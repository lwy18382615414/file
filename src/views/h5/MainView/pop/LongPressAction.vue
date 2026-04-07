<template>
  <div
    v-if="isLongPress"
    :class="route.path === '/my-share' ? 'share-page' : 'common-page'"
    class="content-bottom-bar"
  >
    <template v-if="route.path !== '/my-share'">
      <div class="operation-group">
        <div class="download-btn" @click="multiDownload">
          <SvgIcon
            :class="['icon', { 'is-loading': loading }]"
            :color="shareList.length === 0 ? '#c4c4c4' : '#327EDC'"
            :name="loading ? 'loading' : 'ic_download'"
            size="26"
          />
        </div>
        <div class="download-btn delete" @click="handleMultiDelete">
          <SvgIcon
            :class="['icon', { 'is-loading': loading }]"
            :color="shareList.length === 0 ? '#c4c4c4' : '#ee3f3f'"
            :name="loading ? 'loading' : 'ic_delete'"
            size="26"
          />
        </div>
        <div
          :class="['copylink-btn', { 'is-disabled': isDisabled }]"
          @click="setShowLinkDialog(true)"
        >
          {{ t("copyLink") }}
        </div>
        <div
          :class="['share-btn', { 'is-disabled': isDisabled }]"
          @click="shareToNative"
        >
          {{ t("shareToFriend") }}
        </div>
      </div>
    </template>
    <div v-else>
      <van-button
        v-if="!shareList.length"
        block
        color="#EBEFF6"
        type="primary"
        @click="setLongPress(false)"
      >{{ t("cancel") }}
      </van-button
      >
      <van-button
        v-else
        :disabled="!shareList.length"
        block
        color="#EBEFF6"
        type="primary"
        @click="cancelShare"
      >{{ t("cancelShare") }}
      </van-button
      >
    </div>
  </div>
</template>
<script lang="ts" setup>
import { deleteFileOrDirApi, downloadFileApi, getDownloadFileIdApi } from "@/api/fileService";
import config from "@/hooks/config";
import { getFromApp } from "@/utils/auth";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { checkIsShared, downloadFile, downloadShareFileInApp, t } from "@/utils";
import { storeToRefs } from "pinia";
import { useShareFileStore } from "@/stores";
import { cancelShareApi } from "@/api/share";
import { getContentId, getId, getIsFolder, getName } from "@/utils/typeUtils";
import { debounce } from "lodash-es";
import { getBatchPermissionApi } from "@/api/common";
import type { ContentType } from "@/types/type";
import { Permission } from "@/enum/permission";

const emit = defineEmits(["refresh"]);
const { cloudDriveUploadUrl } = config();
const { isLongPress, shareList } = storeToRefs(useShareFileStore());
const { setLongPress, setShareList, setShowLinkDialog, shareToNative } =
  useShareFileStore();

const route = useRoute();
const loading = ref(false);

const isDisabled = computed(() => shareList.value.length === 0);

const cancelLongPress = () => {
  setLongPress(false);
  setShareList([]);
};

const cancelShare = () => {
  const ids = shareList.value.map((item) => getId(item)!);
  showConfirmDialog({
    width: "80%",
    title: t("confirmCancelShare"),
    message: t("cancelShareWarning"),
    confirmButtonColor: "#327edc",
    cancelButtonText: t("cancel"),
    confirmButtonText: t("Ok"),
  }).then(async () => {
    const res = await cancelShareApi(ids);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("cancelSuccess"),
      });
      cancelLongPress();
      emit("refresh");
    }
  });
};

const multiDownload = async () => {
  if (loading.value) return;
  if (shareList.value.length === 0) return;
  const showToast = shareList.value.every((item) => !getIsFolder(item));
  if (shareList.value.every((item) => getIsFolder(item))) {
    showDialog({
      title: t("hint"),
      message: t("folderDownloadWarn"),
      confirmButtonText: t("gotIt"),
    }).then(async () => {
      setTimeout(() => {
        cancelLongPress();
      }, 100);
    });
    return;
  }
  if (shareList.value.some((item) => getIsFolder(item))) {
    showDialog({
      title: t("hint"),
      message: t("folderDownloadWarn2"),
      confirmButtonText: t("gotIt"),
    }).then(async () => {

    });
  }
  const filteredFiles = shareList.value.filter((item) => !getIsFolder(item));
  const isApp = getFromApp();
  if (isApp) {
    loading.value = true;
    let downloadFiles = [];
    try {
      for (const item of filteredFiles) {
        const res = await getDownloadFileIdApi(getContentId(item)!);

        downloadFiles.push({
          fileName: getName(item),
          filePath: cloudDriveUploadUrl.value + `/api/file/download/clouddrive?fileid=${ res.data.fileId }`,
          fileSize: res.data.size,
          sn: res.data.aesKey,
        });
      }
      downloadShareFileInApp(JSON.stringify(downloadFiles), showToast);
    } catch (err) {
      console.error("下载出错:", err);
    } finally {
      loading.value = false;
    }
  } else {
    for (const item of filteredFiles) {
      await downloadFile({
        apiFunction: downloadFileApi,
        contentId: getContentId(item)!,
        fileName: getName(item),
      });
    }
  }
  setTimeout(() => {
    cancelLongPress();
  }, 100);
};

