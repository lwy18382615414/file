<template>
  <div
    :class="[
      'file-list-mobile',
      { 'is-grid': currentViewMode === LayoutMode.GRID },
    ]"
  >
    <!-- 列表 -->
    <van-list
      ref="listRef"
      :loading="loading"
      :finished="!hasMore"
      :immediate-check="false"
      @load="$emit('loadMore')"
    >
      <template v-if="loading && !list.length">
        <FileListSkeleton :count="15" />
      </template>

      <template v-else-if="list.length">
        <div>
          <template
            v-for="{
              title,
              data,
              showCondition,
              type,
              class: sectionClass,
            } in sections"
            :key="title"
          >
            <p v-if="showCondition" :class="sectionClass" class="file-type">
              {{ title }}
            </p>
            <div
              v-if="data.length"
              :class="
                currentViewMode === LayoutMode.GRID
                  ? 'file-grid-section'
                  : 'file-list-section'
              "
            >
              <div
                v-for="item in data"
                :key="getContentId(item)"
                :class="
                  currentViewMode === LayoutMode.GRID
                    ? 'file-grid-wrapper'
                    : 'file-explorer-wrapper'
                "
              >
                <FileExplorerItem
                  v-if="currentViewMode === LayoutMode.LIST"
                  :content="item"
                  :type="type"
                  :page-type="pageType"
                  :selected="isSelected(item)"
                  @menu="handleMenu"
                  @selection-change="handleSelectionChange"
                  @open="handleOpen"
                />
                <FileExplorerGridItem
                  v-else
                  :content="item"
                  :type="type"
                  :page-type="pageType"
                  :selected="isSelected(item)"
                  @menu="handleMenu"
                  @selection-change="handleSelectionChange"
                  @open="handleOpen"
                />
              </div>
            </div>
          </template>
        </div>
      </template>

      <EmptyState v-else />
    </van-list>

    <!-- 长按出现的操作项 -->
    <div v-if="isLongPressing" class="multiple-actions-toolbar">
      <template v-if="isMySharePage">
        <button class="toolbar-text-button" @click="handleMyShareAction">
          {{ selectedCount ? t("cancelShare") : t("cancel") }}
        </button>
      </template>
      <template v-else>
        <div
          v-for="(item, index) in actions"
          :key="`${item.icon}-${index}`"
          class="icon-wrapper"
        >
          <SvgIcon
            :name="'action-' + item.icon"
            :color="item.color"
            @click="item.action"
          />
          <span>{{ t(item.icon) }}</span>
        </div>
      </template>
    </div>

    <!-- 底部文件操作项 -->
    <FileMenuPopup
      v-model:show="menuVisible"
      :item="activeItem"
      :actions="menuActions"
      @select="handlePopupSelect"
      @close="handleMenuClose"
    />

    <!-- 分享文件操作弹窗 -->
    <CopyLinkPopup
      :show="shareLinkVisible"
      :items="shareLinkItems"
      @update:show="handleShareLinkVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { SvgIcon, EmptyState } from "@/components";
import CopyLinkPopup from "./pop/CopyLinkPopup.vue";
import FileListSkeleton from "@/views/components/h5/FileListSkeleton.vue";
import { computed, ref, watch } from "vue";
import type { ContentType, TableColumn } from "@/types/type";
import {
  ExplorerPageType,
  getExplorerContext,
  type ExplorerQueryState,
} from "../../fileExplorer";
import { getContentId } from "@/utils/typeUtils";
import { useI18n } from "vue-i18n";
import FileMenuPopup from "./pop/FileMenuPopup.vue";
import { useRoute, useRouter } from "vue-router";
import type { MovePayload } from "../../hooks/useFileActions";
import FileExplorerItem from "./FileExplorerItem.vue";
import FileExplorerGridItem from "./FileExplorerGridItem.vue";
import { useLongPress } from "@/hooks/useLongPress";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useMobileFileSections } from "../../hooks/useMobileFileSections";
import { useFileMenu } from "../../hooks/useFileMenu";
import { useFileActions } from "../../hooks/useFileActions";
import { useShareLink } from "../../hooks/useShareLink";
import { LayoutMode } from "@/enum/baseEnum";
import { useUiFeedback } from "@/hooks/useUiFeedback";

const props = defineProps<{
  pageType: ExplorerPageType;
  query: ExplorerQueryState;
  loading: boolean;
  list: ContentType[];
  columns: TableColumn[];
  hasMore: boolean;
  shouldLoadMobileFoldersFirst: boolean;
}>();

const emit = defineEmits<{
  (e: "loadMore"): void;
  (e: "refresh"): void;
  (e: "rename", item: ContentType): void;
  (e: "headerBlockingChange", value: boolean): void;
}>();

const syncHeaderBlocking = () => {
  emit(
    "headerBlockingChange",
    isLongPressing.value || menuVisible.value || shareLinkVisible.value,
  );
};

const { t } = useI18n();
const moveEnabled = computed(() => {
  const context = getExplorerContext(route);
  return (
    context.pageType === ExplorerPageType.MY ||
    (context.pageType === ExplorerPageType.SHARED && !context.isRoot)
  );
});
const { currentViewMode } = useLayoutMode();
const { isLongPressing, clearLongPressState } = useLongPress();
const {
  toggle,
  isSelected,
  getSelectedItems,
  getSelectedCount,
  clear,
  setItems,
} = useFileSelection();
const { toast } = useUiFeedback();
const route = useRoute();
const router = useRouter();
const listRef = ref();

