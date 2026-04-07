import { uploadFileStep2Api } from "@/api/fileService";
import { shareContentByChatApi } from "@/api/share";
import { useChunkUploader } from "@/hooks/upload/useChunkUploader";
import { useSimpleUploader } from "@/hooks/upload/useSimpleUploader";
import type { Task } from "@/hooks/upload/useUploadFlow";
import { createUploadPoolWithRetry } from "@/utils/upload/concurrentUpload";

type EncryptKey = { name: string; aesKey: string };

type UploadTaskItem = {
  taskId: string;
  file: File;
  encryptKey?: EncryptKey;
};

interface UploadExecutionOptions {
  files: File[];
  encryptKeys?: EncryptKey[];
  tasks?: UploadTaskItem[];
  contentId: number;
  isByChat?: boolean;
  onProgress?: (taskId: string, progress: number) => void;
  onError?: (taskId: string, error: unknown) => void;
}

export interface UploadContext extends UploadExecutionOptions {
  completeAllTasks?: (callbackData?: unknown) => void;
  findDuplicateFiles?: () => void;
  uploadError?: () => void;
  onRegister?: (task: UploadTaskItem) => void;
  onTaskSuccess?: (taskId: string) => void;
  onTaskError?: (taskId: string, errorMsg?: string, errorType?: string) => void;
  onDuplicate?: (allTasks: Task[], duplicateTasks: Task[]) => void;
  onComplete?: (callbackData?: unknown) => void;
}

const LARGE_FILE_THRESHOLD = 30 * 1024 * 1024;
const { uploadInChunks } = useChunkUploader();
const { uploadSingleFile } = useSimpleUploader();

const resolveUploadTasks = (options: {
  files: File[];
  encryptKeys?: EncryptKey[];
  tasks?: UploadTaskItem[];
}) => {
  if (options.tasks?.length) {
    return options.tasks;
  }

  return options.files.map((file, index) => ({
    taskId: `${file.name}-${index}`,
    file,
    encryptKey: options.encryptKeys?.[index],
  }));
};

export async function uploadFiles(options: UploadExecutionOptions) {
  const {
    files,
    encryptKeys = [],
    tasks,
    contentId,
    isByChat = false,
    onProgress,
    onError,
  } = options;

  const fileList: Task[] = [];
  const uploadTasks = resolveUploadTasks({ files, encryptKeys, tasks });

  const requestTasks = uploadTasks.map((task) => {
    return async () => {
      try {
        if (task.file.size > LARGE_FILE_THRESHOLD) {
          const uploadRes = await uploadInChunks(task.file, {
            onProgress: (_fileName, percent) => {
              onProgress?.(task.taskId, percent);
            },
          });

          if (!uploadRes) throw new Error("分片上传失败");

          const uploadedFile: Task = {
            taskId: task.taskId,
            name: uploadRes.name,
            fileId: uploadRes.fileUrl,
            size: uploadRes.fileSize,
            aesKey: task.encryptKey?.aesKey,
          };

          fileList.push(uploadedFile);
          return uploadedFile;
        }

        const uploadRes = await uploadSingleFile(task.file, {
          onProgress: (_fileName, percent) => {
            onProgress?.(task.taskId, percent);
          },
        });

        if (!uploadRes) throw new Error("单文件上传失败");

        const uploadedFile: Task = {
          taskId: task.taskId,
          ...uploadRes,
          aesKey: task.encryptKey?.aesKey,
        };

        fileList.push(uploadedFile);
        return uploadedFile;
      } catch (error) {
        console.error(`${task.file.name} 上传失败`, error);
        onError?.(task.taskId, error);
        throw error;
      }
    };
  });

  const uploadResults = await createUploadPoolWithRetry(requestTasks, 3, 0);
  const successCount = uploadResults.filter(
    (item) => item?.status === "fulfilled",
  ).length;

  if (!successCount) {
    return { fileList: [], serverRes: { code: 0, data: [] } };
  }

  const serverRes = isByChat
    ? await shareContentByChatApi({
        fileInfos: fileList,
        contentId,
      })
    : await uploadFileStep2Api({
        fileInfos: fileList,
        contentId,
        repeatFileOperateType: 0,
        viewRanges: [],
        editRanges: [],
      });

  return { fileList, serverRes };
}

export async function startUploadTask(context: UploadContext) {
  const {
    files,
    encryptKeys = [],
    tasks,
    contentId,
    isByChat = false,
    completeAllTasks,
    findDuplicateFiles,
    uploadError,
    onRegister,
    onProgress,
    onTaskSuccess,
    onTaskError,
    onDuplicate,
    onComplete,
  } = context;

  const uploadTasks = resolveUploadTasks({ files, encryptKeys, tasks });

  console.log("上传任务列表：", uploadTasks);

  debugger;
  uploadTasks.forEach((task) => {
    onRegister?.(task);
  });

  const { fileList, serverRes } = await uploadFiles({
    files,
    encryptKeys,
    tasks: uploadTasks,
    contentId,
    isByChat,
    onProgress,
    onError(taskId, error) {
      const errorMsg = error instanceof Error ? error.message : "上传失败";
      onTaskError?.(taskId, errorMsg, "upload");
    },
  });

  if (!fileList.length) {
    uploadError?.();
    return { fileList, serverRes };
  }

  if (serverRes.code !== 1) {
    const errorMsg = serverRes.message || "上传失败";
    fileList.forEach((file) => {
      onTaskError?.(file.taskId, errorMsg, "server");
    });
    uploadError?.();
    return { fileList, serverRes };
  }

  if (isByChat) {
    fileList.forEach((file) => {
      onTaskSuccess?.(file.taskId);
    });
    onComplete?.(serverRes.data);
    completeAllTasks?.(serverRes.data);
    return { fileList, serverRes };
  }

  const duplicateIds = Array.isArray(serverRes.data) ? serverRes.data : [];
  const duplicateTasks = fileList.filter((file) =>
    duplicateIds.includes(file.fileId),
  );
  const successTasks = fileList.filter(
    (file) => !duplicateIds.includes(file.fileId),
  );

  successTasks.forEach((file) => {
    onTaskSuccess?.(file.taskId);
  });

  if (duplicateTasks.length) {
    onDuplicate?.(fileList, duplicateTasks);
    findDuplicateFiles?.();
    return { fileList, serverRes };
  }

  onComplete?.(serverRes.data);
  completeAllTasks?.(serverRes.data);
  return { fileList, serverRes };
}
