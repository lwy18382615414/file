<template>
  <div
    class="van-popup__container"
    :class="{ 'full-height': isFolderSelectPage }"
  >
    <div v-if="!isFolderSelectPage" class="van-popup__header">
      <div
        class="van-popup__header-left"
        @click="emit('update:visible', false)"
      >
        {{ t("cancel") }}
      </div>
      <div class="van-popup__header-title">{{ t("saveToCloud") }}</div>
    </div>
    <div
      class="van-popup__content"
      :style="{ marginTop: isFolderSelectPage ? '0' : '16px' }"
    >
      <div v-if="!isFolderSelectPage" class="item-select">
        <SvgIcon name="selected-folder" size="30" />
        <div class="item-select__title">
          {{
            t("selectedDocumentsCount", { count: selectedFiles.length })
          }}
        </div>
      </div>
      <div v-if="breadcrumbList.length > 1" class="breadcrumb">
        <div
          v-for="(item, index) in breadcrumbList"
          :key="index"
          class="breadcrumb-item"
        >
          <span
            :class="{ active: index === breadcrumbList.length - 1 }"
            class="breadcrumb-item__name"
            @click="onClickBreadcrumb(item)"
            >{{ item.name }}</span
          >
          <span v-if="index !== breadcrumbList.length - 1">
            <SvgIcon name="ic_right" />
          </span>
        </div>
      </div>
      <div
        ref="scrollContainer"
        class="folder-list"
        :class="{
          'full-list': isFolderSelectPage,
          showBottomBtn:
            breadcrumbList.length > 1 && selectFolder?.contentId !== 'shared',
        }"
        @scroll.passive="onScroll"
      >
        <template v-if="folderList.length > 0">
          <div
            v-for="item in folderList"
            :key="item.contentId"
            class="item-select"
            @click="getFolderList(item)"
          >
            <SvgIcon name="file-folder" size="30" />
            <div class="item-select__title">{{ item.name }}</div>
          </div>
        </template>
        <div v-else-if="folderList.length === 0 && loading">
          <FileListSkeleton :count="10" />
        </div>
        <div v-else class="empty-wrapper">
          <SvgIcon name="empty-folder" size="106" />
          <div class="item-select__title">{{ t("noFolder") }}</div>
        </div>
      </div>
    </div>
    <div
      v-if="breadcrumbList.length > 1 && selectFolder?.contentId !== 'shared'"
      class="van-popup__bottom"
    >
      <div class="btn van-button--new" @click="onShow">
        {{ t("createFolder") }}
      </div>
      <div
        v-if="saveType !== CloudDriveH5Enum.FromInput"
        class="btn van-button--save"
        @click="saveToCloudDrive"
      >
        {{ t("save") }}
      </div>
      <!-- 自定义按钮 -->
      <!--      <div-->
      <!--        v-else-->
      <!--        class="btn van-button&#45;&#45;save"-->
      <!--        @click="handleSelectFiles"-->
      <!--      >-->
      <!--        {{ t("upload") }}-->
      <!--      </div>-->
      <van-uploader
        v-else
        ref="uploader"
        class="btn van-button--save"
        :after-read="afterRead"
        :before-read="beforeRead"
        accept="*"
        multiple
      >
        {{ t("upload") }}
      </van-uploader>
    </div>
  </div>

  <RepeatFilePopup
    :allFileList="allFileList"
    :contentId="newContentId"
    :duplicateList="duplicateList"
    :isTransfer="true"
    :show="showRepeatFile"
    @saveSuccess="saveSuccess"
    @update:show="showRepeatFile = $event"
  />
</template>

