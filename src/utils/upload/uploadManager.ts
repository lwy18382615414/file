import { uploadFileStep2Api } from "@/api/fileService";
import { shareContentByChatApi } from "@/api/share";
import config from "@/hooks/config";
import { useChunkUploader } from "@/hooks/upload/useChunkUploader";
import { useSimpleUploader } from "@/hooks/upload/useSimpleUploader";
import type { Task } from "@/hooks/upload/useUploadFlow";
import { createUploadPoolWithRetry } from "@/utils/upload/concurrentUpload";
import { handleFileEncryption } from "@/utils/upload/encrypt";

export interface Step2ExecutionResult {
  successTasks: Task[];
  duplicateTasks: Task[];
  failedTasks: Array<{
    contentId: number;
    tasks: Task[];
    message: string;
  }>;
}

type UploadTaskItem = {
  taskId: string;
  sourceFile: File;
  contentId?: number;
};

type PreparedUploadTask = {
  taskId: string;
  sourceFile: File;
  encryptedFile: File;
  aesKey: string;
  name: string;
  contentId?: number;
};

interface UploadExecutionOptions {
  tasks: UploadTaskItem[];
  contentId: number;
  isByChat?: boolean;
  signal?: AbortSignal;
  onProgress?: (taskId: string, progress: number) => void;
  onError?: (taskId: string, error: unknown, errorType?: string) => void;
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

const { fileChunkSize } = config();
const { uploadInChunks } = useChunkUploader();
const { uploadSingleFile } = useSimpleUploader();

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new Error("__UPLOAD_ABORTED__");
  }
};

const prepareUploadTask = async (
  task: UploadTaskItem,
  signal?: AbortSignal,
): Promise<PreparedUploadTask> => {
  throwIfAborted(signal);
  const [encryptedResult] = await handleFileEncryption([task.sourceFile], signal);
  throwIfAborted(signal);

  if (!encryptedResult) {
    throw new Error("文件加密失败");
  }

  return {
    taskId: task.taskId,
    sourceFile: task.sourceFile,
    encryptedFile: encryptedResult.file,
    aesKey: encryptedResult.key,
    name: encryptedResult.name,
    contentId: task.contentId,
  };
};

export async function uploadFiles(options: UploadExecutionOptions) {
  const {
    tasks,
    contentId,
    isByChat = false,
    signal,
    onProgress,
    onError,
  } = options;

  const fileList: Task[] = [];

  const requestTasks = tasks.map((task) => {
    return async () => {
      try {
        throwIfAborted(signal);
        const preparedTask = await prepareUploadTask(task, signal);
        throwIfAborted(signal);

        if (preparedTask.encryptedFile.size > fileChunkSize.value) {
          const uploadRes = await uploadInChunks(preparedTask.encryptedFile, {
            signal,
            onProgress: (_fileName, percent) => {
              onProgress?.(preparedTask.taskId, percent);
            },
          });

          if (!uploadRes) throw new Error("分片上传失败");
          throwIfAborted(signal);

          const uploadedFile: Task = {
            taskId: preparedTask.taskId,
            name: uploadRes.name,
            fileId: uploadRes.fileUrl,
            size: uploadRes.fileSize,
            aesKey: preparedTask.aesKey,
            contentId: preparedTask.contentId,
          };

          fileList.push(uploadedFile);
          return uploadedFile;
        }

        const uploadRes = await uploadSingleFile(preparedTask.encryptedFile, {
          signal,
          onProgress: (_fileName, percent) => {
            onProgress?.(preparedTask.taskId, percent);
          },
        });

        if (!uploadRes) throw new Error("单文件上传失败");
        throwIfAborted(signal);

        const uploadedFile: Task = {
          taskId: preparedTask.taskId,
          ...uploadRes,
          aesKey: preparedTask.aesKey,
          contentId: preparedTask.contentId,
        };

        fileList.push(uploadedFile);
        return uploadedFile;
      } catch (error) {
        const errorType =
          error instanceof Error &&
          ["文件加密失败", "__ENCRYPT_ABORTED__", "__UPLOAD_ABORTED__"].includes(
            error.message,
          )
            ? error.message === "__UPLOAD_ABORTED__"
              ? "abort"
              : "encrypt"
            : "upload";
        onError?.(task.taskId, error, errorType);
        throw error;
      }
    };
  });

  const uploadResults = await createUploadPoolWithRetry(requestTasks, 3, 0);
  const successCount = uploadResults.filter(
    (item) => item?.status === "fulfilled",
  ).length;

  throwIfAborted(signal);

  if (!successCount) {
    return { fileList: [], serverRes: { code: 0, data: [] } };
  }

  if (!isByChat) {
    return {
      fileList,
      serverRes: { code: 1, data: [] },
    };
  }

  const serverRes = await shareContentByChatApi({
    fileInfos: fileList,
    contentId,
  });

  return { fileList, serverRes };
}

const groupTasksByContentId = (tasks: Task[], defaultContentId: number) => {
  const groupedTasks = new Map<number, Task[]>();

  tasks.forEach((task) => {
    const resolvedContentId = task.contentId ?? defaultContentId;
    const currentGroup = groupedTasks.get(resolvedContentId) ?? [];
    currentGroup.push({
      ...task,
      contentId: resolvedContentId,
    });
    groupedTasks.set(resolvedContentId, currentGroup);
  });

  return groupedTasks;
};

