<template>
  <div class="file-list-pc">
    <PcExplorerHeader
      :page-type="pageType"
      :query="headerQuery"
      :total="total"
      :can-create="canCreate"
      :can-upload="canUpload"
      :can-download="canDownload"
      :can-share="canShare"
      :can-delete="canDelete"
      :has-selection="hasSelection"
      :current-folder-permission-count="currentFolderPermissionCount"
      @create="handleCreate"
      @upload="handleUpload"
      @download="handleDownload"
      @share="handleShare"
      @copy-link="handleCopyLink"
      @delete="handleDelete"
      @restore="handleRestore"
      @delete-permanently="handleDeletePermanently"
      @cancel-share="handleCancelShare"
      @open-shared-space-setting="handleOpenSharedSpaceSetting"
      @update-keyword="handleUpdateKeyword"
      @update-date-range="handleDateRangeUpdate"
      @search="handleSearch"
    />
    <CopyLinkPc
      :show="shareLinkVisible"
      :items="shareLinkItems"
      @update:show="handleShareLinkVisibleChange"
    />
    <NameEditDialogPc
      :show="renameVisible"
      :item="renameItem"
      :mode="mode"
      @update:show="handleRenameVisibleChange"
      @confirm="confirmRename"
    />
    <UploadDialogPc
      :show="uploadVisible"
      :title="uploadTitle"
      :content-id="uploadContentId"
      :is-personal="uploadIsPersonal"
      :bind-uploader-ref="bindUploaderRef"
      :selected-files="selectedFiles"
      :loading="uploadLoading"
      :has-selected-files="hasSelectedFiles"
      :show-repeat-file-dialog="showRepeatFileDialog"
      :open-file-dialog="openFileDialog"
      :handle-select-change="handleSelectChange"
      :handle-drag-over="handleDragOver"
      :handle-drop="handleDrop"
      :handle-remove="handleRemove"
      :handle-upload="submitUpload"
      :handle-repeat-visible-change="handleRepeatVisibleChange"
      @update:show="handleUploadVisibleChange"
      @refresh="emit('refresh')"
    />
    <UploadProgress />
    <PcFileContextMenu
      :show="contextMenuVisible"
      :position="contextMenuPosition"
      :actions="contextMenuActions"
      @close="closeContextMenu"
      @select="handleContextMenuSelect"
    />
    <SettingDialog
      :show="settingVisible"
      :content-id="getExplorerContext(route).currentFolderId"
      @update:show="settingVisible = $event"
    />
    <PcDragUploadContainer
      class="file-list-wrapper"
      :can-drop="canUpload"
      :content-id="getExplorerContext(route).currentFolderId"
      :is-personal="props.pageType === ExplorerPageType.MY"
      @refresh="emit('refresh')"
    >
      <PcExplorerListView
        v-if="currentViewMode === LayoutMode.LIST"
        class="file-list-table"
        :list="list"
        :columns="columns"
        :page-type="pageType"
        :loading="loading"
        :has-more="props.hasMore"
        :sort-method="currentSortMethod"
        :sort-order="currentSortOrder"
        @sort-change="handleSortChange"
        @load-more="handleLoadMore"
        @row-contextmenu="handleRowContextmenu"
        @row-dblclick="handleRowDbClick"
      >
      </PcExplorerListView>
      <PcExplorerGridView v-else :list="list" :loading="loading">
        <template #item="scope">
          <slot name="item" v-bind="scope" />
        </template>
      </PcExplorerGridView>
    </PcDragUploadContainer>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, toRef, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getExplorerContext } from "../../fileExplorer";
import { LayoutMode } from "@/enum/baseEnum";
import { Permission } from "@/enum/permission";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import { setExplorerSortMode } from "@/hooks/sort/state";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import type { ContentType, TableColumn } from "@/types/type";
import { getIsFolder, getPermissionType } from "@/utils/typeUtils";
import { hasPermission, SessionStorageUtil, t } from "@/utils";
import { ExplorerPageType, type ExplorerQueryState } from "../../fileExplorer";
import { parseQueryDate } from "@/utils";
import { useFileActions } from "../../hooks/useFileActions";
import {
  usePcFileContextMenu,
  type PcFileContextActionKey,
} from "../../hooks/usePcFileContextMenu";
import { useRenameDialog } from "../../hooks/useRenameDialog";
import { useShareLink } from "../../hooks/useShareLink";
import { useUploadDialog } from "../../hooks/useUploadDialog";
import CopyLinkPc from "./CopyLinkPc.vue";
import NameEditDialogPc from "./NameEditDialogPc.vue";
import UploadDialogPc from "./UploadDialogPc.vue";
import UploadProgress from "./UploadProgress.vue";
import PcDragUploadContainer from "./PcDragUploadContainer.vue";
import PcExplorerGridView from "./PcExplorerGridView.vue";
import PcExplorerHeader from "./PcExplorerHeader.vue";
import PcExplorerListView from "./PcExplorerListView.vue";
import PcFileContextMenu from "./PcFileContextMenu.vue";
import SettingDialog from "./SettingDialog.vue";

