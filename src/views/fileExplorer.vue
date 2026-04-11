<template>
  <div class="main-container">
    <template v-if="isMobileApp">
      <FileListMobile
        :page-type="context.pageType"
        :query="query"
        :loading="loading"
        :list="list"
        :has-more="hasMore"
        :columns="pageConfig.columns"
        :should-load-mobile-folders-first="shouldLoadMobileFoldersFirst"
        @load-more="loadMore"
        @refresh="refreshList"
        @rename="openRename"
        @header-blocking-change="childHeaderBlocked = $event"
      />

      <CreateChooseDialog
        :create-visible="createVisible"
        @update:create-visible="createVisible = $event"
        @on-action="handleCreateAction"
      />

      <UploadDialog
        :upload-visible="uploadVisible"
        :content-id="context.currentFolderId"
        @update:upload-visible="uploadVisible = $event"
        @on-refresh-data="refreshList"
        @on-repeat="showRepeatFile = true"
      />

      <RepeatFilePopup
        :show="showRepeatFile"
        :content-id="context.currentFolderId"
        @update:show="showRepeatFile = $event"
      />

      <NameEditPopup
        :show="renameVisible"
        :item="renameItem"
        :mode="mode"
        @update:show="handleRenameVisibleChange"
        @confirm="confirmRename"
      />
    </template>

    <FileListPc
      v-else
      :page-type="context.pageType"
      :query="query"
      :loading="loading"
      :list="list"
      :total="total"
      :has-more="hasMore"
      :columns="pageConfig.columns"
      :allow-upload="allowUpload"
      :current-folder-permission-type="currentFolderPermissionType"
      :current-folder-permission-count="currentFolderPermissionCount"
      @load-more="loadMore"
      @refresh="refreshList"
      @search="searchList"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { clearRecycleBinApi } from "@/api/recycleBin";
import { hasCreateSharePermissionApi } from "@/api/common";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import { useRenameDialog } from "./hooks/useRenameDialog";
import { useExplorerMobileHeader } from "./hooks/useExplorerMobileHeader";
import { ExplorerPageType } from "./fileExplorer";
import FileListMobile from "./components/h5/FileListMobile.vue";
import FileListPc from "./components/pc/FileListPc.vue";
import CreateChooseDialog from "./components/h5/pop/CreateChooseDialog.vue";
import UploadDialog from "./components/h5/pop/UploadDialog.vue";
import RepeatFilePopup from "./components/h5/pop/RepeatFilePopup.vue";
import NameEditPopup from "./components/h5/pop/NameEditPopup.vue";
import { useFileData } from "./useFileData";

const router = useRouter();
const { t } = useI18n();
const { toast, confirm } = useUiFeedback();
const childHeaderBlocked = ref(false);
const canCreateSharedFolder = ref(false);
const createVisible = ref(false);
const uploadVisible = ref(false);
const showRepeatFile = ref(false);

const isHeaderBlocked = computed(
  () =>
    childHeaderBlocked.value ||
    createVisible.value ||
    uploadVisible.value ||
    showRepeatFile.value ||
    renameVisible.value,
);

const {
  isMobileApp,
  query,
  context,
  pageConfig,
  loading,
  list,
  total,
  hasMore,
  shouldLoadMobileFoldersFirst,
  currentFolderPermissionType,
  currentFolderPermissionCount,
  allowUpload,
  loadMore,
  refreshList,
  searchList,
} = useFileData();

const {
  mode,
  renameVisible,
  renameItem,
  openRename,
  openCreate,
  closeRename,
  confirmRename,
} = useRenameDialog({
  onRefresh: () => refreshList(),
});

const handleRenameVisibleChange = (value: boolean) => {
  if (value) {
    renameVisible.value = true;
    return;
  }

  closeRename();
};

const syncCreatePermission = async () => {
  if (
    context.value.pageType !== ExplorerPageType.SHARED ||
    !context.value.isRoot
  ) {
    canCreateSharedFolder.value = false;
    return;
  }

  try {
    const res = await hasCreateSharePermissionApi();
    canCreateSharedFolder.value = res.code === 1 ? !!res.data : false;
  } catch {
    canCreateSharedFolder.value = false;
  }
};

const openCreateEntry = () => {
  if (!allowUpload.value) return;
  createVisible.value = true;
};

const openCreateFolder = () => {
  openCreate();
};

const handleCreateAction = (action: string) => {
  if (action === "createFolder") {
    openCreate();
    return;
  }

  if (action === "createFile") {
    uploadVisible.value = true;
  }
};

const openShareSettings = () => {
  if (!context.value.currentFolderId) return;

  router.push({
    path: "/space-setting",
    query: {
      contentId: context.value.currentFolderId,
      permissionType: currentFolderPermissionType.value ?? undefined,
    },
  });
};

const clearRecycle = async () => {
  try {
    await confirm({
      title: t("emptyRecycleBin"),
      message: t("confirmEmptyRecycleBin"),
      showCancelButton: true,
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
      width: "80%",
    });
  } catch {
    return;
  }

  const res = await clearRecycleBinApi();
  if (res.code === 1) {
    toast(t("emptySuccess"), "success");
    await refreshList();
  }
};

const handleBack = () => {
  router.back();
};

watch(
  () => [context.value.pageType, context.value.isRoot],
  () => {
    void syncCreatePermission();
  },
  { immediate: true },
);

useExplorerMobileHeader({
  isMobileApp,
  allowUpload,
  canCreateSharedFolder,
  isHeaderBlocked,
  onOpenCreateEntry: openCreateEntry,
  onOpenCreateFolder: openCreateFolder,
  onOpenShareSettings: openShareSettings,
  onClearRecycleBin: clearRecycle,
  onBack: handleBack,
});
</script>

<style lang="scss" scoped>
.main-container {
  height: 100%;
  box-sizing: border-box;
}
</style>

<style lang="scss">
.main-container .van-dialog,
.main-container .van-overlay,
.main-container .van-popup,
.main-container .van-action-sheet {
  z-index: 3001;
}
</style>

<style lang="scss">
.main-container .van-popup--bottom,
.main-container .van-action-sheet {
  z-index: 3002;
}
</style>
