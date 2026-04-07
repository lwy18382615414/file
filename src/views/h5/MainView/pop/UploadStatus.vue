<template>
  <div>
    <!-- 上传进度面板 -->
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
            </div>
          </div>
        </div>
      </div>
    </van-action-sheet>

    <!-- 浮动气泡 -->
    <van-floating-bubble
      v-if="uploadingTasks.length > 0 && !showUpload"
      axis="xy"
      z-index="1000"
      @click="showOrHideUploadDialog(true)"
    >
      <template #default>
        <SvgIcon name="ic_uploading" size="36" />
      </template>
    </van-floating-bubble>
  </div>
</template>
<script lang="ts" setup>
import { useUploadInfo } from "@/stores";
import { getFileIcon, t } from "@/utils";
import { storeToRefs } from "pinia";
import { useUploader } from "@/hooks/upload/useUploader";

const { resetUploader } = useUploader();
const uploadInfo = useUploadInfo();
const { showOrHideUploadDialog } = useUploadInfo();
const { showUpload, uploadingTasks } = storeToRefs(uploadInfo)

const handleClose = () => {
  showOrHideUploadDialog(false);
  console.log("handleClose", uploadingTasks.value.every((task) => task.status === "success"));
  if (uploadingTasks.value.every((task) => task.status === "success")) {
    resetUploader();
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
    }
    .progress-bar {
      width: 100%;
    }
  }
}
</style>