const route = useRoute();
const router = useRouter();
const { currentViewMode } = useLayoutMode();
const { currentSortMethod, currentSortOrder } = useExplorerSort();
const { selected, clear } = useFileSelection();
const { toast } = useUiFeedback();

const emit = defineEmits<{
  (e: "loadMore"): void;
  (e: "refresh"): void;
  (
    e: "search",
    payload: Pick<ExplorerQueryState, "keyword" | "startDate" | "endDate">,
  ): void;
}>();

const props = defineProps<{
  pageType: ExplorerPageType;
  query: ExplorerQueryState;
  loading: boolean;
  list: ContentType[];
  total: number;
  hasMore: boolean;
  columns: TableColumn[];
  allowUpload: boolean;
  currentFolderPermissionType: number | null;
  currentFolderPermissionCount: number | null;
}>();

const headerQuery = reactive<ExplorerQueryState>({ ...props.query });

const hasExplicitPermission = (
  item: ContentType,
  permission: Permission,
): boolean => {
  const permissionType = getPermissionType(item);

  if (
    props.pageType === ExplorerPageType.SHARED ||
    props.pageType === ExplorerPageType.SEARCH
  ) {
    if (permissionType == null) return false;
  }

  return hasPermission(permissionType, permission);
};

const selectedItems = computed(() => selected.value);
const hasSelection = computed(() => selectedItems.value.length > 0);
const canCreate = computed(() => props.allowUpload);
const canUpload = computed(() => props.allowUpload);
const canDownload = computed(() => {
  if (!hasSelection.value) return false;
  if (selectedItems.value.every((item) => getIsFolder(item))) return false;
  if (props.pageType === ExplorerPageType.SEARCH) return true;
  return selectedItems.value.every((item) =>
    hasExplicitPermission(item, Permission.View),
  );
});
const canShare = computed(() => {
  if (!hasSelection.value) return false;
  if (props.pageType === ExplorerPageType.SEARCH) return true;
  return selectedItems.value.every((item) =>
    hasExplicitPermission(item, Permission.Share),
  );
});
const canDelete = computed(() => {
  if (!hasSelection.value) return false;
  if (props.pageType === ExplorerPageType.SEARCH) return true;
  return selectedItems.value.every((item) =>
    hasExplicitPermission(item, Permission.Edit),
  );
});

const { shareLinkVisible, shareLinkItems, openShareLink, closeShareLink } =
  useShareLink();

const {
  mode,
  renameVisible,
  renameItem,
  openCreate,
  openRename,
  confirmRename,
  closeRename,
} = useRenameDialog({
  onRefresh: () => emit("refresh"),
});

const {
  uploadVisible,
  uploadTitle,
  uploadContentId,
  uploadIsPersonal,
  bindUploaderRef,
  selectedFiles,
  loading: uploadLoading,
  hasSelectedFiles,
  showRepeatFileDialog,
  openUpload,
  closeUpload,
  openFileDialog,
  handleSelectChange,
  handleDragOver,
  handleDrop,
  handleRemove,
  handleUpload: submitUpload,
  handleRepeatVisibleChange,
} = useUploadDialog({
  onRefresh: () => emit("refresh"),
});

const {
  open,
  downloadMany,
  shareToFriendMany,
  removeMany,
  deletePermanentlyMany,
  restoreMany,
  cancelShareMany,
  handleContextMenuSelect: runContextMenuAction,
} = useFileActions({
  onRefresh: () => emit("refresh"),
  onRenameDialog: openRename,
  onCopyLinkDialog: openShareLink,
  onAfterAction: clear,
  onDuplicateFiles: (data) => {
    toast(t("duplicateFilesWarning", { count: data.length }), "warning");
  },
});

const {
  visible: contextMenuVisible,
  position: contextMenuPosition,
  actions: contextMenuActions,
  contextItems,
  anchorRow,
  openForRow,
  close: closeContextMenu,
} = usePcFileContextMenu({
  pageType: toRef(props, "pageType"),
});

const settingVisible = ref(false);

