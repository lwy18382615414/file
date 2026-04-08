<template>
  <div class="folder-select-pc">
    <div v-if="showBreadcrumb" ref="breadcrumbContainer" class="breadcrumb">
      <div
        v-for="(item, index) in breadcrumbList"
        :key="getItemKey(item, index)"
        class="breadcrumb-item"
      >
        <span
          class="breadcrumb-item__name"
          :class="{ active: index === breadcrumbList.length - 1 }"
          @click="handleBreadcrumbClick(item)"
        >
          {{ item.name }}
        </span>
        <span
          v-if="index !== breadcrumbList.length - 1"
          class="breadcrumb-item__arrow"
        >
          <SvgIcon name="ic_right" />
        </span>
      </div>
    </div>

    <div ref="scrollContainer" class="folder-list" @scroll.passive="onScroll">
      <template v-if="folderList.length > 0">
        <div
          v-for="(item, index) in folderList"
          :key="getItemKey(item, index)"
          class="folder-item"
          @click="handleSelectFolder(item)"
        >
          <div class="folder-item__info">
            <SvgIcon name="file-folder" size="30" />
            <span class="folder-item__name">{{ item.name }}</span>
          </div>
          <SvgIcon name="ic_right" size="16" color="#B7BDC8" />
        </div>
      </template>
      <div v-else-if="loading" class="skeleton-wrapper">
        <FileListSkeleton :count="10" />
      </div>
      <EmptyState v-else />
    </div>

    <div class="btn-box">
      <el-button
        :disabled="!canCreateFolder"
        class="create-folder-btn"
        @click="showCreateFolder = true"
      >
        <SvgIcon
          name="share-add"
          :color="canCreateFolder ? '' : '#fff'"
          style="margin-right: 8px"
        />
        {{ t("createFolder") }}
      </el-button>

      <div class="btn-box__right">
        <el-button class="cancel-btn" @click="emit('cancelSelect')">
          {{ t("cancel") }}
        </el-button>
        <el-button
          :disabled="!canConfirmFolder"
          class="confirm-btn"
          type="primary"
          @click="handleConfirm"
        >
          {{ t("Ok") }}
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="showCreateFolder"
      :title="t('createFolder')"
      width="400px"
      align-center
      destroy-on-close
    >
      <el-input
        v-model.trim="newFolderName"
        maxlength="100"
        :placeholder="t('inputFolderName')"
        @keyup.enter="handleCreateFolder"
      />
      <template #footer>
        <el-button @click="handleCancelCreate">{{ t("cancel") }}</el-button>
        <el-button
          type="primary"
          :disabled="!newFolderName"
          @click="handleCreateFolder"
        >
          {{ t("Ok") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, toRefs, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import SvgIcon from "@/components/SvgIcon.vue";
import FileListSkeleton from "@/views/h5/Components/FileListSkeleton.vue";
import {
  useShareFolderSelect,
  type SelectFolder,
} from "@/hooks/useShareFolderSelect";
import type { ShareContentType } from "@/views/share/types";
import { createFolderApi } from "@/api/fileService";
import { checkNameValidity, t } from "@/utils";
import { EmptyState } from "@/components";

const props = withDefaults(
  defineProps<{
    selectedFiles: ShareContentType[];
    shareId: number | null;
    isSaveBtnDisabled?: boolean;
  }>(),
  {
    selectedFiles: () => [],
    shareId: null,
    isSaveBtnDisabled: false,
  },
);

const emit = defineEmits<{
  (e: "cancelSelect"): void;
  (
    e: "saveSelect",
    targetFolderName: string,
    targetFolderId: number | null,
  ): void;
  (e: "selectFolder", contentId: number, folderName: string): void;
}>();

const { selectedFiles, shareId } = toRefs(props);
const scrollContainer = ref<HTMLElement | null>(null);
const breadcrumbContainer = ref<HTMLElement | null>(null);
const showCreateFolder = ref(false);
const newFolderName = ref("");

const {
  loading,
  folderList,
  breadcrumbList,
  selectFolder,
  showBreadcrumb,
  isSharedRootFolder,
  getItemKey,
  resetRootState,
  getFolderList,
  onClickBreadcrumb,
  refreshCurrentFolder,
  onScroll: handleScroll,
} = useShareFolderSelect({
  selectedFiles,
  shareId,
});

const canCreateFolder = computed(
  () => !!selectFolder.value && !isSharedRootFolder.value,
);
const canConfirmFolder = computed(
  () =>
    !!selectFolder.value &&
    !isSharedRootFolder.value &&
    !props.isSaveBtnDisabled,
);

const onScroll = async () => {
  await handleScroll(scrollContainer.value);
};

const handleSelectFolder = async (item: SelectFolder) => {
  emit("selectFolder", item.contentId ?? 0, item.name);
  await getFolderList(item);
};

const handleBreadcrumbClick = async (item: SelectFolder) => {
  await onClickBreadcrumb(item);
};

const handleCancelCreate = () => {
  showCreateFolder.value = false;
  newFolderName.value = "";
};

const handleCreateFolder = async () => {
  if (!selectFolder.value) return;
  if (!newFolderName.value) return;

  const { isValid, message } = checkNameValidity(newFolderName.value);
  if (!isValid) {
    ElMessage.error(message);
    return;
  }

  const res = await createFolderApi({
    currentContentId: selectFolder.value.contentId ?? 0,
    viewRanges: [],
    editRanges: [],
    folderName: newFolderName.value,
    isPersonal: selectFolder.value.isPersonal,
  });

  if (res.code === 1) {
    handleCancelCreate();
    await refreshCurrentFolder();
    return;
  }

  if (res.code === 701) {
    await ElMessageBox.alert(t("folderAlreadyExists"), t("hint"), {
      confirmButtonText: t("Ok"),
    });
    return;
  }

  if (res.code === 1109 || res.code === 702) {
    await ElMessageBox.alert(t("noEditPermission"), t("hint"), {
      confirmButtonText: t("Ok"),
    });
    return;
  }

  ElMessage.error(t("errorOccurred"));
};

const handleConfirm = () => {
  if (!canConfirmFolder.value || !selectFolder.value) return;
  emit(
    "saveSelect",
    selectFolder.value.name,
    selectFolder.value.contentId ?? 0,
  );
};

watch(
  () =>
    breadcrumbList.value
      .map(
        (item) => `${item.contentId ?? "root"}-${item.name}-${item.isPersonal}`,
      )
      .join("|"),
  async () => {
    await nextTick();
    const container = breadcrumbContainer.value;
    if (!container) return;
    container.scrollTo({
      left: container.scrollWidth,
      behavior: "smooth",
    });
  },
  { flush: "post" },
);

onMounted(() => {
  resetRootState();
});
</script>

<style lang="scss" scoped>
.folder-select-pc {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.breadcrumb {
  display: flex;
  align-items: center;
  height: 50px;
  line-height: 50px;
  padding: 0 16px;
  font-size: 14px;
  color: #747683;
  border-bottom: 1px solid #f2f4f7;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;

    &__name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    &__arrow {
      margin: 0 4px;
      display: inline-flex;
      align-items: center;
    }
  }

  .active {
    color: #2d2d2d;
  }
}

.folder-list {
  flex: 1;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f2f4f7;
  cursor: pointer;

  &__info {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__name {
    margin-left: 8px;
    color: #2d2d2d;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
  flex: 1;
  margin-top: 50px;
}

.empty-text {
  font-size: 14px;
  color: #747683;
}

.btn-box {
  background: #fff;
  border-top: 1px solid #e0e4eb;
  padding: 15px 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .el-button + .el-button {
    margin-left: 0;
  }
}

.create-folder-btn,
.cancel-btn {
  background: #f2f6fe;
  border: none;
  color: #327edc;

  &.is-disabled {
    background: #b7b7b7;
    color: #fff;
    border: 1px solid #b7b7b7;
  }
}

.confirm-btn {
  border: none;
  background: #327edc;
  color: #fff;
  font-weight: 700;

  &.is-disabled {
    background: #b7b7b7;
    color: #fff;
    border: 1px solid #b7b7b7;
  }
}
</style>
