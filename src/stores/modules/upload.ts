import { defineStore } from "pinia";
import { ref } from "vue";

type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadingTask {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  errorMsg?: string;
  errorType?: string;
}

export interface Task {
  name: string;
  fileId: string;
  size: number;
  aesKey?: string;
}

export const useUploadInfo = defineStore("upload-info", () => {
  // 展示文件上传浮动气泡
  const showBubble = ref(false);
  const showUpload = ref(false);
  const uploadingTasks = ref<UploadingTask[]>([]);
  const allTasks = ref<Task[]>([]); // 所有上传任务
  const duplicateTasks = ref<Task[]>([]); // 重名文件名列表
  const showBubbleWarning = ref(false); // 红点显示控制

  // 显示或隐藏浮动气泡
  const showOrHideBubble = (val: boolean) => {
    showBubble.value = val;
  };

  // 添加新任务
  const addUploadingTask = (fileName: string) => {
    if (!uploadingTasks.value.some((t) => t.name === fileName)) {
      uploadingTasks.value.push({
        id: fileName,
        name: fileName,
        progress: 0,
        status: "pending",
      });
    }
  };

  // 更新进度
  const updateUploadingFileProgress = (fileName: string, progress: number) => {
    const task = uploadingTasks.value.find((t) => t.name === fileName);
    if (task) {
      task.progress = progress;
      task.status = "uploading";
    }
  };

  // 标记上传成功
  const markTaskSuccess = (fileName: string) => {
    const task = uploadingTasks.value.find((t) => t.name === fileName);
    if (task) task.status = "success";
    
    // 检查是否所有任务都已完成
    // 如果所有任务都成功，自动关闭弹窗
    if (uploadingTasks.value.length > 0 && uploadingTasks.value.every((t) => t.status === "success")) {
      showUpload.value = false;
      // clearUploadingStatus()
    }
  };

  // 标记上传失败
  const markTaskError = (
    fileName: string,
    errorMsg = "",
    errorType: string,
  ) => {
    const task = uploadingTasks.value.find((t) => t.name === fileName);
    if (task) {
      task.status = "error";
      task.errorMsg = errorMsg;
      task.errorType = errorType;
    }
  };

  // 标记为重名文件冲突（专用）
  const markTaskDuplicate = (fileName: string) => {
    markTaskError(fileName, "存在同名文件", "duplicate");
    showBubbleWarning.value = true;
  };

  // 添加重复文件
  const addDuplicateTask = (task: Task[]) => {
    duplicateTasks.value = task;
  };

  // 文件重复时添加所有文件
  const addAllTasks = (task: Task[]) => {
    allTasks.value = task;
  };

  // 清除所有上传任务
  const clearUploadingStatus = () => {
    uploadingTasks.value = [];
    duplicateTasks.value = [];
    showBubble.value = false;
    showUpload.value = false;
    showBubbleWarning.value = false;
  };

  const setBubbleWarning = (val: boolean) => {
    showBubbleWarning.value = val;
  };

  // 控制上传进度弹窗显示
  const showOrHideUploadDialog = (val: boolean) => {
    showUpload.value = val;
  };

  return {
    showBubble,
    showUpload,
    uploadingTasks,
    allTasks,
    duplicateTasks,
    showBubbleWarning,

    showOrHideBubble,
    addUploadingTask,
    addDuplicateTask,
    addAllTasks,
    updateUploadingFileProgress,
    markTaskSuccess,
    markTaskError,
    markTaskDuplicate,

    clearUploadingStatus,
    showOrHideUploadDialog,
    setBubbleWarning,
  };
});
