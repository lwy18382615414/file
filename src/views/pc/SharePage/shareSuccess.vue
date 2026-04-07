<template>
  <div class="share-success">
    <div class="share-title">
      <span>{{ t("saveToCloudDrive") }}</span>
    </div>
    <div class="share-success-content">
      <div class="success-icon">
        <SvgIcon name="ic_save-success" size="100" />
      </div>
      <div class="success-text">{{ t("fileSaveSuccess") }}</div>
      <div class="taget-folder">
        <span>{{ t("savedTo") }}：</span>
        <span class="folder-name">{{ targetFolder }}</span>
      </div>
      <el-button type="primary" @click="goToCloudDrive">
        {{ t("viewNow") }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/utils";

defineProps({
  targetFolder: {
    type: String,
    default: "",
  },
});

const goToCloudDrive = () => {
  console.log(
    JSON.stringify({
      type: "14",
      data: {
        path: "jump-page",
        contentId: sessionStorage.getItem("lastSelectedId") || 0,
      },
    }),
  );
};
</script>

<style scoped lang="scss">
.share-success {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #fff;

  .share-success-content {
    width: 220px;
    height: 253px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: auto;

    .success-text {
      white-space: nowrap;
      font-size: 20px;
      font-weight: 700;
      color: #2d2d2d;
      margin-top: 20px;
    }

    .taget-folder {
      margin: 20px 0;

      .folder-name {
        color: #327edc;
      }
    }

    .el-button {
      width: 100%;
      height: 48px;
    }
  }
}
</style>
