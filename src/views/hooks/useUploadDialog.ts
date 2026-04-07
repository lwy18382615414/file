import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  ElMessage,
  type UploadInstance,
  type UploadProps,
} from "element-plus";
import { debounce } from "lodash-es";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { checkFileSize, t } from "@/utils";
import { handleFileEncryption } from "@/utils/upload/encrypt";
import { startUploadTask } from "@/utils/upload/uploadManager";

export function useUploadDialog(options?: { onRefresh?: () => void }) {
  const route = useRoute();
  const context = computed(() => getExplorerContext(route));

  const uploadVisible = ref(false);
  const uploadTitle = ref(t("uploadFile"));
  const uploadContentId = ref(0);
  const uploadIsPersonal = ref(true);

  const uploaderRef = ref<UploadInstance>();
  const selectedFiles = ref<File[]>([]);
  const encryptKeys = ref<{ name: string; aesKey: string }[]>([]);
  const fileBuffer = ref<File[]>([]);
  const loading = ref(false);
  const showRepeatFileDialog = ref(false);
  let controller = new AbortController();

  const resetUploadState = () => {
    selectedFiles.value = [];
    encryptKeys.value = [];
    fileBuffer.value = [];
    loading.value = false;
    showRepeatFileDialog.value = false;
  };

  const processBufferedFiles = debounce(async () => {
    if (!fileBuffer.value.length) return;

    const filesToEncrypt = [...fileBuffer.value];
    fileBuffer.value = [];
    loading.value = true;

    try {
      const encrypted = await handleFileEncryption(
        filesToEncrypt,
        controller.signal,
      );

      selectedFiles.value.push(...encrypted.map((item) => item.file));
      encryptKeys.value.push(
        ...encrypted.map((item) => ({
          name: item.name,
          aesKey: item.key,
        })),
      );
    } catch (error: any) {
      if (error?.message === "__ENCRYPT_ABORTED__") return;
      console.error("批量加密失败", error);
      ElMessage.error(t("operationFailedRetry"));
    } finally {
      loading.value = false;
    }
  }, 300);

  const addFilesToBuffer = (files: File[]) => {
    const validFiles: File[] = [];

    files.forEach((file) => {
      if (checkFileSize(file)) {
        ElMessage.error(t("fileSizeLimit"));
        return;
      }
      validFiles.push(file);
    });

    if (!validFiles.length) return;

    fileBuffer.value.push(...validFiles);
    processBufferedFiles();
  };

  const handleSelectChange: UploadProps["onChange"] = (uploadFile) => {
    if (uploadFile.raw?.isDirectory) return;
    const file = uploadFile.raw;
    if (!file) return;
    addFilesToBuffer([file]);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    if (!droppedFiles.length) return;

    const existingNames = new Set(selectedFiles.value.map((file) => file.name));
    const nextFiles: File[] = [];
    const duplicateNames: string[] = [];

    droppedFiles.forEach((file) => {
      if (existingNames.has(file.name)) {
        duplicateNames.push(file.name);
        return;
      }
      nextFiles.push(file);
    });

    if (duplicateNames.length) {
      ElMessage.warning(
        t("duplicateFiles", { files: duplicateNames.join("、") }),
      );
    }

    addFilesToBuffer(nextFiles);
  };

  const handleRemove = (fileName: string) => {
    const index = selectedFiles.value.findIndex((file) => file.name === fileName);
    if (index === -1) return;

    selectedFiles.value.splice(index, 1);
    encryptKeys.value.splice(index, 1);
  };

  const openFileDialog = () => {
    const input: HTMLInputElement | null =
      (uploaderRef.value as any)?.$el?.querySelector?.(".el-upload__input") ?? null;
    input?.click();
  };

  const handleUpload = async () => {
    if (!selectedFiles.value.length) {
      ElMessage.error(t("selectFile"));
      return;
    }

    startUploadTask({
      files: selectedFiles.value,
      encryptKeys: encryptKeys.value,
      contentId: uploadContentId.value,
      completeAllTasks() {
        ElMessage.success(t("uploadSuccess"));
        options?.onRefresh?.();
      },
      findDuplicateFiles() {
        showRepeatFileDialog.value = true;
      },
      uploadError() {
        ElMessage.error(t("errorOccurred"));
      },
    });

    closeUpload();
  };

  const openUpload = () => {
    uploadTitle.value = t("uploadFile");
    uploadContentId.value = context.value.currentFolderId;
    uploadIsPersonal.value = context.value.pageType !== ExplorerPageType.SHARED;
    controller = new AbortController();
    resetUploadState();
    uploadVisible.value = true;
  };

  const closeUpload = () => {
    uploadVisible.value = false;
    controller.abort();
    resetUploadState();
  };

  return {
    uploadVisible,
    uploadTitle,
    uploadContentId,
    uploadIsPersonal,
    uploaderRef,
    selectedFiles,
    loading,
    showRepeatFileDialog,
    openUpload,
    closeUpload,
    openFileDialog,
    handleSelectChange,
    handleDrop,
    handleRemove,
    handleUpload,
  };
}
