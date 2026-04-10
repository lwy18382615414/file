<template>
  <div
    :class="[
      'file-list-mobile',
      { 'is-grid': currentViewMode === LayoutMode.GRID },
    ]"
  >
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
    <div v-if="isLongPressing" class="multiple-actions-toolbar">
      <template v-if="isMySharePage">
        <button class="toolbar-text-button" @click="handleMyShareAction">
          {{ selectedCount ? t("cancelShare") : t("cancel") }}
        </button>
      </template>
      <template v-else>
        <div v-for="item in actions" :key="item.icon" class="icon-wrapper">
          <SvgIcon
            :name="'action-' + item.icon"
            :color="item.color"
            @click="item.action"
          ></SvgIcon>
        </div>
      </template>
    </div>
    <FileMenuPopup
      v-model:show="menuVisible"
      :item="activeItem"
      :actions="menuActions"
      @select="handlePopupSelect"
      @close="handleMenuClose"
    />
    <NameEditPopup
      :show="renameVisible"
      :item="renameItem"
      :mode="mode"
      @update:show="handleRenameVisibleChange"
      @confirm="confirmRename"
    />
    <CopyLinkH5
      :show="shareLinkVisible"
      :items="shareLinkItems"
      @update:show="handleShareLinkVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { SvgIcon, EmptyState } from "@/components";
import NameEditPopup from "./NameEditPopup.vue";
import CopyLinkH5 from "./CopyLinkH5.vue";
import FileListSkeleton from "@/views/h5/Components/FileListSkeleton.vue";
import { computed, ref, watch } from "vue";
import type { ContentType, TableColumn } from "@/types/type";
import { ExplorerPageType, type ExplorerQueryState } from "../../fileExplorer";
import { getContentId } from "@/utils/typeUtils";
import { useI18n } from "vue-i18n";
import FileMenuPopup from "./FileMenuPopup.vue";
import { useRoute, useRouter } from "vue-router";
import FileExplorerItem from "./FileExplorerItem.vue";
import FileExplorerGridItem from "./FileExplorerGridItem.vue";
import { useLongPress } from "@/hooks/useLongPress";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useMobileFileSections } from "../../hooks/useMobileFileSections";
import { useFileMenu } from "../../hooks/useFileMenu";
import { useFileActions } from "../../hooks/useFileActions";
import { useRenameDialog } from "../../hooks/useRenameDialog";
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
}>();

const { t } = useI18n();
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
  mode,
  renameVisible,
  renameItem,
  openRename,
  confirmRename,
  closeRename,
} = useRenameDialog({
  onRefresh: () => emit("refresh"),
});

const {
  open,
  downloadMany,
  shareToFriendMany,
  cancelShareMany,
  removeMany,
  handleMenuAction,
} = useFileActions({
  onRefresh: () => emit("refresh"),
  onRenameDialog: openRename,
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
      movePayload: JSON.stringify({ items }),
    },
  });
};

const actions = [
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
      const selectedItems = getSelectedItems();
      await openMovePage(selectedItems);
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

const handleRenameVisibleChange = (value: boolean) => {
  if (value) {
    renameVisible.value = true;
    return;
  }

  closeRename();
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
    closeRename();
    closeShareLink();
    clear();
    clearLongPressState();
    const listEl = listRef.value?.$el;
    listEl?.scrollTo({ top: 0 });
  },
);

const handleSelectionChange = (item: ContentType) => {
  toggle(item);
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
};</script>

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
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;

  .icon-wrapper {
    width: 50px;
    height: 50px;
    background-color: #f3f4f6;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar-text-button {
    width: 100%;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: #ebeff6;
    color: #2d2d2d;
    font-size: 14px;
  }
}
</style>
