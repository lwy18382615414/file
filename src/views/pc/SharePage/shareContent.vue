<template>
  <div
    v-if="loading"
    v-loading="loading"
    :element-loading-text="t('loading')"
    class="loading-wrapper"
  />
  <div v-if="!isSaveSuccess" class="share-content">
    <div class="share-title flex items-center justify-between">
      <span v-if="isTopFolder">{{ t("cloudDriveSharing") }}</span>
      <span v-else class="cursor-pointer" @click="backTopFolder">{{
          t("return")
        }}</span>
    </div>

    <template v-if="invalidSharing">
      <div class="share-expired">
        <img alt="share-expired" src="@/assets/images/invalid-sharing.png"/>
        <div class="text">{{ errorMessage }}</div>
      </div>
    </template>
    <template v-else>
      <div v-if="!isSelectFolder" class="share-info">
        <div v-if="isTopFolder" class="file-wrapper">
          <SvgIcon
            :name="
                firstFile?.isFolder
                  ? 'icon_folder'
                  : getFileIcon(firstFile?.name)
              "
            size="48"
          />
          <div class="info">
            <div class="file-name">
              <span> {{ t("fileName", { name: firstFile?.name }) }} </span>
              <span v-if="tableData.length > 1">{{
                  t("andItem", { count: tableData.length })
                }}</span>
            </div>
            <div class="share-meta">
                <span class="share-person">
                  <SvgIcon name="ic_share-person" size="18"/>
                  <span>{{ sharePersonName }}</span>
                </span>
              <div class="divider"></div>
              <span class="share-time">
                  {{ dayjs(parseInt(shareTime)).format(t("timeFormat")) }}</span
              >
            </div>
          </div>
        </div>
        <div v-else class="breadcrumb">
          <el-breadcrumb :separator-icon="ArrowRight">
            <el-breadcrumb-item
              v-for="item in breadcrumbList"
              :key="item.name"
              @click="handleBreadcrumbClick(item)"
            >
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="file-list">
          <CommonTable
            ref="commonTableRef"
            :table-columns="TABLE_COLUMNS"
            :table-data="tableData"
            height="calc(100vh - 240px + 8px)"
            @selection-change="handleSelectionChange"
            @row-dblclick="handleTableRowDblclick"
          >
            <template #headerText="{ column }">
              <span v-if="!showChooseCount">{{ t(column.label) }}</span>
              <div v-else class="cursor-pointer">
                <template v-if="column.label === 'columnOpt.docName'">
                    <span @click="handleChooseAll">{{
                        selectedRows.length === contents.length
                          ? t("unselectAll")
                          : t("selectAll")
                      }}</span>
                  <span class="ml-2">{{
                      t("selectedDocuments", { count: selectedRows.length })
                    }}</span>
                </template>
                <span v-else>{{ t(column.label) }}</span>
              </div>
            </template>
            <template #name="{ row }">
              <template v-if="row.isDelete && isSharePerson">
                <div class="file-name">
                  <div class="flex-shrink-0">
                    <SvgIcon name="icon_folder" size="30"/>
                  </div>
                  <div class="name">{{ t("fileDeleted") }}</div>
                </div>
              </template>
              <template v-else>
                <div class="file-name">
                  <div class="flex-shrink-0">
                    <SvgIcon
                      :name="
                          row.isFolder ? 'icon_folder' : getFileIcon(row.name)
                        "
                      size="30"
                    />
                  </div>
                  <div class="name">{{ row.name }}</div>
                </div>
              </template>
            </template>
            <template #size="{ row }">
              <template v-if="row.isDelete && isSharePerson"> -</template>
              <template v-else>
                <div class="text-[#747683]">
                    <span>{{
                        row.isFolder ? "-" : formatFileSize(row.size)
                      }}</span>
                </div>
              </template>
            </template>
            <template #updateAt="{ row }">
              <template v-if="row.isDelete && isSharePerson">
                <div class="text-[#747683]">
                  <span>{{ t("shareExpired") }}</span>
                </div>
              </template>
              <div v-else class="text-[#747683]">
                <span>{{ dayjs(row.updateAt).format(t("timeFormat")) }}</span>
              </div>
            </template>
          </CommonTable>
        </div>
        <div class="line-divider"></div>
        <div class="operate">
          <div class="folder-select" @click="isSelectFolder = true">
            <div class="flex">
              <div class="whitespace-nowrap">{{ t("saveToFolder") }}:</div>
              <span class="folder-name"> {{ folderName }} </span>
            </div>
            <span class="folder-icon">
                <SvgIcon name="select-folder"/>
              </span>
          </div>
          <div>
            <el-button
              :disabled="disabledBtn"
              type="default"
              @click="download"
            >{{ t("download") }}
            </el-button>
            <el-button
              :disabled="
                  selectedRows.length === 0 ||
                  tableData.every((item) => item.isDelete)
                "
              type="primary"
              @click="handleSaveToCloud"
            >{{ t("saveToCloudDrive") }}
            </el-button>
          </div>
        </div>
      </div>
      <div v-else class="folder-select-wrapper">
        <FolderSelect
          ref="folderRef"
          :isSaveBtnDisabled="isSaveBtnDisabled"
          @cancelSelect="isSelectFolder = false"
          @saveSelect="handleSaveFolder"
          @select-folder="selectFolder"
        />
      </div>
    </template>
  </div>
  <template v-else>
    <ShareSuccess :targetFolder="targetFolder"/>
  </template>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  getShareContentByMessageApi,
  getShareDownloadParamsApi,
  getShareFolderContentApi,
  saveToCloudDriveApi,
} from "@/api/share";
import { formatFileSize, getFileIcon, t } from "@/utils";
import type { TypeContent } from "./type";
import dayjs from "dayjs";
import { TABLE_COLUMNS } from "./constance";
import { ArrowRight } from "@element-plus/icons-vue";
import FolderSelect from "./folderSelect.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import { useDialog } from "@/hooks/useDialog";
import { getMyUserInfo } from "@/utils/auth";
import ShareSuccess from "./shareSuccess.vue";
import { useHandleSaveFolder } from "@/hooks/composable/useHandleSaveFolder";
import { usePermissionGuard } from "@/hooks/composable/usePermissionGuard";

