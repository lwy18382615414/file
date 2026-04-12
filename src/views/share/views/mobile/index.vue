<template>
  <div class="mobile-container">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      :element-loading-text="t('loading')"
      :element-loading-background="'#fff'"
      class="share-loading"
    />
    <template v-else>
      <ShareHeader
        :avatar-id="shareBaseInfo.avatarId"
        :share-person-name="shareBaseInfo.sharePersonName"
        :share-time="shareBaseInfo.shareTime"
        :is-input-psw="isInputPsw"
        :origin-share-count="shareBaseInfo.originShareCount"
        :expire-time-text="shareBaseInfo.expireTimeText"
      />
      <div v-if="isInputPsw" class="divider"></div>

      <div v-if="isInputPsw" class="share-file-list-wrapper">
        <FileListWrapper
          :file-list="fileList"
          :selected-files="selectedFiles"
          :breadcrumb-list="breadcrumbList"
          :is-top-folder="isTopFolder"
          @select-all="selectAll"
          @breadcrumb-click="handleBreadcrumbClick"
          @item-click="handleItemClick"
          @choose-file="chooseFile"
        />
      </div>

      <div v-else class="input-wrapper">
        <van-field
          v-model="psw"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="t('inputPasswordCaseInsensitive')"
        >
          <template #right-icon>
            <van-icon
              :name="showPassword ? 'eye-o' : 'closed-eye'"
              @click="showPassword = !showPassword"
            />
          </template>
        </van-field>
        <div class="extract-btn" @click="handleExtractFile">
          {{ t("extractFile") }}
        </div>
      </div>

      <div v-if="isInputPsw" class="bottom-actions-wrapper">
        <span class="download-btn" @click="onDownload">
          <SvgIcon
            name="action-share_download"
            size="26"
            color="var(--theme-color)"
          />
        </span>
        <div
          v-if="isClient && isHaveFileApp"
          class="goto-app-btn"
          @click="saveToCloudDriver"
        >
          {{ t("saveToCloud") }}
        </div>
        <a v-else :href="schemeUrl" class="goto-app-btn">
          {{ t("viewInApp") }}
        </a>
      </div>

      <FolderSelect
        :visible="showFolderSelect"
        :selected-files="selectedFiles"
        :share-id="shareId"
        @update:visible="showFolderSelect = $event"
        @success="handleSaveSuccess"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import schemeConfig from "@/config";
import { SvgIcon } from "@/components";
import ShareHeader from "@/views/share/components/mobile/ShareHeader.vue";
import FileListWrapper from "@/views/share/components/mobile/FileListWrapper.vue";
import FolderSelect from "@/views/share/components/mobile/FolderSelect.vue";
import { useEnv } from "../../hooks/useEnv";
import { useShareData } from "../../hooks/useShareData";

const { isClient } = useEnv();
const { t } = useI18n();
const showPassword = ref(false);

const {
  shareId,
  shareKey,
  psw,
  isLoading,
  shareBaseInfo,
  fileList,
  selectedFiles,
  breadcrumbList,
  isTopFolder,
  isInputPsw,
  isHaveFileApp,
  showFolderSelect,
  handleExtractFile,
  selectAll,
  chooseFile,
  handleItemClick,
  handleBreadcrumbClick,
  onDownload,
  saveToCloudDriver,
  handleSaveSuccess,
} = useShareData();

const schemeUrl = computed(() => {
  const baseUrl = `${location.origin}${location.pathname}`;
  let hash = `#/share-page?shareKey=${shareKey.value}`;
  if (psw.value) {
    hash += `&psw=${psw.value}`;
  }
  const fullUrl = `${baseUrl}${hash}`;
  const encodedFullUrl = encodeURIComponent(fullUrl);
  return `${schemeConfig.cloudCallAppKey}://cloudShare?url=${encodedFullUrl}`;
});
</script>

<style lang="scss" scoped>
.mobile-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
}

.share-loading {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.divider {
  width: 100%;
  height: 12px;
  background: var(--content-bg-color);
  margin-top: 36px;
}

.share-file-list-wrapper,
.input-wrapper {
  flex: 1;
  overflow-y: auto;
}

.input-wrapper {
  padding: 0 16px;

  :deep(.van-field) {
    margin-top: 40px;
    background: var(--input-bg-color);
    border-radius: 4px;
    padding: 8px 16px;
  }

  .password-toggle-text {
    font-size: 14px;
    color: var(--theme-color);
    cursor: pointer;
  }

  .extract-btn {
    margin-top: 12px;
    width: 100%;
    height: 42px;
    line-height: 42px;
    text-align: center;
    background: var(--btn-primary-color);
    color: #fff;
    border-radius: 8px;
  }
}

.bottom-actions-wrapper {
  height: 67px;
  width: 100%;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .download-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 8px;
    background: var(--content-bg-color);
  }
  .goto-app-btn {
    width: calc(100vw - 32px - 46px);
    height: 42px;
    text-align: center;
    line-height: 42px;
    background: var(--content-bg-color);
    border-radius: 8px;
    margin-top: 0;
    border: none;
    color: var(--theme-color);
  }
}
</style>
