<template>
  <van-action-sheet v-model:show="showUpload" @close="handleClose">
    <div class="header">
      <div class="title">
        <span>{{ t("uploadFile") }}</span>
      </div>
      <div class="close" @click="showUpload = false">
        <SvgIcon name="ic_close" />
      </div>
    </div>
    <div class="content">
      <div class="file-info">
        <div class="form-label">{{ t("chooseFile") }}:</div>
        <van-loading v-if="fileLoading" color="#327edc" size="24px" vertical>
          {{ t("fileLoading") }}...
        </van-loading>
        <template v-else>
          <van-uploader
            v-if="selectedFile.length === 0"
            :after-read="afterRead"
            :before-read="beforeRead"
            accept="*"
            multiple
          >
            <div class="select-file">
              <SvgIcon name="ic_empty_file" size="54" />
              <span class="text">{{ t("clickToChooseFile") }}</span>
            </div>
          </van-uploader>
          <div v-else class="file-list">
            <div
              v-for="file in selectedFile"
              :key="file.name"
              class="file-item"
            >
              <div class="flex items-center gap-[12px]">
                <SvgIcon :name="getFileIcon(file.name)" size="30" />
                <div class="file-name">{{ file.name }}</div>
              </div>
              <SvgIcon name="ic_close-bg" @click="handleRemove(file.name)" />
            </div>
          </div>
        </template>
      </div>
      <div class="divider"></div>
      <div class="btn-group">
        <van-button
          color="#fff"
          style="color: #327edc; border-color: #327edc"
          type="primary"
          @click="handleClose"
          >{{ t("cancel") }}</van-button
        >
        <van-button
          :disabled="fileLoading"
          color="#327edc"
          type="primary"
          @click="handleUpload"
          >{{ t("Ok") }}</van-button
        >
      </div>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { t, getFileIcon, checkFileSize } from "@/utils";
import { type PropType, watch, ref } from "vue";
import type { UploaderFileListItem } from "vant";
import { handleFileEncryption } from "@/utils/upload/encrypt";
import type { EncryptedFileType } from "@/views/h5/MainView/type";
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";

const props = defineProps({
  uploadVisible: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  contentId: {
    type: Number as PropType<number>,
    default: () => 0,
  },
});

const emits = defineEmits([
  "update:uploadVisible",
  "onRefreshData",
  "onRepeat",
]);
const { runUpload, closeUploadDialog } = useUploadFlow();

const showUpload = ref(props.uploadVisible);
const fileLoading = ref(false);
const selectedFile = ref<File[]>([]);
const encryptKeyList = ref<{ name: string; aesKey: string }[]>([]);
let controller = new AbortController();

function handleClose() {
  selectedFile.value = [];

  showUpload.value = false;
  encryptKeyList.value = [];
  controller.abort();
}

function beforeRead(
  file: File | File[],
): boolean {
  try {
    const files = Array.isArray(file) ? file : [file];

    const validFiles = files.filter((f) => !checkFileSize(f));

    if (validFiles.length === 0) {
      showToast(t("fileSizeLimit"));
      return false; // 所有文件都超限，阻止上传
    }

    if (validFiles.length < files.length) {
      showToast(t("fileSizeLimit"));
    }

    fileLoading.value = true;

    return true;
  } catch (error) {
    console.error(error);
    showToast({ message: t("errorOccurred"), type: "fail" });
    fileLoading.value = false;
    return false;
  }
}

async function afterRead(
  fileInfos: UploaderFileListItem | UploaderFileListItem[],
) {
  try {
    let encryptedFile: EncryptedFileType[];
    if (Array.isArray(fileInfos)) {
      const files = fileInfos.map((item) => item.file!);

      encryptedFile = await handleFileEncryption(files, controller.signal);
    } else {
      encryptedFile = await handleFileEncryption(
        [fileInfos.file!],
        controller.signal,
      );
    }
    selectedFile.value = encryptedFile.map((item) => item.file);
    encryptKeyList.value = encryptedFile.map((item) => ({
      name: item.name,
      aesKey: item.key,
    }));
    fileLoading.value = false;
  } catch (err: any) {
    console.log(err);
    if (err?.message === "__ENCRYPT_ABORTED__") return;
    console.error("批量加密失败", err);
    showToast(t("operationFailedRetry"));
  } finally {
    fileLoading.value = false;
  }
}

function handleRemove(name: string) {
  const index = selectedFile.value.findIndex((file) => file.name === name);
  if (index !== -1) {
    selectedFile.value.splice(index, 1);
    encryptKeyList.value.splice(index, 1);
  }
}

async function handleUpload() {
  if (!selectedFile.value.length) {
    showToast({ message: t("selectFile"), type: "fail" });
    return;
  }
  runUpload({
    files: selectedFile.value,
    encryptKeys: encryptKeyList.value,
    contentId: props.contentId,
    completeAllTasks() {
      showToast({ message: t("uploadSuccess"), type: "success" });
      emits("onRefreshData");
      showUpload.value = false;
      closeUploadDialog();
    },
    findDuplicateFiles() {
      showUpload.value = false;
      emits("onRepeat");
    },
    uploadError() {
      showToast(t("errorOccurred"));
    },
  });
  showUpload.value = false;
}

watch(
  () => props.uploadVisible,
  (val) => {
    showUpload.value = val;
    if (val) {
      controller = new AbortController();
      fileLoading.value = false;
    }
  },
);

watch(showUpload, (val) => {
  emits("update:uploadVisible", val);
});
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ebeff6;

  .title {
    color: #000;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-family: PingFang SC;
  }
}
.content {
  padding: 24px 16px;

  :deep(.van-uploader) {
    width: 100%;
    margin: 8px 0;

    .van-uploader__input-wrapper {
      width: 100%;
    }
  }
  .file-info {
    .form-label {
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: #2d2d2d;
      font-weight: bold;
    }

    .select-file {
      width: 100%;
      height: 140px;
      border-radius: 6px;
      border: 1px dashed #327edc;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .text {
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        color: #2d2d2d;
      }
    }
  }

  .file-list {
    margin-top: 14px;
    width: 100%;
    max-height: 140px;
    overflow-y: auto;
    border-radius: 6px;
    background-color: #fff;
    padding: 0 8px;

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 0;

      &:not(:last-child) {
        border-bottom: 1px solid #e3e6ec80;
      }

      .file-name {
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--16) * var(--scale-factor));
        font-weight: bold;
        max-width: calc(100vw - 155px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  :deep(.van-checkbox) {
    border-radius: 2px;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: #e8ecf280;
    margin: 16px 0;
  }

  .btn-group {
    display: flex;
    width: 100%;
    gap: 16px;

    .van-button {
      width: 50%;
      text-align: center;
      padding: 10px 0;
      border-radius: 8px;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));

      &.cancel-btn {
        border: 1px solid #327edc;
        color: #327edc;
      }

      &.confirm-btn {
        background: #327edc;
        color: #ffffff;
      }
    }
  }

  .repeat-file-operate-list {
    .active {
      background: #ebf0ff;
    }
  }
}
</style>