<script lang="ts" setup>
import { computed, inject, type PropType, reactive, type Ref, ref } from "vue";
import {
  checkFileSize,
  handleFileSave,
  hasPermission,
  t,
  h5CallAppShare,
  checkIsHaveFile,
  closeFileSelectBottomSheet,
} from "@/utils";
import type { TypeContent } from "@/views/pc/SharePage/type";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getShareSpace } from "@/api/shareSpace";
import { Permission } from "@/enum/permission";
import { useRoute } from "vue-router";
import type { ISelectFolder } from "../type";
import { usePermissionGuard } from "@/hooks/composable/usePermissionGuard";
import { saveToCloudDriveApi, shareContentByChatApi } from "@/api/share";
import { debounce } from "lodash-es";
import { exportKey, generateKey } from "@/utils/upload/encrypt";
import { handleFileEncryption } from "@/utils/upload/encrypt";
import { getTransferFileInfoApi, uploadFileStep2Api } from "@/api/fileService";
import RepeatFilePopup from "@/views/h5/Layout/components/RepeatFilePopup.vue";
import type { Task } from "@/stores";
import FileListSkeleton from "@/views/h5/Components/FileListSkeleton.vue";
import type { TransFileInfo } from "@/types/type";
import { CloudDriveH5Enum } from "@/enum/baseEnum";
import { closeToast, showLoadingToast, type UploaderFileListItem } from "vant";
import type { EncryptedFileType } from "@/views/h5/MainView/type";
import { startUploadTask } from "@/utils/upload/uploadManager";
import { onUnmounted } from "vue";

const props = defineProps({
  fileInfo: {
    type: Array as PropType<Array<TransFileInfo>>,
    default: () => [],
  },
  saveType: {
    type: Number as PropType<CloudDriveH5Enum>,
    default: 0,
  },
});

const route = useRoute();

const emit = defineEmits([
  "update:visible",
  "showCreatPop",
  "setChooseFolder",
  "refresh",
]);

const selectedFiles = inject<Ref<TypeContent[]>>("selectedFiles", ref([]));
const shareId = inject<Ref<number>>("shareId", ref(0));

const { runPermissionGuard } = usePermissionGuard();
const folderList = ref<Record<string, any>>([
  { contentId: "myFiles", name: t("myFiles"), isPersonal: true },
  { contentId: "shared", name: t("shared"), isPersonal: false },
]);

const breadcrumbList = ref<ISelectFolder[]>([
  {
    contentId: null,
    name: t("cloudDrive"),
    isPersonal: true,
  },
]);
const selectFolder = ref<ISelectFolder | null>();
const initState = {
  page: 1,
  pageSize: 10,
  total: 0,
  hasMore: true,
};
const state = reactive({ ...initState });
const scrollContainer = ref<HTMLElement | null>(null);
const showRepeatFile = ref(false);
const duplicateList = ref<Record<number, string>[]>([]);
const allFileList = ref<Array<Task>>([]);
const loading = ref(false);
const uploader = ref();
let controller = new AbortController();

const isFolderSelectPage = computed(() => route.path === "/file-select");

const newContentId = computed(() => {
  return selectFolder.value?.contentId === "myFiles"
    ? 0
    : Number(selectFolder.value?.contentId);
});

console.log("客户端传递的数据", props.fileInfo);

const closeFileSelect = () => {
  showToast({
    type: "fail",
    message: t("fileStopped"),
  });
  setTimeout(() => {
    closeFileSelectBottomSheet();
  }, 1000);
};

const getFolderList = async ({
  contentId,
  isPersonal,
  name,
}: ISelectFolder) => {
  selectFolder.value = {
    contentId,
    name,
    isPersonal,
  };
  emit("setChooseFolder", selectFolder.value);

  const findBreadcrumb = breadcrumbList.value.find(
    (item) => item.contentId === contentId,
  );
  if (!findBreadcrumb) {
    breadcrumbList.value.push({
      contentId,
      name,
      isPersonal,
    });
  } else {
    const index = breadcrumbList.value.findIndex(
      (item) => item.contentId === contentId,
    );
    breadcrumbList.value.splice(index + 1, breadcrumbList.value.length);
  }

  folderList.value = [];
  Object.assign(state, initState);

  const apiFunc = isPersonal ? getMySpaceContentApi : getShareSpace;

  try {
    loading.value = true;
    const newContentId = typeof contentId === "string" ? 0 : contentId;

    const res = await apiFunc({
      ContentId: newContentId!,
      ContentType: 1,
      PageIndex: state.page,
      PageSize: state.pageSize,
    });
    if (res.code !== 1) return;
    folderList.value = res.data.data
      .map((item) => ({
        contentId: item.contentId,
        name: item.contentName,
        isPersonal: isPersonal,
        permissionType: item?.permissionType || 0,
      }))
      .filter((f) => hasPermission(f.permissionType, Permission.Upload));
    state.total = res.data.count;
    state.hasMore = state.page * state.pageSize < state.total;
  } catch (error) {
    console.error("Error fetching folder list:", error);
  } finally {
    loading.value = false;
  }
};

