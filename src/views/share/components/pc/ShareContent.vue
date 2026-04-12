<template>
  <div class="share-content-container">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      :element-loading-text="t('loading')"
      class="share-loading"
    />

    <template v-else>
      <div v-if="isExpired" class="share-status share-status--expired">
        <img alt="invalid-sharing" src="@/assets/images/invalid-sharing.png" />
        <div class="share-status__text">{{ errorMsg || t("linkExpired") }}</div>
      </div>

      <template v-else-if="!isInputPsw">
        <div class="share-title">
          <span>{{ t("cloudDriveSharing") }}</span>
        </div>

        <div class="share-password-card">
          <div class="share-password-card__avatar">
            <AvatarBox :avatar="shareBaseInfo.avatarId" :size="52" />
          </div>

          <div class="share-password-card__name">
            {{ shareBaseInfo.sharePersonName
            }}{{ t("sharedWithYou", { name: "" }) }}
          </div>

          <el-input
            v-model.trim="psw"
            type="password"
            show-password
            :placeholder="t('inputPasswordCaseInsensitive')"
            @keyup.enter="handleExtractFile"
          />

          <el-button
            :disabled="!psw.trim()"
            type="primary"
            @click="handleExtractFile"
          >
            {{ t("extractFile") }}
          </el-button>

          <div class="share-password-card__expire">
            {{ shareBaseInfo.expireTimeText }}
          </div>
        </div>
      </template>

      <template v-else-if="isSaveSuccess">
        <div class="share-title">
          <span>{{ t("saveToCloudDrive") }}</span>
        </div>

        <div class="share-success-content">
          <div class="success-icon">
            <SvgIcon name="ic_save-success" size="100" />
          </div>
          <div class="success-text">{{ t("fileSaveSuccess") }}</div>
          <div class="taget-folder">
            <span>{{ t("savedTo") }}：</span>
            <span class="folder-name">{{ targetFolder }}</span>
          </div>
          <el-button type="primary" @click="goToCloudDrive">
            {{ t("viewNow") }}
          </el-button>
        </div>
      </template>

      <template v-else>
        <div class="share-title share-title--content">
          <span v-if="!showFolderSelect">{{ t("cloudDriveSharing") }}</span>
          <span
            v-else
            class="share-title__back"
            @click="handleCancelFolderSelect"
          >
            <SvgIcon name="ic_arr_back" size="20" />
            {{ t("saveToFolder") }}
          </span>
        </div>

        <div v-if="!showFolderSelect" class="share-info">
          <div class="file-wrapper">
            <SvgIcon
              :name="
                shareList[0].isFolder
                  ? 'file-folder'
                  : getFileIcon(shareList[0].name)
              "
              style="flex-shrink: 0"
              size="48"
            />
            <div class="info">
              <div class="file-name">
                <span>
                  {{ t("fileName", { name: shareList[0].name }) }}
                </span>
                <span v-if="shareList.length > 1">
                  {{ t("andItem", { count: shareList.length }) }}
                </span>
              </div>
              <div class="share-meta">
                <span class="share-person">
                  <SvgIcon name="ic_share-person" size="18" />
                  <span>{{ shareBaseInfo.sharePersonName }}</span>
                </span>
                <div class="divider"></div>
                <span class="share-time">
                  {{ dayjs(shareBaseInfo.shareTime).format(t("timeFormat")) }}
                </span>
                <div class="divider"></div>
                <span class="expire-time">{{
                  shareBaseInfo.expireTimeText
                }}</span>
              </div>
            </div>
            <a v-if="isBrowser" :href="schemeUrl" class="app-btn">
              {{ t("viewInClient") }}
            </a>
          </div>

          <div class="share-file-list-wrapper">
            <div
              v-if="!isTopFolder"
              ref="breadcrumbWrapperRef"
              class="breadcrumb"
            >
              <el-breadcrumb :separator-icon="ArrowRight">
                <el-breadcrumb-item
                  v-for="(item, index) in breadcrumbList"
                  :key="`${item.contentId}-${item.name}`"
                  :class="[
                    'breadcrumb-item',
                    { 'is-current': index === breadcrumbList.length - 1 },
                  ]"
                  @click="handlePcBreadcrumbClick(item)"
                >
                  {{ item.name }}
                </el-breadcrumb-item>
              </el-breadcrumb>
            </div>

            <CommonTable
              ref="commonTableRef"
              :table-columns="tableColumns"
              :table-data="fileList"
              class="share-table"
              :height="tableHeight"
              @selection-change="handleSelectionChange"
              @row-dblclick="handleTableRowDblclick"
            >
              <template #headerText="{ column }">
                <template
                  v-if="column.property === 'name' && selectedFiles.length > 0"
                >
                  <div class="table-header-select">
                    <span class="selected-count">
                      {{ t("selectedItems", { count: selectedFiles.length }) }}
                    </span>
                  </div>
                </template>
                <span v-else>{{ t(column.label) }}</span>
              </template>

              <template #name="{ row }">
                <div class="file-name-cell">
                  <SvgIcon
                    :name="row.isFolder ? 'file-folder' : getFileIcon(row.name)"
                    size="30"
                  />
                  <span class="file-name-text">{{ row.name }}</span>
                </div>
              </template>

              <template #size="{ row }">
                <span class="table-muted">{{
                  row.isFolder ? "-" : formatFileSize(row.size)
                }}</span>
              </template>

              <template #updateAt="{ row }">
                <span class="table-muted">{{
                  dayjs(row.updateAt).format(t("timeFormat"))
                }}</span>
              </template>
            </CommonTable>
          </div>

          <div class="share-actions">
            <div
              v-if="isPcClient"
              class="folder-select"
              @click="saveToCloudDriver"
            >
              <div class="flex">
                <div class="whitespace-nowrap">{{ t("saveToFolder") }}:</div>
                <span class="folder-name">{{ folderName }}</span>
              </div>
              <span class="folder-icon">
                <SvgIcon name="select-folder" />
              </span>
            </div>
            <div class="share-actions__buttons">
              <el-button
                :disabled="!selectedFiles.some((item) => !item.isFolder)"
                type="default"
                @click="onDownload"
              >
                {{ t("download") }}
              </el-button>
              <el-button
                v-if="isPcClient && isHaveFileApp"
                :disabled="selectedFiles.length === 0"
                type="primary"
                @click="handleSaveToCloud"
              >
                {{ t("saveToCloudDrive") }}
              </el-button>
            </div>
          </div>
        </div>

        <div v-else class="folder-select-wrapper">
          <FolderSelectPc
            :selected-files="selectedFiles"
            :share-id="shareId"
            @cancelSelect="handleCancelFolderSelect"
            @saveSelect="handleSaveFolder"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ArrowRight } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { CommonTable } from "@/components";
