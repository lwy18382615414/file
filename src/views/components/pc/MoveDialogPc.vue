<template>
  <div class="move-dialog-pc-container">
    <el-dialog
      :model-value="show"
      width="960"
      :modal="false"
      destroy-on-close
      :show-close="false"
      class="move-dialog-pc"
      @close="handleClose"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header__left">
            <span class="dialog-title">{{ t("move") }}：</span>
            <span class="dialog-title__name">{{ titlePrimary }}</span>
            <button
              v-if="items.length > 1"
              type="button"
              class="dialog-title__extra"
            >
              {{ t("andItem", { count: items.length }) }}
              <SvgIcon name="ic_arr_down_more" :size="14" />
            </button>
          </div>
          <button type="button" class="icon-button" @click="handleClose">
            <SvgIcon name="ic_close" :size="18" />
          </button>
        </div>
      </template>

      <div class="sub-header">
        <div class="breadcrumb-wrapper">
          <div class="compact-actions">
            <button
              class="nav-button"
              :class="{ disabled: !canGoBack }"
              :disabled="!canGoBack"
              type="button"
              @click="handleBack"
            >
              <SvgIcon name="action-pre_page" size="12" />
            </button>
            <button
              class="nav-button"
              :class="{ disabled: !canGoForward }"
              :disabled="!canGoForward"
              type="button"
              @click="handleForward"
            >
              <SvgIcon name="action-next_page" size="12" />
            </button>
          </div>

          <div v-if="breadcrumbList.length" class="breadcrumb">
            <button
              type="button"
              class="breadcrumb-item"
              :class="{ active: breadcrumbList.length === 1 }"
              @click="handleBreadcrumbClick(0)"
            >
              {{ breadcrumbList[0].name }}
            </button>

            <template v-if="hiddenBreadcrumbs.length">
              <span class="breadcrumb-separator">
                <SvgIcon name="ic_right" :size="14" color="#98a2b3" />
              </span>
              <el-popover
                placement="bottom"
                trigger="hover"
                :width="220"
                popper-class="move-dialog-breadcrumb-popover"
              >
                <template #reference>
                  <button
                    type="button"
                    class="breadcrumb-item breadcrumb-item--ellipsis"
                  >
                    ···
                  </button>
                </template>
                <div class="breadcrumb-popover-list">
                  <button
                    v-for="(item, index) in hiddenBreadcrumbs"
                    :key="`${item.contentId}-${index}`"
                    type="button"
                    class="breadcrumb-popover-item"
                    @click="handleBreadcrumbClick(index + 1)"
                  >
                    {{ item.name }}
                  </button>
                </div>
              </el-popover>
            </template>

            <template v-if="breadcrumbList.length > 1">
              <span class="breadcrumb-separator">
                <SvgIcon name="ic_right" :size="14" color="#98a2b3" />
              </span>
              <button
                type="button"
                class="breadcrumb-item active"
                @click="handleBreadcrumbClick(breadcrumbList.length - 1)"
              >
                {{ breadcrumbList[breadcrumbList.length - 1].name }}
              </button>
            </template>
          </div>
        </div>

        <div class="toolbar-actions">
          <div class="search-box">
            <SvgIcon name="ic_search" :size="16" color="#98a2b3" />
            <input
              v-model.trim="keyword"
              class="search-input"
              :placeholder="t('searchFolders')"
            />
          </div>
        </div>
      </div>

      <div class="dialog-main">
        <div class="tree-panel">
          <div class="tree-root">
            <SvgIcon name="file-folder" :size="18" color="#327edc" />
            <span>{{ spaceLabel }}</span>
          </div>
          <div class="tree-list">
            <button
              v-for="item in treeFolders"
              :key="item.contentId"
              type="button"
              class="tree-item"
              :class="{
                active: item.contentId === activeTreeId,
                locked: isTargetLocked(item.contentId, item.path || ''),
              }"
              @click="handleTreeSelect(item)"
            >
              <span
                v-if="isTargetLocked(item.contentId, item.path || '')"
                class="tree-item__lock-mask"
              ></span>
              <span class="tree-item__indicator"></span>
              <span class="tree-item__name">{{ item.contentName }}</span>
              <SvgIcon name="ic_right" :size="14" color="#98a2b3" />
            </button>
          </div>
        </div>

        <div class="content-panel">
          <div class="content-header">
            <span class="col-name">{{ t("docName") }}</span>
            <span class="col-time">{{ t("lastUpdated") }}</span>
            <span class="col-size">{{ t("size") }}</span>
          </div>

          <div ref="scrollContainer" class="content-list">
            <template v-if="filteredRows.length > 0">
              <button
                v-for="item in filteredRows"
                :key="item.contentId"
                type="button"
                class="content-row"
                :class="{
                  disabled:
                    !item.isFolder ||
                    isTargetLocked(item.contentId, item.path || ''),
                  selected: item.contentId === currentFolderId,
                  locked: isTargetLocked(item.contentId, item.path || ''),
                }"
                :disabled="
                  !item.isFolder ||
                  isTargetLocked(item.contentId, item.path || '')
                "
                @click="handleContentRowClick(item)"
              >
                <span
                  v-if="isTargetLocked(item.contentId, item.path || '')"
                  class="lock-mask"
                ></span>
                <div class="col-name cell-name">
                  <SvgIcon
                    :name="item.isFolder ? 'file-folder' : getRowFileIcon(item)"
                    :size="20"
                    :color="item.isFolder ? '#327edc' : '#98a2b3'"
                  />
                  <span>{{ item.contentName }}</span>
                </div>
                <span class="col-time">{{ formatTime(item.operateTime) }}</span>
                <span class="col-size">
                  {{
                    item.isFolder ? "-" : formatFileSize(item.contentSize || 0)
                  }}
                </span>
              </button>
            </template>
            <div
              v-else-if="loading"
              v-loading="loading"
              class="skeleton-wrapper"
            ></div>
            <div v-else class="empty-wrapper">
              <EmptyState />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button type="button" class="create-folder-btn">
            <SvgIcon name="share-add" :size="16" color="#327edc" />
            <span>{{ t("createFolder") }}</span>
          </button>

          <div class="footer-actions">
            <el-button class="cancel-btn" @click="handleClose">
              {{ t("cancel") }}
            </el-button>
            <el-button
              class="confirm-btn"
              type="primary"
              :disabled="!canConfirmMoveTarget"
              @click="handleClose"
            >
              {{ t("moveHere") }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { EmptyState, SvgIcon } from "@/components";
import { _getMySpaceContentApi } from "@/api/mySpace";
import { _getShareSpace } from "@/api/shareSpace";
import type { ContentType } from "@/types/type";
import { ExplorerPageType } from "@/views/fileExplorer";
import type { MovePayload } from "@/views/hooks/useFileActions";
import { formatFileSize, formatTime, getFileIcon, t } from "@/utils";
import { getContentId, getIsFolder, getName } from "@/utils/typeUtils";

type FolderRow = {
  contentId: number;
  contentName: string;
  isFolder: boolean;
  operateTime: string;
  contentSize: number;
  path?: string;
};

type BreadcrumbItem = {
  contentId: number;
  name: string;
  path: string;
};

type ForwardEntry = {
  folderId: number;
  breadcrumbs: BreadcrumbItem[];
  treeRootId: number;
};

const props = defineProps<{
  show: boolean;
  payload: MovePayload | null;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const loading = ref(false);
const keyword = ref("");
const allRows = ref<FolderRow[]>([]);
const rootFolders = ref<FolderRow[]>([]);
const breadcrumbList = ref<BreadcrumbItem[]>([]);
const scrollContainer = ref<HTMLElement | null>(null);
const currentFolderId = ref(0);
const activeTreeId = ref(0);
const forwardStack = ref<ForwardEntry[]>([]);
const defaultRows = ref<FolderRow[]>([]);
const defaultBreadcrumbs = ref<BreadcrumbItem[]>([]);
const defaultFolderId = ref(0);
const defaultTreeId = ref(0);
const initializedPageType = ref<ExplorerPageType | null>(null);

const items = computed<ContentType[]>(() => props.payload?.items ?? []);
const firstItem = computed(() => items.value[0] ?? null);
const pageType = computed(() => props.payload?.pageType ?? ExplorerPageType.MY);
const sourceFolderId = computed(() => props.payload?.currentFolderId ?? 0);
const rootPath = "";
const sourceFolderPaths = computed(() =>
  items.value
    .filter((item) => getIsFolder(item))
    .map((item) => ({
      contentId: getContentId(item) ?? 0,
      path: ("path" in item ? item.path : "") || "",
    }))
    .filter((item) => item.contentId > 0 && item.path),
);
const spaceLabel = computed(() =>
  pageType.value === ExplorerPageType.SHARED ? t("shared") : t("myFiles"),
);
const isTargetLocked = (folderId: number, folderPath: string) => {
  if (folderId === sourceFolderId.value) return true;

  return sourceFolderPaths.value.some((item) => {
    if (folderId === item.contentId) return true;
    return folderPath.startsWith(`${item.path}/`);
  });
};

const canConfirmMoveTarget = computed(() => {
  const currentPath =
    breadcrumbList.value[breadcrumbList.value.length - 1]?.path ?? rootPath;
  return !isTargetLocked(currentFolderId.value, currentPath);
});

const buildBreadcrumbItem = (
  contentId: number,
  name: string,
  path: string = rootPath,
): BreadcrumbItem => ({
  contentId,
  name,
  path,
});

const buildRootBreadcrumb = () =>
  buildBreadcrumbItem(0, spaceLabel.value, rootPath);

const titlePrimary = computed(() => {
  const item = firstItem.value;
  return item ? (getName(item) ?? "") : t("selectFile");
});

const filteredRows = computed(() => {
  if (!keyword.value) return allRows.value;
  return allRows.value.filter((item) =>
    item.contentName.includes(keyword.value),
  );
});
const hiddenBreadcrumbs = computed(() => {
  if (breadcrumbList.value.length <= 2) return [];
  return breadcrumbList.value.slice(1, -1);
});
const treeFolders = computed(() =>
  rootFolders.value.filter((item) => item.isFolder),
);
const canGoBack = computed(() => breadcrumbList.value.length > 1);
const canGoForward = computed(() => forwardStack.value.length > 0);

const requestFolders = async (folderId: number) => {
  const requestApi =
    pageType.value === ExplorerPageType.SHARED
      ? _getShareSpace
      : _getMySpaceContentApi;

  const res = await requestApi({
    PageIndex: 1,
    PageSize: 999,
    ContentId: folderId,
    ContentType: 0,
    SortMethod: 2,
    SortOrder: "asc",
  });

  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const getRowFileIcon = (item: FolderRow) => getFileIcon(item.contentName);

const setCurrentLocation = async (
  folderId: number,
  breadcrumbs: BreadcrumbItem[],
  treeRootId: number,
) => {
  loading.value = true;
  currentFolderId.value = folderId;
  activeTreeId.value = treeRootId;

  try {
    allRows.value =
      folderId === 0
        ? rootFolders.value.map((item) => ({ ...item }))
        : await requestFolders(folderId);
    breadcrumbList.value = breadcrumbs;
    await nextTick();
    scrollContainer.value?.scrollTo({ top: 0 });
  } finally {
    loading.value = false;
  }
};

const resetForwardStack = () => {
  forwardStack.value = [];
};

const buildCurrentEntry = (): ForwardEntry => ({
  folderId: currentFolderId.value,
  breadcrumbs: breadcrumbList.value.map((item) => ({ ...item })),
  treeRootId: activeTreeId.value,
});

const openLocation = async (
  folderId: number,
  breadcrumbs: BreadcrumbItem[],
  treeRootId: number,
) => {
  resetForwardStack();
  await setCurrentLocation(folderId, breadcrumbs, treeRootId);
};

const restoreDefaultState = async () => {
  keyword.value = "";
  allRows.value = defaultRows.value.map((item) => ({ ...item }));
  breadcrumbList.value = defaultBreadcrumbs.value.map((item) => ({ ...item }));
  currentFolderId.value = defaultFolderId.value;
  activeTreeId.value = defaultTreeId.value;
  resetForwardStack();
  await nextTick();
  scrollContainer.value?.scrollTo({ top: 0 });
};

const initializeDialog = async () => {
  if (!props.payload) {
    allRows.value = [];
    rootFolders.value = [];
    breadcrumbList.value = [];
    currentFolderId.value = 0;
    activeTreeId.value = 0;
    defaultRows.value = [];
    defaultBreadcrumbs.value = [];
    defaultFolderId.value = 0;
    defaultTreeId.value = 0;
    initializedPageType.value = null;
    resetForwardStack();
    return;
  }

  loading.value = true;

  try {
    const roots = await requestFolders(0);
    rootFolders.value = roots.filter((item) => item.isFolder);

    const firstSelectableRoot = rootFolders.value.find(
      (item) => !isTargetLocked(item.contentId, item.path || ""),
    );

    if (!firstSelectableRoot) {
      const initialBreadcrumbs = [buildRootBreadcrumb()];
      allRows.value = rootFolders.value.map((item) => ({ ...item }));
      breadcrumbList.value = initialBreadcrumbs;
      currentFolderId.value = 0;
      activeTreeId.value = 0;
      defaultRows.value = allRows.value.map((item) => ({ ...item }));
      defaultBreadcrumbs.value = initialBreadcrumbs.map((item) => ({
        ...item,
      }));
      defaultFolderId.value = 0;
      defaultTreeId.value = 0;
      initializedPageType.value = pageType.value;
      resetForwardStack();
      return;
    }

    const initialBreadcrumbs = [
      buildRootBreadcrumb(),
      buildBreadcrumbItem(
        firstSelectableRoot.contentId,
        firstSelectableRoot.contentName,
        firstSelectableRoot.path || "",
      ),
    ];

    resetForwardStack();
    await setCurrentLocation(
      firstSelectableRoot.contentId,
      initialBreadcrumbs,
      firstSelectableRoot.contentId,
    );

    defaultRows.value = allRows.value.map((item) => ({ ...item }));
    defaultBreadcrumbs.value = initialBreadcrumbs.map((item) => ({ ...item }));
    defaultFolderId.value = firstSelectableRoot.contentId;
    defaultTreeId.value = firstSelectableRoot.contentId;
    initializedPageType.value = pageType.value;
  } finally {
    loading.value = false;
  }
};

const ensureDialogReady = async () => {
  if (!props.payload) return;

  if (
    initializedPageType.value !== pageType.value ||
    !rootFolders.value.length
  ) {
    await initializeDialog();
    return;
  }

  await restoreDefaultState();
};

const resetDialogState = async () => {
  if (!props.payload || initializedPageType.value !== pageType.value) {
    keyword.value = "";
    resetForwardStack();
    return;
  }

  await restoreDefaultState();
};

const handleClose = async () => {
  await resetDialogState();
  emit("update:show", false);
};

watch(
  () => props.show,
  async (value) => {
    if (!value) return;
    await ensureDialogReady();
  },
  { immediate: true },
);

const handleTreeSelect = async (item: FolderRow) => {
  if (isTargetLocked(item.contentId, item.path || "")) return;

  await openLocation(
    item.contentId,
    [
      buildRootBreadcrumb(),
      buildBreadcrumbItem(item.contentId, item.contentName, item.path || ""),
    ],
    item.contentId,
  );
};

const handleContentRowClick = async (item: FolderRow) => {
  if (!item.isFolder || isTargetLocked(item.contentId, item.path || "")) return;

  await openLocation(
    item.contentId,
    [
      ...breadcrumbList.value,
      buildBreadcrumbItem(item.contentId, item.contentName, item.path || ""),
    ],
    activeTreeId.value || item.contentId,
  );
};

const handleBreadcrumbClick = async (index: number) => {
  if (index === breadcrumbList.value.length - 1) return;

  const nextBreadcrumbs = breadcrumbList.value.slice(0, index + 1);
  const target = nextBreadcrumbs[nextBreadcrumbs.length - 1];
  const treeRootId = nextBreadcrumbs[1]?.contentId ?? 0;

  await openLocation(target.contentId, nextBreadcrumbs, treeRootId);
};

const handleBack = async () => {
  if (!canGoBack.value) return;

  forwardStack.value.push(buildCurrentEntry());
  const nextBreadcrumbs = breadcrumbList.value.slice(0, -1);
  const target = nextBreadcrumbs[nextBreadcrumbs.length - 1];
  const treeRootId = nextBreadcrumbs[1]?.contentId ?? 0;

  await setCurrentLocation(target.contentId, nextBreadcrumbs, treeRootId);
};

const handleForward = async () => {
  const nextEntry = forwardStack.value.pop();
  if (!nextEntry) return;

  await setCurrentLocation(
    nextEntry.folderId,
    nextEntry.breadcrumbs.map((item) => ({ ...item })),
    nextEntry.treeRootId,
  );
};
</script>

<style scoped lang="scss">
:deep(.el-dialog) {
  padding: 0;
  overflow: hidden;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid #eaecf0;
}

:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-dialog__footer) {
  padding: 0;
  border-top: 1px solid #eaecf0;
}

.dialog-header {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dialog-title {
  color: #101828;
  font-size: 16px;
  font-weight: 600;
}

.dialog-title__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #101828;
  font-size: 16px;
}

.dialog-title__extra,
.icon-button,
.breadcrumb-item,
.tree-item,
.create-folder-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

.dialog-title__extra {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #667085;
  font-size: 14px;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.sub-header {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eaecf0;
}

.breadcrumb-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.compact-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-button {
  width: 28px;
  height: 28px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.breadcrumb-item {
  border: none;
  background: transparent;
  color: #667085;
  font-size: 14px;
  padding: 0;
  // max-width: 180px;
  // overflow: hidden;
  // text-overflow: ellipsis;
  // white-space: nowrap;
  cursor: pointer;
}

.breadcrumb-item--ellipsis {
  min-width: 24px;
  max-width: none;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
}

.breadcrumb-item.active {
  color: #101828;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 6px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.breadcrumb-popover-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.breadcrumb-popover-item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #344054;
  text-align: left;
  cursor: pointer;
}

.breadcrumb-popover-item:hover {
  background: #f8fafc;
}

:deep(.move-dialog-breadcrumb-popover) {
  padding: 8px;
  border-radius: 10px;
}

:deep(.breadcrumb .el-popper-trigger),
:deep(.breadcrumb .el-popover__reference),
:deep(.breadcrumb .el-popover__reference-wrapper) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

:deep(.breadcrumb .el-popper-trigger button) {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: none;
  background: transparent;
  outline: none;
  box-shadow: none;
}

:deep(.breadcrumb .el-popover__reference-wrapper .breadcrumb-item),
:deep(.breadcrumb .el-popover__reference-wrapper .breadcrumb-item--ellipsis) {
  max-width: none;
}

:deep(.breadcrumb .el-popper-trigger .breadcrumb-item--ellipsis) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 0;
  color: #667085;
  line-height: 1;
  user-select: none;
}

:deep(.breadcrumb .el-popper-trigger:hover .breadcrumb-item--ellipsis),
:deep(.breadcrumb .el-popper-trigger .breadcrumb-item--ellipsis:focus) {
  color: #101828;
}

:deep(.breadcrumb .el-popper-trigger button:focus-visible),
:deep(.breadcrumb .el-popper-trigger .breadcrumb-item--ellipsis:focus-visible) {
  outline: none;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-box {
  width: 220px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  color: #101828;
  font-size: 14px;
}

.dialog-main {
  height: 480px;
  display: flex;
}

.tree-panel {
  width: 280px;
  border-right: 1px solid #eaecf0;
  background: #fcfcfd;
}

.tree-root {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #eaecf0;
  color: #101828;
  font-size: 14px;
  font-weight: 500;
}

.tree-list {
  padding: 8px 0;
}

.tree-item {
  position: relative;
  width: 100%;
  height: 40px;
  padding: 0 16px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #344054;
  text-align: left;
  overflow: hidden;
}

.tree-item__lock-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: not-allowed;
}

.tree-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-item.locked .tree-item__indicator {
  background: transparent;
}

.tree-item.locked.active {
  background: transparent;
  color: #344054;
}

.tree-item__indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  border-radius: 0 2px 2px 0;
}

.tree-item.active {
  background: #eff6ff;
  color: #175cd3;
}

.tree-item.active .tree-item__indicator {
  background: #327edc;
}

.tree-item__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
}

.content-header,
.content-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px 100px;
  align-items: center;
}

.content-header {
  height: 48px;
  padding: 0 20px;
  border-bottom: 1px solid #eaecf0;
  color: #98a2b3;
  font-size: 13px;
}

.content-list {
  height: calc(100% - 48px);
  overflow-y: auto;
}

.content-row {
  position: relative;
  width: 100%;
  height: 52px;
  padding: 0 20px;
  border: none;
  background: transparent;
  text-align: left;
  color: #101828;
}

.lock-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: not-allowed;
}

.content-row:hover:not(.disabled) {
  background: #f8fafc;
}

.content-row.selected {
  background: #eff6ff;
}

.content-row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-row.locked {
  background: #f8fafc;
}

.cell-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cell-name span,
.col-time,
.col-size {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.skeleton-wrapper,
.empty-wrapper {
  width: 100%;
  height: 100%;
  padding: 16px 20px;
}

.dialog-footer {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create-folder-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #327edc;
  font-size: 14px;
  padding: 0;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  min-width: 88px;
  height: 36px;
  border-radius: 8px;
}

.cancel-btn {
  border: 1px solid #d0d5dd;
  background: #fff;
  color: #344054;
}
</style>
