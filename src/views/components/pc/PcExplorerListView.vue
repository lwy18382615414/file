<template>
  <CommonTable
    ref="tableRef"
    height="100%"
    border
    :row-key="getRowKey"
    :table-data="list"
    :table-columns="resolvedColumns"
    :loading="loading"
    class="explorer-table"
    @header-click="handleHeaderClick"
    @selection-change="handleSelectionChange"
    @row-contextmenu="handleRowContextmenu"
    @row-dblclick="handleDbClick"
  >
    <template #sortHeader="scope">
      <div class="sort-header">
        <span>{{
          getHeaderLabel(scope.column.label, scope.column.property)
        }}</span>
        <span
          v-if="getSortArrow(scope.column.property)"
          class="sort-header__arrow"
        >
          {{ getSortArrow(scope.column.property) }}
        </span>
      </div>
    </template>
    <template #name="scope">
      <div class="name-cell">
        <div v-if="pageType !== ExplorerPageType.MY_SHARES" class="file-icon">
          <SvgIcon
            :name="
              getIsFolder(scope.row)
                ? 'file-folder'
                : getFileIcon(getName(scope.row))
            "
            size="24"
          />
        </div>
        <el-input
          v-if="isDraftCreateRow(scope.row)"
          :ref="bindDraftInputRefFor(scope.row)"
          class="name-cell__input"
          :model-value="scope.row.contentName"
          maxlength="100"
          show-word-limit
          :placeholder="t('inputFolderName')"
          @update:model-value="emitDraftNameChange(String($event || ''))"
          @blur="emitDraftSubmit"
          @keydown.enter.prevent="emitDraftSubmit"
          @keydown.esc.prevent="emitDraftCancel"
        />

        <div v-else class="name-cell__content">
          <span class="name-cell__text">
            {{ getName(scope.row) }}
            <template
              v-if="
                pageType === ExplorerPageType.MY_SHARES &&
                scope.row.shareCount > 1
              "
            >
              {{ t("andItem", { count: scope.row.shareCount }) }}
            </template>
          </span>
          <div
            v-if="isUploadingFolderRow(scope.row) && scope.row.isUploading"
            class="loading"
          ></div>
        </div>
      </div>
    </template>

    <template #time="scope">
      <span>{{ formatTime(getOperateTime(scope.row)) }}</span>
    </template>

    <template #size="scope">
      <span>{{
        getSize(scope.row) ? formatFileSize(getSize(scope.row)) : "-"
      }}</span>
    </template>

    <template #shareTime="scope">
      <span>{{ formatTime(getShareTime(scope.row)) }}</span>
    </template>

    <template #shareStatus="scope">
      <span>
        {{
          getIsDeleteAll(scope.row)
            ? t("fileDeleted")
            : getExpirationStatus(
                getStatus(scope.row),
                getExpireType(scope.row),
                getExpireTime(scope.row),
              )
        }}
      </span>
    </template>

    <template #deleteTime="scope">
      <span>{{ formatTime(getDeleteTime(scope.row)) }}</span>
    </template>

    <template #append>
      <div ref="sentinelRef" class="scroll-sentinel">
        <span v-if="loading">正在加载中...</span>
        <span v-else-if="!hasMore" class="no-more">没有更多文件了</span>
      </div>
    </template>

    <template #empty-content>
      <div class="drag-upload__text">{{ t("dragUpload") }}</div>
    </template>
  </CommonTable>
</template>

<script lang="ts" setup>
import { CommonTable } from "@/components";
import type { ElInput } from "element-plus";
import type {
  ContentType,
  ExplorerDraftItem,
  ExplorerUploadingFolderItem,
  TableColumn,
} from "@/types/type";
import {
  formatFileSize,
  formatTime,
  getExpirationStatus,
  getFileIcon,
} from "@/utils";
import {
  getName,
  getOperateTime,
  getShareTime,
  getSize,
  getIsDeleteAll,
  getStatus,
  getExpireType,
  getExpireTime,
  getDeleteTime,
  getIsFolder,
  getRowKey,
} from "@/utils/typeUtils";
import {
  ExplorerPageType,
  type ExplorerQueryState,
} from "@/views/fileExplorer";
import { useFileSelection } from "@/hooks/useFileSelection";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";

const tableRef = ref<{
  getTableRef: () => {
    clearSelection?: () => void;
    toggleRowSelection?: (row: ContentType, selected?: boolean) => void;
    $refs?: {
      tableBody?: HTMLElement;
      bodyWrapper?: HTMLElement;
    };
  };
} | null>(null);

const { t } = useI18n();
const {
  selected,
  getSelectedCount,
  isSelected,
  toggle,
  setItems,
  clear,
  select,
} = useFileSelection();

