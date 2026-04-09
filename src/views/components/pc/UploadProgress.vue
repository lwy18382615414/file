<template>
  <Transition name="slide-fade">
    <div
      v-if="showUpload && uploadingTasks.length > 0"
      class="upload-panel"
      :class="{ 'is-minimized': isMinimized }"
    >
      <div class="panel-header">
        <div class="header-left">
          <span class="title">{{ t('fileUpload') }} ({{ uploadingTasks.length }})</span>
        </div>
        <div class="header-right">
          <i class="icon-btn" @click="toggleMinimize">
            {{ isMinimized ? '▴' : '▾' }}
          </i>
          <i class="icon-btn" @click="handleClose">✕</i>
        </div>
      </div>

      <div v-show="!isMinimized" class="panel-body">
        <div v-if="uploadingTasks.length === 0" class="empty-tip">
          {{ t('uploadFile') }}
        </div>

        <div
          v-for="task in uploadingTasks"
          :key="task.id"
          class="task-item"
        >
          <div class="file-icon">
            <SvgIcon :name="getFileIcon(task.name)" size="24" />
          </div>

          <div class="file-info">
            <div class="file-name" :title="task.name">{{ task.name }}</div>

            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-bar"
                  :class="getStatusColorClass(task.status)"
                  :style="{ width: task.progress + '%' }"
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
              {{ task.errorMsg || t('operationFailedRetry') }}
              <span
                v-if="task.status === 'error'"
                class="retry-text"
                @click="retryFailedUploads"
              >
                {{ t('retry') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUploadFlow, type UploadingTask } from "@/hooks/upload/useUploadFlow";
import { getFileIcon, t } from "@/utils";

const { showUpload, uploadingTasks, cancelCurrentUpload, retryFailedUploads } =
  useUploadFlow();

const isMinimized = ref(false);

const getStatusText = (task: UploadingTask) => {
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
  isMinimized.value = !isMinimized.value;
};

const handleClose = () => {
  cancelCurrentUpload();
};
</script>

<style scoped lang="scss">
$panel-width-pc: 360px;
$primary-color: #327edc;
$success-color: #67c23a;
$error-color: #f56c6c;
$text-main: #303133;
$text-secondary: #909399;
$border-color: #ebeef5;

.upload-panel {
  position: fixed;
  z-index: 2000;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  bottom: 20px;
  right: 20px;
  width: $panel-width-pc;
  border-radius: 8px;
  max-height: 80vh;

  &.is-minimized {
    height: auto;
    .panel-body {
      display: none;
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid $border-color;
  user-select: none;

  .title {
    font-weight: bold;
    font-size: 14px;
    color: $text-main;
  }

  .header-right {
    display: flex;
    gap: 12px;

    .icon-btn {
      cursor: pointer;
      font-style: normal;
      font-size: 14px;
      color: $text-secondary;
      &:hover {
        color: $primary-color;
      }
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  max-height: 300px;
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: $text-secondary;
  font-size: 13px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f2f2;
  gap: 12px;

  &:last-child {
    border-bottom: none;
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
    display: flex;
    flex-direction: column;
    gap: 4px;

    .file-name {
      font-size: 13px;
      color: $text-main;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-wrapper {
      width: 100%;
      height: 4px;
      background: #ebeef5;
      border-radius: 2px;
      overflow: hidden;

      .progress-bg {
        height: 100%;
      }

      .progress-bar {
        height: 100%;
        transition: width 0.3s ease;
        &.bg-primary {
          background-color: $primary-color;
        }
        &.bg-success {
          background-color: $success-color;
        }
        &.bg-error {
          background-color: $error-color;
        }
      }
    }

    .file-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: $text-secondary;
    }

    .error-msg {
      color: $error-color;
      font-size: 12px;
    }

    .retry-text {
      margin-left: 8px;
      color: $primary-color;
      cursor: pointer;
    }
  }
}
</style>
