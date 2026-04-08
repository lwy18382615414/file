<template>
  <div class="file-select-page">
    <template v-if="isPcClient"></template>

    <template v-else-if="isMobileApp">
      <div class="page-content">
        <div ref="breadcrumbContainer" v-if="showBreadcrumb" class="breadcrumb">
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
          :class="{ showBottomBtn: showBottomActions }"
          @scroll.passive="onScroll"
        >
          <template v-if="folderList.length > 0">
            <div
              v-for="(item, index) in folderList"
              :key="getItemKey(item, index)"
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

      <div v-if="showBottomActions" class="page-bottom">
        <div class="btn btn-secondary" @click="showCreateFolder = true">
          {{ t("createFolder") }}
        </div>
        <van-uploader
          v-if="type === CloudDriveH5Enum.FromInput"
          class="btn btn-primary uploader-btn"
          :after-read="afterRead"
          :before-read="beforeRead"
          accept="*"
          multiple
        >
          {{ t("upload") }}
        </van-uploader>
        <div v-else class="btn btn-primary" @click="handleSave">
          {{ t("save") }}
        </div>
      </div>
    </template>
  </div>

  <CreateFolderComponent
    :visible="showCreateFolder"
    :choose-folder="currentFolder"
    @update:visible="onToggleCreateFolder"
    @confirm="refreshCurrentFolder"
  />

  <RepeatFilePopup
    :allFileList="allFileList"
    :contentId="targetContentId"
    :duplicateList="duplicateList"
    :isTransfer="true"
    :show="showRepeatFile"
    @saveSuccess="saveSuccess"
    @update:show="showRepeatFile = $event"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  closeToast,
  showLoadingToast,
  showToast,
  type UploaderFileListItem,
} from "vant";
import {
  t,
  checkIsHaveFile,
  closeFileSelectBottomSheet,
  checkFileSize,
  handleFileSave,
  h5CallAppShare,
} from "@/utils";
import { useShareFolderSelect } from "@/hooks/useShareFolderSelect";
import { CloudDriveH5Enum } from "@/enum/baseEnum";
import type { ShareContentType } from "@/views/share/types";
import type { TransFileInfo } from "@/types/type";
import type { EncryptedFileType } from "@/views/h5/MainView/type";
import type { Task } from "@/stores/modules/upload";
import { SvgIcon } from "@/components";
import FileListSkeleton from "@/views/h5/Components/FileListSkeleton.vue";
import CreateFolderComponent from "@/views/share/components/mobile/CreateFolderPopup.vue";
import RepeatFilePopup from "@/views/h5/Layout/components/RepeatFilePopup.vue";
import { getTransferFileInfoApi, uploadFileStep2Api } from "@/api/fileService";
import { shareContentByChatApi } from "@/api/share";
import {
  exportKey,
  generateKey,
  handleFileEncryption,
} from "@/utils/upload/encrypt";
import { startUploadTask } from "@/utils/upload/uploadManager";
import { useEnv } from "./share/hooks/useEnv";

interface TransferUploadFileInfo extends Task {}
interface ShareTransferResult {
  code: number;
  data: unknown;
}
interface UploadTransferResult {
  code: number;
  data: Task[];
}

const { isPcClient, isMobileApp } = useEnv();

const route = useRoute();
const breadcrumbContainer = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const showCreateFolder = ref(false);
const showRepeatFile = ref(false);
const duplicateList = ref<Record<number, string>[]>([]);
const allFileList = ref<Task[]>([]);
const shareId = ref<number | null>(null);
let controller = new AbortController();

const type = computed(
  () => Number(route.query.type) || CloudDriveH5Enum.FromChat,
);

const fileInfo = computed<TransFileInfo[]>(() => {
  const fileInfoQuery = route.query.fileInfo;
  if (typeof fileInfoQuery === "string") {
    try {
      return JSON.parse(fileInfoQuery) as TransFileInfo[];
    } catch (error) {
      console.log(error);
    }
  }
  return [];
});

