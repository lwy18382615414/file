import { useRoute, useRouter } from "vue-router";
import type { ContentType } from "@/types/type";
import type { PcFileContextActionKey } from "./usePcFileContextMenu";
import {
  cancelTopSpaceApi,
  getParentFolderContentIdApi,
  topSpaceApi,
} from "@/api/common";
import {
  deleteFileOrDirApi,
  downloadFileApi,
  getDownloadFileIdApi,
} from "@/api/fileService";
import { deleteFileApi, restoreFile } from "@/api/recycleBin";
import { cancelShareApi, generateShareLinkApi } from "@/api/share";
import {
  buildFolderRoute,
  ExplorerPageType,
  getExplorerContext,
} from "@/views/fileExplorer";
import {
  checkCanShare,
  downloadFile,
  downloadInAppFile,
  downloadShareFileInApp,
  h5CallAppShare,
} from "@/utils";
import {
  getContentId,
  getId,
  getIsFolder,
  getIsShare,
  getName,
  getSize,
} from "@/utils/typeUtils";
import { useI18n } from "vue-i18n";
import { useUiFeedback } from "@/hooks/useUiFeedback";

export function useFileActions(options?: {
  onRefresh?: () => void | Promise<void>;
  onRenameDialog?: (item: ContentType) => void;
  onCopyLinkDialog?: (items: ContentType[]) => void;
  onDuplicateFiles?: (data: Record<number, string>[]) => void;
  onAfterAction?: () => void;
}) {
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  const { toast, confirm, isMobileApp, isPcClient } = useUiFeedback();
  const onRefresh = options?.onRefresh;
  const onRenameDialog = options?.onRenameDialog;
  const onCopyLinkDialog = options?.onCopyLinkDialog;
  const onDuplicateFiles = options?.onDuplicateFiles;
  const onAfterAction = options?.onAfterAction;

  // 打开文件夹
  const open = async (item: ContentType) => {
    const context = getExplorerContext(route);

    if (context.pageType === ExplorerPageType.MY_SHARES) {
      await router.push({
        path: "/share-detail",
        state: {
          shareInfo: JSON.stringify(item),
        },
      });
      return;
    }

    if (!getIsFolder(item)) return;

    const contentId = getContentId(item) ?? 0;
    const contentName = getName(item) ?? "";

    if (context.pageType === ExplorerPageType.SEARCH) {
      const pageType = getIsShare(item)
        ? ExplorerPageType.SHARED
        : ExplorerPageType.MY;

      if (!contentId) {
        await router.push(`/${pageType}`);
        return;
      }

      const res = await getParentFolderContentIdApi(contentId);
      const pathIds = (res.data.path || "").split("/").filter(Boolean);
      const rawPathNames = (res.data.name || "").split("/").filter(Boolean);
      const pathNames = rawPathNames.slice(1);
      const targetName = pathNames[pathNames.length - 1] || contentName;
      const currentNames = pathNames.slice(0, -1);

      const target = buildFolderRoute(
        pageType,
        pathIds,
        { contentId, contentName: targetName },
        currentNames,
      );
      await router.push(target);
      return;
    }

    if (
      context.pageType === ExplorerPageType.MY ||
      context.pageType === ExplorerPageType.SHARED
    ) {
      const target = buildFolderRoute(
        context.pageType,
        context.folderPath,
        { contentId, contentName },
        context.folderNames,
      );
      await router.push(target);
    }
  };

  // 下载文件
  const downloadMany = async (items: ContentType[]) => {
    if (!items.length) {
      toast(t("selectFile"));
      return false;
    }

    const isHaveFolder = items.some((item) => getIsFolder(item));
    const isAllFolder = items.every((item) => getIsFolder(item));

    if (isAllFolder) {
      await confirm({
        title: t("hint"),
        message: t("folderDownloadWarn"),
        confirmButtonText: t("gotIt"),
      });
      return false;
    }

    if (isHaveFolder) {
      await confirm({
        title: t("hint"),
        message: t("folderDownloadWarn2"),
        confirmButtonText: t("gotIt"),
      });
    }

    const files = items.filter((item) => !getIsFolder(item));

    if (isMobileApp.value) {
      if (files.length === 1) {
        const item = files[0];
        await downloadInAppFile({
          contentId: getContentId(item) ?? 0,
          fileName: getName(item) ?? "",
          fileSize: getSize(item),
        });
        return true;
      }

      const downloadFiles = await Promise.all(
        files.map(async (item) => {
          const contentId = getContentId(item) ?? 0;
          const res = await getDownloadFileIdApi(contentId);
          const { fileId, aesKey } = res.data;

          return {
            fileName: getName(item) ?? "",
            filePath: `/api/file/download/clouddrive?fileid=${fileId}`,
            fileSize: getSize(item),
            sn: aesKey,
          };
        }),
      );

      downloadShareFileInApp(JSON.stringify(downloadFiles), true);
      return true;
    }

    if (isPcClient.value) {
      const contentIds = files
        .map((item) => getContentId(item) ?? 0)
        .filter((contentId) => contentId > 0);

      if (!contentIds.length) {
        toast(t("selectFile"));
        return false;
      }

      console.log(JSON.stringify({ type: "12", data: contentIds }));
      return true;
    }

    for (const item of files) {
      await downloadFile({
        apiFunction: downloadFileApi,
        contentId: getContentId(item) ?? 0,
        fileName: getName(item) ?? "",
      });
    }

    return true;
  };

  const download = async (item: ContentType) => {
    await downloadMany([item]);
  };

  // 打开重命名弹窗
  const rename = async (item: ContentType) => {
    onRenameDialog?.(item);
  };

  // 分享文件
  const shareToFriendMany = async (items: ContentType[]) => {
    if (!items.length) {
      toast(t("selectFile"));
      return false;
    }

    const contentIds = items
      .map((item) => getContentId(item))
      .filter((contentId): contentId is number => !!contentId);

    if (!contentIds.length) {
      toast(t("selectFile"));
      return false;
    }

    const buildShareData = async (shareItems: ContentType[]) => {
      const shareRes = await generateShareLinkApi({
        contentIds: shareItems.map((item) => getContentId(item)!),
        expireType: 5,
        passwordType: 0,
        password: "",
        canShare: false,
      });

      const data = shareItems.map((item) => ({
        ...item,
        name: getName(item),
        shareKey: shareRes.data.shareKey,
      }));

      if (!isPcClient.value) {
        h5CallAppShare(JSON.stringify(data));
      } else {
        console.log(JSON.stringify({ type: "11", data }));
      }

      return true;
    };

    const permissionRes = await checkCanShare(contentIds);

    if (!permissionRes) {
      return buildShareData(items);
    }

    const noPermissionList = JSON.parse(permissionRes as string) as number[];
    const noPermissionCount = noPermissionList.length;

    if (noPermissionCount === contentIds.length) {
      toast(t("noSharePermission"));
      return false;
    }

    try {
      await confirm({
        title: t("shareFile"),
        message: t("sharePermissionWarning", { count: noPermissionCount }),
        cancelButtonText: t("cancel"),
        confirmButtonText: t("Ok"),
      });
    } catch {
      return false;
    }

    const shareItems = items.filter((item) => {
      const contentId = getContentId(item);
      return contentId != null && !noPermissionList.includes(contentId);
    });

    return buildShareData(shareItems);
  };

  const shareToFriend = async (item: ContentType) => {
    await shareToFriendMany([item]);
  };

  const cancelShareMany = async (items: ContentType[]) => {
    const ids = items.map((item) => getId(item) ?? 0).filter((id) => id > 0);

    if (!ids.length) return false;

    try {
      await confirm({
        title: t("confirmCancelShare"),
        message: t("cancelShareWarning"),
        showCancelButton: true,
        confirmButtonColor: "#327edc",
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
        width: "80%",
      });
    } catch {
      return false;
    }

    await cancelShareApi(ids);
    toast(t("cancelShareSuccess"), "success");
    await onRefresh?.();
    return true;
  };

  const deletePermanentlyMany = async (items: ContentType[]) => {
    if (!items.length) {
      toast(t("selectFile"));
      return false;
    }

    const ids = items.map((item) => getId(item) ?? 0).filter((id) => id > 0);

    if (!ids.length) return false;

    try {
      await confirm({
        title: t("confirmDeletePermanently"),
        message: t("confirmDeletePermanentlyQuestion"),
        showCancelButton: true,
        confirmButtonColor: "#f5222d",
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
        width: "80%",
      });
    } catch {
      return false;
    }

    await deleteFileApi({ ids });
    toast(t("deleteSuccess"), "success");
    await onRefresh?.();
    return true;
  };

  const restoreMany = async (
    items: ContentType[],
    repeatFileOperateType = 0,
  ) => {
    if (!items.length) {
      toast(t("selectFile"));
      return false;
    }

    const restoreFiles = items
      .map((item) => {
        const id = getId(item);
        const contentId = getContentId(item);

        if (id == null || contentId == null) return null;

        return { id, contentId };
      })
      .filter(
        (
          item,
        ): item is {
          id: number;
          contentId: number;
        } => item != null,
      );

    if (!restoreFiles.length) return false;

    const res = await restoreFile({
      restoreFiles,
      repeatFileOperateType,
    });

    if (res.code !== 1) {
      toast(t("restoreFailed"), "error");
      return false;
    }

    if (res.data?.length) {
      onDuplicateFiles?.(res.data);
      return false;
    }

    toast(t("restoreSuccess"), "success");
    await onRefresh?.();
    return true;
  };

  // 批量移除文件或文件夹
  const removeMany = async (items: ContentType[]) => {
    if (!items.length) {
      toast(t("selectFile"));
      return false;
    }
    const contentIds = items
      .map((item) => getContentId(item) ?? 0)
      .filter((contentId) => contentId > 0);

    if (!contentIds.length) return false;

    try {
      await confirm({
        title: t("deleteFile"),
        message: t("deleteFileWarning"),
        showCancelButton: true,
        confirmButtonColor: "#f5222d",
        confirmButtonText: t("delete"),
        cancelButtonText: t("cancel"),
        width: "80%",
      });
    } catch {
      return false;
    }

    await deleteFileOrDirApi(contentIds);

    toast(t("deleteSuccess"), "success");
    await onRefresh?.();
    return true;
  };

  // 移除单个文件或文件夹
  const remove = async (item: ContentType) => {
    await removeMany([item]);
  };

  // 置顶
  const top = async (item: ContentType) => {
    const contentId = getContentId(item) ?? 0;
    await topSpaceApi(contentId);

    toast(t("pinSuccess"), "success");
    await onRefresh?.();
  };

  // 取消置顶
  const unTop = async (item: ContentType) => {
    const contentId = getContentId(item) ?? 0;
    await cancelTopSpaceApi(contentId);

    toast(t("unpinSuccess"), "success");
    await onRefresh?.();
  };

  // 打开设置分享链接的弹窗
  const copyLink = async (item: ContentType | ContentType[]) => {
    if (Array.isArray(item)) {
      onCopyLinkDialog?.(item);
    } else {
      onCopyLinkDialog?.([item]);
    }
  };

  const actionMap: Record<string, (item: ContentType) => Promise<void>> = {
    open: open,
    download: download,
    rename: rename,
    share: shareToFriend,
    delete: remove,
    top: top,
    unTop: unTop,
    copy: copyLink,
  };

  const handleMenuAction = async (key: string, item: ContentType) => {
    const action = actionMap[key];

    if (action) {
      await action(item);
    }
  };

  const handleContextMenuSelect = async (
    key: PcFileContextActionKey,
    items: ContentType[],
    row: ContentType | null,
  ) => {
    const rowActionMap: Partial<
      Record<
        PcFileContextActionKey,
        (item: ContentType) => void | Promise<void>
      >
    > = {
      open,
      top,
      unTop,
      rename,
    };

    const itemsActionMap: Partial<
      Record<PcFileContextActionKey, (list: ContentType[]) => Promise<unknown>>
    > = {
      copyLink,
      download: downloadMany,
      share: shareToFriendMany,
      delete: removeMany,
      restore: restoreMany,
      deletePermanently: deletePermanentlyMany,
      cancelShare: cancelShareMany,
    };

    const rowAction = rowActionMap[key];

    if (rowAction) {
      if (!row) return;
      await rowAction(row);
      onAfterAction?.();
      return;
    }

    const itemsAction = itemsActionMap[key];

    if (!itemsAction || !items.length) return;

    const result = await itemsAction(items);

    if (result === false) return;

    onAfterAction?.();
  };

  return {
    open,
    download,
    downloadMany,
    rename,
    shareToFriend,
    shareToFriendMany,
    cancelShareMany,
    copyLink,
    remove,
    removeMany,
    deletePermanentlyMany,
    restoreMany,
    top,
    unTop,
    handleMenuAction,
    handleContextMenuSelect,
  };
}