const route = useRoute();
const { folderName, targetFolderContentId, isSelectFolder, saveFolder } =
  useHandleSaveFolder();
const { runPermissionGuard } = usePermissionGuard();
const sharePersonName = route.query.operatorName;
const shareContentId = route.query.contentIds as string;
const shareTime = route.query.shareTime as string;
const myUserId = route.query.operatorUserId as string;

const myUserInfo = getMyUserInfo();

const contents = ref<Array<TypeContent>>([]);
const showChooseCount = ref(false);
const commonTableRef = ref();
const selectedRows = ref<Array<TypeContent>>([]);
const isTopFolder = ref(true);
const breadcrumbList = ref<Array<TypeContent>>([
  {
    contentId: NaN,
    name: t("share"),
    isFolder: true,
    size: 0,
    updateAt: "",
    parentId: undefined,
  },
]);
const folderRef = ref<InstanceType<typeof FolderSelect>>();
const isSaveSuccess = ref(false);
const isSaveBtnDisabled = ref(false);
const invalidSharing = ref(false);
const errorMessage = ref("");
const loading = ref(true);
const currentContentId = ref(0);

const tableRef = computed(() => commonTableRef.value?.getTableRef());

const disabledBtn = computed(() => {
  const findFile = selectedRows.value.filter((item) => !item.isFolder);
  return findFile.length === 0;
});

const targetFolder = computed(() => {
  return sessionStorage.getItem("lastSelectedName") || t("myFiles");
});

const firstFile = computed(() => {
  if (contents.value.length === 0)
    return {
      isFolder: false,
      name: "",
    };
  return contents.value[0];
});

const isSharePerson = computed(() => {
  console.log(myUserInfo?.userId, myUserId);

  return myUserInfo?.userId == myUserId;
});

const tableData = computed(() => {
  return contents.value.filter((item) => !item.isDelete || isSharePerson.value);
});

watch(
  () => isSelectFolder.value,
  (val) => {
    if (!val) {
      nextTick(() => {
        selectedRows.value.forEach((item) => {
          tableRef.value?.toggleRowSelection(item);
        });
      });
    }
  },
);

const selectFolder = (contentId: number, folderName: string) => {
  isSaveBtnDisabled.value = contentId === 1 && folderName === t("shared");
};

