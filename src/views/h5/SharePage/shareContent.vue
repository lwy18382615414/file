<template>
  <div
    v-if="isLoading"
    v-loading="isLoading"
    :element-loading-text="t('loading')"
    class="share-loading"
  ></div>
  <div v-else class="share-page-content">
    <template v-if="!invalidSharing">
      <div class="person-avatar">
        <van-image :src="avatarUrl + avatarId">
          <template #error>
            <img src="@/assets/images/avatar.png" alt="" />
          </template>
        </van-image>
      </div>
      <div class="person-name">
        {{ t("sharedBy", { name: sharePersonName }) }}
      </div>
      <div class="share-time mb-1">
        {{
          t(firstTotal <= 1 ? "totalItems" : "totalItems_plural", {
            count: firstTotal,
          })
        }}
        {{ dayjs(parseInt(shareTime)).format(t("timeFormat")) }}
      </div>
      <div class="share-file-list">
        <div class="divider"></div>
        <div class="checkbox-wrapper">
          <div>
            {{ t("selectedItems", { count: selectedFiles.length }) }}
          </div>
          <div class="flex items-center" @click="selectAll">
            <span class="mr-1">
              {{
                selectedFiles.length === fileList.length
                  ? t("unselectAll")
                  : t("selectAll")
              }}
            </span>
            <CustomCheckBox :check-box-class="checkAllClass" />
          </div>
        </div>
        <div v-if="!isTopFolder" class="breadcrumb">
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
        <div
          v-if="fileList.length > 0"
          class="list"
          :class="{ 'is-top-folder': !isTopFolder }"
        >
          <div
            v-for="(item, index) in fileList"
            :key="index"
            class="item"
            @click="handleItemClick(item)"
          >
            <template v-if="showDeleteFile(item.isDelete)">
              <div class="item-left">
                <div class="item-icon">
                  <SvgIcon name="icon_folder" size="30" />
                </div>
                <div class="item-info">
                  <div class="item-name">{{ t("fileDeleted") }}</div>
                  <div class="item-time-size">{{ t("shareExpired") }}</div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="item-left">
                <div class="item-icon">
                  <SvgIcon
                    :name="
                      item.isFolder ? 'icon_folder' : getFileIcon(item.name)
                    "
                    size="30"
                  />
                </div>
                <div class="item-info">
                  <div class="item-name">
                    {{ item.name }}
                  </div>
                  <div class="item-time-size">
                    <span class="mr-1">{{
                      dayjs(item.updateAt).format(t("timeFormat"))
                    }}</span>
                    <span>{{
                      item.size ? formatFileSize(item.size) : "-"
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="item-right" @click.stop>
                <CustomCheckBox
                  :check-box-class="itemCheckClass(item) ? 'is-all' : ''"
                  @click="chooseFile(item)"
                />
              </div>
            </template>
          </div>
        </div>
        <div v-else class="empty-wrapper">
          <SvgIcon name="empty-folder" size="106" />
          <div class="item-select__title">{{ t("noFiles") }}</div>
        </div>

        <div class="operate-group">
          <van-button :disabled="disabledBtn" @click="onDownload"
            >{{ t("download") }}
          </van-button>
          <van-button
            :disabled="fileList.every((item) => item.isDelete)"
            class="van-button--primary"
            @click="saveToCloudDriver"
            >{{ t("saveToCloud") }}
          </van-button>
        </div>
      </div>
    </template>

    <div v-else class="share-not-found">
      <img alt="invalid-sharing" src="@/assets/images/invalid-sharing.png" />
      <p>
        {{ t(`${errorMsg}`) }}
      </p>
    </div>

    <FolderSelect
      :visible="showFolderSelect"
      @update:visible="showFolderSelect = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref } from "vue";
import { useRoute } from "vue-router";
import {
  getShareContentByMessageApi,
  getShareDownloadParamsApi,
  getShareFolderContentApi,
} from "@/api/share";
import type { TypeContent } from "@/views/pc/SharePage/type";
import {
  downloadShareFileInApp,
  formatFileSize,
  getFileIcon,
  t,
} from "@/utils";
import dayjs from "dayjs";
import config from "@/hooks/config";
import FolderSelect from "./pop/folderSelect.vue";
import { ArrowRight } from "@element-plus/icons-vue";
import { getMyUserInfo } from "@/utils/auth";
import { getStatusMessage } from "@/utils/httpCode";
import { usePermissionGuard } from "@/hooks/composable/usePermissionGuard";

const route = useRoute();

const { getConfigFetch, cloudDriveUploadUrl, avatarUrl } = config();
const { runPermissionGuard } = usePermissionGuard();
const sharePersonName = route.query.operatorName;
const shareContentId = route.query.contentIds as string;
const shareTime = route.query.shareTime as string;
const avatarId = route.query.avatarId as string;
const myUserId = route.query.operatorUserId as string;
const myUserInfo = getMyUserInfo();

const fileList = ref<TypeContent[]>([]);
const selectedFiles = ref<TypeContent[]>([]);
const showFolderSelect = ref(false);

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
const isLoading = ref(true);
const invalidSharing = ref(false);
const errorMsg = ref(""); // 错误信息

const firstTotal = ref(0); // 初始文件总数

provide("selectedFiles", selectedFiles);

const checkAllClass = computed(() => {
  if (fileList.value.every((item) => item.isDelete)) return "is-disabled";
  if (selectedFiles.value.length === fileList.value.length) return "is-all";
  if (selectedFiles.value.length === 0) return "";
  return "is-partial";
});

const disabledBtn = computed(() => {
  const findFile = selectedFiles.value.filter((item) => !item.isFolder);
  return findFile.length === 0;
});

// 判断是否显示被删除文件
const showDeleteFile = (isDelete?: boolean) => {
  if (isDelete) {
    if (myUserInfo && myUserInfo.userId == myUserId) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

const getShareContent = async () => {
  const contentIds = shareContentId.split(",").map((item) => Number(item));

  try {
    const res = await getShareContentByMessageApi(contentIds);
    if (res.code === 1) {
      fileList.value = res.data.filter(
        (item) => !item.isDelete || myUserInfo.userId == myUserId,
      );
      firstTotal.value = fileList.value.length;
      if (
        res.data.every((item) => item.isDelete) &&
        myUserInfo.userId != myUserId
      ) {
        invalidSharing.value = true;
        errorMsg.value = t("shareInvalid");
      }
      setTimeout(() => {
        isLoading.value = false;
      }, 1000);
      selectAll();
    } else {
      invalidSharing.value = true;
      errorMsg.value = getStatusMessage(res.code);
    }
  } catch (error) {
    console.error("请求失败:", error);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 1000);
  }
};

const selectAll = () => {
  if (selectedFiles.value.length === fileList.value.length) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = fileList.value.filter((item) => !item.isDelete);
  }
};

const handleItemClick = (item: TypeContent) => {
  if (item.isDelete) return;
  if (item.isFolder) {
    openFolder(item);
  } else {
    chooseFile(item);
  }
};

const handleBreadcrumbClick = async (item: TypeContent) => {
  if (isNaN(item.contentId)) {
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
    return;
  }
  await openFolder(item, true);
};

const openFolder = async (item: TypeContent, fromBreadcrumb = false) => {
  const res = await getShareFolderContentApi(item.contentId);
  if (res.code === 1) {
    isTopFolder.value = false;

    if (!fromBreadcrumb) {
      breadcrumbList.value.push(item);
    } else {
      const index = breadcrumbList.value.findIndex(
        (i) => i.contentId === item.contentId,
      );
      if (index !== -1) {
        breadcrumbList.value = breadcrumbList.value.slice(0, index + 1);
      }
    }

    if (res.data.length > 0) {
      fileList.value = res.data.map((item) => ({
        contentId: item.contentId,
        name: item.name,
        isFolder: item.isFolder,
        size: item.contentSize,
        updateAt: item.operateTime,
        parentId: item.parentId,
      }));

      setTimeout(() => {
        if (!fromBreadcrumb) selectAll();
      }, 200);
    } else {
      fileList.value = [];
    }
  }
};

const chooseFile = (item: TypeContent) => {
  if (selectedFiles.value.some((file) => file.contentId === item.contentId)) {
    selectedFiles.value = selectedFiles.value.filter(
      (file) => file.contentId !== item.contentId,
    );
  } else {
    selectedFiles.value.push(item);
  }
};

const itemCheckClass = (item: TypeContent) => {
  return selectedFiles.value.some((file) => file.contentId === item.contentId);
};

const onDownload = async () => {
  if (selectedFiles.value.length === 0) {
    showToast({ type: "fail", message: t("selectFile") });
    return;
  }

  const contentIds = selectedFiles.value
    .filter((item) => !item.isFolder)
    .map((item) => item.contentId);
  if (contentIds.length === 0) return;

  await runPermissionGuard({
    contentIds,
    selectedRows: selectedFiles.value,
    request: (ids) => getShareDownloadParamsApi({
      contentIds: ids,
    }),
    showConfirm: (count) => {
      return showConfirmDialog({
        title: t("download"),
        message: t("downPermissionWarning", { count }),
        cancelButtonText: t("cancel"),
        confirmButtonText: t("Ok"),
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
      const files = sucRes.map((file) => ({
        fileName: file.fileName,
        filePath:
          cloudDriveUploadUrl.value +
          `/api/file/download/clouddrive?fileid=${file.fileId}`,
        fileSize: file.size,
        sn: file.aesKey,
      }));
      downloadShareFileInApp(JSON.stringify(files));
      selectedFiles.value = [];
    },
  });
};

const saveToCloudDriver = () => {
  if (selectedFiles.value.length === 0) {
    showToast({ type: "fail", message: t("selectFile") });
    return;
  }
  showFolderSelect.value = true;
};

onMounted(() => {
  getConfigFetch();
  getShareContent();
});
</script>

<style scoped lang="scss">
.share-loading {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.share-page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;

  .person-avatar {
    margin-top: 45px;
    width: 52px;
    height: 52px;
    border-radius: 6px;
    overflow: hidden;

    :deep(.van-image) {
      width: 100%;
      height: 100%;
    }
  }

  .person-name {
    margin: 20px 0 10px;
    font-size: 20px;
    color: #2d2d2d;
  }

  .share-time {
    font-size: 12px;
    color: #747683;
  }

  .share-file-list {
    .divider {
      width: 100vw;
      height: 12px;
      background: #f9f9fa;
      margin-top: 40px;
    }

    .checkbox-wrapper {
      color: #747683;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px;
    }

    .breadcrumb {
      padding: 16px;
    }

    .list {
      max-height: calc(100vh - 350px);
      overflow-y: auto;

      &.is-top-folder {
        max-height: calc(100vh - 350px - 48px);
      }

      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        border-bottom: 1px solid #f2f4f7;

        .item-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .item-info {
            padding: 13px 0;
            width: calc(100vw - 32px - 30px - 10px - 32px);

            .item-name {
              font-size: 16px;
              color: #131314;
              margin-bottom: 7px;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }

            .item-time-size {
              font-size: 12px;
              color: #747683;
              display: flex;
              align-items: center;
              gap: 5px;
            }
          }
        }
      }
    }

    .empty-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 14px;
      color: #747683;
    }

    .operate-group {
      width: 100vw;
      position: fixed;
      bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;

      :deep(.van-button) {
        width: 50%;
        background: #ebeff6;
        border-radius: 8px;
        margin-top: 0;
        border: none;

        &.van-button--default {
          color: #2d2d2d;
        }

        &.van-button--primary {
          line-height: 44px;
          color: #327edc;
        }
      }
    }
  }

  .share-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 90%;

    img {
      width: 120px;
      height: 120px;
    }

    p {
      font-size: 13px;
      color: #747683;
      text-align: center;
    }
  }
}
</style>
