import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createFolderApi, deleteFileOrDirApi, downloadFileCountApi, renameFileApi, } from "@/api/fileService";
import { cancelTopSpaceApi, exitSpaceApi, getBatchPermissionApi, topSpaceApi } from "@/api/common";
import { checkIsShared, checkNameValidity, getQueryVariable, t } from "@/utils";
import { useDialog } from "@/hooks/useDialog";
import type { ContentType } from "@/types/type";
import { useRouteStackStore, useSetting, useShareFileStore, } from "@/stores";
import { storeToRefs } from "pinia";
import { useFileBelong } from "@/hooks/useFileBelong";
import { type ElInput, ElMessage } from "element-plus";
import { cancelShareApi } from "@/api/share";
import { deleteFileApi, restoreFile } from "@/api/recycleBin";
import { Permission } from "@/enum/permission";
import { getContentId, getId, getIsFolder, getName } from "@/utils/typeUtils";
import { debounce } from "lodash-es";

export function useFileActions(options: {
  onRefresh: () => void;
  onEditDone?: () => void;
  onDuplicateFiles?: (data: Record<number, string>[]) => void;
  clearSelection?: () => void;
}) {
  const router = useRouter();
  const route = useRoute();
  const { fileBelong } = useFileBelong();
  const shareFileStore = useShareFileStore();
  const {
    setShowLinkDialog,
    setShowShareDialog,
    setShowChooseCount,
    setShareList,
  } = shareFileStore;
  const { shareList } = storeToRefs(shareFileStore);
  const routeStackStore = useRouteStackStore();

  const isSubmitting = ref(false);
  const isEdit = ref(false);
  const editingFileName = ref("");
  const inputRef = ref<InstanceType<typeof ElInput> | null>(null);
  const shareSpaceName = ref("");
  const show = ref(false);
  const shareDialogTitle = ref("");
  const isCreating = ref(false);
  const { onRefresh, onEditDone, onDuplicateFiles, clearSelection } = options;
  const tenantId = getQueryVariable("chatTenantId") || sessionStorage.getItem("tenantId") || "";

  // 打开文件夹
  const openFile = async (file: ContentType, isSearchResultPage: boolean = false) => {
    if (file.isUploading) return;
    const isFolder = getIsFolder(file) ?? false;
    const itemContentId = getContentId(file) ?? 0;
    const itemName = getName(file);
    if (isFolder) {
      if (!isSearchResultPage) {
        routeStackStore.pushFolder(
          itemContentId,
          itemName,
          `/folder/${ itemContentId }?contentName=${ encodeURIComponent(itemName) }`
        );
      }

      await router.push({
        name: "Folder",
        params: {
          contentId: itemContentId,
        },
        query: {
          contentName: itemName
        }
      });
    } else {
      await downloadFileCountApi([getContentId(file)!]);
      console.log(JSON.stringify({ type: "13", data: [getContentId(file)], tenantId }));
    }
  };

  const deleteFile = async (file: ContentType) => {
    const contentId = getContentId(file);
    if (!contentId) return;
    const res = await checkIsShared([contentId]);
    const confirmDelete = () => deleteFileOrDirApi([contentId]);

    try {
      await useDialog({
        title: t("deleteFile"),
        content: res.length > 0 ? t("shareDelete") : t("deleteFileWarning"),
        confirmText: t("delete"),
      });
      await confirmDelete();
      ElMessage.success(t("deleteSuccess"));
      onRefresh();
    } catch {
      // cancel
    }
  };

  const handleMultiDelete = debounce(async () => {
    if (shareList.value.length === 0) return;
    const allContentIds = shareList.value.map((item) => getContentId(item)!);

    try {
      const permRes = await getBatchPermissionApi(allContentIds);
      if (permRes.code !== 1) {
        throw new Error('API_ERROR');
      }

      const permissionMap = permRes.data;

      const validFiles: ContentType[] = [];
      const invalidFiles: ContentType[] = [];

      shareList.value.forEach(item => {
        const id = getContentId(item)!;
        const permValue = permissionMap[id];

        if (permValue >= Permission.Edit) {
          validFiles.push(item);
        } else {
          invalidFiles.push(item);
        }
      });

      if (invalidFiles.length > 0) {
        if (invalidFiles.length === shareList.value.length) {
          ElMessage.error(t("noPermissionForAll"))
          return
        }
        const noPermissionFileNames = invalidFiles.map(item => getName(item));
        const errorMsg = t("permissionDeniedList", { files: noPermissionFileNames.join("、 ") });

        await useDialog({
          title: t("deleteFile"),
          content: errorMsg,
          confirmText: t("delete"),
        });
      }

      if (validFiles.length === 0) return;

      const validContentIds = validFiles.map(item => getContentId(item)!);
      const sharedContentIds = (await checkIsShared(validContentIds)) || [];

      const hasShared = validContentIds.some(id => sharedContentIds.includes(id));

      await useDialog({
        title: t("deleteFile"),
        content: hasShared ? t("shareDelete") : t("deleteFileWarning"),
        confirmText: t("delete"),
      });

      const deleteRes = await deleteFileOrDirApi(validContentIds);

      if (deleteRes.code === 1) {
        ElMessage.success(t("deleteSuccess"));
        onRefresh();
      } else {
        throw new Error('API_ERROR');
      }

    } catch (error) {
      console.log(error)
      if (error === 'cancel') return;
      ElMessage.error(t("errorOccurred"));
    }
  }, 300);

  // 置顶文件
  const topFile = async (file: ContentType) => {
    const res = await topSpaceApi(getContentId(file)!);
    if (res.code === 1) {
      ElMessage.success(t("pinSuccess"));
      onRefresh();
    } else {
      ElMessage.error(t("pinFailed"));
    }
  };

  // 取消置顶文件
  const cancelTopFile = async (file: ContentType) => {
    const res = await cancelTopSpaceApi(getContentId(file)!);
    if (res.code === 1) {
      ElMessage.success(t("unpinSuccess"));
      onRefresh();
    } else {
      ElMessage.error(t("unpinFailed"));
    }
  };

  // 下载文件
  const downloadFile = async (file: ContentType) => {
    await downloadFileCountApi([getContentId(file)!]);
    console.log(JSON.stringify({ type: "13", data: [getContentId(file)], tenantId }));
    onRefresh();
  };

  const handleMultiDownload = async () => {
    if (shareList.value.length === 0) return;
    if (shareList.value.every((item) => getIsFolder(item))) {
      ElMessage.warning(t("folderDownloadWarn"));
      return;
    }

    const contentIds = shareList.value
      .filter((item) => !getIsFolder(item))
      .map((item) => getContentId(item)!);
    if (shareList.value.some((item) => getIsFolder(item))) {
      await mutiDownloadFiles(contentIds, t("folderDownloadWarn2"));
    } else {
      await mutiDownloadFiles(contentIds);
    }
  };

  // 批量下载文件
  const mutiDownloadFiles = async (contentIds: number[], message?: string) => {
    await downloadFileCountApi(contentIds);
    console.log(JSON.stringify({ type: "13", data: contentIds, tenantId, message }));
    onRefresh();
  };

  // 重命名文件
  const saveEdit = async (value: ContentType, event?: KeyboardEvent) => {
    try {
      if (isSubmitting.value) return;

      // 处理键盘事件
      if (event) {
        if (event.key === "Escape") {
          onEditDone?.();
          onRefresh();
          return;
        }
        if (event.key !== "Enter") return;
        event.preventDefault();
        isSubmitting.value = true;
      }

      const name = editingFileName.value.trim();

      // 校验文件名合法性
      const { isValid, message } = checkNameValidity(name);
      if (!isValid) {
        ElMessage.error(message);
        isSubmitting.value = false;
        return;
      }

      // 空名处理
      if (!name) {
        await useDialog({
          title: getContentId(value) ? t("renameFailed") : t("newFolderFailed"),
          content: getContentId(value)
            ? t("fileNameRequired")
            : t("folderNameRequired"),
          confirmText: t("Ok"),
        })
          .then(() => inputRef.value?.focus())
          .catch(() => {
            onEditDone?.();
            onRefresh();
          })
          .finally(() => {
            isSubmitting.value = false;
          });
        return;
      }

      // 无改动则直接退出
      if (name === getName(value)) {
        onEditDone?.();
        return;
      }

      // 创建文件夹 or 重命名
      const res = getContentId(value)
        ? await renameFileApi(getContentId(value), name)
        : await createFolderApi({
          folderName: name,
          currentContentId: route.params.contentId,
          isPersonal: fileBelong.value === "mySpace",
          viewRanges: [],
          editRanges: [],
        });

      if (res.code === 1) {
        getContentId(value)
          ? ElMessage.success(t("renameSuccess"))
          : handleSuccess(t("newFolderSuccess"));
        onRefresh();
        isEdit.value = false;
        editingFileName.value = "";
      } else {
        await handleError();
      }
    } catch (error) {
      console.error(error);
      onEditDone?.();
      onRefresh();
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleSuccess = (message: string) => {
    onRefresh();
    ElMessage.success(message);
    onEditDone?.();
  };

  const handleError = async () => {
    try {
      await useDialog({
        title: t("renameFailed"),
        content: t("folderExists"),
        confirmText: t("Ok"),
      });
      inputRef.value?.focus();
      isSubmitting.value = false;
    } catch {
      onEditDone?.();
      onRefresh();
    }
  };

  // 分享文件
  const handleExportFile = async () => {
    await setShowShareDialog();
    onRefresh();
  };

  // 复制链接
  const handleCopyLink = () => {
    setShowLinkDialog(true);
  };

  // 表格多选框选择文件
  const handleSelectionChange = (file: ContentType[]) => {
    if (file.length > 0) {
      setShowChooseCount(true);
    } else {
      setShowChooseCount(false);
    }
    setShareList(file);
  };

  // 取消分享
  const cancelShare = () => {
    const ids = shareList.value
      .map((item) => getId(item))
      .filter((id): id is number => typeof id === "number");
    useDialog({
      title: t("confirmCancelShareAction"),
      content: t("cancelShareWarning"),
      confirmText: t("Ok"),
      cancelText: t("cancel"),
    })
      .then(async () => {
        const res = await cancelShareApi(ids);
        if (res.code === 1) {
          ElMessage.success(t("cancelShareSuccess"));
          onRefresh();
        }
      })
      .catch(() => {
      });
  };

  // 删除回收站文件
  const deletePermanently = (file?: ContentType) => {
    let ids: number[] = [];
    if (file) {
      ids.push(getId(file)!);
    } else {
      ids = shareList.value
        .map((item) => getId(item))
        .filter((id): id is number => typeof id === "number");
    }
    useDialog({
      title: t("hint"),
      content: t("confirmDeletePermanentlyQuestion"),
      cancelText: t("cancel"),
      confirmText: t("Ok"),
    }).then(async () => {
      const res = await deleteFileApi({ ids });
      if (res.code === 1) {
        ElMessage.success(t("deleteSuccess"));
        onRefresh();
      }
    });
  };

  // 还原回收站文件
  const onRestoreFile = async (row: ContentType, type?: number) => {
    let files: { id: number; contentId: number }[] = [];
    if (row) {
      files.push({
        id: getId(row)!,
        contentId: getContentId(row)!,
      });
    } else {
      files = shareList.value.map((item) => ({
        id: getId(item)!,
        contentId: getContentId(item)!,
      }));
    }
    const res = await restoreFile({
      restoreFiles: files,
      repeatFileOperateType: type || 0,
    });
    if (res.code === 1) {
      if (res.data && res.data.length > 0) {
        console.log(res.data);
        onDuplicateFiles?.(res.data);
      } else {
        ElMessage.success(t("operationSuccess"));
        onRefresh();
      }
    }
  };

  // 删除根目录
  const deleteRootFolder = (row: ContentType) => {
    useDialog({
      title: t("deleteRootDir"),
      content: t("deleteRootDirWarning"),
    }).then(async () => {
      if (getContentId(row)) {
        const res = await deleteFileOrDirApi([getContentId(row)!]);
        if (res.code === 1) {
          ElMessage.success(t("deleteSuccess"));
          onRefresh();
          clearSelection?.();
        }
      } else {
        ElMessage.error(t("errorOccurred"));
      }
    });
  };

  // 新建/重命名共享文件夹
  const createSharedFolder = async (spaceName: string, contentId?: number) => {
    const { isValid, message } = checkNameValidity(spaceName);
    if (!isValid) {
      ElMessage.error(message);
      return;
    }

    if (spaceName.trim() === "") {
      ElMessage.error(t("folderNameRequired"));
      return;
    }

    if (shareDialogTitle.value === t("createFolder")) {
      const res = await createFolderApi({
        currentContentId: 0,
        folderName: spaceName,
        viewRanges: [],
        editRanges: [],
        isPersonal: false,
      });
      if (res && res.code === 1) {
        ElMessage.success(t("newFolderSuccess"));
        show.value = false;
        onRefresh();
      } else if (res.code === 701) {
        ElMessage.error(t("duplicateFolderName"));
      }
    } else {
      if (shareSpaceName.value === spaceName) {
        show.value = false;
        return;
      }
      const res = await renameFileApi(contentId, spaceName);
      if (res && res.code === 1) {
        ElMessage.success(t("renameSuccess"));
        show.value = false;
        onRefresh();
      } else if (res.code === 701) {
        ElMessage.error(t("duplicateFolderName"));
      }
    }
  };

  // 退出共享文件夹
  const exitShareSpace = async (folder: ContentType) => {
    try {
      const contentId = "contentId" in folder ? folder.contentId : undefined;
      const permissionType = "permissionType" in folder ? folder.permissionType : undefined;
      if (!contentId || !permissionType) {
        ElMessage.error(t("errorOccurred"));
        return;
      } else {
        if (permissionType === Permission.SuperAdmin) {
          useDialog({
            title: t("exitRootDir"),
            content: t("superAdminTransferWarning"),
            cancelText: t("cancel"),
            confirmText: t("goToTransfer"),
          }).then(async () => {
            useSetting().updateSettingVisible(true);
          });
        } else {
          useDialog({
            title: t("exitRootDir"),
            content: t("exitFolderWarning"),
          })
            .then(async () => {
              const res = await exitSpaceApi(contentId);
              if (res && res.code === 1) {
                ElMessage.success(t("exitSuccess"));
                onRefresh();
                clearSelection?.();
              }
            })
            .catch(() => {
            });
        }
      }
    } catch (e) {
      ElMessage.error(t("errorOccurred"));
    }
  };

  return {
    isCreating,
    isSubmitting,
    isEdit,
    editingFileName,
    inputRef,
    shareSpaceName,
    show,
    shareDialogTitle,
    openFile,
    deleteFile,
    handleMultiDelete,
    topFile,
    cancelTopFile,
    downloadFile,
    handleMultiDownload,
    saveEdit,
    handleExportFile,
    handleCopyLink,
    handleSelectionChange,
    cancelShare,
    deletePermanently,
    onRestoreFile,
    deleteRootFolder,
    createSharedFolder,
    exitShareSpace,
    mutiDownloadFiles,
  };
}
