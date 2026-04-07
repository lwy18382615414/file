import { useUploader } from "@/hooks/upload/useUploader";
import { useUploadInfo } from "@/stores";

interface UploadContext {
  files: File[];
  encryptKeys?: { name: string; aesKey: string }[];
  contentId: number;
  isByChat?: boolean;
  completeAllTasks?: (callbackData?: any) => void;
  findDuplicateFiles?: () => void;
  uploadError?: () => void;
}

export async function startUploadTask(context: UploadContext) {
  const {
    files,
    encryptKeys = [],
    contentId,
    isByChat = false,
    completeAllTasks,
    findDuplicateFiles,
    uploadError,
  } = context;

  const {
    addUploadingTask,
    updateUploadingFileProgress,
    markTaskSuccess,
    markTaskError,
    addDuplicateTask,
    addAllTasks,
    markTaskDuplicate,
  } = useUploadInfo();
  const { uploadFiles, resetUploader } = useUploader();

  // Step 0：展示浮动气泡并注册任务
  files.forEach((file) => {
    addUploadingTask(file.name);
  });

  // Step 1：并发上传任务（封装内部逻辑）
  const { fileList, serverRes } = await uploadFiles({
    files,
    encryptKeys,
    contentId,
    isByChat,
    onProgress: (name, percent) => {
      updateUploadingFileProgress(name, percent);
    },
    onError: (name, err) => {
      markTaskError(name, err ?? "上传失败", "unknown");
    },
  });

  // Step 2：处理同名文件标记
  if (serverRes.code === 1) {
    const duplicateIds = serverRes.data;
    const duplicateFiles = fileList.filter((f) =>
      duplicateIds.some((id) => f.fileId === id),
    );
    if (duplicateFiles.length) {
      addDuplicateTask(duplicateFiles);
      addAllTasks(fileList);
      duplicateFiles.forEach((f) => {
        markTaskDuplicate(f.name);
      });
      findDuplicateFiles?.();
    } else {
      fileList.forEach((f) => {markTaskSuccess(f.name)})
      // resetUploader();
      completeAllTasks?.(serverRes.data);
    }
  } else {
    resetUploader();
    // if (!httpMessage[serverRes.code]) {
    uploadError?.();
    // }
  }
}