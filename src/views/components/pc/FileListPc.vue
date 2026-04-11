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
      :can-move="canMove"
      :can-delete="canDelete"
      :has-selection="hasSelection"
      :current-folder-permission-count="currentFolderPermissionCount"
      @create="handleCreate"
      @upload="handleUpload"
      @download="handleDownload"
      @share="handleShare"
      @move="handleMove"
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
    <CopyLinkDialog
      :show="shareLinkVisible"
      :items="shareLinkItems"
      @update:show="handleShareLinkVisibleChange"
    />
    <MoveDialog
      :show="moveVisible"
      :payload="movePayload"
      :submitting="moveSubmitting"
      @update:show="handleMoveVisibleChange"
      @refresh="emit('refresh')"
      @confirm="handleMoveConfirm"
    />
    <RecycleRepeatFile
      :repeat-visible="moveRepeatVisible"
      :repeat-list="moveRepeatList"
      @update:repeat-visible="handleMoveRepeatVisibleChange"
      @handle-repeat-file="handleMoveRepeatFile"
    />
    <NameEditDialog
      :show="renameVisible"
      :item="renameItem"
      :mode="mode"
      @update:show="handleRenameVisibleChange"
      @confirm="confirmRename"
    />
    <UploadDialog
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
    <UploadProgress @close="emit('refresh')" />
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
      @uploading-folder-start="handleUploadingFolderStart"
      @uploading-folder-finish="handleUploadingFolderFinish"
      @uploading-folder-fail="handleUploadingFolderFail"
    >
      <PcExplorerListView
        v-if="
          currentViewMode === LayoutMode.LIST ||
          !!draftCreateRow ||
          uploadingFolderRows.length > 0
        "
        class="file-list-table"
        :list="displayList"
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
        @draft-name-change="handleDraftNameChange"
        @draft-submit="commitInlineCreate"
        @draft-cancel="cancelInlineCreate"
        @draft-input-ref="bindInlineCreateInputRef"
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
import { computed, reactive, toRef, watch, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createFolderApi } from "@/api/fileService";
import { getExplorerContext } from "../../fileExplorer";
import { LayoutMode } from "@/enum/baseEnum";
import { Permission } from "@/enum/permission";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import { setExplorerSortMode } from "@/hooks/sort/state";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import type {
  ContentType,
  ExplorerDraftItem,
  ExplorerUploadingFolderItem,
  TableColumn,
} from "@/types/type";
import {
  checkNameValidity,
  hasPermission,
  SessionStorageUtil,
  t,
} from "@/utils";
import {
  getContentId,
  getIsFolder,
  getPermissionType,
} from "@/utils/typeUtils";
import { ExplorerPageType, type ExplorerQueryState } from "../../fileExplorer";
import { parseQueryDate } from "@/utils";
import { useFileActions, type MovePayload } from "../../hooks/useFileActions";
import {
  usePcFileContextMenu,
  type PcFileContextActionKey,
} from "../../hooks/usePcFileContextMenu";
import { useRenameDialog } from "../../hooks/useRenameDialog";
import { useShareLink } from "../../hooks/useShareLink";
import { useUploadDialog } from "../../hooks/useUploadDialog";
import CopyLinkDialog from "./Dialog/CopyLinkDialog.vue";
import MoveDialog from "./Dialog/MoveDialog.vue";
import NameEditDialog from "./Dialog/NameEditDialog.vue";
import RecycleRepeatFile from "@/views/pc/Layout/pop/RecycleRepeatFile.vue";
import UploadDialog from "./Dialog/UploadDialog.vue";
import UploadProgress from "./UploadProgress.vue";
import PcDragUploadContainer from "./PcDragUploadContainer.vue";
import PcExplorerGridView from "./PcExplorerGridView.vue";
import PcExplorerHeader from "./PcExplorerHeader.vue";
import PcExplorerListView from "./PcExplorerListView.vue";
import PcFileContextMenu from "./PcFileContextMenu.vue";
import SettingDialog from "./Dialog/SettingDialog.vue";

