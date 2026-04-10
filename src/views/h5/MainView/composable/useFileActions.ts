import { type Ref } from "vue";
import type { ContentType } from "@/types/type";
import { useRouter } from "vue-router";
import { useShareFileStore, useRouteStackStore } from "@/stores";
import { getFromApp } from "@/utils/auth";
import { checkIsShared, downloadFile, downloadInAppFile, t } from "@/utils";
import { deleteFileOrDirApi, downloadFileApi } from "@/api/fileService";
import { cancelTopSpaceApi, topSpaceApi } from "@/api/common";
import { deleteFileApi, restoreFile } from "@/api/recycleBin";
import { getContentId, getIsFolder, getName, getSize } from "@/utils/typeUtils";

export function useFileActions(options: {
  contentId: Ref<number>;
  onRefresh: () => void;
  onRenameDialog: (item: ContentType) => void;
  onDuplicateFile: (
    item: ContentType,
    list: Record<number, string>[],
  ) => void;
}) {
  const { onRefresh, onRenameDialog, onDuplicateFile } = options;

  const router = useRouter();

  const routeStackStore = useRouteStackStore()

  const { setShareList, shareToNative, setShowLinkDialog } =
    useShareFileStore();

  const openEntry = async (item: ContentType, isSearchResultPage: boolean = false) => {
    const isFolder = getIsFolder(item) ?? false
    const itemContentId = getContentId(item) ?? 0
    const itemName = getName(item);

    if (isFolder) {
      if (!isSearchResultPage) {
        routeStackStore.pushFolder(
          itemContentId,
          itemName,
          `/folder/${itemContentId}?folderName=${encodeURIComponent(itemName)}`
        )
      }

      await router.push({
        name: 'Folder',
        params: {
          contentId: itemContentId,
        },
        query: {
          contentName: itemName
        }
      });
    } else {
      const isApp = getFromApp();
      if (isApp) {
        await downloadInAppFile({
          contentId: itemContentId,
          fileName: itemName,
          fileSize: getSize(item),
        });
      } else {
        await downloadFile({
          apiFunction: downloadFileApi,
          contentId: itemContentId,
          fileName: itemName,
        });
      }
    }
  };

  const rename = async (item: ContentType) => {
    onRenameDialog(item);
  };

  const shareToFriend = async (item: ContentType) => {
    setShareList([item]);
    await shareToNative();
  };

  const copyLink = async (item: ContentType) => {
    setShareList([item]);
    setShowLinkDialog(true);
  };

  const move = async (item: ContentType) => {
    await router.push({
      path: "/move-file",
      state: {
        movePayload: JSON.stringify({ items: [item] }),
      },
    });
  };

  const deleteEntry = async (item: ContentType) => {
    const itemContentId = getContentId(item) ?? 0;
    const res = await checkIsShared([itemContentId]);
    if (res.length > 0) {
      showDialog({
        title: t("deleteFile"),
        message: t("shareDelete"),
        showCancelButton: true,
        confirmButtonColor: "#f5222d",
        confirmButtonText: t("delete"),
        cancelButtonText: t("cancel"),
        width: "80%",
      }).then(async () => {
        await onDeleteFile(itemContentId);
      });
    } else {
      showDialog({
        title: t("deleteFile"),
        message: t("deleteFileWarning"),
        showCancelButton: true,
        confirmButtonColor: "#f5222d",
        confirmButtonText: t("delete"),
        cancelButtonText: t("cancel"),
        width: "80%",
      }).then(async () => {
        await onDeleteFile(itemContentId);
      });
    }
  };

  const top = async (item: ContentType) => {
    const itemContentId = 'contentId' in item ? item.contentId : 0;
    const res = await topSpaceApi(itemContentId);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("pinSuccess"),
      });
      onRefresh();
    }
  };

  const unTop = async (item: ContentType) => {
    const itemContentId = 'contentId' in item ? item.contentId : 0;
    const res = await cancelTopSpaceApi(itemContentId);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("unpinSuccess"),
      });
      onRefresh();
    }
  };

  const restore = async (item: ContentType) => {
    const itemId = 'id' in item ? item.id : 0;
    const itemContentId = 'contentId' in item ? item.contentId : 0;
    const res = await restoreFile({
      restoreFiles: [
        {
          id: itemId,
          contentId: itemContentId,
        },
      ],
      repeatFileOperateType: 0,
    });
    if (res.code === 1) {
      if (res.data && res.data.length > 0) {
        console.log(res.data);
        onDuplicateFile(item, res.data);
      } else {
        showToast({
          type: "success",
          message: t("restoreSuccess"),
        });
        onRefresh();
      }
    } else {
      showToast({
        type: "fail",
        message: t("restoreFailed"),
      });
    }
  };

  const deletePermanently = async (item: ContentType) => {
    const itemId = 'id' in item ? item.id : 0;
    showConfirmDialog({
      title: t("confirmDeletePermanently"),
      message: t("irreversibleAction"),
      cancelButtonText: t("cancel"),
      confirmButtonText: t("deletePermanently"),
      width: "80%",
    })
      .then(async () => {
        const res = await deleteFileApi({
          ids: [itemId],
        });
        if (res.code === 1) {
          showToast({
            type: "success",
            message: t("deleteSuccess"),
          });
          onRefresh();
        }
      })
      .catch(() => {});
  };

  // 确认删除
  async function onDeleteFile(contentId: number) {
    const res = await deleteFileOrDirApi([contentId!]);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("deleteSuccess"),
      });
      onRefresh();
    }
  }

  return {
    openEntry,
    rename,
    deleteEntry,
    top,
    unTop,
    restore,
    deletePermanently,
    shareToFriend,
    copyLink,
    move,
  };
}
