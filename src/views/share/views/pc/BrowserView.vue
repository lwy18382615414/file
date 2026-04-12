<template>
  <div class="browser-view">
    <header class="browser-header">
      <div class="app-pic">
        <img alt="app-logo" src="@/assets/images/app-pic.png" />
      </div>
      <el-button size="small" type="primary" @click="appDownload">
        {{ t("clientDownload") }}
      </el-button>
    </header>
    <p class="share-desc">
      {{ t("steadyWorkPromotion", { appName: "Steady@Work" }) }}
    </p>

    <div class="content">
      <ShareContent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ShareContent from "@/views/share/components/pc/ShareContent.vue";

const { t } = useI18n();

const appDownload = () => {
  window.open("https://www.gosteady.cn/index", "_blank");
};
</script>

<style lang="scss" scoped>
.browser-view {
  width: 100%;
  height: 100%;
  background: url("@/assets/images/share-page-bg.png") no-repeat center center;
  background-size: cover;
}

.browser-header {
  width: 100%;
  height: 70px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-around;

  .app-pic {
    width: 255px;
    height: 48px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .el-button {
    width: 180px;
    height: 44px;
  }

  :deep(.el-button) {
    span {
      font-family: Microsoft YaHei UI;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      color: var(--btn-primary-text-color);
    }
  }
}

.share-desc {
  font-family: Microsoft YaHei UI;
  font-size: calc(var(--base--font--size--24) * var(--scale-factor));
  text-align: center;
  color: var(--text-primary-color);
  margin: 80px 0;
}

.content {
  display: flex;
  justify-content: center;

  :deep(.share-content-container) {
    width: 860px;
    min-height: 450px;
    border-radius: 8px;
    overflow: hidden;
    opacity: 1;
    background: #fff;
    box-shadow: 0 3px 0.375rem rgba(95, 95, 95, 0.4);
  }
}
</style>
