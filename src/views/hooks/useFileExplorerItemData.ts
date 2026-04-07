import { computed, type MaybeRefOrGetter, toValue } from "vue";
import {
  countdown,
  formatFileSize,
  formatTime,
  getExpirationStatus,
  getFileIcon,
  handleFileAndFolderName,
  t,
} from "@/utils";
import {
  getDeleteTime,
  getExpireTime,
  getExpireType,
  getIsDeleteAll,
  getName,
  getOperateTime,
  getShareCount,
  getShareTime,
  getSize,
  getStatus,
  getUserName,
} from "@/utils/typeUtils";
import type { ContentType } from "@/types/type";
import { FileTypeEnum } from "@/enum/baseEnum";
import { ExplorerPageType } from "@/views/fileExplorer";

const PAGE_RECYCLE = ExplorerPageType.RECYCLE;
const PAGE_SHARE = ExplorerPageType.MY_SHARES;
const NORMAL_PAGES = [
  ExplorerPageType.MY,
  ExplorerPageType.RECENT,
  ExplorerPageType.SHARED,
  ExplorerPageType.SEARCH,
];

export function useFileExplorerItemData(options: {
  content: MaybeRefOrGetter<ContentType>;
  type: MaybeRefOrGetter<FileTypeEnum>;
  pageType: MaybeRefOrGetter<ExplorerPageType>;
}) {
  const isSharePage = computed(() => toValue(options.pageType) === PAGE_SHARE);
  const isRecyclePage = computed(() => toValue(options.pageType) === PAGE_RECYCLE);
  const isNormalPage = computed(() =>
    NORMAL_PAGES.includes(toValue(options.pageType)),
  );
  const isFolderItem = computed(
    () => toValue(options.type) === FileTypeEnum.Folder,
  );

  const itemData = computed(() => {
    const content = toValue(options.content);

    return {
      name: getName(content),
      size: getSize(content),
      shareCount: getShareCount(content),
      operateTime: getOperateTime(content),
      deleteTime: getDeleteTime(content),
      expireTime: getExpireTime(content),
      shareTime: getShareTime(content),
      status: getStatus(content),
      expireType: getExpireType(content),
      userName: getUserName(content),
      isDeleteAll: getIsDeleteAll(content),
    };
  });

  const computedIcon = computed(() => {
    const { name, isDeleteAll } = itemData.value;

    if (isSharePage.value) {
      if (isDeleteAll || handleFileAndFolderName(name) === t("folder")) {
        return "file-folder";
      }

      return getFileIcon(name);
    }

    if (isFolderItem.value) {
      return "file-folder";
    }

    return getFileIcon(name);
  });

  const hasMetaInfo = computed(() => {
    if (isNormalPage.value && isFolderItem.value) return false;
    return true;
  });

  const primaryText = computed(() => {
    if (!isSharePage.value) return itemData.value.name;
    if (!itemData.value.isDeleteAll) {
      return itemData.value.shareCount
        ? `${itemData.value.name}${t("andItem", { count: itemData.value.shareCount })}`
        : itemData.value.name;
    }

    if (itemData.value.shareCount) {
      return t("fileDeletedCount", { count: itemData.value.shareCount });
    }

    return t("fileDeleted");
  });

  const metaLines = computed(() => {
    if (!hasMetaInfo.value) return [];

    if (isNormalPage.value) {
      const lines = [formatTime(itemData.value.operateTime)];
      if (itemData.value.size) {
        lines.push(formatFileSize(itemData.value.size));
      }
      lines.push(itemData.value.userName);
      return lines.filter(Boolean);
    }

    if (isRecyclePage.value) {
      return [
        formatTime(itemData.value.deleteTime),
        countdown(itemData.value.expireTime),
      ].filter(Boolean);
    }

    if (isSharePage.value) {
      return [
        formatTime(itemData.value.shareTime),
        itemData.value.isDeleteAll
          ? t("fileDeleted")
          : getExpirationStatus(
              itemData.value.status,
              itemData.value.expireType,
              itemData.value.expireTime,
            ),
      ].filter(Boolean);
    }

    return [];
  });

  return {
    isSharePage,
    isRecyclePage,
    isNormalPage,
    isFolderItem,
    itemData,
    computedIcon,
    hasMetaInfo,
    primaryText,
    metaLines,
  };
}
