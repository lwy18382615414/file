<template>
  <van-popup
    v-model:show="showBottom"
    round
    position="bottom"
    style="height: 34.375rem"
  >
    <div class="van-popup__container">
      <div class="van-popup__header">
        <div class="van-popup__header-left" @click="showBottom = false">
          {{ t("cancel") }}
        </div>
        <div class="van-popup__header-title">{{ t("saveToCloud") }}</div>
      </div>
      <div class="van-popup__content" :style="{ marginTop: '16px' }">
        <div class="item-select">
          <SvgIcon name="selected-folder" size="30" />
          <div class="item-select__title">{{ selectedFilesCountText }}</div>
        </div>
        <div v-if="showBreadcrumb" class="breadcrumb">
          <div
            v-for="(item, index) in breadcrumbList"
            :key="getItemKey(item, index)"
            class="breadcrumb-item"
          >
            <span
              class="breadcrumb-item__name"
              :class="{ active: index === breadcrumbList.length - 1 }"
              @click="onClickBreadcrumb(item)"
            >
              {{ item.name }}
            </span>
            <span v-if="index !== breadcrumbList.length - 1">
              <SvgIcon name="ic_right" />
            </span>
          </div>
        </div>
        <div
          ref="scrollContainer"
          class="folder-list"
          :class="{
            showBottomBtn: showBottomActions,
          }"
          @scroll.passive="onScroll"
        >
          <template v-if="folderList.length > 0">
            <div
              v-for="(item, index) in folderList"
              :key="index"
              class="item-select"
              @click="getFolderList(item)"
            >
              <SvgIcon name="file-folder" size="30" />
              <div class="item-select__title">{{ item.name }}</div>
            </div>
          </template>
          <div v-else-if="loading" class="skeleton-wrapper">
            <FileListSkeleton :count="10" />
          </div>
          <div v-else class="empty-wrapper">
            <SvgIcon name="empty-folder" size="106" />
            <div class="item-select__title">{{ t("noFolder") }}</div>
          </div>
        </div>
      </div>
      <div v-if="showBottomActions" class="van-popup__bottom">
        <div
          v-if="canCreateFolderButton"
          class="btn van-button--new"
          @click="showCreateFolder = true"
        >
          {{ t("createFolder") }}
        </div>
        <div
          v-if="canConfirmTargetFolder"
          class="btn van-button--save"
          @click="saveToCloudDrive"
        >
          {{ t("save") }}
        </div>
      </div>
    </div>
  </van-popup>

  <van-dialog
    v-model:show="showSaveSuccess"
    show-cancel-button
    width="80%"
    :confirm-button-text="t('clickToView')"
    confirm-button-color="var(--theme-color)"
    cancel-button-color="var(--text-primary-color)"
    :cancel-button-text="t('cancel')"
    @cancel="closeSaveSuccess"
    @confirm="goToCloudDrive"
  >
    <div class="van-dialog__content">
      <SvgIcon name="ic_save-success" size="50" />
      <div class="success-text">{{ t("fileSaveSuccess") }}</div>
      <div class="taget-folder">
        <span>{{ t("savedTo") }}：</span>
        <span class="folder-name">{{ selectFolder?.name }}</span>
      </div>
    </div>
  </van-dialog>

  <CreateFolderComponent
    :visible="showCreateFolder"
    :choose-folder="currentFolder"
    :can-create="canCreateFolderButton"
    @update:visible="onToggleCreateFolder"
    @confirm="refreshCurrentFolder"
  />
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from "vue";
import { useRouter } from "vue-router";
import { hasCreateSharePermissionApi } from "@/api/common";
import { t } from "@/utils";
import { useShareFolderSelect } from "@/hooks/useShareFolderSelect";
import type { ShareContentType } from "@/views/share/types";
import SvgIcon from "@/components/SvgIcon.vue";
import FileListSkeleton from "@/views/components/h5/FileListSkeleton.vue";
import CreateFolderComponent from "@/views/share/components/mobile/CreateFolderPopup.vue";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    selectedFiles: ShareContentType[];
    shareId: number | null;
  }>(),
  {
    visible: false,
    selectedFiles: () => [],
    shareId: null,
  },
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const { visible, selectedFiles, shareId } = toRefs(props);
const router = useRouter();

const showBottom = ref(false);
const showCreateFolder = ref(false);
const showSaveSuccess = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const canCreateSharedRootFolder = ref(false);