import FolderSelectPc from "./FolderSelectPc.vue";
import { useShareData } from "../../hooks/useShareData";
import AvatarBox from "@/components/customSelectPerson/AvatarBox.vue";
import dayjs from "dayjs";
import { formatFileSize, getFileIcon } from "@/utils";
import schemeConfig from "@/config";
import { useEnv } from "../../hooks/useEnv";
import type { ShareContentType } from "../../types";
import type { TableColumn } from "@/types/type";
import { useHandleSaveFolder } from "@/hooks/useHandleSaveFolder.ts";
import { usePermissionGuard } from "@/hooks/usePermissionGuard.ts";
import { saveToCloudDriveApi } from "@/api/share";
import { ElMessageBox } from "element-plus";

const { t } = useI18n();
const { isBrowser, isPcClient } = useEnv();
const { folderName, targetFolderContentId, saveFolder } = useHandleSaveFolder();
const { runPermissionGuard } = usePermissionGuard();
const breadcrumbWrapperRef = ref<HTMLDivElement>();
const commonTableRef = ref<{
  getTableRef?: () => {
    clearSelection?: () => void;
    toggleRowSelection?: (row: ShareContentType, selected?: boolean) => void;
  };
}>();
const isSyncingTableSelection = ref(false);
const isSaveSuccess = ref(false);

