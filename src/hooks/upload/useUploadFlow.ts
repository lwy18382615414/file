import { computed, ref } from "vue";
import { startUploadTask } from "@/utils/upload/uploadManager";
import type { UploadContext } from "@/utils/upload/uploadManager";

export type UploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "paused"
  | "duplicate"
  | "error";

export interface UploadingTask {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  errorMsg?: string;
  errorType?: string;
}

export interface Task {
  taskId: string;
  name: string;
  fileId: string;
  size: number;
  aesKey?: string;
  contentId?: number;
}

export type UploadSourceItem = {
  file: File;
  contentId?: number;
};

type UploadCallbacks = {
  completeAllTasks?: (callbackData?: unknown) => void;
  findDuplicateFiles?: () => void;
  uploadError?: () => void;
};

type UploadBatchContext = UploadCallbacks & {
  files?: File[];
  uploadItems?: UploadSourceItem[];
  contentId: number;
  isByChat?: boolean;
};

type UploadTaskEntry = {
  id: string;
  sourceFile: File;
  contentId?: number;
};

type ActiveUploadBatch = UploadCallbacks & {
  tasks: UploadTaskEntry[];
  contentId: number;
  isByChat?: boolean;
};

type UploadingTaskInput = string | { id?: string; name: string };

const showUpload = ref(false);
const uploadingTasks = ref<UploadingTask[]>([]);
const allTasks = ref<Task[]>([]);
const duplicateTasks = ref<Task[]>([]);
const showBubbleWarning = ref(false);
const currentBatch = ref<ActiveUploadBatch | null>(null);
const currentController = ref<AbortController | null>(null);

const createTaskId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createBatchTasks = (
  files: File[] = [],
  uploadItems: UploadSourceItem[] = [],
) => {
  if (uploadItems.length) {
    return uploadItems.map((item) => ({
      id: createTaskId(),
      sourceFile: item.file,
      contentId: item.contentId,
    }));
  }

  return files.map((file) => ({
    id: createTaskId(),
    sourceFile: file,
  }));
};

const getTask = (taskId: string) =>
  uploadingTasks.value.find((task) => task.id === taskId);

const addUploadingTask = (taskInput: UploadingTaskInput) => {
  const task =
    typeof taskInput === "string"
      ? {
          id: createTaskId(),
          name: taskInput,
        }
      : {
          id: taskInput.id ?? createTaskId(),
          name: taskInput.name,
        };

  if (getTask(task.id)) return task.id;

  uploadingTasks.value.push({
    id: task.id,
    name: task.name,
    progress: 0,
    status: "pending",
  });

  return task.id;
};

const registerUploadTasks = (files: File[]) => {
  const tasks = createBatchTasks(files);
  tasks.forEach((task) => {
    addUploadingTask({ id: task.id, name: task.sourceFile.name });
  });
  showUpload.value = true;
  return tasks;
};

const updateTaskProgress = (taskId: string, progress: number) => {
  const task = getTask(taskId);
  if (!task) return;
  task.progress = progress;
  task.status = "uploading";
  task.errorMsg = "";
  task.errorType = "";
};

const markTaskSuccess = (taskId: string) => {
  const task = getTask(taskId);
  if (!task) return;
  task.progress = 100;
  task.status = "success";
  task.errorMsg = "";
  task.errorType = "";

  if (
    uploadingTasks.value.length > 0 &&
    uploadingTasks.value.every((item) => item.status === "success")
  ) {
    showUpload.value = false;
  }
};

const markTaskError = (
  taskId: string,
  errorMsg = "",
  errorType = "unknown",
) => {
  const task = getTask(taskId);
  if (!task) return;
  task.status = "error";
  task.errorMsg = errorMsg;
  task.errorType = errorType;
};

const markTaskDuplicate = (taskId: string) => {
  const task = getTask(taskId);
  if (!task) return;
  task.progress = 100;
  task.status = "duplicate";
  task.errorMsg = "存在同名文件";
  task.errorType = "";
  showBubbleWarning.value = true;
};

const resetTaskForRetry = (taskId: string) => {
  const task = getTask(taskId);
  if (!task) return;
  task.progress = 0;
  task.status = "pending";
  task.errorMsg = "";
  task.errorType = "";
};

const setDuplicateTasks = (tasks: Task[]) => {
  duplicateTasks.value = tasks;
};

