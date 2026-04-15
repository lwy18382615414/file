<template>
  <div class="move-file-page">
    <div class="page-content">
      <div class="selected-summary item-select">
        <div class="item-select__title">{{ summary }}</div>
      </div>

      <div class="search-wrapper">
        <van-search
          v-model="keyword"
          :placeholder="t('searchFolders')"
          @update:model-value="handleSearch"
        >
          <template #left-icon>
            <SvgIcon name="common-search" size="22" />
          </template>
        </van-search>
      </div>

      <div class="breadcrumb-list">
        <div
          v-for="(item, index) in breadcrumbList"
          :key="`${item.contentId}-${index}`"
          class="breadcrumb-item"
        >
          <button
            type="button"
            class="breadcrumb-item__name"
            :class="{ active: index === breadcrumbList.length - 1 }"
            @click="handleBreadcrumbClick(index)"
          >
            {{ item.name }}
          </button>
          <span
            v-if="index !== breadcrumbList.length - 1"
            class="breadcrumb-separator"
          >
            <SvgIcon name="nav-right" size="16" />
          </span>
        </div>
      </div>

      <div class="folder-list show-bottom-btn">
        <template v-if="displayFolders.length">
          <button
            v-for="item in displayFolders"
            :key="item.contentId"
            type="button"
            class="item-select folder-entry"
            :class="{
              active: item.contentId === currentFolderId,
              locked: isTargetLocked(item.contentId, item.path || ''),
            }"
            :disabled="
              loading || isTargetLocked(item.contentId, item.path || '')
            "
            @click="handleFolderClick(item)"
          >
            <SvgIcon name="file-folder" size="24" />

            <div class="item-select__title">{{ item.contentName }}</div>
            <SvgIcon
              v-if="!isTargetLocked(item.contentId, item.path || '')"
              name="nav-right"
              size="24"
            />
          </button>
        </template>

        <div v-else-if="loading" class="status-block">
          {{ t("loading") }}...
        </div>
        <div v-else class="status-block">{{ t("noFolder") }}</div>
      </div>
    </div>

    <div class="page-bottom">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading || isCreatingFolder || submitting"
        @click="handleOpenCreatePopup"
      >
        {{ t("createFolder") }}
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canConfirmMoveTarget || submitting || isCreatingFolder"
        @click="handleConfirmMove"
      >
        {{ submitting ? `${t("moveHere")}...` : t("moveHere") }}
      </button>
    </div>

    <NameEditPopup
      :show="createPopupVisible"
      :item="null"
      mode="create"
      @update:show="createPopupVisible = $event"
      @confirm="handleCreateFolder"
    />

    <div
      v-if="showRepeatPopup"
      class="repeat-mask"
      @click.self="showRepeatPopup = false"
    >
      <div class="repeat-popup">
        <div class="repeat-header">
          <span>{{ t("fileDuplicate") }}</span>
        </div>
        <div class="repeat-content">
          <p class="repeat-text">
            {{ t("duplicateFilesWarning", { count: duplicateList.length }) }}
          </p>
          <button
            type="button"
            class="repeat-option"
            @click="handleMoveRepeatFile(3)"
          >
            {{ t("skipFiles") }}
          </button>
          <button
            type="button"
            class="repeat-option"
            @click="handleMoveRepeatFile(1)"
          >
            {{ t("overwriteFiles") }}
          </button>
          <button
            type="button"
            class="repeat-option"
            @click="handleMoveRepeatFile(2)"
          >
            {{ t("keep") }}
          </button>
          <button
            type="button"
            class="repeat-cancel"
            @click="showRepeatPopup = false"
          >
            {{ t("cancel") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { createFolderApi, moveFileOrDirApi } from "@/api/fileService";
import { _getMySpaceContentApi } from "@/api/mySpace";
import { _getShareSpace } from "@/api/shareSpace";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import type { ContentType } from "@/types/type";
import { checkNameValidity, setAppTitle, t } from "@/utils";
import { getContentId, getIsFolder, getName } from "@/utils/typeUtils";
import { ExplorerPageType } from "@/views/fileExplorer";
import type { MovePayload } from "@/views/hooks/useFileActions";
import { SvgIcon } from "@/components";
import NameEditPopup from "@/views/components/h5/pop/NameEditPopup.vue";

type FolderRow = {
  contentId: number;
  contentName: string;
  isFolder: boolean;
  path?: string;
  operateTime?: string;
  contentSize?: number;
};

type BreadcrumbItem = {
  contentId: number;
  name: string;
  path: string;
};

const router = useRouter();
const { toast } = useUiFeedback();
const keyword = ref("");
const loading = ref(false);
const submitting = ref(false);
const isCreatingFolder = ref(false);
const createPopupVisible = ref(false);
const allRows = ref<FolderRow[]>([]);
const breadcrumbList = ref<BreadcrumbItem[]>([]);
const currentFolderId = ref(0);
const showRepeatPopup = ref(false);
const duplicateList = ref<Record<number, string>[]>([]);
const pendingMoveTargetId = ref<number | null>(null);

const movePayload = computed<MovePayload | null>(() => {
  try {
    const raw = history.state.movePayload;
    if (!raw) return null;
    return JSON.parse(raw) as MovePayload;
  } catch {
    return null;
  }
});

const items = computed<ContentType[]>(() => movePayload.value?.items ?? []);
const pageType = computed(
  () => movePayload.value?.pageType ?? ExplorerPageType.MY,
);
const spaceLabel = computed(() =>
  pageType.value === ExplorerPageType.SHARED ? t("shared") : t("myFiles"),
);
const summary = computed(() => {
  const firstItem = items.value[0];
  if (!firstItem) return t("selectFile");
  const firstName = getName(firstItem) ?? "";
  if (items.value.length <= 1) {
    return t("currentSelection", { name: firstName });
  }
  return t("moveSelectedItems", {
    name: firstName,
    count: items.value.length,
  });
});
const displayFolders = computed(() => {
  const folders = allRows.value.filter((item) => item.isFolder);
  if (!keyword.value) return folders;
  return folders.filter((item) => item.contentName.includes(keyword.value));
});
const sourceFolderPaths = computed(() =>
  items.value
    .filter((item) => getIsFolder(item))
    .map((item) => ({
      contentId: getContentId(item) ?? 0,
      path: ("path" in item ? item.path : "") || "",
    }))
    .filter((item) => item.contentId > 0 && item.path),
);
const canConfirmMoveTarget = computed(() => {
  const currentPath =
    breadcrumbList.value[breadcrumbList.value.length - 1]?.path ?? "";
  return (
    items.value.length > 0 &&
    !isTargetLocked(currentFolderId.value, currentPath)
  );
});

const handleSearch = (value: string) => {
  keyword.value = value;
};

const buildRootBreadcrumb = (): BreadcrumbItem => ({
  contentId: 0,
  name: spaceLabel.value,
  path: "",
});

const normalizeFolderPath = (path: string) => path.replace(/\/+$/, "");

const buildBreadcrumbsFromPayload = () => {
  const payload = movePayload.value;
  const breadcrumbs = [buildRootBreadcrumb()];

  if (!payload) return breadcrumbs;

  payload.folderPath.forEach((id, index) => {
    breadcrumbs.push({
      contentId: Number(id) || 0,
      name: payload.folderNames[index] || "",
      path: normalizeFolderPath(
        `/${payload.folderPath.slice(0, index + 1).join("/")}`,
      ),
    });
  });

  return breadcrumbs;
};

const isTargetLocked = (folderId: number, folderPath: string) => {
  const normalizedTargetPath = normalizeFolderPath(folderPath);

  return sourceFolderPaths.value.some((item) => {
    const sourcePath = normalizeFolderPath(item.path);
    if (folderId === item.contentId) return true;
    return (
      !!sourcePath &&
      !!normalizedTargetPath &&
      normalizedTargetPath.startsWith(`${sourcePath}/`)
    );
  });
};

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
    SortMethod: 1,
    SortOrder: "desc",
  });

  return Array.isArray(res.data?.data) ? (res.data.data as FolderRow[]) : [];
};

