<template>
  <div class="upload-bubble-wrapper">
    <el-dialog
      v-model="showUpload"
      :show-close="false"
      :modal="false"
      :close-on-click-modal="false"
      :before-close="handleClose"
      modal-class="el-dialog__wrapper"
      style="
        padding: 0;
        overflow: hidden;
        position: absolute;
        right: 20px;
        bottom: 0;
        z-index: 10000;
        border-radius: 8px;
      "
      width="400"
    >
      <!-- 头部 -->
      <template #header>
        <div class="dialog-header">
          <span>{{ t('fileUpload') }}</span>
          <SvgIcon name="ic_close" @click="handleClose" />
        </div>
      </template>

      <div ref="dialogContentRef" class="dialog-content">
        <div class="upload-progress">
          <div
            v-for="(file, index) in uploadingTasks"
            :key="file.id"
            :ref="(el) => setProgressItemRef(el, index)"
            class="progress-item"
          >
            <div class="progress-item-wrapper">
              <div class="file-icon">
                <SvgIcon :name="getFileIcon(file.name)" size="24" />
              </div>
              <div class="file-info">
                <div class="file-name">
                  {{ file.name }}
                  <span
                    v-if="
                      file.status === 'error' && file.errorType === 'duplicate'
                    "
                    class="red-text"
                    >重复</span
                  >
                </div>
                <div class="progress-bar">
                  <el-progress :percentage="file.progress"> </el-progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <van-floating-bubble
      v-if="!showUpload && uploadingTasks.length > 0"
      axis="xy"
      @click="showOrHideUploadDialog(true)"
    >
      <template #default>
        <SvgIcon name="ic_uploading" size="36" />
      </template>
    </van-floating-bubble>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { useUploader } from "@/hooks/upload/useUploader";
import { useUploadInfo } from "@/stores";
import { getFileIcon, t } from "@/utils";
import { storeToRefs } from "pinia";

const { resetUploader } = useUploader();

const uploadInfo = useUploadInfo();
const { showOrHideUploadDialog } = useUploadInfo();

const { showUpload, uploadingTasks } = storeToRefs(uploadInfo);

// 滚动相关
const dialogContentRef = ref<HTMLElement | null>(null);
const progressItemRefs = ref<(HTMLElement | null)[]>([]);
const previousStatusMap = ref<Map<string, string>>(new Map());

// 设置进度项引用
const setProgressItemRef = (el: unknown, index: number) => {
  if (el && el instanceof HTMLElement) {
    progressItemRefs.value[index] = el;
  }
};

// 滚动到指定文件位置
const scrollToUploadingFile = async (taskId: string) => {
  await nextTick();
  
  if (!dialogContentRef.value || !showUpload.value) return;

  const taskIndex = uploadingTasks.value.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  const targetElement = progressItemRefs.value[taskIndex];
  if (!targetElement) return;

  // 使用 scrollIntoView 滚动到目标元素
  targetElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
};

// 监听上传任务状态变化
watch(
  uploadingTasks,
  (newTasks, oldTasks) => {
    if (!showUpload.value) return;

    // 初始化 previousStatusMap
    if (oldTasks === undefined || oldTasks.length === 0) {
      newTasks.forEach((task) => {
        previousStatusMap.value.set(task.id, task.status);
      });
      return;
    }

    // 检测状态变化：从非 "uploading" 变为 "uploading"
    newTasks.forEach((task) => {
      const previousStatus = previousStatusMap.value.get(task.id);
      
      if (
        previousStatus !== undefined &&
        previousStatus !== "uploading" &&
        task.status === "uploading"
      ) {
        // 状态变为 uploading，滚动到该位置
        scrollToUploadingFile(task.id);
      }
      
      // 更新状态记录
      previousStatusMap.value.set(task.id, task.status);
    });

    // 清理已删除的任务的状态记录
    const currentTaskIds = new Set(newTasks.map((t) => t.id));
    previousStatusMap.value.forEach((_, taskId) => {
      if (!currentTaskIds.has(taskId)) {
        previousStatusMap.value.delete(taskId);
      }
    });
  },
  { deep: true }
);

// 监听弹窗打开，重置引用
watch(showUpload, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // 重置引用数组
      progressItemRefs.value = [];
      // 如果有正在上传的任务，滚动到第一个
      const firstUploading = uploadingTasks.value.find(
        (t) => t.status === "uploading"
      );
      if (firstUploading) {
        scrollToUploadingFile(firstUploading.id);
      }
    });
  }
});

const handleClose = () => {
  showOrHideUploadDialog(false);
  if (uploadingTasks.value.every((task) => task.status === "success")) {
    resetUploader();
  }
};
</script>

<style scoped lang="scss">
.upload-bubble-wrapper {
  position: fixed;
  bottom: 20px;
  right: 24px;
  z-index: 9999;
}

:deep(.el-dialog__header) {
  padding-bottom: 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e5e5;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  overflow: hidden;
}

.dialog-content {
  padding: 0 16px 16px;
  border-bottom: 1px solid #e3e6ec80;
  max-height: 300px;
  overflow-y: auto;

  .error-msg {
    width: 100%;
    color: #f5222d;
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));

    .operation {
      display: inline-block;
      margin-left: 12px;
      color: #327edc;
      cursor: context-menu;
    }
  }

  .red-text {
    color: #f5222d;
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    font-weight: normal;
    margin-left: 4px;
  }

  .progress-item {
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:first-child {
      padding-top: 0;
    }

    &:not(:last-child) {
      border-bottom: 1px solid #e3e6ec80;
    }

    .progress-item-wrapper {
      display: flex;
      align-items: center;
      padding: 12px 0;

      .file-icon {
        margin-right: 8px;
      }

      .file-info {
        .file-name {
          margin-bottom: 6px;
          color: #2d2d2d;
          font-size: calc(var(--base--font--size--14) * var(--scale-factor));
          font-weight: bold;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .progress-bar {
        width: 330px;

        :deep(.el-progress__text) {
          min-width: unset;
        }
      }
    }
  }
}

:deep(.el-dialog__wrapper) {
  pointer-events: none;

  .el-dialog {
    pointer-events: auto;
  }
}
</style>