const {
  loading,
  folderList,
  breadcrumbList,
  selectFolder,
  currentFolder,
  showBreadcrumb,
  showBottomActions,
  canCreateFolder,
  canConfirmTargetFolder,
  selectedFilesCountText,
  getItemKey,
  resetRootState,
  getFolderList,
  onClickBreadcrumb,
  refreshCurrentFolder,
  saveToCloudDrive,
  onScroll: handleScroll,
} = useShareFolderSelect({
  selectedFiles,
  shareId,
  onSaveSuccess: () => {
    showSaveSuccess.value = true;
  },
});

const canCreateFolderButton = computed(() => {
  if (!canCreateFolder.value) return false;
  if (!selectFolder.value) return false;
  if (selectFolder.value.contentId !== 0 || selectFolder.value.isPersonal)
    return true;
  return canCreateSharedRootFolder.value;
});

const onScroll = async () => {
  await handleScroll(scrollContainer.value);
};

const onToggleCreateFolder = (value: boolean) => {
  showCreateFolder.value = value;
  showBottom.value = !value;
};

const closeSaveSuccess = () => {
  showSaveSuccess.value = false;
  showBottom.value = false;
  emit("success");
};

const goToCloudDrive = () => {
  const contentId = selectFolder.value?.contentId ?? 0;

  showSaveSuccess.value = false;
  showBottom.value = false;
  emit("success");
  router.push({
    path: "/jump-page",
    query: { contentId },
  });
};

watch(
  () => visible.value,
  (value, oldValue) => {
    showBottom.value = value;
    if (value && !oldValue) {
      resetRootState();
    }
  },
  { immediate: true },
);

watch(
  () => selectFolder.value,
  async (value) => {
    if (!value || value.contentId !== 0 || value.isPersonal) {
      canCreateSharedRootFolder.value = false;
      return;
    }

    try {
      const res = await hasCreateSharePermissionApi();
      canCreateSharedRootFolder.value = res.code === 1 ? !!res.data : false;
    } catch (error) {
      console.error("获取共享根目录创建权限失败:", error);
      canCreateSharedRootFolder.value = false;
    }
  },
  { immediate: true },
);

watch(
  [showBottom, showCreateFolder, showSaveSuccess],
  ([bottomVisible, createVisible, saveVisible]) => {
    const containerVisible = bottomVisible || createVisible || saveVisible;
    emit("update:visible", containerVisible);
    if (!containerVisible) {
      selectFolder.value = null;
    }
  },
);
</script>

<style lang="scss" scoped>
.van-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 28px;

  .success-text {
    color: var(--text-primary-color);
    padding: 12px 0 8px;
  }

  .taget-folder {
    font-size: 14px;
    color: var(--text-secondary-color);

    .folder-name {
      color: var(--theme-color);
    }
  }
}

.van-popup__container {
  font-family: Inter;
}

.van-popup__header {
  display: flex;
  align-items: center;
  padding: 16px;
  justify-content: center;
  background-color: var(--subtle-fill-color);

  &-left {
    position: absolute;
    left: 16px;
    color: var(--text-secondary-color);
  }

  &-title {
    color: var(--text-primary-color);
  }
}

.van-popup__content {
  .breadcrumb {
    display: flex;
    align-items: center;
    height: 50px;
    line-height: 50px;
    padding: 0 16px;
    font-size: 14px;
    color: var(--text-secondary-color);
    border-bottom: 1px solid var(--card-border-color);
    max-width: calc(100vw - 16px);
    overflow-x: auto;
    overflow-y: hidden;

    .breadcrumb-item {
      display: flex;
      align-items: center;

      &__name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .active {
      color: var(--text-primary-color);
    }
  }

  .folder-list {
    overflow-y: auto;
    max-height: calc(550px - 100px - 65px - 16px);

    &.showBottomBtn {
      max-height: calc(550px - 100px - 65px - 16px - 82px);
    }

    .empty-wrapper,
    .skeleton-wrapper {
      min-height: 180px;
    }

    .empty-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--text-secondary-color);
      margin-top: 50px;
    }
  }

  .item-select {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--card-border-color);

    &__title {
      margin-left: 8px;
      color: var(--text-primary-color);
      max-width: calc(100vw - 32px - 16px - 16px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.2;
    }
  }
}

.van-popup__bottom {
  width: 100%;
  position: absolute;
  bottom: 0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  padding: 16px;
  gap: 12px;

  .btn {
    width: 50%;
    text-align: center;
    font-size: 16px;
    border-radius: 8px;
    height: 50px;
    line-height: 50px;
  }

  .van-button--new {
    color: var(--theme-color);
    background: var(--content-bg-color);
  }

  .van-button--save {
    color: #fff;
    background: var(--btn-primary-color);
  }
}
</style>