const handleMultiDelete = debounce(async () => {
  if (shareList.value.length === 0) return;
  const allContentIds = shareList.value.map((item) => getContentId(item)!);
  try {
    const permRes = await getBatchPermissionApi(allContentIds);
    if (permRes.code !== 1) {
      throw new Error("API_ERROR");
    }

    const permissionMap = permRes.data;

    const validFiles: ContentType[] = [];
    const invalidFiles: ContentType[] = [];

    shareList.value.forEach(item => {
      const id = getContentId(item)!;
      const permValue = permissionMap[id];

      if (permValue >= Permission.Edit) {
        validFiles.push(item);
      } else {
        invalidFiles.push(item);
      }
    });

    if (invalidFiles.length > 0) {
      if (invalidFiles.length === shareList.value.length) {
        showToast(t("noPermissionForAll"));
        return;
      }
      const noPermissionFileNames = invalidFiles.map(item => getName(item));
      const errorMsg = t("permissionDeniedList", { files: noPermissionFileNames.join("、 ") });

      await showDialog({
        title: t("deleteFile"),
        message: errorMsg,
        showCancelButton: true,
        confirmButtonColor: "#f5222d",
        confirmButtonText: t("delete"),
        cancelButtonText: t("cancel"),
        width: "80%",
      });
    }

    if (validFiles.length === 0) return;

    const validContentIds = validFiles.map(item => getContentId(item)!);
    const sharedContentIds = (await checkIsShared(validContentIds)) || [];

    const hasShared = validContentIds.some(id => sharedContentIds.includes(id));

    await showDialog({
      title: t("deleteFile"),
      message: hasShared ? t("shareDelete") : t("deleteFileWarning"),
      showCancelButton: true,
      confirmButtonColor: "#f5222d",
      confirmButtonText: t("delete"),
      cancelButtonText: t("cancel"),
      width: "80%",
    });

    const deleteRes = await deleteFileOrDirApi(validContentIds);

    if (deleteRes.code === 1) {
      showSuccessToast(t("deleteSuccess"));
      cancelLongPress();
      emit("refresh");
    } else {
      throw new Error('API_ERROR');
    }
  } catch (error) {
    console.log(error)
    if (error === 'cancel') return;
    showFailToast(t("errorOccurred"));
  }
}, 300);
</script>

<style lang="scss" scoped>
@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.content-bottom-bar {
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding: 16px 0;
  background: #ffffff;

  &.share-page {
    padding: 16px 12px;
  }

  &.common-page {
    padding: 16px;
    color: #2d2d2d;
    //box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.5);
  }

  .operation-group {
    display: flex;
    align-items: center;
    text-align: center;
    height: 48px;

    .download-btn {
      &.delete {
        margin-left: 11px;
      }


      height: 48px;
      width: 48px;
      background: #EBEFF6;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;

      .icon.is-loading {
        animation: 2s linear 0s infinite normal none running rotating;
      }
    }

    .copylink-btn {
      flex: 1;
      background: #EBEFF6;
      color: #327EDC;
      line-height: 48px;
      border-radius: 8px;
      margin-left: 11px;
    }

    .share-btn {
      flex: 1;
      background: #327EDC;
      color: #ffffff;
      line-height: 48px;
      border-radius: 8px;
      margin-left: 11px;
    }

    .is-disabled {
      background: #EBEFF6;
      color: #CACCD2;
    }
  }

  .operation-btn {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #ebeff6;
    border-radius: 12px;
    padding: 16px 0;

    &.is-disabled {
      color: #2d2d2d66;
    }
  }

  .cancel-btn {
    width: 100%;
    text-align: center;
    padding: 12px 0;
  }

  :deep(.van-button) {
    border-radius: 8px;

    &.van-button--disabled {
      background: #ebeff6 !important;
      opacity: 1;

      .van-button__text {
        color: #747683;
      }
    }

    .van-button__text {
      font-family: PingFang SC;
      font-size: 16px;
      color: #2d2d2d;
    }
  }
}
</style>