export async function executeGroupedUploadStep2(options: {
  tasks: Task[];
  defaultContentId: number;
  repeatFileOperateType: number;
  signal?: AbortSignal;
}) {
  const { tasks, defaultContentId, repeatFileOperateType, signal } = options;
  const groupedTasks = groupTasksByContentId(tasks, defaultContentId);
  const result: Step2ExecutionResult = {
    successTasks: [],
    duplicateTasks: [],
    failedTasks: [],
  };

  for (const [currentContentId, groupTasks] of groupedTasks.entries()) {
    throwIfAborted(signal);

    const serverRes = await uploadFileStep2Api({
      fileInfos: groupTasks,
      contentId: currentContentId,
      repeatFileOperateType,
      viewRanges: [],
      editRanges: [],
    });

    if (serverRes.code !== 1) {
      result.failedTasks.push({
        contentId: currentContentId,
        tasks: groupTasks,
        message: serverRes.message || "上传失败",
      });
      continue;
    }

    const duplicateIds = Array.isArray(serverRes.data) ? serverRes.data : [];
    const currentDuplicateTasks = groupTasks.filter((task) =>
      duplicateIds.includes(task.fileId),
    );
    const currentSuccessTasks = groupTasks.filter(
      (task) => !duplicateIds.includes(task.fileId),
    );

    result.duplicateTasks.push(...currentDuplicateTasks);
    result.successTasks.push(...currentSuccessTasks);
  }

  return result;
}

export async function replayGroupedUploadStep2(options: {
  tasks: Task[];
  defaultContentId: number;
  repeatFileOperateType: number;
}) {
  const { tasks, defaultContentId, repeatFileOperateType } = options;
  return executeGroupedUploadStep2({
    tasks,
    defaultContentId,
    repeatFileOperateType,
  });
}

export async function uploadGroupedFiles(options: UploadExecutionOptions) {
  const { contentId, signal } = options;
  const { fileList } = await uploadFiles(options);

  if (!fileList.length) {
    return {
      fileList,
      step2Result: {
        successTasks: [],
        duplicateTasks: [],
        failedTasks: [],
      } satisfies Step2ExecutionResult,
    };
  }

  const step2Result = await executeGroupedUploadStep2({
    tasks: fileList,
    defaultContentId: contentId,
    repeatFileOperateType: 0,
    signal,
  });

  return { fileList, step2Result };
}

export async function startUploadTask(context: UploadContext) {
  const {
    tasks,
    contentId,
    isByChat = false,
    signal,
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

  tasks.forEach((task) => {
    onRegister?.(task);
  });

  if (isByChat) {
    const { fileList, serverRes } = await uploadFiles({
      tasks,
      contentId,
      isByChat,
      signal,
      onProgress,
      onError(taskId, error, errorType = "upload") {
        const errorMsg = error instanceof Error ? error.message : "上传失败";
        onTaskError?.(taskId, errorMsg, errorType);
      },
    });

    if (!fileList.length) {
      if (signal?.aborted) {
        return { fileList, serverRes };
      }
      uploadError?.();
      return { fileList, serverRes };
    }

    throwIfAborted(signal);

    if (serverRes.code !== 1) {
      if (signal?.aborted) {
        return { fileList, serverRes };
      }
      const errorMsg = serverRes.message || "上传失败";
      fileList.forEach((file) => {
        onTaskError?.(file.taskId, errorMsg, "server");
      });
      uploadError?.();
      return { fileList, serverRes };
    }

    fileList.forEach((file) => {
      onTaskSuccess?.(file.taskId);
    });
    onComplete?.(serverRes.data);
    completeAllTasks?.(serverRes.data);
    return { fileList, serverRes };
  }

  const { fileList, step2Result } = await uploadGroupedFiles({
    tasks,
    contentId,
    signal,
    onProgress,
    onError(taskId, error, errorType = "upload") {
      const errorMsg = error instanceof Error ? error.message : "上传失败";
      onTaskError?.(taskId, errorMsg, errorType);
    },
  });

  if (!fileList.length) {
    if (signal?.aborted) {
      return { fileList, step2Result };
    }
    uploadError?.();
    return { fileList, step2Result };
  }

  throwIfAborted(signal);

  step2Result.successTasks.forEach((file) => {
    onTaskSuccess?.(file.taskId);
  });

  step2Result.failedTasks.forEach((failedGroup) => {
    failedGroup.tasks.forEach((file) => {
      onTaskError?.(file.taskId, failedGroup.message, "server");
    });
  });

  if (step2Result.failedTasks.length) {
    uploadError?.();
  }

  if (step2Result.duplicateTasks.length) {
    onDuplicate?.(fileList, step2Result.duplicateTasks);
    findDuplicateFiles?.();
    return { fileList, step2Result };
  }

  if (step2Result.failedTasks.length) {
    return { fileList, step2Result };
  }

  onComplete?.(step2Result.successTasks);
  completeAllTasks?.(step2Result.successTasks);
  return { fileList, step2Result };
}