const emit = defineEmits<{
  (
    e: "sortChange",
    payload: {
      sortBy: ExplorerQueryState["sortBy"];
      sortOrder: ExplorerQueryState["sortOrder"];
    },
  ): void;
  (e: "loadMore"): void;
  (
    e: "rowContextmenu",
    payload: {
      row: ContentType;
      event: MouseEvent;
    },
  ): void;
  (e: "rowDblclick", payload: { row: ContentType }): void;
  (e: "draftNameChange", value: string): void;
  (e: "draftSubmit"): void;
  (e: "draftCancel"): void;
  (e: "draftInputRef", value: InstanceType<typeof ElInput> | null): void;
}>();

const emitDraftSubmit = () => emit("draftSubmit");
const emitDraftCancel = () => emit("draftCancel");
const emitDraftNameChange = (value: string) => emit("draftNameChange", value);

const props = withDefaults(
  defineProps<{
    list: ContentType[];
    columns: TableColumn[];
    pageType: string;
    loading?: boolean;
    hasMore?: boolean;
    sortMethod?: number;
    sortOrder?: string;
  }>(),
  {
    loading: false,
    hasMore: false,
    sortMethod: 0,
    sortOrder: "desc",
  },
);

const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const isDraftCreateRow = (item: ContentType): item is ExplorerDraftItem => {
  return "__isDraftCreate" in item && item.__isDraftCreate === true;
};

const isUploadingFolderRow = (
  item: ContentType,
): item is ExplorerUploadingFolderItem => {
  return "__isUploadingFolder" in item && item.__isUploadingFolder === true;
};

const isTemporaryRow = (item: ContentType) => {
  return isDraftCreateRow(item) || isUploadingFolderRow(item);
};

const bindDraftInputRef = (
  row: ContentType,
  input: InstanceType<typeof ElInput> | null,
) => {
  if (!isDraftCreateRow(row)) return;
  emit("draftInputRef", input);
};

const bindDraftInputRefFor = (row: ContentType) => {
  return (input: InstanceType<typeof ElInput> | null) => {
    bindDraftInputRef(row, input);
  };
};

const resolvedColumns = computed(() => {
  return props.columns.map((column) => {
    if (column.type !== "selection") return column;

    return {
      ...column,
      selectable: (row: ContentType) => !isTemporaryRow(row),
    } as TableColumn;
  });
});

function syncTableSelection() {
  const table = tableRef.value?.getTableRef();
  if (!table) return;

  table.clearSelection?.();
  props.list.forEach((item) => {
    if (isTemporaryRow(item)) return;
    if (isSelected(item)) {
      table.toggleRowSelection?.(item, true);
    }
  });
}

function handleSelectionChange(rows: ContentType[]) {
  props.list.forEach((item) => {
    if (isTemporaryRow(item)) return;

    const checked = rows.some((row) => getRowKey(row) === getRowKey(item));
    const selected = isSelected(item);

    if (checked !== selected) {
      toggle(item);
    }
  });
}

const sortablePropMap: Record<string, string[]> = {
  [ExplorerPageType.MY_SHARES]: ["shareFile", "shareTime"],
  [ExplorerPageType.RECYCLE]: ["contentName", "deleteTime"],
  default: ["operateTime", "contentSize", "contentName"],
};

const propSortByMap: Record<string, ExplorerQueryState["sortBy"]> = {
  operateTime: "time",
  contentSize: "size",
  contentName: "name",
  shareFile: "name",
  shareTime: "time",
  deleteTime: "time",
};

function getActiveSortProp() {
  if (props.pageType === ExplorerPageType.MY_SHARES) {
    return props.sortMethod === 0 ? "shareFile" : "shareTime";
  }

  if (props.pageType === ExplorerPageType.RECYCLE) {
    return props.sortMethod === 0 ? "contentName" : "deleteTime";
  }

  return sortablePropMap.default[props.sortMethod] || "operateTime";
}

function getSortArrow(prop?: string) {
  if (props.pageType === ExplorerPageType.RECENT) return "";
  if (!prop || prop !== getActiveSortProp()) return "";
  return props.sortOrder === "asc" ? "↑" : "↓";
}

function getNameColumnProp() {
  if (props.pageType === ExplorerPageType.MY_SHARES) {
    return "shareFile";
  }

  return "contentName";
}

function getHeaderLabel(label?: string, prop?: string) {
  if (prop === getNameColumnProp() && getSelectedCount()) {
    return t("selectedDocuments", { count: getSelectedCount() });
  }

  return String(label || "");
}