const setAllTasks = (tasks: Task[]) => {
  allTasks.value = tasks;
};

const openUploadDialog = () => {
  showUpload.value = true;
};

const closeUploadDialog = () => {
  showUpload.value = false;
};

const clearUploadState = () => {
  showUpload.value = false;
  uploadingTasks.value = [];
  allTasks.value = [];
  duplicateTasks.value = [];
  showBubbleWarning.value = false;
  currentBatch.value = null;
  currentController.value = null;
};

const cancelCurrentUpload = () => {
  currentController.value?.abort();
  clearUploadState();
};

const getFailedTaskIds = () =>
  uploadingTasks.value
    .filter((task) => task.status === "error")
    .map((task) => task.id);

const runUploadBatch = async (
  batch: ActiveUploadBatch,
  options?: { register?: boolean },
) => {
  currentBatch.value = batch;
  currentController.value = new AbortController();

  console.log("Starting upload batch with tasks:", batch.tasks, options);

  if (options?.register !== false) {
    batch.tasks.forEach((task) => {
      addUploadingTask({ id: task.id, name: task.sourceFile.name });
    });
    showUpload.value = true;
  } else {
    openUploadDialog();
  }

  const { completeAllTasks, ...restBatch } = batch;

  const uploadContext: UploadContext = {
    ...restBatch,
    signal: currentController.value.signal,
    tasks: batch.tasks.map((task) => ({
      taskId: task.id,
      sourceFile: task.sourceFile,
      contentId: task.contentId,
    })),
    onProgress: updateTaskProgress,
    onTaskSuccess: markTaskSuccess,
    onTaskError(taskId, errorMsg, errorType) {
      if (errorType === "abort") return;
      markTaskError(taskId, errorMsg, errorType);
    },
    onDuplicate(tasks, duplicates) {
      setAllTasks(tasks);
      setDuplicateTasks(duplicates);
      duplicates.forEach((task) => markTaskDuplicate(task.taskId));
    },
    onComplete(callbackData) {
      if (allTasksSucceeded.value) {
        completeAllTasks?.(callbackData);
      }
    },
  };

  try {
    await startUploadTask(uploadContext);
  } finally {
    currentController.value = null;
  }
};

const runUpload = async (
  context: UploadBatchContext,
  options?: { register?: boolean },
) => {
  const batch: ActiveUploadBatch = {
    contentId: context.contentId,
    isByChat: context.isByChat,
    completeAllTasks: context.completeAllTasks,
    findDuplicateFiles: context.findDuplicateFiles,
    uploadError: context.uploadError,
    tasks: createBatchTasks(context.files, context.uploadItems),
  };

  await runUploadBatch(batch, options);
};

const retryFailedUploads = async () => {
  if (!currentBatch.value) return;

  const failedTaskIds = getFailedTaskIds();
  if (!failedTaskIds.length) return;

  const retryTasks = currentBatch.value.tasks.filter((task) =>
    failedTaskIds.includes(task.id),
  );
  if (!retryTasks.length) return;

  retryTasks.forEach((task) => resetTaskForRetry(task.id));
  showBubbleWarning.value = false;

  await runUploadBatch(
    {
      ...currentBatch.value,
      tasks: retryTasks,
    },
    { register: false },
  );
};

const hasFailedTasks = computed(() =>
  uploadingTasks.value.some((task) => task.status === "error"),
);
const hasUploadingTasks = computed(() =>
  uploadingTasks.value.some(
    (task) =>
      task.status === "pending" ||
      task.status === "uploading" ||
      task.status === "paused",
  ),
);
const allTasksSucceeded = computed(
  () =>
    uploadingTasks.value.length > 0 &&
    uploadingTasks.value.every((task) => task.status === "success"),
);

export function useUploadFlow() {
  return {
    showUpload,
    uploadingTasks,
    allTasks,
    duplicateTasks,
    showBubbleWarning,
    hasFailedTasks,
    hasUploadingTasks,
    allTasksSucceeded,
    currentBatch,
    addUploadingTask,
    registerUploadTasks,
    updateTaskProgress,
    markTaskSuccess,
    markTaskError,
    markTaskDuplicate,
    resetTaskForRetry,
    setDuplicateTasks,
    setAllTasks,
    openUploadDialog,
    closeUploadDialog,
    clearUploadState,
    cancelCurrentUpload,
    runUpload,
    retryFailedUploads,
  };
}