const loadMore = async ({ contentId, isPersonal, name }: ISelectFolder) => {
  const apiFunc = isPersonal ? getMySpaceContentApi : getShareSpace;
  try {
    const newContentId = typeof contentId === "string" ? 0 : contentId;
    const res = await apiFunc({
      ContentId: newContentId!,
      ContentType: 1,
      PageIndex: state.page,
      PageSize: state.pageSize,
    });
    if (res.code !== 1) return;
    const newData = res.data.data
      .map((item) => ({
        contentId: item.contentId,
        name: item.contentName,
        isPersonal: isPersonal,
        permissionType: item.permissionType || 0,
      }))
      .filter((f) => hasPermission(f.permissionType, Permission.Upload));
    folderList.value.push(...newData);
    state.hasMore = state.page * state.pageSize < state.total;
  } catch (error) {
    console.error("Error fetching folder list:", error);
  }
};

const onScroll = () => {
  const el = scrollContainer.value;
  if (!el || !state.hasMore) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
  if (isBottom && state.hasMore) {
    state.page += 1;
    loadMore(selectFolder.value!);
  }
};

const onClickBreadcrumb = (item: ISelectFolder) => {
  if (item.contentId === null) {
    folderList.value = [
      { contentId: "myFiles", name: t("myFiles"), isPersonal: true },
      { contentId: "shared", name: t("shared"), isPersonal: false },
    ];
    breadcrumbList.value = [
      { contentId: null, name: t("cloudDrive"), isPersonal: true },
    ];
  } else {
    getFolderList(item);
  }
};

const onShow = () => {
  if (!isFolderSelectPage.value) {
    emit("update:visible", false);
  }
  emit("showCreatPop", true);
};

const saveToCloudDrive = debounce(async () => {
  const canSelect = await checkIsHaveFile();
  if (!canSelect) {
    closeFileSelect();
    return;
  }
  const contentId = selectFolder.value?.contentId;
  const targetContentId = contentId === "myFiles" ? 0 : Number(contentId);

  if (!isFolderSelectPage.value) {
    const contentIds = selectedFiles.value.map((item) => item.contentId);
    await runPermissionGuard({
      contentIds,
      selectedRows: selectedFiles.value,
      request: (ids) =>
        saveToCloudDriveApi({
          contentIds: ids,
          targetContentId: targetContentId || 0,
          ...(shareId.value && shareId.value !== 0
            ? { shareId: shareId.value }
            : {}),
        }),
      showConfirm: (count) => {
        return showConfirmDialog({
          title: t("saveToCloudDrive"),
          message: t("savePermissionWarning", { count }),
          cancelButtonText: t("cancel"),
          confirmButtonText: t("Ok"),
        });
      },
      notifyError(type) {
        if (type === "all-denied") {
          showToast({ message: t("noSavePermission") });
        } else if (type === "unknown") {
          showToast(t("operationFailedRetry"));
        }
      },
      onSuccess: () => {
        emit("refresh");
      },
    });
  } else {
    showLoadingToast({
      duration: 0,
      forbidClick: true,
    });
    await getTransferFiles(newContentId.value);
  }
}, 500);

