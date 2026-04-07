import { defineStore } from "pinia";
import { ref } from "vue";
import type { ContentType } from "@/types/type";
import type { TableInstance } from "element-plus";
import { checkCanShare, h5CallAppShare, t } from "@/utils";
import { getDeviceType } from "@/utils";
import { useDialog } from "@/hooks/useDialog";
import { generateShareLinkApi } from "@/api/share";
import { DeviceType } from "@/enum/baseEnum.ts";
import { getContentId, getId, getName } from "@/utils/typeUtils";

export const useShareFileStore = defineStore("shareFile", () => {
  // 分享文件列表
  const shareList = ref<ContentType[]>([]);
  // 显示生成链接弹窗
  const showLinkDialog = ref(false);

  // 是否消除选中文件
  const isClearSelect = ref(false);

  // pc端显示选中文件个数
  const showChooseCount = ref(false);

  // 移动端
  // 长按展示多选框
  const isLongPress = ref(false);

  // 链接
  const shareContents = ref<any[]>([]);

  // 设置分享文件列表
  function setShareList(files: ContentType[]) {
    shareList.value = files;
  }

  // 文件是否在分享列表中
  function isInShareList(file: ContentType): boolean {
    return shareList.value.some((item) =>
      getContentId(file) ? getContentId(item) === getContentId(file) : getId(item) === getId(file)
    );
  }

  // 是否全选
  function isAllSelected(fileList: ContentType[]) {
    const total = fileList.length;

    const selected = shareList.value.filter((item) =>
      fileList.some((file) =>
        getContentId(file) != null
          ? getContentId(file) === getContentId(item)
          : getId(file) === getId(item),
      ),
    ).length;

    if (selected === 0) return "is-none";
    if (selected === total) return "is-all";
    return "is-partial";
  }

  // 添加一个分享文件
  function addShareFile(file: ContentType) {
    // 检查是否已存在，避免重复添加
    const exists = shareList.value.some((item) =>
      getContentId(file) ? getContentId(item) === getContentId(file) : getId(item) === getId(file)
    );
    if (!exists) {
      shareList.value.push(file);
    }
  }

  // 移除其中一个分享文件
  function removeShareFile(file: ContentType) {
    const index = shareList.value.findIndex((item) =>
      getContentId(file) ? getContentId(item) === getContentId(file) : getId(item) === getId(file)
    );

    if (index !== -1) {
      shareList.value.splice(index, 1);
    }
  }

  function handleToggleAll(fileList: ContentType[]) {
    const status = isAllSelected(fileList);

    if (status === "is-all") {
      shareList.value = [];
    } else {
      setShareList(fileList);
    }
  }

  // api获取分析链接key
  async function getShareLinkKey(contents: ContentType[]) {
    const contentIds = contents.map((item) => getContentId(item)!);

    const res = await generateShareLinkApi({
      contentIds: contentIds,
      expireType: 5,
      passwordType: 0,
      password: "",
      canShare: false
    });
    if (res.code === 1) {
      const data = contents.map((item) => {
        return {
          ...item,
          name: getName(item),
          shareKey: res.data.shareKey,
        };
      });
      if (getDeviceType() === DeviceType.H5) {
        console.log(JSON.stringify(data));
        h5CallAppShare(JSON.stringify(data));
        // 清空分享列表
        shareList.value = [];
      } else {
        console.log(JSON.stringify({ type: "11", data }));
      }
    } else {
      shareContents.value = [];
      if (getDeviceType() === DeviceType.H5) {
        showToast({ message: t("operationFailedRetry"), type:'fail' });
      } else {
        ElMessage.error(t("operationFailedRetry"));
      }
    }
  }

  // PC端显示分享好友选择框
  async function setShowShareDialog(tableElement?: TableInstance) {
    const contentIds = shareList.value.map(
      (item) => getContentId(item),
    ) as number[];

    const res = (await checkCanShare(contentIds)) as any;
    if (res) {
      const noPermissionList = JSON.parse(res);
      const noPermissionCount = noPermissionList.length;

      if (noPermissionCount === shareList.value.length) {
        ElMessage.error(t("noSharePermission"));
        return;
      }

      useDialog({
        title: t("shareFile"),
        content: t("sharePermissionWarning", {
          count: noPermissionCount,
        }),
        confirmText: t("Ok"),
      }).then(async () => {
        const newShareList = shareList.value.filter(
          (item) => !noPermissionList.includes(getContentId(item)),
        );
        await getShareLinkKey(newShareList);
        if (tableElement) clearSelection(tableElement);
      });
    } else {
      const contentIds = shareList.value;
      await getShareLinkKey(contentIds)
      if (tableElement) clearSelection(tableElement);
    }
  }

  // h5 调起原生分享
  async function shareToNative() {
    if (shareList.value.length === 0) {
      showToast(t("selectFile"));
      return;
    }
    const contentIds = shareList.value.map(
      (item) => getContentId(item),
    ) as number[];
    const res = (await checkCanShare(contentIds)) as any;
    if (res) {
      const noPermissionList = JSON.parse(res);
      const noPermissionCount = noPermissionList.length;

      if (noPermissionCount === contentIds.length) {
        showToast({
          message: t("noSharePermission"),
        });
        return;
      }

      showConfirmDialog({
        title: t("shareFile"),
        message: t("sharePermissionWarning", { count: noPermissionCount }),
        cancelButtonText: t("cancel"),
        confirmButtonText: t("Ok"),
      }).then(async () => {
        const newShareList = shareList.value.filter(
          (item) => !noPermissionList.includes(getContentId(item)),
        );
        await getShareLinkKey(newShareList)
      });
    } else {
      const contentIds = shareList.value
      await getShareLinkKey(contentIds)
    }
    setLongPress(false);
  }

  // 打开分享链接弹窗
  function setShowLinkDialog(show: boolean) {
    if (show && shareList.value.length === 0) {
      showToast(t("selectFile"));
      return;
    }
    showLinkDialog.value = show;
  }

  // 设置是否消除选中文件
  function setClearSelect() {
    isClearSelect.value = true;
  }

  // 消除选中文件
  function clearSelection(tableElement: TableInstance) {
    tableElement?.clearSelection();
    isClearSelect.value = false;
    setShowChooseCount(false);
  }

  // 显示或隐藏选择文件个数
  function setShowChooseCount(show: boolean) {
    showChooseCount.value = show;
  }

  // 移动端
  // 长按展示多选框
  function setLongPress(isLong: boolean) {
    isLongPress.value = isLong;
  }

  return {
    shareList,
    showLinkDialog,
    isClearSelect,
    showChooseCount,
    isLongPress,

    setShareList,
    isInShareList,
    isAllSelected,
    addShareFile,
    removeShareFile,
    handleToggleAll,
    setShowShareDialog,
    setShowLinkDialog,
    setClearSelect,
    clearSelection,
    setLongPress,
    setShowChooseCount,
    shareToNative,
  };
});