const {
  shareId,
  shareKey,
  isLoading,
  isExpired,
  errorMsg,
  isInputPsw,
  psw,
  shareBaseInfo,
  shareList,
  fileList,
  selectedFiles,
  breadcrumbList,
  isTopFolder,
  showFolderSelect,
  isHaveFileApp,
  openFolder,
  handleBreadcrumbClick,
  handleExtractFile,
  onDownload,
  handleFileDownload,
  saveToCloudDriver,
} = useShareData();

const tableColumns: TableColumn[] = [
  {
    type: "selection",
    width: 48,
  },
  {
    label: "columnOpt.docName",
    prop: "name",
    slots: "name",
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.size",
    prop: "size",
    width: 120,
    slots: "size",
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.modifiedTime",
    prop: "updateAt",
    width: 180,
    slots: "updateAt",
    headerSlot: "headerText",
  },
];

const targetFolder = computed(
  () =>
    sessionStorage.getItem("lastSelectedName") ||
    folderName.value ||
    t("myFiles"),
);

const tableHeight = computed(() => {
  if (isBrowser.value) {
    return 264;
  }
  return isTopFolder.value
    ? "calc(100vh - 42px - 100px - 72px)"
    : "calc(100vh - 42px - 100px - 72px - 45px)";
});

const getTableRef = () => commonTableRef.value?.getTableRef?.();

const syncTableSelection = async () => {
  await nextTick();

  const table = getTableRef();
  if (!table) {
    isSyncingTableSelection.value = false;
    return;
  }

  const selectedIds = new Set(
    selectedFiles.value.map((item) => item.contentId),
  );

  try {
    table.clearSelection?.();
    fileList.value.forEach((item) => {
      if (selectedIds.has(item.contentId)) {
        table.toggleRowSelection?.(item, true);
      }
    });
  } finally {
    await nextTick();
    isSyncingTableSelection.value = false;
  }
};

const scrollToCurrentBreadcrumb = async () => {
  await nextTick();
  const breadcrumbWrapper = breadcrumbWrapperRef.value;
  if (!breadcrumbWrapper) return;

  breadcrumbWrapper.scrollTo({
    left: breadcrumbWrapper.scrollWidth,
    behavior: "smooth",
  });
};

const handleCancelFolderSelect = () => {
  showFolderSelect.value = false;
};

const handleSaveFolder = async (
  targetFolderName: string,
  targetFolderId: number | null,
) => {
  await saveFolder({
    targetFolderName,
    targetFolderId,
  });
  showFolderSelect.value = false;
};

const handleSaveToCloud = async () => {
  const contentIds = selectedFiles.value.map((item) => item.contentId);

  await runPermissionGuard({
    contentIds,
    selectedRows: selectedFiles.value,
    request: (ids) =>
      saveToCloudDriveApi({
        contentIds: ids,
        targetContentId: targetFolderContentId.value,
        ...(shareId.value ? { shareId: shareId.value } : {}),
      }),
    showConfirm: (count) => {
      return ElMessageBox.confirm(
        t("savePermissionWarning", {
          count,
        }),
        t("saveToCloudDrive"),
        {
          confirmButtonText: t("Ok"),
          cancelButtonText: t("cancel"),
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
        },
      );
    },
    notifySuccess: () => {
      isSaveSuccess.value = true;
    },
    notifyError(type) {
      if (type === "all-denied") {
        ElMessage.error(t("noSavePermission"));
      } else {
        ElMessage.error(t("operationFailedRetry"));
      }
    },
  });
};

const goToCloudDrive = () => {
  console.log(
    JSON.stringify({
      type: "14",
      data: {
        path: "jump-page",
        contentId: sessionStorage.getItem("lastSelectedId") || 0,
      },
    }),
  );
};

watch(
  fileList,
  () => {
    isSyncingTableSelection.value = true;
  },
  { deep: true, flush: "sync" },
);

watch(
  fileList,
  () => {
    syncTableSelection();
  },
  { deep: true, flush: "post" },
);

