<template>
  <van-action-sheet
    v-model:show="showPopup"
    :close-on-click-overlay="false"
    @click-overlay="toggleMinimize"
    @update:show="handlePopupShowChange"
  >
    <div class="upload-sheet">
      <div class="sheet-header">
        <span class="sheet-title"
          >{{ t("fileUpload") }} ({{ uploadingTasks.length }})</span
        >
        <div class="header-actions">
          <button class="icon-btn" type="button" @click="toggleMinimize">
            <SvgIcon name="ic_retract" size="18" color="var(--text-primary-color)" />
          </button>
          <button class="close-btn" type="button" @click="handleClose">
            <SvgIcon name="ic_close" size="18" color="var(--btn-primary-text-color)" />
          </button>
        </div>
      </div>

      <div v-if="uploadingTasks.length" class="sheet-body">
        <div v-for="task in uploadingTasks" :key="task.id" class="task-item">
          <div class="file-icon">
            <SvgIcon :name="getFileIcon(task.name)" size="24" />
          </div>

          <div class="file-info">
            <button
              class="task-remove-btn"
              type="button"
              @click="confirmRemoveTask(task.id, task.name)"
            >
              <SvgIcon name="ic_close-bg" size="18" />
            </button>
            <div class="file-name">{{ task.name }}</div>

            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-bar"
                  :class="getStatusColorClass(task.status)"
                  :style="{ width: `${task.progress}%` }"
                ></div>
              </div>
            </div>

            <div class="file-meta">
              <span class="status-text">{{ getStatusText(task) }}</span>
              <span class="percent-text">{{ task.progress }}%</span>
            </div>

            <div
              v-if="task.status === 'error' || task.status === 'duplicate'"
              class="error-msg"
            >
              {{ task.errorMsg || t("operationFailedRetry") }}
              <span
                v-if="task.status === 'error' && task.errorType !== 'no-permission'"
                class="retry-text"
                @click="retryFailedUploads"
              >
                {{ t("retry") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </van-action-sheet>

  <van-floating-bubble
    v-if="showBubble"
    class="upload-bubble"
    magnetic="x"
    axis="xy"
    @click="restorePopup"
  >
    <div class="bubble-content">
      <span class="bubble-badge">{{ bubbleCount }}</span>
    </div>
  </van-floating-bubble>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  useUploadFlow,
  type UploadingTask,
} from "@/hooks/upload/useUploadFlow";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import { getFileIcon, t } from "@/utils";

const {
  showUpload,
  uploadingTasks,
  cancelCurrentUpload,
  retryFailedUploads,
  removeUploadTask,
} = useUploadFlow();
const { confirm } = useUiFeedback();

const isMinimized = ref(false);

const hasTasks = computed(() => uploadingTasks.value.length > 0);
const showPopup = computed({
  get: () => showUpload.value && hasTasks.value && !isMinimized.value,
  set: () => {},
});
const handlePopupShowChange = (val: boolean) => {
  if (!val && !isMinimized.value) {
    handleClose();
  }
};
const showBubble = computed(
  () => showUpload.value && hasTasks.value && isMinimized.value,
);
const bubbleCount = computed(() => {
  const uploadingCount = uploadingTasks.value.filter(
    (task) => task.status === "pending" || task.status === "uploading",
  ).length;
  const count =
    uploadingCount > 0 ? uploadingCount : uploadingTasks.value.length;

  return count > 99 ? "99+" : String(count);
});

watch(
  () => showUpload.value,
  (val) => {
    if (val && hasTasks.value) {
      isMinimized.value = false;
    }
  },
);

watch(hasTasks, (val) => {
  if (!val) {
    isMinimized.value = false;
  }
});

const getStatusText = (task: UploadingTask) => {
  if (task.errorType === "no-permission") {
    return t("noPermission");
  }

  switch (task.status) {
    case "pending":
      return "等待中";
    case "uploading":
      return "上传中";
    case "success":
      return "完成";
    case "paused":
      return "暂停中";
    case "duplicate":
      return "重复";
    case "error":
      return "失败";
    default:
      return task.status;
  }
};

const getStatusColorClass = (status: UploadingTask["status"]) => {
  if (status === "success") return "bg-success";
  if (status === "error" || status === "duplicate") return "bg-error";
  return "bg-primary";
};

const toggleMinimize = () => {
  isMinimized.value = true;
  showUpload.value = true;
};

const restorePopup = () => {
  isMinimized.value = false;
};

const confirmRemoveTask = async (taskId: string, fileName: string) => {
  try {
    await confirm({
      title: t("delete"),
      message: t("confirmDeleteFileWithName", { name: fileName }),
      confirmButtonText: t("delete"),
      cancelButtonText: t("cancel"),
      confirmButtonColor: "#f5222d",
      showCancelButton: true,
      type: "warning",
    });
  } catch {
    return;
  }

  removeUploadTask(taskId);
};

const handleClose = () => {
  isMinimized.value = false;
  cancelCurrentUpload();
};
</script>

<style scoped lang="scss">
.upload-sheet {
  width: 100%;
  max-height: min(70vh, 560px);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn,
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

.icon-btn {
  color: var(--text-primary-color);
  line-height: 1;
}

.sheet-body {
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  background: var(--content-bg-color);
}

.file-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  flex: 1;
  min-width: 0;
  position: relative;
  padding-right: 28px;
}

.task-remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
}

.file-name {
  color: var(--text-primary-color);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-wrapper {
  margin-top: 10px;
}

.progress-bg {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #d9dde7;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  transition: width 0.2s ease;
}

.bg-primary {
  background: var(--btn-primary-color);
}

.bg-success {
  background: #52c41a;
}

.bg-error {
  background: #ee3f4d;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}

.status-text,
.percent-text {
  flex-shrink: 0;
}

.error-msg {
  margin-top: 8px;
  color: #ee3f4d;
  font-size: 12px;
  line-height: 18px;
}

.retry-text {
  margin-left: 6px;
  color: var(--theme-color);
}

.upload-bubble {
  z-index: 3003;
}

.bubble-content {
  min-width: 48px;
  height: 48px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--btn-primary-color) 0%,
    var(--theme-color-hover) 100%
  );
  box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-color) 28%, transparent);
}

.bubble-badge {
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--btn-default-bg);
  color: var(--theme-color);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
