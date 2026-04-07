<template>
  <el-dialog
    v-model="chooseVisible"
    :show-close="false"
    :before-close="handleClose"
    :modal="false"
    destroy-on-close
    style="
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
      background: #f2f4f8;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
    width="460"
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <span>{{ title || t("uploadFile") }}</span>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>
    <!-- 内容 -->
    <div class="dialog-content">
      <div v-if="type === 'file'" class="file-select">
        <div class="form-label">{{ t("chooseFile") }}:</div>
        <el-upload
          ref="uploader"
          class="hidden-uploader"
          :class="{ 'show-trigger': selectedFile.length === 0 && !loading }"
          action="#"
          multiple
          drag
          :show-file-list="false"
          :auto-upload="false"
          :on-change="onChange"
        >
          <template #trigger>
            <div
              class="file-wrapper"
              :class="{ 'no-file': selectedFile.length === 0 }"
            >
              <div class="empty-file">
                <SvgIcon name="ic_empty_file" size="54" />
                <span class="text">{{ t("clickToChoose") }}</span>
              </div>
            </div>
          </template>
        </el-upload>
        <div v-if="selectedFile.length > 0 || loading">
          <div
            v-if="selectedFile.length > 0 || loading"
            class="file-list"
            v-loading="loading"
            :element-loading-text="t('fileLoading') + '...'"
            :class="{ clickable: selectedFile.length > 0 && !loading }"
            @click="selectedFile.length > 0 && !loading && openFileDialog()"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <div
              v-for="file in selectedFile"
              :key="file.name"
              class="file-item flex items-center justify-between"
            >
              <div class="flex items-center gap-[12px]">
                <SvgIcon :name="getFileIcon(file.name)" size="24" />
                <div class="file-name">{{ file.name }}</div>
              </div>
              <SvgIcon name="ic_close-bg" @click.stop="handleRemove(file.name)" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="type === 'folder'">
        <div v-if="!showErrorTip" class="folder-create">
          <div class="form-label">{{ t("folder") }}</div>
          <el-input
            ref="inputRef"
            v-model="folderName"
            :placeholder="t('inputFolderName')"
            maxlength="100"
            clearable
            show-word-limit
            style="width: 300px"
          />
        </div>
        <div v-else class="error-tip">
          <SvgIcon name="ic_err_file" size="54" />
          <span class="text">{{ errorTip }}</span>
        </div>
      </div>
    </div>

    <!-- 按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">{{
          t("cancel")
        }}</el-button>
        <el-button
          :disabled="loading"
          class="confirm-btn"
          @click="handleUpload"
          >{{ t("Ok") }}</el-button
        >
      </div>
    </template>
  </el-dialog>
  <RepeatFileDialog
    :repeat-visible="showRepeatFileDialog"
    :contentId="contentId"
    @update:repeatVisible="showRepeatFileDialog = $event"
  />
</template>

<script setup lang="ts">
import { type PropType, ref, watch } from "vue";
import { useUploadInfo } from "@/stores";
import { ElMessage, type UploadProps, type UploadInstance } from "element-plus";
import { createFolderApi } from "@/api/fileService";
import { checkFileSize, getFileIcon, t } from "@/utils";
import { handleFileEncryption } from "@/utils/upload/encrypt";
import { startUploadTask } from "@/utils/upload/uploadManager";
import RepeatFileDialog from "@/views/pc/Layout/pop/RepeatFileDialog.vue";
import { debounce } from "lodash-es";

const props = defineProps({
  visible: Boolean,
  title: {
    type: String as PropType<string>,
    default: () => t("uploadFile"),
  },
  type: {
    type: String as PropType<string>,
    default: () => "file",
  },
  contentId: {
    type: Number as PropType<number>,
    default: 0,
  },
  isPersonal: {
    type: Boolean as PropType<boolean>,
    default: () => true,
  },
});

const emits = defineEmits(["update:visible", "onRefreshData"]);

const { showOrHideUploadDialog } = useUploadInfo();

const uploader = ref<UploadInstance>()
const chooseVisible = ref(props.visible);
const fileBuffer = ref<File[]>([]);
const selectedFile = ref<Array<File>>([]);
const folderName = ref("");
const inputRef = ref();
const showErrorTip = ref(false);
const errorTip = ref("");
const encryptKey = ref<{ name: string; aesKey: string }[]>([]);
const showRepeatFileDialog = ref(false);
const loading = ref(false);
let controller = new AbortController();

// 封装统一处理的逻辑
const processAllFiles = debounce(async () => {
  if (!fileBuffer.value.length) return;

  loading.value = true;
  try {
    const encrypted = await handleFileEncryption(
      fileBuffer.value,
      controller.signal,
    );

    selectedFile.value.push(...encrypted.map((e) => e.file));
    encryptKey.value.push(
      ...encrypted.map((e) => ({
        name: e.name,
        aesKey: e.key,
      })),
    );
  } catch (err: any) {
    if (err?.message === "__ENCRYPT_ABORTED__") return;
    console.error("批量加密失败", err);
    ElMessage.error(t("operationFailedRetry"));
  } finally {
    loading.value = false;
    fileBuffer.value = []; // 清空缓存
  }
}, 300); // 300ms 防抖，确保多选时只触发一次