const getShareContent = async () => {
  try {
    const contentIds = shareContentId.split(",").map((item) => Number(item));

    const res = await getShareContentByMessageApi(contentIds);
    if (res.code === 1) {
      contents.value = res.data;

      setTimeout(() => {
        handleChooseAll();
      },  200);
      if (res.data.every((item) => item.isDelete) && !isSharePerson.value) {
        invalidSharing.value = true;
        errorMessage.value = t("shareInvalid");
      }
    } else {
      invalidSharing.value = true;
      errorMessage.value = t("shareInvalid");
    }
  } catch (e) {
    console.log(e);
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 1000);
  }
};

const handleSelectionChange = async (row: TypeContent[]) => {
  showChooseCount.value = row.length > 0;
  selectedRows.value = row;
};

const handleChooseAll = () => {
  if (selectedRows.value.length === contents.value.length) {
    tableRef.value?.clearSelection();
    selectedRows.value = [];
  } else {
    tableRef.value.toggleAllSelection();
    selectedRows.value = contents.value;
  }
};

const download = async () => {
  let contentIds = selectedRows.value
    .filter((item) => !item.isFolder)
    .map((item) => item.contentId);

  await runPermissionGuard({
    contentIds,
    selectedRows: selectedRows.value,
    request: (ids) => getShareDownloadParamsApi({
      contentIds: ids,
    }),
    showConfirm: (count) => {
      return useDialog({
        title: t("download"),
        content: t("downPermissionWarning", {
          count: count,
        }),
        confirmText: t("Ok"),
      });
    },
    notifyError(type) {
      if (type === "all-denied") {
        showToast({ message: t("downloadFailed") });
      } else if (type === "unknown") {
        showToast(t("operationFailedRetry"));
      }
    },
    onSuccess: async (sucRes) => {
      console.log(
        JSON.stringify({
          type: "12",
          data: sucRes.map((item) => item.contentId),
        }),
      );
    },
  });
};

const handleSaveFolder = async (
  targetFolderName: string,
  targetFolderId: number | null,
) => {
  await saveFolder({
    targetFolderName,
    targetFolderId,
  });
};

// 表格双击进入文件夹
const handleTableRowDblclick = async (row: TypeContent) => {
  await handleRowDblclick(row, false);
};

// 面包屑点击
const handleBreadcrumbClick = async (item: TypeContent) => {
  if (currentContentId.value === item.contentId) return;
  if (isNaN(item.contentId)) {
    backTopFolder();
    return;
  }
  await handleRowDblclick(item, true);
};

const backTopFolder = () => {
  getShareContent();
  breadcrumbList.value = [
    {
      contentId: NaN,
      name: t("share"),
      isFolder: true,
      size: 0,
      updateAt: "",
      parentId: undefined,
    },
  ];
  isTopFolder.value = true;
};

const handleRowDblclick = async (row: TypeContent, fromBreadcrumb = false) => {
  if (row.isFolder) {
    currentContentId.value = row.contentId;
    const res = await getShareFolderContentApi(row.contentId);
    if (res.code === 1) {
      isTopFolder.value = false;

      if (!fromBreadcrumb) {
        breadcrumbList.value.push(row);
      } else {
        const index = breadcrumbList.value.findIndex(
          (item) => item.contentId === row.contentId,
        );
        if (index !== -1) {
          breadcrumbList.value = breadcrumbList.value.slice(0, index + 1);
        }
      }

      if (res.data.length > 0) {
        contents.value = res.data.map((item) => ({
          contentId: item.contentId,
          name: item.name,
          isFolder: item.isFolder,
          size: item.contentSize,
          updateAt: item.operateTime,
          parentId: item.parentId,
        }));

        setTimeout(() => {
          handleChooseAll();
        }, 200);
      } else {
        contents.value = [];
      }
    }
  } else {
    console.log(JSON.stringify({ type: "12", data: [row.contentId] }));
  }
};