const setCurrentLocation = async (
  folderId: number,
  breadcrumbs: BreadcrumbItem[],
) => {
  loading.value = true;
  currentFolderId.value = folderId;

  try {
    allRows.value = await requestFolders(folderId);
    breadcrumbList.value = breadcrumbs;
  } finally {
    loading.value = false;
  }
};

const reloadCurrentLocation = async () => {
  await setCurrentLocation(
    currentFolderId.value,
    breadcrumbList.value.map((item) => ({ ...item })),
  );
};

const initializePage = async () => {
  if (!items.value.length) {
    toast(t("selectFile"), "error");
    router.back();
    return;
  }

  const breadcrumbs = buildBreadcrumbsFromPayload();
  const folderId = movePayload.value?.currentFolderId ?? 0;

  try {
    await setCurrentLocation(folderId, breadcrumbs);
  } catch {
    await setCurrentLocation(0, [buildRootBreadcrumb()]);
  }
};

const handleFolderClick = async (item: FolderRow) => {
  if (loading.value || isCreatingFolder.value) return;
  if (isTargetLocked(item.contentId, item.path || "")) return;

  await setCurrentLocation(item.contentId, [
    ...breadcrumbList.value,
    {
      contentId: item.contentId,
      name: item.contentName,
      path: item.path || "",
    },
  ]);
};

const handleBreadcrumbClick = async (index: number) => {
  if (loading.value || isCreatingFolder.value) return;
  if (index === breadcrumbList.value.length - 1) return;

  const nextBreadcrumbs = breadcrumbList.value.slice(0, index + 1);
  const target = nextBreadcrumbs[nextBreadcrumbs.length - 1];
  await setCurrentLocation(target.contentId, nextBreadcrumbs);
};

const handleOpenCreatePopup = () => {
  if (createPopupVisible.value || loading.value || submitting.value) return;
  createPopupVisible.value = true;
};