const route = useRoute();
const router = useRouter();
const { currentViewMode, setLayoutMode } = useLayoutMode();
const { currentSortMethod, currentSortOrder } = useExplorerSort();
const { selected, clear } = useFileSelection();
const { toast, confirm } = useUiFeedback();

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
const canMove = computed(() => {
  if (!hasSelection.value) return false;
  if (
    props.pageType !== ExplorerPageType.MY &&
    props.pageType !== ExplorerPageType.SHARED
  ) {
    return false;
  }
  return selectedItems.value.every((item) =>
    hasExplicitPermission(item, Permission.Edit),
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

const moveVisible = ref(false);
const movePayload = ref<MovePayload | null>(null);
const moveSubmitting = ref(false);
const moveRepeatVisible = ref(false);
const moveRepeatList = ref<Record<string, string>[]>([]);
const pendingMoveTargetId = ref<number | null>(null);

const openMoveDialog = (payload: MovePayload) => {
  movePayload.value = payload;
  moveVisible.value = true;
};

const resetMoveRepeatState = () => {
  moveRepeatVisible.value = false;
  moveRepeatList.value = [];
  pendingMoveTargetId.value = null;
};

const closeMoveDialog = () => {
  moveVisible.value = false;
  movePayload.value = null;
  moveSubmitting.value = false;
  resetMoveRepeatState();
};

const buildRepeatList = (data: Record<number, string>[]) => {
  return data.map((item) => {
    const [key, value] = Object.entries(item)[0] ?? ["", ""];
    return {
      id: key,
      name: value,
    };
  });
};

const handleMoveRepeatVisibleChange = (value: boolean) => {
  moveRepeatVisible.value = value;
  if (!value) {
    closeMoveDialog();
  }
};

const hideMoveDialogKeepPayload = () => {
  moveSubmitting.value = false;
};

const finalizeMoveSuccess = () => {
  closeMoveDialog();
  clear();
};

const handleMoveConfirm = async (payload: { targetContentId: number }) => {
  const items = movePayload.value?.items ?? [];
  if (!items.length || moveSubmitting.value) return;

  pendingMoveTargetId.value = payload.targetContentId;
  moveSubmitting.value = true;

  try {
    const moved = await confirmMoveMany(items, payload.targetContentId, 0);
    if (!moved) return;
    finalizeMoveSuccess();
  } finally {
    moveSubmitting.value = false;
  }
};

const handleMoveRepeatFile = async (repeatFileOperateType: number) => {
  const items = movePayload.value?.items ?? [];
  const targetContentId = pendingMoveTargetId.value;

  if (!items.length || targetContentId == null || moveSubmitting.value) return;

  moveSubmitting.value = true;

  try {
    const moved = await confirmMoveMany(
      items,
      targetContentId,
      repeatFileOperateType,
    );
    if (!moved) return;
    finalizeMoveSuccess();
  } finally {
    moveSubmitting.value = false;
  }
};

const handleMoveDuplicateFiles = (data: Record<number, string>[]) => {
  moveRepeatList.value = buildRepeatList(data);
  moveRepeatVisible.value = true;
  hideMoveDialogKeepPayload();
};

watch(moveVisible, (value) => {
  if (!value && !moveRepeatVisible.value) {
    moveSubmitting.value = false;
  }
});

watch(moveRepeatVisible, (value) => {
  if (!value && !moveVisible.value) {
    moveSubmitting.value = false;
  }
});

watch(movePayload, (value) => {
  if (value) return;
  resetMoveRepeatState();
});

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
  moveMany,
  confirmMoveMany,
  removeMany,
  deletePermanentlyMany,
  restoreMany,
  cancelShareMany,
  handleContextMenuSelect: runContextMenuAction,
} = useFileActions({
  onRefresh: () => emit("refresh"),
  onRenameDialog: openRename,
  onCopyLinkDialog: openShareLink,
  onMoveDialog: openMoveDialog,
  onMoveDuplicateFiles: handleMoveDuplicateFiles,
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

type UploadingFolderEventPayload = {
  tempRowId: string;
  contentId: number;
  folderName: string;
};

const settingVisible = ref(false);
const draftCreateRow = ref<ExplorerDraftItem | null>(null);
const uploadingFolderRows = ref<ExplorerUploadingFolderItem[]>([]);
const isSavingInline = ref(false);
const inlineCreateInputRef = ref<{
  focus?: () => void;
  select?: () => void;
} | null>(null);

const isDraftCreateRow = (item: ContentType): item is ExplorerDraftItem => {
  return "__isDraftCreate" in item && item.__isDraftCreate === true;
};

const getExistingContentIds = (list: ContentType[]) => {
  return new Set(
    list
      .map((item) => getContentId(item))
      .filter(
        (contentId): contentId is number => typeof contentId === "number",
      ),
  );
};

const displayList = computed<ContentType[]>(() => {
  const existingContentIds = getExistingContentIds(props.list);
  const visibleUploadingFolders = uploadingFolderRows.value.filter(
    (item) => !existingContentIds.has(item.contentId),
  );

  return [
    ...(draftCreateRow.value ? [draftCreateRow.value] : []),
    ...visibleUploadingFolders,
    ...props.list,
  ];
});

const removeUploadingFolderRow = (tempRowId: string) => {
  uploadingFolderRows.value = uploadingFolderRows.value.filter(
    (item) => item.__tempRowId !== tempRowId,
  );
};

const handleUploadingFolderStart = (payload: UploadingFolderEventPayload) => {
  removeUploadingFolderRow(payload.tempRowId);
  uploadingFolderRows.value.unshift({
    __tempRowId: payload.tempRowId,
    __isUploadingFolder: true,
    isUploading: true,
    contentId: payload.contentId,
    parentId: getExplorerContext(route).currentFolderId,
    contentName: payload.folderName,
    operateTime: new Date().toLocaleString(),
    userName: "",
    contentSize: 0,
    isFolder: true,
    path: "",
    isSetTop: false,
    ...(props.pageType === ExplorerPageType.SHARED &&
    props.currentFolderPermissionType != null
      ? { permissionType: props.currentFolderPermissionType }
      : {}),
  });
};

const handleUploadingFolderFinish = (payload: UploadingFolderEventPayload) => {
  uploadingFolderRows.value = uploadingFolderRows.value.map((item) => {
    if (item.__tempRowId !== payload.tempRowId) return item;
    return {
      ...item,
      contentId: payload.contentId,
      contentName: payload.folderName,
    };
  });
};

const handleUploadingFolderFail = (payload: UploadingFolderEventPayload) => {
  removeUploadingFolderRow(payload.tempRowId);
};

const clearInlineCreateState = () => {
  draftCreateRow.value = null;
  inlineCreateInputRef.value = null;
  isSavingInline.value = false;
};

const bindInlineCreateInputRef = (
  input: {
    focus?: () => void;
    select?: () => void;
  } | null,
) => {
  inlineCreateInputRef.value = input;
};

const focusInlineCreateInput = async () => {
  await nextTick();
  inlineCreateInputRef.value?.focus?.();
  inlineCreateInputRef.value?.select?.();
};

const buildDraftCreateRow = (): ExplorerDraftItem => {
  const context = getExplorerContext(route);

  return {
    __tempRowId: `draft-create-${Date.now()}`,
    __isDraftCreate: true,
    contentId: 0,
    parentId: context.currentFolderId,
    contentName: "",
    operateTime: new Date().toLocaleString(),
    userName: "",
    contentSize: 0,
    isFolder: true,
    path: "",
    isSetTop: false,
    ...(props.pageType === ExplorerPageType.SHARED &&
    props.currentFolderPermissionType != null
      ? { permissionType: props.currentFolderPermissionType }
      : {}),
  };
};

const handleDraftNameChange = (value: string) => {
  if (!draftCreateRow.value) return;
  draftCreateRow.value.contentName = value;
};

const cancelInlineCreate = () => {
  clearInlineCreateState();
};

const startInlineCreate = async () => {
  if (draftCreateRow.value) {
    await focusInlineCreateInput();
    return;
  }

  clear();
  closeContextMenu();
  draftCreateRow.value = buildDraftCreateRow();
  await focusInlineCreateInput();
};

const commitInlineCreate = async () => {
  const row = draftCreateRow.value;
  if (!row || isSavingInline.value) return;

  const folderName = row.contentName.trim();
  if (!folderName) {
    try {
      await confirm({
        title: t("hint"),
        message: t("folderNameRequired"),
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
        showCancelButton: true,
      });
      await focusInlineCreateInput();
    } catch {
      cancelInlineCreate();
    }
    return;
  }

  const { isValid, message } = checkNameValidity(folderName);
  if (!isValid) {
    toast(message, "error");
    await focusInlineCreateInput();
    return;
  }

  isSavingInline.value = true;

  try {
    const context = getExplorerContext(route);
    const res = await createFolderApi({
      currentContentId: context.currentFolderId,
      viewRanges: [],
      editRanges: [],
      folderName,
      isPersonal: props.pageType !== ExplorerPageType.SHARED,
    });

    if (res.code !== 1) {
      toast(t("createFailed"), "error");
      await focusInlineCreateInput();
      return;
    }

    toast(t("createSuccess"), "success");
    cancelInlineCreate();
    emit("refresh");
  } catch {
    toast(t("createFailed"), "error");
    await focusInlineCreateInput();
  } finally {
    isSavingInline.value = false;
  }
};

const handleCreate = async () => {
  if (!canCreate.value) return;

  if (props.pageType === ExplorerPageType.RECENT) {
    SessionStorageUtil.set("recentCreateFolder", "1");
    await router.push({
      path: "/my",
    });
    return;
  }

  if (currentViewMode.value === LayoutMode.GRID) {
    setLayoutMode(LayoutMode.LIST);
    await nextTick();
  }

  await startInlineCreate();
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

const handleMove = async () => {
  if (!canMove.value) return;
  await moveMany(selectedItems.value);
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

const handleMoveVisibleChange = (value: boolean) => {
  if (value) {
    moveVisible.value = true;
    return;
  }

  if (moveSubmitting.value) return;
  closeMoveDialog();
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
  if (isDraftCreateRow(payload.row)) return;
  openForRow(payload.row, payload.event);
};

const handleRowDbClick = async (payload: { row: ContentType }) => {
  const row = payload.row;
  if (isDraftCreateRow(row)) return;
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
  clearInlineCreateState();
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
    clearInlineCreateState();
    uploadingFolderRows.value = [];

    if (props.pageType !== ExplorerPageType.MY) return;
    const recentCreate = SessionStorageUtil.get("recentCreateFolder");
    if (recentCreate === "1") {
      await startInlineCreate();
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