const handleSaveToCloud = async () => {
  const contentIds = selectedRows.value.map((item) => item.contentId);

  await runPermissionGuard({
    contentIds,
    selectedRows: selectedRows.value,
    request: (ids) =>
      saveToCloudDriveApi({
        contentIds: ids,
        targetContentId: targetFolderContentId.value,
      }),
    showConfirm: (count) => {
      return useDialog({
        title: t("saveToCloudDrive"),
        content: t("savePermissionWarning", {
          count,
        }),
        confirmText: t("Ok"),
      });
    },
    notifySuccess: () => {
      isSaveSuccess.value = true;
    },
    notifyError(type) {
      if (type === "all-denied") {
        ElMessage.error(t("noSavePermission"));
      } else if (type === "unknown") {
        ElMessage.error(t("operationFailedRetry"));
      }
    },
  });
};

onMounted(async () => {
  await getShareContent();
});
</script>

<style lang="scss" scoped>
:deep(.share-title) {
  line-height: 150%;
  font-family: Microsoft YaHei;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  font-weight: bold;
  color: #2d2d2d;
  padding: 10px 16px;
}

.loading-wrapper {
  width: 100%;
  height: 100%;
  background: #ffffff;
  position: absolute;
  inset: 0;
  z-index: 9999;
}

.share-content {
  width: 100%;
  height: 100%;
  position: relative;
  background: #ffffff;

  .share-expired {
    margin-top: 50px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #747683;
    font-size: calc(var(--base--font--size--18) * var(--scale-factor));

    img {
      width: 240px;
      height: 240px;
    }
  }

  .share-content-box {
    width: 268px;
    margin: 50px auto 40px;
  }

  .person-avatar {
    margin: 0 auto;
    width: 52px;
    height: 52px;
    border-radius: 6px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .person-name {
    margin: 10px 0 40px;
    text-align: center;
    color: #747683;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));

    .name {
      font-family: Microsoft YaHei;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      font-weight: bold;
      color: #2d2d2d;
    }
  }

  .share-info {
    padding: 3px 16px 0;

    .file-wrapper {
      position: relative;
      height: 80px;
      padding: 0 22px;
      background: #f2f4f8;
      display: flex;
      align-items: center;
      border-radius: 4px;
      margin-bottom: 16px;

      .file-name {
        margin-left: 8px;
        font-weight: 400;
        font-size: calc(var(--base--font--size--16) * var(--scale-factor));
        color: #2d2d2d;
        max-width: 480px;
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
        color: #747683;
        line-height: 18px;

        .share-person {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: Microsoft YaHei;
          color: #747683;
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
        background: #ffffff;
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

    .breadcrumb {
      margin-bottom: 16px;
      padding: 16px;
      border-radius: 4px;
      background: #f2f4f8;

      :deep(.el-breadcrumb__item) {
        &:not(:last-child) {
          .el-breadcrumb__inner {
            cursor: pointer;
            color: #747683;
          }
        }

        &:last-child {
          .el-breadcrumb__inner {
            color: #2d2d2d;
          }
        }
      }
    }

    .file-list {
      margin-bottom: 20px;

      :deep(.el-table__header) {
        th {
          .cell {
            color: #747683;
            font-weight: normal;
          }
        }
      }

      :deep(.el-table) {
        --el-table-border-color: none;
        --el-table-border: none;
      }

      :deep(.el-table__body) {
        .el-table__cell {
          padding: 12.5px 0;
        }
      }

      .file-name {
        display: flex;
        align-items: center;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        color: #2d2d2d;

        .name {
          margin-left: 8px;
        }
      }
    }

    .line-divider {
      position: absolute;
      left: 0;
      height: 1px;
      width: 100%;
      background: #e0e4eb;
    }

    .operate {
      font-family: Ping Fang;
      padding: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .folder-select {
        width: 280px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid #e3e6ec;
        border-radius: 4px;
        color: #747683;
        padding: 10px;

        .folder-name {
          margin-left: 8px;
          color: #2d2d2d;
          max-width: 188px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .el-button {
        margin-top: 0;
        height: 32px;
        border-radius: 4px;
        border: 1px solid var(--el-color-primary);
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: bold;

        &.el-button--default {
          font-weight: 700;
          border: 1px solid var(--el-color-primary);
          color: var(--el-color-primary);
        }

        &.is-disabled {
          background: #b7b7b7;
          color: #fff;
          font-weight: normal;
          border: 1px solid #b7b7b7;
        }
      }
    }
  }
}

.folder-select-wrapper {
  margin-top: 20px;
  height: calc(100vh - 61px);
  position: relative;
  font-family: "PingFang SC";
}
</style>