function handleHeaderClick(column: { property?: string }) {
  if (props.pageType === ExplorerPageType.RECENT) return;
  const prop = String(column?.property || "");
  const sortableProps =
    sortablePropMap[props.pageType] || sortablePropMap.default;
  if (!prop || !sortableProps.includes(prop)) return;

  const sortBy = propSortByMap[prop];
  if (!sortBy) return;

  const isActive = getActiveSortProp() === prop;
  const sortOrder: ExplorerQueryState["sortOrder"] = isActive
    ? props.sortOrder === "asc"
      ? "desc"
      : "asc"
    : "desc";

  emit("sortChange", { sortBy, sortOrder });
}

async function handleRowContextmenu(
  row: ContentType,
  _column: unknown,
  event: MouseEvent,
) {
  event.preventDefault();

  if (isTemporaryRow(row)) return;

  const table = tableRef.value?.getTableRef();
  const selectedCount = getSelectedCount();
  const rowSelected = isSelected(row);

  if (!rowSelected) {
    if (selectedCount <= 1) {
      clear();
      table?.clearSelection?.();
    }
    select(row);
    table?.toggleRowSelection?.(row, true);
  } else {
    table?.toggleRowSelection?.(row, true);
  }

  emit("rowContextmenu", { row, event });
}

async function handleDbClick(row: ContentType) {
  if (isTemporaryRow(row)) return;
  emit("rowDblclick", { row });
}

watch(
  () => props.list,
  async (list) => {
    setItems(list);
    await nextTick();
    syncTableSelection();
  },
  { immediate: true },
);

watch(
  () => selected.value.length,
  async (count, prevCount) => {
    if (count !== 0 || prevCount === 0) return;

    await nextTick();
    tableRef.value?.getTableRef()?.clearSelection?.();
  },
);

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !props.loading && props.hasMore) {
        emit("loadMore");
      }
    },
    {
      rootMargin: "0px 0px 50px 0px",
      threshold: 0.01,
    },
  );

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped lang="scss">
.explorer-table {
  :deep(.table-container),
  :deep(.el-table),
  :deep(.el-table__inner-wrapper) {
    height: 100%;
  }

  :deep(.el-table::before),
  :deep(.el-table::after),
  :deep(.el-table--border::after),
  :deep(.el-table--group::after) {
    display: none !important;
  }

  :deep(.el-table--border) {
    .el-table__header-wrapper,
    .el-table__body-wrapper,
    .el-table__footer-wrapper {
      border: none !important;
    }
  }

  :deep(.el-table) {
    border: none !important;
    --el-table-border-color: transparent;
    --el-table-border: none;

    /* 批量隐藏子元素的伪元素及多余结构 */
    .el-table__inner-wrapper::before,
    .el-table__inner-wrapper::after,
    .el-table__fixed-right::before,
    .el-table__fixed::before,
    .el-table__border-left-patch,
    colgroup col[name="gutter"] {
      display: none !important;
    }

    /* 批量去除内部单元格及容器的边框 */
    th.el-table__cell,
    td.el-table__cell,
    .el-table__cell,
    .el-table__header-wrapper,
    .el-table__fixed-header-wrapper {
      border: none !important;
    }

    /* 阴影和间距优化 */
    .el-table__fixed,
    .el-table__fixed-right {
      box-shadow: none !important;
    }

    .el-table__header,
    .el-table__body,
    .el-table__footer {
      border-collapse: separate;
      border-spacing: 0;
    }

    /* 滚动条 */
    .el-table__body-wrapper {
      overflow-y: auto;
      .el-scrollbar__bar {
        z-index: 3;
      }
    }

    /* 单元格高度 */
    .el-table__header th.el-table__cell {
      height: 36px;
      padding-block: 0;
    }

    .el-table__body td.el-table__cell {
      height: 56px;
      padding-block: 0;
    }

    /* 表头 Hover 效果与布局 */
    .el-table__header-wrapper th.el-table__cell {
      position: relative;

      .cell {
        position: relative;
      }

      .caret-wrapper {
        display: none;
        z-index: 2;
      }

      &::after {
        content: "";
        position: absolute;
        top: 50%;
        right: 0;
        width: 6px;
        height: 18px;
        background: transparent;
        transform: translate(50%, -50%);
        pointer-events: none;
        transition: background-color 0.2s ease;
      }

      &:hover::after {
        background: rgba(64, 158, 255, 0.35);
      }

      &:first-child::after {
        display: none !important;
      }
    }
  }
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  .file-icon {
    flex-shrink: 0;
  }
}

.name-cell__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.name-cell__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #252525;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.loading {
  flex-shrink: 0;
  border: 3px solid hsla(213, 71%, 53%, 0.2);
  border-top-color: var(--theme-color);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.name-cell__input {
  flex: 1;
  min-width: 0;
}

.sort-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sort-header__arrow {
  color: var(--theme-color);
  font-size: 12px;
  line-height: 1;
}

.scroll-sentinel {
  visibility: hidden;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-weak-color);
  font-size: 13px;

  .no-more {
    color: var(--text-weak-color);
  }
}
</style>
