import { getRecentViewApi } from "@/api/recentView";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getMyShareListApi } from "@/api/share";
import { getRecycleBinList } from "@/api/recycleBin";
import { getShareSpace } from "@/api/shareSpace";
import { t } from "@/utils";
import type { SortOption } from "@/views/h5/MainView/type";
import type { ContentType } from "@/types/type";
import type { useFileActions } from "./composable/useFileActions";
import { Permission } from "@/enum/permission";
import { searchGlobalApi } from "@/api/common";
import { getIsFolder } from "@/utils/typeUtils";

export const noSortPaths = new Set(["/recent-view", "/recycle-bin"]);

export const defaultState = {
  PageIndex: 1,
  PageSize: 20,
};

// 按路径区分每个页面的额外参数
export const pageStateConfig: Record<string, Partial<any>> = {
  "/recent-view": {},
  "/my-space": {
    ContentType: 1,
    SortMethod: 0,
    SortOrder: "desc",
  },
  "/my-share": {
    SortMethod: 1,
    SortOrder: "desc",
  },
  "/share-space": {
    SortMethod: 0,
    SortOrder: "desc",
  },
  "/recycle-bin": {},
};

// 接口映射表
export const pageApiMap: Record<string, (params: any) => Promise<any>> = {
  "/recent-view": getRecentViewApi,
  "/my-space": getMySpaceContentApi,
  "/share-space": getShareSpace,
  "/my-share": getMyShareListApi,
  "/recycle-bin": getRecycleBinList,
  "/search-result": searchGlobalApi
};

// 页面排序
export const sortListMap: Record<string, SortOption[]> = {
  "/my-share": [
    { name: 0, title: t("sortByName"), warn: t("docName") },
    { name: 1, title: t("sortByTime"), warn: t("time") },
  ],
  default: [
    { name: 2, title: t("sortByName"), warn: t("docName") },
    { name: 0, title: t("sortByTime"), warn: t("time") },
    { name: 1, title: t("sortBySize"), warn: t("size") },
  ],
};

export const rootPath = new Set([
  "/recent-view",
  "/my-space",
  "/share-space",
  "/my-share",
  "/recycle-bin",
]);

export const pageActionKeys: Record<string, string[]> = {
  "/recent-view": ["download", "shareToFriend", "copyLink"],
  "/my-space": [
    "open",
    "download",
    "shareToFriend",
    "copyLink",
    "rename",
    "top",
    "delete",
  ],
  "/recycle-bin": ["restore", "deletePermanently"],
};

export const allActions: Record<
  string,
  {
    name: string;
    icon: string;
    permission?: Permission;
    visible?: (item: ContentType) => boolean;
    action: (
      item: ContentType,
      fileActions: ReturnType<typeof useFileActions>,
    ) => void | Promise<void>;
  }
> = {
  open: {
    name: t("open"),
    icon: "ic_open",
    visible: (item) => getIsFolder(item),
    action: async (item, { openEntry }) => await openEntry(item),
    permission: Permission.View,
  },
  download: {
    name: t("download"),
    icon: "ic_download",
    visible: (item) => !getIsFolder(item),
    action: async (item, { openEntry }) => await openEntry(item),
    permission: Permission.View,
  },
  shareToFriend: {
    name: t("shareToFriend"),
    icon: "ic_share",
    action: async (item, { shareToFriend }) => await shareToFriend(item),
    permission: Permission.Share,
  },
  copyLink: {
    name: t("copyLink"),
    icon: "ic_copyLink",
    action: async (item, { copyLink }) => await copyLink(item),
    permission: Permission.Share,
  },
  rename: {
    name: t("rename"),
    icon: "ic_rename",
    action: (item, { rename }) => rename(item),
    permission: Permission.Upload,
  },
  delete: {
    name: t("delete"),
    icon: "ic_delete",
    action: (item, { deleteEntry }) => deleteEntry(item),
    permission: Permission.Edit,
  },
  top: {
    name: t("pin"),
    icon: "ic_topSet",
    action: (item, { top }) => top(item),
    permission: Permission.View,
  },
  unTop: {
    name: t("unpin"),
    icon: "ic_topSet",
    action: (item, { unTop }) => unTop(item),
    permission: Permission.View,
  },
  restore: {
    name: t("restore"),
    icon: "ic_restore",
    action: (item, { restore }) => restore(item),
  },
  deletePermanently: {
    name: t("deletePermanently"),
    icon: "ic_delete_ab",
    action: (item, { deletePermanently }) => deletePermanently(item),
  },
};
