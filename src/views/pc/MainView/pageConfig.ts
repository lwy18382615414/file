import { getRecentViewApi } from "@/api/recentView";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getMyShareListApi } from "@/api/share";
import { getRecycleBinList } from "@/api/recycleBin";
import { searchGlobalApi } from "@/api/common";
import { getShareSpace } from "@/api/shareSpace";
import type {
  RecentViewItem,
  PersonalCloudContent,
  SharedCloudContent,
  RecycleBinItem,
  MyShareItem,
  CloudSearchResultItem,
} from "@/types/type";
import type {
  MySpaceParams,
  MySpaceCallbackParams,
  RecentViewBachParams,
  MyShareParams,
  MyShareCallbackParams,
  ShareSpaceParams,
  ShareSpaceCallbackParams,
  RecycleBinCallbackParams,
  CloudSearchCallBackParams,
} from "@/api/type";
import type { PageConfig, TableColumnKey } from "./types";
import {
  RECENT_COLUMN,
  MY_COLUMN,
  MY_SHARE_COLUMN,
  RECYCLE_BIN_COLUMN,
  SHARE_SPACE,
  pageSortConfig,
} from "./constance";

// 右键菜单列表
const RECENT_MENU = ["open", "download", "export", "copyLink"];
const COMMON_MENU = [
  "open",
  "export",
  "copyLink",
  "delete",
  "top",
  "rename",
  "download",
];
const MY_SHARE_MENU = ["copyLink", "cancelShare"];

// 页面配置映射
export const pageConfigMap: {
  [K in TableColumnKey]: PageConfig<K>;
} = {
  recent: {
    api: getRecentViewApi,
    paramsType: {} as MySpaceParams,
    responseType: {} as RecentViewBachParams,
    dataItemType: {} as RecentViewItem,
    tableColumns: RECENT_COLUMN,
    menuKeys: RECENT_MENU,
    sortConfig: undefined,
  },
  my: {
    api: getMySpaceContentApi,
    paramsType: {} as MySpaceParams,
    responseType: {} as MySpaceCallbackParams,
    dataItemType: {} as PersonalCloudContent,
    tableColumns: MY_COLUMN,
    menuKeys: COMMON_MENU,
    sortConfig: pageSortConfig.default,
  },
  folder: {
    api: getMySpaceContentApi,
    paramsType: {} as MySpaceParams,
    responseType: {} as MySpaceCallbackParams,
    dataItemType: {} as PersonalCloudContent,
    tableColumns: MY_COLUMN,
    menuKeys: COMMON_MENU,
    sortConfig: pageSortConfig.default,
  },
  shareSpace: {
    api: getShareSpace,
    paramsType: {} as ShareSpaceParams,
    responseType: {} as ShareSpaceCallbackParams,
    dataItemType: {} as SharedCloudContent,
    tableColumns: SHARE_SPACE,
    menuKeys: COMMON_MENU,
    sortConfig: pageSortConfig.default,
  },
  recycleBin: {
    api: getRecycleBinList,
    paramsType: {} as {
      PageIndex: number;
      PageSize: number;
      name?: string;
    },
    responseType: {} as RecycleBinCallbackParams,
    dataItemType: {} as RecycleBinItem,
    tableColumns: RECYCLE_BIN_COLUMN,
    menuKeys: [],
    sortConfig: undefined,
  },
  myShare: {
    api: getMyShareListApi,
    paramsType: {} as MyShareParams,
    responseType: {} as MyShareCallbackParams,
    dataItemType: {} as MyShareItem,
    tableColumns: MY_SHARE_COLUMN,
    menuKeys: MY_SHARE_MENU,
    sortConfig: pageSortConfig["/my-share"],
  },
  searchResult: {
    api: searchGlobalApi,
    paramsType: {} as {
      keyWord: string;
      pageIndex: number;
      pageSize: number;
    },
    responseType: {} as CloudSearchCallBackParams,
    dataItemType: {} as CloudSearchResultItem,
    tableColumns: RECENT_COLUMN,
    menuKeys: COMMON_MENU,
    sortConfig: undefined,
  },
};

// 根据 columnKey 获取页面配置的辅助函数
export function getPageConfig<TKey extends TableColumnKey>(
  key: TKey,
  fileBelong: string
): PageConfig<TKey> {
  if (key === 'folder') {
    pageConfigMap['folder'].api = fileBelong === "mySpace" ? getMySpaceContentApi : getShareSpace
  }
  return pageConfigMap[key];
}

// 根据路由路径获取 columnKey
export function getColumnKeyByPath(path: string): TableColumnKey {
  if (path === "/recent-view") return "recent";
  if (path === "/my-space") return "my";
  if (path === "/my-share") return "myShare";
  if (path.startsWith("/share-space")) return "shareSpace";
  if (path === "/recycle-bin") return "recycleBin";
  if (path.startsWith("/folder")) return "folder";
  if (path === "/search-result") return "searchResult";
  return "recent"; // 默认值
}