// 使用Promise.all等待所有map操作完成
const getTransferFiles = async (targetContentId: number) => {
  try {
    const promises = props.fileInfo.map(async (item) => ({
      fileId: item.fileId,
      fileUrl: item.fileUrl,
      aesKey: await exportKey(await generateKey()),
    }));
    const transferStorageFiles = await Promise.all(promises);
    const res = await getTransferFileInfoApi({
      transferStorageFiles,
    });
    if (res.code === 1) {
      const fileInfos = props.fileInfo.map((item) => {
        const transferFile = res.data.find((tf) => tf.fileUrl === item.fileUrl);

        return {
          name: item.fileName,
          fileId: transferFile?.fileId,
          size: item.fileSize,
          aesKey: transferFile?.aesKey,
        };
      });

      console.log(fileInfos);

      let uploadRes: any;

      if (props.saveType === CloudDriveH5Enum.TransferSource) {
        uploadRes = await shareContentByChatApi({
          fileInfos: fileInfos,
          contentId: targetContentId,
        });
      } else {
        uploadRes = await uploadFileStep2Api({
          fileInfos: fileInfos,
          contentId: targetContentId,
          repeatFileOperateType: 0,
          viewRanges: [],
          editRanges: [],
        });
      }

      if (uploadRes.code === 1) {
        if (props.saveType === CloudDriveH5Enum.TransferSource) {
          h5CallAppShare(JSON.stringify(uploadRes.data), 1);
        } else {
          if (!uploadRes.data.length) {
            handleFileSave(true, t("fileSaveSuccess"));
          } else {
            showRepeatFile.value = true;
            duplicateList.value = uploadRes.data as any;
            allFileList.value = fileInfos;
          }
        }
      } else if (uploadRes.code === 710) {
        handleFileSave(false, t("ConcurrentConflict"));
      } else {
        handleFileSave(false, t("errorOccurred"));
      }
    }
  } catch (error) {
    console.error("处理文件转存时出错:", error);
    handleFileSave(false, t("errorOccurred"));
  } finally {
    closeToast();
  }
};

const saveSuccess = () => {
  handleFileSave(true, t("fileSaveSuccess"));
};

async function beforeRead(
  file: File | File[],
): Promise<false | File | File[] | undefined> {
  const canSelect = await checkIsHaveFile();
  if (!canSelect) {
    closeFileSelect();
    return false; // 阻止上传
  }

  try {
    const files = Array.isArray(file) ? file : [file];

    const validFiles = files.filter((f) => !checkFileSize(f));

    if (validFiles.length === 0) {
      showToast(t("fileSizeLimit"));
      return undefined; // 所有文件都超限，阻止上传
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
      const files = fileInfos.map((item) => item.file!);

      encryptedFile = await handleFileEncryption(files, controller.signal);
    } else {
      encryptedFile = await handleFileEncryption(
        [fileInfos.file!],
        controller.signal,
      );
    }

    const contentId = selectFolder.value?.contentId;
    const targetContentId = contentId === "myFiles" ? 0 : Number(contentId);

    startUploadTask({
      isByChat: true,
      files: encryptedFile.map((item) => item.file),
      encryptKeys: encryptedFile.map((item) => ({
        name: item.name,
        aesKey: item.key,
      })),
      contentId: targetContentId,
      completeAllTasks(data: any) {
        closeToast();
        h5CallAppShare(JSON.stringify(data), 1);
      },
      uploadError() {
        showToast(t("errorOccurred"));
      },
    });
  } catch (err: any) {
    console.log(err);
    if (err?.message === "__ENCRYPT_ABORTED__") return;
    console.error("批量加密失败", err);
    showToast(t("operationFailedRetry"));
  } finally {
    closeToast();
  }
}

defineExpose({
  getFolderList,
});

onUnmounted(() => {
  controller?.abort();
});
</script>

<style lang="scss" scoped>
.van-popup__container {
  font-family: PingFang SC;

  &.full-height {
    height: 100vh;
  }
}

.van-popup__header {
  display: flex;
  align-items: center;
  padding: 16px;
  justify-content: center;
  background-color: #ebeff6;

  &-left {
    position: absolute;
    left: 16px;
    color: #747683;
  }

  &-title {
    color: #2d2d2d;
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
    color: #747683;
    border-bottom: 1px solid #f2f4f7;
    max-width: calc(100vw - 16px);
    overflow-x: auto;
    overflow-y: hidden;

    .breadcrumb-item {
      display: flex;
      align-items: center;
      cursor: pointer;

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
    max-height: calc(550px - 100px - 65px - 16px);

    &.full-list {
      max-height: calc(100vh - 50px);
    }

    &.showBottomBtn {
      max-height: calc(100vh - 50px - 85px);
    }

    .empty-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 14px;
      color: #747683;
      margin-top: 50px;
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
}

.van-popup__bottom {
  width: 100%;
  position: fixed;
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
    background: #ebeff6;
    cursor: pointer;
  }

  .van-button--new {
    color: #2d2d2d;
  }
  .van-button--save {
    color: #327edc;

    :deep(.van-uploader__wrapper) {
      display: block;
    }
  }
}
</style>