const selectedFiles = computed<ShareContentType[]>(() =>
  fileInfo.value.map((item, index) => ({
    contentId: -(index + 1),
    name: item.fileName,
    isFolder: false,
    size: item.fileSize,
    updateAt: "",
    isDelete: false,
  })),
);

const {
  loading,
  folderList,
  breadcrumbList,
  selectFolder,
  currentFolder,
  showBreadcrumb,
  showBottomActions,
  // selectedFilesCountText,
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

// const titleText = computed(() => {
//   const chatTypeMap: Record<number, string> = {
//     0: t("saveToCloud"),
//     1: t("uploadToCloud"),
//     2: t("transferToCloud"),
//   };
//   return chatTypeMap[type.value] || t("saveToCloud");
// });

const targetContentId = computed(() => selectFolder.value?.contentId ?? 0);

const isTransferFileMatch = (
  item: unknown,
): item is { fileUrl: string; fileId?: string; aesKey?: string } => {
  return !!item && typeof item === "object" && "fileUrl" in item;
};

const isValidUploaderItem = (
  item: UploaderFileListItem,
): item is UploaderFileListItem & { file: File } => {
  return !!item.file;
};

const closePage = () => {
  closeFileSelectBottomSheet();
};

const ensureCanOperate = async () => {
  const canSelect = await checkIsHaveFile();
  if (canSelect) return true;

  showToast({ type: "fail", message: t("fileStopped") });
  closePage();
  return false;
};

const getTransferFileInfos = (
  transferData: unknown[],
): TransferUploadFileInfo[] => {
  return fileInfo.value.map((item) => {
    const transferFile = transferData.find(
      (value) => isTransferFileMatch(value) && value.fileUrl === item.fileUrl,
    );

    return {
      name: item.fileName,
      fileId: isTransferFileMatch(transferFile)
        ? transferFile.fileId || ""
        : "",
      size: item.fileSize,
      aesKey: isTransferFileMatch(transferFile)
        ? transferFile.aesKey
        : undefined,
    };
  });
};

const onScroll = async () => {
  await handleScroll(scrollContainer.value);
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

const onToggleCreateFolder = (value: boolean) => {
  showCreateFolder.value = value;
};

const saveSuccess = () => {
  handleFileSave(true, t("fileSaveSuccess"));
};

const getTransferFiles = async (contentId: number) => {
  try {
    const transferStorageFiles = await Promise.all(
      fileInfo.value.map(async (item) => ({
        fileId: item.fileId,
        fileUrl: item.fileUrl,
        aesKey: await exportKey(await generateKey()),
      })),
    );

    const res = await getTransferFileInfoApi({ transferStorageFiles });
    if (res.code !== 1) {
      handleFileSave(false, t("errorOccurred"));
      return;
    }

    const transferFileInfos = getTransferFileInfos(
      Array.isArray(res.data) ? res.data : [],
    );

    const uploadRes: ShareTransferResult | UploadTransferResult =
      type.value === CloudDriveH5Enum.TransferSource
        ? await shareContentByChatApi({
            fileInfos: transferFileInfos,
            contentId,
          })
        : await uploadFileStep2Api({
            fileInfos: transferFileInfos,
            contentId,
            repeatFileOperateType: 0,
            viewRanges: [],
            editRanges: [],
          });

    if (uploadRes.code === 1) {
      if (!Array.isArray(uploadRes.data)) {
        h5CallAppShare(JSON.stringify(uploadRes.data), 1);
      } else if (!uploadRes.data.length) {
        handleFileSave(true, t("fileSaveSuccess"));
      } else {
        showRepeatFile.value = true;
        duplicateList.value = uploadRes.data.map((item) => ({
          [item.fileId]: item.name,
        }));
        allFileList.value = transferFileInfos;
      }
    } else if (uploadRes.code === 710) {
      handleFileSave(false, t("ConcurrentConflict"));
    } else {
      handleFileSave(false, t("errorOccurred"));
    }
  } catch (error) {
    console.error("处理文件转存时出错:", error);
    handleFileSave(false, t("errorOccurred"));
  } finally {
    closeToast();
  }
};

const handleSave = async () => {
  if (!(await ensureCanOperate())) return;

  showLoadingToast({
    duration: 0,
    forbidClick: true,
  });
  await getTransferFiles(targetContentId.value);
};

async function beforeRead(
  file: File | File[],
): Promise<File | File[] | undefined> {
  if (!(await ensureCanOperate())) return undefined;

  try {
    const files = Array.isArray(file) ? file : [file];
    const validFiles = files.filter((item) => !checkFileSize(item));

    if (validFiles.length === 0) {
      showToast(t("fileSizeLimit"));
      return undefined;
    }

    if (validFiles.length < files.length) {
      showToast(t("fileSizeLimit"));
    }

    showLoadingToast({
      duration: 0,
      forbidClick: true,
      message: t("uploading"),
    });

    return Array.isArray(file) ? validFiles : validFiles[0];
  } catch (error) {
    console.error(error);
    showToast({ message: t("errorOccurred"), type: "fail" });
    return undefined;
  }
}

async function afterRead(
  fileInfos: UploaderFileListItem | UploaderFileListItem[],
) {
  try {
    let encryptedFile: EncryptedFileType[];

    if (Array.isArray(fileInfos)) {
      const files = fileInfos
        .filter(isValidUploaderItem)
        .map((item) => item.file);
      encryptedFile = await handleFileEncryption(files, controller.signal);
    } else if (isValidUploaderItem(fileInfos)) {
      encryptedFile = await handleFileEncryption(
        [fileInfos.file],
        controller.signal,
      );
    } else {
      encryptedFile = [];
    }

    startUploadTask({
      isByChat: true,
      files: encryptedFile.map((item) => item.file),
      encryptKeys: encryptedFile.map((item) => ({
        name: item.name,
        aesKey: item.key,
      })),
      contentId: targetContentId.value,
      completeAllTasks(data: unknown) {
        closeToast();
        h5CallAppShare(JSON.stringify(data), 1);
      },
      uploadError() {
        showToast(t("errorOccurred"));
      },
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      error.message === "__ENCRYPT_ABORTED__"
    ) {
      return;
    }
    console.error("批量加密失败", error);
    showToast(t("operationFailedRetry"));
  } finally {
    closeToast();
  }
}

onMounted(() => {
  resetRootState();
});

onUnmounted(() => {
  controller.abort();
});
</script>

<style lang="scss" scoped>
.file-select-page {
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 10px 16px;

  .page-title {
    line-height: 150%;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    font-weight: bold;
    color: #2d2d2d;
  }
}

.page-content {
  flex: 1;
  overflow: hidden;
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
    color: #2d2d2d;
  }
}

.folder-list {
  overflow-y: auto;
  height: calc(100% - 50px);

  &.showBottomBtn {
    height: calc(100% - 50px);
  }
}

.item-select {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f2f4f7;

  &__title {
    margin-left: 8px;
    color: #2d2d2d;
    max-width: calc(100vw - 32px - 16px - 16px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
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
  font-size: 14px;
  color: #747683;
  margin-top: 50px;
}

.page-bottom {
  width: 100%;
  background: #fff;
  display: flex;
  justify-content: space-between;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid #e0e4eb;

  .btn {
    width: 50%;
    text-align: center;
    font-size: 16px;
    border-radius: 8px;
    height: 50px;
    line-height: 50px;
  }

  .btn-secondary {
    color: #5665bb;
    background: #f3f4f6;
  }

  .btn-primary {
    color: #fff;
    background: #5665bb;
  }

  .uploader-btn :deep(.van-uploader__wrapper) {
    display: block;
  }

  .uploader-btn :deep(.van-uploader__input-wrapper) {
    display: block;
    color: inherit;
  }
}
</style>