const buildMovePayload = (items: ContentType[]): MovePayload => {
  const context = getExplorerContext(route);

  return {
    items,
    pageType: context.pageType,
    currentFolderId: context.currentFolderId,
    folderPath: [...context.folderPath],
    folderNames: [...context.folderNames],
  };
};
const isMySharePage = computed(
  () => props.pageType === ExplorerPageType.MY_SHARES,
);
const selectedCount = computed(() => getSelectedCount());

const { sections } = useMobileFileSections({
  list: computed(() => props.list),
  shouldLoadMobileFoldersFirst: computed(
    () => props.shouldLoadMobileFoldersFirst,
  ),
});

const { menuVisible, activeItem, menuActions, handleMenu, handleMenuClose } =
  useFileMenu();

const { shareLinkVisible, shareLinkItems, openShareLink, closeShareLink } =
  useShareLink();

const {
  open,
  downloadMany,
  shareToFriendMany,
  cancelShareMany,
  removeMany,
  handleMenuAction,
} = useFileActions({
  onRefresh: () => emit("refresh"),
  onRenameDialog: (item) => emit("rename", item),
  onCopyLinkDialog: openShareLink,
});

const handleShareLinkVisibleChange = (value: boolean) => {
  if (value) return;
  closeShareLink();
  clear();
  clearLongPressState();
};

const openMovePage = async (items: ContentType[]) => {
  if (!items.length) {
    toast(t("selectFile"));
    return;
  }

  await router.push({
    path: "/move-file",
    state: {
      movePayload: JSON.stringify(buildMovePayload(items)),
    },
  });
};

const actions = computed(() => {
  const baseActions = [
    {
      icon: "download",
      color: "#252F43",
      action: async () => {
        const downloaded = await downloadMany(getSelectedItems());
        if (!downloaded) return;
        clear();
        clearLongPressState();
      },
    },
    {
      icon: "delete",
      color: "#f44336",
      action: async () => {
        const removed = await removeMany(getSelectedItems());
        if (!removed) return;
        clear();
        clearLongPressState();
      },
    },
    {
      icon: "copy",
      color: "#252f43",
      action: async () => {
        if (!getSelectedItems().length) {
          toast(t("selectFile"));
          return;
        }
        openShareLink(getSelectedItems());
      },
    },
    {
      icon: "share",
      color: "#252f43",
      action: async () => {
        const shared = await shareToFriendMany(getSelectedItems());
        if (!shared) return;
        clear();
        clearLongPressState();
      },
    },
  ];

  if (!moveEnabled.value) {
    return baseActions;
  }

  return [
    baseActions[0],
    baseActions[1],
    {
      icon: "move",
      color: "#252f43",
      action: async () => {
        const selectedItems = getSelectedItems();
        await openMovePage(selectedItems);
        clear();
        clearLongPressState();
      },
    },
    baseActions[2],
    baseActions[3],
  ];
});

const handleMyShareAction = async () => {
  if (!selectedCount.value) {
    clear();
    clearLongPressState();
    return;
  }

  const cancelled = await cancelShareMany(getSelectedItems());
  if (!cancelled) return;
  clear();
  clearLongPressState();
};

watch(
  () => props.list,
  (list) => {
    setItems(list);
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    menuVisible.value = false;
    closeShareLink();
    clear();
    clearLongPressState();
    const listEl = listRef.value?.$el;
    listEl?.scrollTo({ top: 0 });
    syncHeaderBlocking();
  },
);

watch(
  () => [isLongPressing.value, menuVisible.value, shareLinkVisible.value],
  () => {
    syncHeaderBlocking();
  },
  { immediate: true },
);

const handleSelectionChange = (item: ContentType) => {
  toggle(item);
  syncHeaderBlocking();
};

const handleOpen = async (item: ContentType) => {
  await open(item);
};

const handlePopupSelect = async (key: string) => {
  const item = activeItem.value;
  if (!item) return;
  if (key === "move") {
    await openMovePage([item]);
    return;
  }
  await handleMenuAction(key, item);
};
</script>

<style lang="scss" scoped>
.file-list-mobile {
  height: 100%;

  :deep(.van-list) {
    width: 100%;
    height: 100%;
    overflow-y: auto;

    padding-bottom: 82px;
  }

  &.is-grid {
    :deep(.van-list) {
      padding-bottom: 112px;
    }
  }
}

.file-type {
  font-weight: 500;
  font-size: 18px;
  color: #252525;
  line-height: 22.5px;
  padding: 24px 16px 8px;
}

.file-list-section {
  display: flex;
  flex-direction: column;
}

.file-explorer-wrapper {
  padding: 0 16px;
}

.file-grid-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px 16px 0px;
}

.file-grid-wrapper {
  min-width: 0;
}

.multiple-actions-toolbar {
  border-top: 1px solid #e2e8f0;
  position: absolute;
  width: 100%;
  bottom: 0;
  padding: 16px;
  background-color: var(--btn-default-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .icon-wrapper {
    width: 50px;
    height: 50px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;

    color: #707681;
    font-family: Inter;
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: 15px;
  }

  .toolbar-text-button {
    width: 100%;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: var(--subtle-fill-color);
    color: var(--text-primary-color);
    font-size: 14px;
  }
}
</style>
