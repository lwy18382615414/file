<template>
  <div>
    <van-action-sheet v-model:show="showUpload">
      <div class="header">
        <div class="title">
          <span>{{ t("uploadFile") }}</span>
        </div>
        <div class="close" @click="handleClose">
          <SvgIcon name="ic_close" />
        </div>
      </div>
      <div class="upload-panel-content">
        <div
          v-for="file in uploadingTasks"
          :key="file.id"
          class="progress-item"
        >
          <div class="progress-item-wrapper">
            <div class="file-icon">
              <SvgIcon :name="getFileIcon(file.name)" size="24" />
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="progress-bar">
                <van-progress :percentage="file.progress" />
              </div>
              <div
                v-if="file.status === 'error' || file.status === 'duplicate'"
                class="error-msg"
              >
                {{ file.errorMsg || t("operationFailedRetry") }}
                <span
                  v-if="file.status === 'error'"
                  class="operation"
                  @click="retryFailedUploads"
                >
                  {{ t("retry") }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="hasFailedTasks" class="retry-all" @click="retryFailedUploads">
          {{ t("retry") }}
        </div>
      </div>
    </van-action-sheet>

    <van-floating-bubble
      v-if="uploadingTasks.length > 0 && !showUpload"
      axis="xy"
      z-index="1000"
      @click="openUploadDialog()"
    >
      <template #default>
        <SvgIcon name="ic_uploading" size="36" />
      </template>
    </van-floating-bubble>
  </div>
</template>

<script lang="ts" setup>
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";
import { getFileIcon, t } from "@/utils";

const {
  showUpload,
  uploadingTasks,
  hasFailedTasks,
  openUploadDialog,
  closeUploadDialog,
  clearUploadState,
  retryFailedUploads,
  allTasksSucceeded,
} = useUploadFlow();

const handleClose = () => {
  closeUploadDialog();
  if (allTasksSucceeded.value) {
    clearUploadState();
  }
};
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e3e6ec80;

  .title {
    color: #000;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-family:
      PingFang SC,
      PingFang SC;
  }
}

.progress-item {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 1px solid #e3e6ec80;
  }

  .progress-item-wrapper {
    display: flex;
    align-items: center;
    padding: 0 16px;
    width: 100%;

    .file-icon {
      margin-right: 8px;
    }

    .file-info {
      width: 100%;

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

      .error-msg {
        margin-top: 6px;
        color: #f5222d;
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));

        .operation {
          margin-left: 12px;
          color: #327edc;
        }
      }
    }

    .progress-bar {
      width: 100%;
    }
  }
}

.retry-all {
  padding: 0 16px 16px;
  color: #327edc;
  text-align: right;
}
</style>