const handleCreateFolder = async (folderName: string) => {
  if (!folderName) {
    toast(t("folderNameRequired"), "error");
    return;
  }

  const { isValid, message } = checkNameValidity(folderName);
  if (!isValid) {
    toast(message, "error");
    return;
  }

  if (
    allRows.value.some(
      (item) => item.isFolder && item.contentName.trim() === folderName,
    )
  ) {
    toast(t("duplicateFolderName"), "error");
    return;
  }

  isCreatingFolder.value = true;
  try {
    const res = await createFolderApi({
      currentContentId: currentFolderId.value,
      viewRanges: [],
      editRanges: [],
      folderName,
      isPersonal: pageType.value !== ExplorerPageType.SHARED,
    });

    if (res.code !== 1) {
      toast(t("createFailed"), "error");
      return;
    }

    createPopupVisible.value = false;
    await reloadCurrentLocation();
    toast(t("createSuccess"), "success");
  } catch {
    toast(t("createFailed"), "error");
  } finally {
    isCreatingFolder.value = false;
  }
};

const executeMove = async (repeatFileOperateType = 0) => {
  const contentIds = items.value
    .map((item) => getContentId(item) ?? 0)
    .filter((contentId) => contentId > 0);

  if (!contentIds.length || pendingMoveTargetId.value == null) return;

  submitting.value = true;
  try {
    const res = await moveFileOrDirApi({
      contentIds,
      targetContentId: pendingMoveTargetId.value,
      repeatFileOperateType,
    });

    if (res.code !== 1) {
      toast(t("errorOccurred"), "error");
      return;
    }

    if (res.data?.length) {
      duplicateList.value = res.data;
      showRepeatPopup.value = true;
      return;
    }

    toast(t("operationSuccess"), "success");
    showRepeatPopup.value = false;
    router.back();
  } finally {
    submitting.value = false;
  }
};

const handleConfirmMove = async () => {
  if (!canConfirmMoveTarget.value || submitting.value) return;
  pendingMoveTargetId.value = currentFolderId.value;
  await executeMove(0);
};

const handleMoveRepeatFile = async (repeatFileOperateType: number) => {
  showRepeatPopup.value = false;
  await executeMove(repeatFileOperateType);
};

onMounted(async () => {
  setAppTitle(t("moveTo"));
  await initializePage();
});
</script>

<style scoped lang="scss">
.move-file-page {
  min-height: 100vh;
  padding-bottom: 82px;
  background: #fff;
  box-sizing: border-box;
}

.page-content {
  min-height: 100vh;
  background: #fff;
}

.selected-summary,
.search-bar,
.item-select {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--card-border-color);
}

.selected-summary {
  padding-top: 18px;
  padding-bottom: 14px;
}

.search-bar {
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--text-primary-color);
}

.search-icon {
  position: relative;
  width: 14px;
  height: 14px;
  border: 2px solid #c2cad7;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.search-icon::after {
  content: "";
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 7px;
  height: 2px;
  border-radius: 999px;
  background: #c2cad7;
  transform: rotate(45deg);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  padding: 0 16px;
  min-height: 50px;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--card-border-color);
  color: var(--text-secondary-color);
  font-size: 14px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.breadcrumb-item__name {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--text-secondary-color);
  white-space: nowrap;
  font-size: 14px;
}

.breadcrumb-item__name.active {
  color: var(--text-primary-color);
}

.breadcrumb-separator {
  margin: 0 6px;
}

.folder-list {
  overflow-y: auto;
  min-height: calc(100vh - 170px);
}

.folder-list.show-bottom-btn {
  padding-bottom: 84px;
}

.item-select {
  width: 100%;
  gap: 8px;
  background: #fff;
  text-align: left;
  box-sizing: border-box;
}

.item-select__title {
  color: var(--text-primary-color);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.folder-entry {
  border: none;
}

.folder-entry.active {
  background: #f7faff;
}

.folder-entry.locked {
  opacity: 0.45;
}

.status-block {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
  color: var(--text-secondary-color);
  font-size: 14px;
}

.page-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  box-sizing: border-box;
}

.btn {
  flex: 1;
  height: 50px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}

.btn:disabled {
  opacity: 0.5;
}

.btn-secondary {
  background: var(--subtle-fill-color);
  color: var(--text-primary-color);
}

.btn-primary {
  background: #ebf0ff;
  color: var(--theme-color);
}

.repeat-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.repeat-popup {
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
  background: #fff;
}

.repeat-header {
  padding: 16px 20px;
  background: var(--subtle-fill-color);
  font-size: 16px;
  color: var(--text-primary-color);
}

.repeat-content {
  padding: 20px 16px 16px;
}

.repeat-text {
  margin: 0 0 12px;
  color: var(--text-secondary-color);
  font-size: 14px;
}

.repeat-option,
.repeat-cancel {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 10px;
  font-size: 14px;
}

.repeat-option {
  background: #ebf0ff;
  color: var(--theme-color);
}

.repeat-cancel {
  background: var(--subtle-fill-color);
  color: var(--text-primary-color);
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .page-bottom {
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}

@supports (padding-bottom: constant(safe-area-inset-bottom)) {
  .page-bottom {
    padding-bottom: calc(16px + constant(safe-area-inset-bottom));
  }
}
</style>