// 选择文件
const onChange: UploadProps["onChange"] = async (uploadFile) => {
  if (uploadFile.raw?.isDirectory) return
  const file = uploadFile.raw!;

  const isTooBig = checkFileSize(file);

  if (isTooBig) {
    ElMessage.error(t("fileSizeLimit"));
    return;
  }

  fileBuffer.value.push(file);
  processAllFiles();
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files?.length) return

  const existingNames = selectedFile.value.map(f => f.name)
  const newFiles: File[] = []
  const duplicateNames: string[] = []

  for (const file of files) {
    if (existingNames.includes(file.name)) {
      duplicateNames.push(file.name)
    } else {
      newFiles.push(file)
    }
  }

  if (duplicateNames.length) {
    ElMessage.warning(t('duplicateFiles', { files: duplicateNames.join('、') }))
  }

  if (newFiles.length) {
    for (const file of newFiles) {
      console.log(file)
      onChange({ raw: file })
    }
  }
}

// 移除文件
const handleRemove = (fileName: string) => {
  selectedFile.value = selectedFile.value.filter(
    (item) => item.name !== fileName,
  );
};

const openFileDialog = () => {
  const input: HTMLInputElement | null =
    (uploader.value as any)?.$el?.querySelector?.('.el-upload__input') ?? null
  input?.click()
}


const handleUpload = async () => {
  if (props.type === "file") {
    if (selectedFile.value.length === 0) {
      ElMessage.error(t("selectFile"));
      return;
    }

    // 共享空间及其子空间 上传文件
    startUploadTask({
      files: selectedFile.value,
      encryptKeys: encryptKey.value,
      contentId: props.contentId,
      completeAllTasks() {
        ElMessage.success(t("uploadSuccess"));
        emits("onRefreshData");
      },
      findDuplicateFiles() {
        showRepeatFileDialog.value = true;
      },
      uploadError() {
        ElMessage.error(t("errorOccurred"));
      },
    });
    handleClose();
    showOrHideUploadDialog(true);
  } else {
    if (showErrorTip.value) {
      showErrorTip.value = false;
      errorTip.value = "";
      return;
    }
    if (folderName.value.trim() === "") {
      showErrorTip.value = true;
      errorTip.value = t("folderNameRequired");
      return;
    }
    await createFolderFn();
  }
};

// 创建文件夹
const createFolderFn = async () => {
  const res = await createFolderApi({
    folderName: folderName.value,
    currentContentId: props.contentId,
    viewRanges: [],
    editRanges: [],
    isPersonal: props.isPersonal,
  });
  if (res.code === 1) {
    ElMessage.success(t("createSuccess"));
    emits("onRefreshData");
    handleClose();
  } else if (res.code === 701) {
    showErrorTip.value = true;
    errorTip.value = t("folderExists");
  }
};

const handleClose = () => {
  chooseVisible.value = false;
  controller.abort();
};

watch(
  () => props.visible,
  (newVal) => {
    chooseVisible.value = newVal;
    if (newVal) {
      controller = new AbortController();
      selectedFile.value = [];
      encryptKey.value = [];
      folderName.value = "";
      showErrorTip.value = false;
      errorTip.value = "";
      fileBuffer.value = [];
      loading.value = false;
    }
  },
);

watch(chooseVisible, (newVal) => {
  emits("update:visible", newVal);
});
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid #e3e6ec80;
  font-weight: bold;
  overflow: hidden;
  font-family:
    Microsoft YaHei,
    Microsoft YaHei;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #327edc;
  border-color: #327edc;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid #e3e6ec80;

  .file-wrapper {
    width: 400px;
    height: 140px;
    border-radius: 6px;
    background-color: #fff;
    display: flex;

    &.no-file {
      border: 1px dashed #327edc;
    }

    .empty-file {
      margin: auto;
      display: flex;
      flex-direction: column;
      align-items: center;

      .text {
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        margin-top: 6px;
      }
    }
  }

  .file-list {
    width: 400px;
    height: 140px;
    overflow-y: auto;
    border-radius: 6px;
    background-color: #fff;

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px;

      &:not(:last-child) {
        border-bottom: 1px solid #e3e6ec80;
      }

      .file-name {
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: bold;
        max-width: 290px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 24px;
      }
    }
  }

  .upload-progress {
    margin-top: 14px;
    width: 400px;
    height: 140px;
    max-height: 200px;
    overflow-y: auto;
    border-radius: 6px;
    background-color: #fff;

    .progress-item {
      padding: 13px 16px;

      &:not(:last-child) {
        border-bottom: 1px solid #e3e6ec80;
      }

      .file-name {
        margin-bottom: 16px;
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: bold;
        max-width: calc(400px - 32px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .error-tip {
    width: 400px;
    border-radius: 6px;
    display: flex;
    gap: 6px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .encrypt-tip {
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    color: #747683;
    text-align: left;
  }
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    width: 80px;
    border-radius: 4px;
  }

  .cancel-btn {
    border: 1px solid #327edc;
    background: #f2f4f8;
    color: #327edc;
  }
  .confirm-btn {
    background: #327edc;
    color: #fff;

    &.is-disabled {
      background: #3370ff80;
      color: #fff;
    }
  }
}

.form-label {
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #2d2d2d;
  font-weight: bold;
  margin-right: 14px;
  margin-bottom: 14px;
}

.file-select {
  display: flex;
  flex-direction: column;
}

.hidden-uploader {
  display: none;
}
.hidden-uploader.show-trigger {
  display: block;
}

.file-info-item {
  display: flex;
  align-items: center;

  .file-name {
    margin: 0 16px;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.folder-create {
  display: flex;
  align-items: center;
}

.file-encryption {
  display: flex;
  align-items: center;
  margin: 12px 0;
}

:deep(.el-upload-dragger) {
  padding: 0;
  border: none;
  overflow: unset;

  &.is-dragover {
    .file-wrapper {
      background: #ECF5FFFF;
      border: 2px dashed #327edc;
    }
  }
}
</style>