const handleCreate = async () => {
  if (!canCreate.value) return;

  if (props.pageType === ExplorerPageType.RECENT) {
    SessionStorageUtil.set("recentCreateFolder", "1");
    await router.push({
      path: "/my",
    });
    return;
  }

  openCreate();
};

const handleRenameVisibleChange = (value: boolean) => {
  if (value) {
    renameVisible.value = true;
    return;
  }

  closeRename();
};

const handleUpload = async () => {
  if (!canUpload.value) return;

  if (props.pageType === ExplorerPageType.RECENT) {
    SessionStorageUtil.set("recentCreateFolder", "2");
    await router.push({
      path: "/my",
    });
    return;
  }

  openUpload();
};

const handleDownload = async () => {
  if (!canDownload.value) return;
  await downloadMany(selectedItems.value);
  clear();
};

const handleShare = async () => {
  if (!canShare.value) return;
  await shareToFriendMany(selectedItems.value);
  clear();
};

const handleDelete = async () => {
  if (!canDelete.value) return;
  await removeMany(selectedItems.value);
  clear();
};

const handleRestore = async () => {
  if (!hasSelection.value) return;
  const restored = await restoreMany(selectedItems.value);
  if (!restored) return;
  clear();
};

const handleDeletePermanently = async () => {
  if (!hasSelection.value) return;
  const deleted = await deletePermanentlyMany(selectedItems.value);
  if (!deleted) return;
  clear();
};

const handleCancelShare = async () => {
  if (!hasSelection.value) return;
  const canceled = await cancelShareMany(selectedItems.value);
  if (!canceled) return;
  clear();
};

const handleCopyLink = () => {
  if (!canShare.value) {
    toast(t("selectFile"));
    return;
  }
  openShareLink(selectedItems.value);
};

const handleShareLinkVisibleChange = (value: boolean) => {
  if (value) return;
  closeShareLink();
  clear();
};

const handleUploadVisibleChange = (value: boolean) => {
  if (value) {
    uploadVisible.value = true;
    return;
  }

  closeUpload();
};

const handleUpdateKeyword = (value: string) => {
  headerQuery.keyword = value;
};

const handleDateRangeUpdate = (value: [Date, Date] | null) => {
  if (!value) {
    headerQuery.startDate = "";
    headerQuery.endDate = "";
    return;
  }

  headerQuery.startDate = parseQueryDate(value[0]);
  headerQuery.endDate = parseQueryDate(value[1]);
};

const handleSearch = () => {
  emit("search", {
    keyword: headerQuery.keyword,
    startDate: headerQuery.startDate,
    endDate: headerQuery.endDate,
  });
};

const handleRowContextmenu = (payload: {
  row: ContentType;
  event: MouseEvent;
}) => {
  openForRow(payload.row, payload.event);
};

const handleRowDbClick = async (payload: { row: ContentType }) => {
  const row = payload.row;
  await open(row);
  clear();
};

const handleContextMenuSelect = async (key: PcFileContextActionKey) => {
  const items = [...contextItems.value];
  const row = anchorRow.value;
  closeContextMenu();
  await runContextMenuAction(key, items, row);
};

function getSortMethod(sortBy: ExplorerQueryState["sortBy"]) {
  if (
    props.pageType === ExplorerPageType.MY_SHARES ||
    props.pageType === ExplorerPageType.RECYCLE
  ) {
    return sortBy === "name" ? 0 : 1;
  }

  if (sortBy === "time") return 0;
  if (sortBy === "size") return 1;
  return 2;
}

function handleSortChange(payload: {
  sortBy: ExplorerQueryState["sortBy"];
  sortOrder: ExplorerQueryState["sortOrder"];
}) {
  setExplorerSortMode({
    currentPage: route.path,
    sortMethod: getSortMethod(payload.sortBy),
    sortOrder: payload.sortOrder,
  });
}

function handleOpenSharedSpaceSetting() {
  settingVisible.value = true;
}

function handleLoadMore() {
  emit("loadMore");
}

watch(
  () => props.query,
  (value) => {
    Object.assign(headerQuery, value);
  },
  { deep: true, immediate: true },
);

watch(
  () => route.fullPath,
  async () => {
    if (props.pageType !== ExplorerPageType.MY) return;
    const recentCreate = SessionStorageUtil.get("recentCreateFolder");
    if (recentCreate === "1") {
      openCreate();
    } else if (recentCreate === "2") {
      openUpload();
    }
    SessionStorageUtil.remove("recentCreateFolder");
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.file-list-pc {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
}

.file-list-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.file-list-table {
  height: 100%;
}
</style>
