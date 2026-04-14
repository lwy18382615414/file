<template>
  <van-action-sheet v-model:show="showUpload" @close="handleClose">
    <div class="upload-sheet">
      <div class="sheet-header">
        <span class="sheet-title">{{ t("uploadFile") }}</span>
        <button class="close-btn" type="button" @click="showUpload = false">
          <SvgIcon name="action-close" size="18" color="var(--btn-primary-text-color)" />
        </button>
      </div>

      <div class="sheet-body">
        <div class="file-info">
          <div class="form-label">{{ t("chooseFile") }}</div>
          <van-loading
            v-if="fileLoading"
            color="var(--theme-color)"
            size="24px"
            vertical
          >
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
                <div class="file-meta">
                  <SvgIcon :name="getFileIcon(file.name)" size="30" />
                  <div class="file-name">{{ file.name }}</div>
                </div>
                <SvgIcon name="action-close_bg" @click="handleRemove(file.name)" />
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="sheet-actions">
        <button class="action-btn cancel-btn" type="button" @click="handleClose">
          {{ t("cancel") }}
        </button>
        <button
          class="action-btn confirm-btn"
          type="button"
          :disabled="fileLoading"
          @click="handleUpload"
        >
          {{ t("Ok") }}
        </button>
      </div>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { t, getFileIcon, checkFileSize } from "@/utils";
import { type PropType, watch, ref } from "vue";
import { showToast, type UploaderFileListItem } from "vant";
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

function handleClose() {
  selectedFile.value = [];
  fileLoading.value = false;
  showUpload.value = false;
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
    const files = (Array.isArray(fileInfos) ? fileInfos : [fileInfos])
      .map((item) => item.file)
      .filter((file): file is File => file instanceof File);

    selectedFile.value = files;
  } catch (error) {
    console.error(error);
    showToast(t("operationFailedRetry"));
  } finally {
    fileLoading.value = false;
  }
}

function handleRemove(name: string) {
  const index = selectedFile.value.findIndex((file) => file.name === name);
  if (index !== -1) {
    selectedFile.value.splice(index, 1);
  }
}

async function handleUpload() {
  if (!selectedFile.value.length) {
    showToast({ message: t("selectFile"), type: "fail" });
    return;
  }
  runUpload({
    files: selectedFile.value,
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
      fileLoading.value = false;
      selectedFile.value = [];
    }
  },
);

watch(showUpload, (val) => {
  emits("update:uploadVisible", val);
});
</script>

<style scoped lang="scss">
.upload-sheet {
  width: 100%;
  padding: 0 16px calc(24px + env(safe-area-inset-bottom));
  background: var(--btn-default-bg);
  border-radius: 20px 20px 0 0;
  box-sizing: border-box;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.sheet-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 25px;
  color: var(--text-primary-color);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  background: transparent;
}

.sheet-body {
  padding: 8px 0 24px;
}

:deep(.van-uploader) {
  width: 100%;
  margin-top: 8px;

  .van-uploader__input-wrapper {
    width: 100%;
  }
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-primary-color);
}

.select-file {
  width: 100%;
  min-height: 148px;
  border-radius: 12px;
  border: 1px dashed #b8c2e5;
  background: var(--content-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  box-sizing: border-box;

  .text {
    font-size: 14px;
    line-height: 20px;
    color: var(--text-primary-color);
  }
}

.file-list {
  width: 100%;
  max-height: 188px;
  overflow-y: auto;
  border-radius: 12px;
  background: var(--content-bg-color);
  padding: 0 12px;
  box-sizing: border-box;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(227, 230, 236, 0.8);
  }
}

.file-meta {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-name {
  color: var(--text-primary-color);
  font-size: 16px;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.van-loading) {
  margin: 20px 0;
  color: var(--theme-color);
}

:deep(.van-checkbox) {
  border-radius: 2px;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  height: 44px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn {
  color: var(--text-primary-color);
  background: var(--content-bg-color);
}

.confirm-btn {
  color: var(--btn-primary-text-color);
  background: var(--btn-primary-color);
}

.confirm-btn:disabled {
  opacity: 0.5;
}
</style>