watch(
  breadcrumbList,
  () => {
    scrollToCurrentBreadcrumb();
  },
  { deep: true, flush: "post" },
);

watch(
  commonTableRef,
  (tableRef) => {
    if (tableRef) {
      isSyncingTableSelection.value = true;
      syncTableSelection();
    }
  },
  { flush: "post" },
);

const handleSelectionChange = (rows: ShareContentType[]) => {
  if (isSyncingTableSelection.value) return;
  selectedFiles.value = rows;
};

const handleTableRowDblclick = async (row: ShareContentType) => {
  if (row.isFolder) {
    isSyncingTableSelection.value = true;
    await openFolder(row);
    return;
  }

  await handleFileDownload(row);
};

const handlePcBreadcrumbClick = async (item: ShareContentType) => {
  isSyncingTableSelection.value = true;
  await handleBreadcrumbClick(item);
};

watch(isTopFolder, async (top) => {
  if (top) {
    await nextTick();
    scrollToCurrentBreadcrumb();
  }
});

const schemeUrl = computed(() => {
  const baseUrl = `${location.origin}${location.pathname}`;
  let hash = `#/share-page?shareKey=${shareKey.value}`;
  if (psw.value) {
    hash += `&psw=${psw.value}`;
  }
  const fullUrl = `${baseUrl}${hash}`;
  const encodedFullUrl = encodeURIComponent(fullUrl);
  return `${schemeConfig.cloudCallAppKey}://cloudShare?url=${encodedFullUrl}`;
});
</script>

<style lang="scss" scoped>
.share-content-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--btn-default-bg);
  min-height: 488px;
}

.share-loading {
  position: absolute;
  inset: 0;
}

.share-title {
  line-height: 1.5;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  font-weight: bold;
  color: var(--text-primary-color);
  padding: 10px 16px;

  &--content {
    display: flex;
    align-items: center;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }
}

.share-password-card {
  width: 360px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__avatar {
    margin-bottom: 16px;
  }

  &__name {
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 24px;
    color: #131314;
    text-align: center;
  }

  :deep(.el-input) {
    width: 100%;
    height: 48px;
    margin-bottom: 12px;
  }

  :deep(.el-button) {
    width: 100%;
    height: 40px;
  }

  &__expire {
    margin-top: 12px;
    font-size: 12px;
    line-height: 20px;
    color: var(--text-secondary-color);
    text-align: center;
  }
}

.share-info {
  padding: 3px 16px 0;
  height: 100%;
  display: flex;
  flex-direction: column;

  .file-wrapper {
    position: relative;
    height: 80px;
    min-height: 80px;
    padding: 0 22px;
    background: #f2f4f8;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-bottom: 16px;

    .info {
      min-width: 0;
      flex: 1;
    }

    .file-name {
      margin-left: 8px;
      font-weight: 400;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      color: var(--text-primary-color);
      max-width: calc(100% - 8px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 24px;
    }

    .share-meta {
      margin-top: 4px;
      display: flex;
      align-items: center;
      margin-left: 16px;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: var(--text-secondary-color);
      line-height: 18px;

      .share-person {
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: Microsoft YaHei;
        color: var(--text-secondary-color);
      }

      .divider {
        width: 1px;
        height: 12px;
        background-color: #e0e4eb;
        margin: 0 12px;
      }
    }

    .app-btn {
      position: absolute;
      right: 22px;
      width: 100px;
      padding: 7px 0;
      border-radius: 4px;
      background: var(--btn-default-bg);
      box-sizing: border-box;
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);
      font-family: PingFang;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      font-weight: bold;
      text-align: center;
      cursor: pointer;
    }
  }
}

.share-file-list-wrapper {
  flex: 1;
  border: 1px solid var(--card-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--btn-default-bg);
}

.breadcrumb {
  padding: 16px 16px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;
  border-bottom: 1px solid var(--card-border-color);
  background: var(--btn-default-bg);
  display: flex;
  align-items: center;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.el-breadcrumb) {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  :deep(.el-breadcrumb__inner) {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    cursor: pointer;
    color: var(--text-secondary-color);
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  }

  :deep(.el-breadcrumb__separator) {
    white-space: nowrap;
    color: #b7bdc8;
  }

  :deep(.el-breadcrumb__item) {
    flex-shrink: 0;
  }
}

