import { computed, onMounted, ref } from "vue";
import { useEnv } from "./useEnv";
import {
  checkIsHaveFile,
  downloadFileOut,
  downloadShareFileInApp,
  getTimeDifference,
  SessionStorageUtil,
  t,
} from "@/utils";
import { getToken } from "@/utils/auth";
import {
  downloadFileOutApi,
  getShareFolderContentApi,
  getShareLinkContentApi,
  getShareLinkContentWithLoginApi,
} from "@/api/share";
import { useRoute } from "vue-router";
import type { ShareContentCallbackParams } from "@/api/type";
import type { ShareBaseInfo, ShareContentType } from "../types";
import config from "@/hooks/config";
import { showToast } from "vant";
import { getStatusMessage } from "@/utils/httpCode";

const ROOT_BREADCRUMB_ID = -1;

const createRootBreadcrumb = (): ShareContentType => ({
  contentId: ROOT_BREADCRUMB_ID,
  name: t("share"),
  isFolder: true,
  size: 0,
  updateAt: "",
  isDelete: false,
});

export const useShareData = () => {
  const { isClient, isPcClient } = useEnv();
  const route = useRoute();
  const { cloudDriveUploadUrl, ensureConfigReady } = config();

  const shareId = ref<number | null>(null);

  const isHaveFileApp = ref(false);
  const isLoading = ref(true);
  const isExpired = ref(false);
  const showFolderSelect = ref(false);
  const errorMsg = ref("");
  const isInputPsw = ref(false);
  const psw = ref("");

  const shareList = ref<ShareContentType[]>([]);
  const rootFileList = ref<ShareContentType[]>([]);
  const fileList = ref<ShareContentType[]>([]);
  const selectedFiles = ref<ShareContentType[]>([]);
  const isTopFolder = ref(true);
  const breadcrumbList = ref<ShareContentType[]>([createRootBreadcrumb()]);

  const shareBaseInfo = ref<ShareBaseInfo>({
    avatarId: "",
    sharePersonName: "",
    shareTime: "",
    originShareCount: 0,
    expireTimeText: "",
  });

  const shareKey = computed(() => route.query.shareKey as string);
  const isAnonymous = computed(() => !!getToken());

  const applyShareBaseInfo = (content: ShareContentCallbackParams) => {
    shareBaseInfo.value = {
      avatarId: content.avatar || "",
      sharePersonName: content.userName || "",
      shareTime: content.shareTime || "",
      originShareCount: content.contents?.length || 0,
      expireTimeText: "",
    };

    if (content.expiredType === 5) {
      shareBaseInfo.value.expireTimeText = t("permanent");
      return;
    }

    const { days, hours } = getTimeDifference(content.expiredTime);
    if (days === 0) {
      shareBaseInfo.value.expireTimeText = t("hoursToExpire", {
        count: hours,
      });
      return;
    }

    shareBaseInfo.value.expireTimeText = t("dayHoursToExpire", {
      count: days,
      hours,
    });
  };

  const getShareContent = async (
    password?: string | null,
  ): Promise<ShareContentCallbackParams | undefined> => {
    try {
      const response = isAnonymous.value
        ? await getShareLinkContentWithLoginApi(
            shareKey.value,
            password ?? undefined,
          )
        : await getShareLinkContentApi(shareKey.value, password ?? undefined);

      if (response.code !== 1) {
        isExpired.value = true;
        errorMsg.value = getStatusMessage(response.code);
        return;
      }

      isExpired.value = false;
      errorMsg.value = "";
      return response.data;
    } catch (error) {
      console.error("Error fetching share content:", error);
    }
  };

  const resetSelectionForCurrentList = () => {
    selectedFiles.value = fileList.value.length > 0 ? [...fileList.value] : [];
  };

  const resetToRoot = () => {
    fileList.value = [...rootFileList.value];
    breadcrumbList.value = [createRootBreadcrumb()];
    isTopFolder.value = true;
    resetSelectionForCurrentList();
  };

  const handleExtractFile = async () => {
    const content = await getShareContent(psw.value);
    if (!content) return;

    if (content.needPassword) {
      showToast({ type: "fail", message: t("wrongPassword") });
      return;
    }

    SessionStorageUtil.set(`share_pwd_${shareKey.value}`, psw.value);
    isInputPsw.value = true;
    shareId.value = content.shareId;
    shareList.value = content.contents || [];
    rootFileList.value = [...shareList.value];
    applyShareBaseInfo(content);
    resetToRoot();
  };

  const selectAll = () => {
    if (selectedFiles.value.length === fileList.value.length) {
      selectedFiles.value = [];
    } else {
      selectedFiles.value = [...fileList.value];
    }
  };

  const chooseFile = (item: ShareContentType) => {
    if (selectedFiles.value.some((file) => file.contentId === item.contentId)) {
      selectedFiles.value = selectedFiles.value.filter(
        (file) => file.contentId !== item.contentId,
      );
    } else {
      selectedFiles.value = [...selectedFiles.value, item];
    }
  };

  const openFolder = async (item: ShareContentType, fromBreadcrumb = false) => {
    const res = await getShareFolderContentApi(item.contentId);
    if (res.code !== 1) return;

    isTopFolder.value = false;

    if (fromBreadcrumb) {
      const index = breadcrumbList.value.findIndex(
        (breadcrumb) => breadcrumb.contentId === item.contentId,
      );
      if (index !== -1) {
        breadcrumbList.value = breadcrumbList.value.slice(0, index + 1);
      }
    } else {
      const lastBreadcrumb =
        breadcrumbList.value[breadcrumbList.value.length - 1];
      if (lastBreadcrumb?.contentId !== item.contentId) {
        breadcrumbList.value.push(item);
      }
    }

    fileList.value = res.data.map((folderItem) => ({
      contentId: folderItem.contentId,
      name: folderItem.contentName,
      isFolder: folderItem.isFolder,
      size: folderItem.contentSize,
      updateAt: folderItem.operateTime,
      isDelete: false,
    }));

    resetSelectionForCurrentList();
  };

  const handleItemClick = async (item: ShareContentType) => {
    if (item.isFolder) {
      await openFolder(item);
    } else {
      chooseFile(item);
    }
  };

  const handleBreadcrumbClick = async (item: ShareContentType) => {
    if (item.contentId === ROOT_BREADCRUMB_ID) {
      resetToRoot();
      return;
    }

    await openFolder(item, true);
  };

  const downloadFiles = async (items: ShareContentType[]) => {
    if (!cloudDriveUploadUrl.value) {
      await ensureConfigReady();
    }

    if (items.length === 0) {
      showToast({ type: "fail", message: t("selectFile") });
      return;
    }

    const contentIds = items
      .filter((item) => !item.isFolder)
      .map((item) => item.contentId);

    if (contentIds.length === 0) {
      showToast({ type: "fail", message: t("noDownloadableFiles") });
      return;
    }

    if (!shareId.value) return;

    if (isClient.value && isHaveFileApp.value) {
      if (isPcClient.value) {
        console.log(
          JSON.stringify({
            type: "12",
            data: { contentIds: contentIds, shareId: shareId.value },
            openAfterDownload: true,
          }),
        );
        return;
      }
      const res = await downloadFileOutApi(shareId.value, contentIds);
      if (res.code !== 1) return;

      const files = res.data.map((item) => ({
        fileName: item.fileName,
        filePath:
          cloudDriveUploadUrl.value +
          `/api/file/download/clouddrive?fileid=${item.fileId}`,
        fileSize: item.size,
        sn: item.aesKey,
      }));

      downloadShareFileInApp(JSON.stringify(files), true);
      return;
    }

    await downloadFileOut(shareId.value, contentIds);
  };

  const onDownload = async () => {
    await downloadFiles(selectedFiles.value);
  };

  const handleFileDownload = async (item: ShareContentType) => {
    await downloadFiles([item]);
  };

  const saveToCloudDriver = () => {
    if (selectedFiles.value.length === 0) {
      showToast({ type: "fail", message: t("selectFile") });
      return;
    }

    showFolderSelect.value = true;
  };

  const handleSaveSuccess = () => {
    showFolderSelect.value = false;
  };

  onMounted(async () => {
    try {
      await ensureConfigReady();
      if (isClient.value) {
        isHaveFileApp.value = await checkIsHaveFile();
      }

      const cachedPassword = SessionStorageUtil.get<string>(
        `share_pwd_${shareKey.value}`,
      );

      const res = await getShareContent(cachedPassword);

      if (res) {
        applyShareBaseInfo(res);

        if (!res.needPassword) {
          isInputPsw.value = true;
          shareId.value = res.shareId;
          shareList.value = res.contents || [];
          rootFileList.value = [...shareList.value];
          resetToRoot();
        }
      } else {
        isExpired.value = true;
      }
    } finally {
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }
  });

  return {
    shareId,
    isLoading,
    isExpired,
    errorMsg,
    isInputPsw,
    psw,
    shareBaseInfo,
    shareList,
    fileList,
    selectedFiles,
    breadcrumbList,
    isTopFolder,
    isHaveFileApp,
    isAnonymous,
    shareKey,
    showFolderSelect,
    selectAll,
    chooseFile,
    handleItemClick,
    handleBreadcrumbClick,
    handleExtractFile,
    onDownload,
    handleFileDownload,
    saveToCloudDriver,
    handleSaveSuccess,
    resetToRoot,
    openFolder,
  };
};