.breadcrumb-item {
  flex-shrink: 0;

  &.is-current {
    :deep(.el-breadcrumb__inner) {
      color: var(--theme-color);
      font-weight: 500;
    }
  }
}

.share-table {
  height: 100%;

  :deep(.table-container),
  :deep(.el-table),
  :deep(.el-table__inner-wrapper) {
    height: 100%;
  }

  :deep(.el-table) {
    border: none !important;
    --el-table-border-color: transparent;
    --el-table-border: none;
    --el-table-row-hover-bg-color: #f7f9fc;

    &::before,
    &::after {
      display: none !important;
    }

    .el-table__inner-wrapper::before,
    .el-table__inner-wrapper::after,
    .el-table__fixed-right::before,
    .el-table__fixed::before,
    .el-table__border-left-patch,
    colgroup col[name="gutter"] {
      display: none !important;
    }

    .el-table__header-wrapper,
    .el-table__body-wrapper,
    .el-table__footer-wrapper,
    th.el-table__cell,
    td.el-table__cell,
    .el-table__cell {
      border: none !important;
    }

    .el-table__header,
    .el-table__body,
    .el-table__footer {
      border-collapse: separate;
      border-spacing: 0;
    }

    .el-table__fixed,
    .el-table__fixed-right {
      box-shadow: none !important;
    }

    .el-table__header-wrapper th.el-table__cell {
      height: 44px;
      padding: 0;
      background: var(--btn-default-bg);

      .cell {
        color: var(--text-secondary-color);
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: 400;
      }
    }

    .el-table__body td.el-table__cell {
      height: 56px;
      padding: 0;
    }

    .el-checkbox {
      --el-checkbox-input-width: 16px;
      --el-checkbox-input-height: 16px;
    }

    .el-checkbox__inner {
      border-color: var(--text-secondary-color);
      border-radius: 2px;
    }

    .el-checkbox__input.is-checked .el-checkbox__inner,
    .el-checkbox__input.is-indeterminate .el-checkbox__inner {
      background: var(--theme-color);
      border-color: var(--theme-color);
    }
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }
}

.table-header-select {
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary-color);
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.selected-count {
  color: var(--text-secondary-color);
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--text-primary-color);
  cursor: pointer;
}

.file-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  line-height: 20px;
}

.table-muted {
  color: var(--text-secondary-color);
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.share-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;

  .folder-select {
    width: 280px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--card-border-color);
    border-radius: 4px;
    color: var(--text-secondary-color);
    padding: 10px;
    cursor: pointer;

    .folder-name {
      margin-left: 8px;
      color: var(--text-primary-color);
      max-width: 188px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__buttons {
    margin-left: auto;
  }

  :deep(.el-button) {
    font-family: PingFang;
    border: 1px solid var(--el-color-primary);
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    font-weight: bold;

    &.el-button--default {
      color: var(--el-color-primary);
    }

    &.is-disabled {
      background: #b7b7b7;
      color: var(--btn-primary-text-color);
      font-weight: normal;
      border: 1px solid #b7b7b7;
    }
  }
}

.folder-select-wrapper {
  flex: 1;
  min-height: 452px;
  display: flex;
  flex-direction: column;
}

.share-success-content {
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  padding: 40px 0;

  .success-text {
    white-space: nowrap;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary-color);
    margin-top: 20px;
  }

  .taget-folder {
    margin: 20px 0;

    .folder-name {
      color: var(--theme-color);
    }
  }

  .el-button {
    width: 100%;
    height: 48px;
  }
}

.share-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  color: var(--text-secondary-color);
  position: absolute;
  inset: 0;

  img {
    width: 240px;
    height: 240px;
  }

  &__text {
    margin-top: 16px;
    font-size: calc(var(--base--font--size--18) * var(--scale-factor));
  }
}
</style>
