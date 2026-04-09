import { getRecentViewApi } from "@/api/recentView";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getShareSpace } from "@/api/shareSpace";
import { getMyShareListApi } from "@/api/share";
import { getRecycleBinList } from "@/api/recycleBin";
import { searchGlobalApi } from "@/api/common";
import type { TableColumn } from "@/types/type";
import { t } from "@/utils";
import type { RouteLocationNormalizedLoaded } from "vue-router";

export enum ExplorerPageType {
  RECENT = "recent",
  MY = "my",
  SHARED = "shared",
  MY_SHARES = "my-shares",
  RECYCLE = "recycle",
  SEARCH = "search",
}

export type ExplorerQueryState = {
  page: number;
  pageSize: number;
  sortBy: "time" | "size" | "name";
  sortOrder: "asc" | "desc";
  keyword: string;
  startDate: string;
  endDate: string;
};

export type ExplorerContext = {
  pageType: ExplorerPageType;
  folderPath: string[];
  currentFolderId: number;
  folderNames: string[];
  isRoot: boolean;
};

export type ExplorerPageConfig = {
  api: (params: Record<string, any>) => Promise<any>;
  buildParams: (
    context: ExplorerContext,
    query: ExplorerQueryState,
  ) => Record<string, any>;
  columns: TableColumn[];
};

const FILE_COLUMNS: TableColumn[] = [
  {
    type: "selection",
    width: 48,
    reserveSelection: true,
  },
  {
    label: t("columnOpt.docName"),
    prop: "contentName",
    slots: "name",
    headerSlot: "sortHeader",
    minWidth: 340,
    resizable: true,
    showOverflowTooltip: true,
  },
  {
    label: t("columnOpt.lastUpdated"),
    prop: "operateTime",
    slots: "time",
    headerSlot: "sortHeader",
    minWidth: 140,
    resizable: true,
  },
  {
    label: t("columnOpt.updatedBy"),
    prop: "userName",
    minWidth: 100,
    resizable: true,
  },
  {
    label: t("columnOpt.size"),
    prop: "contentSize",
    slots: "size",
    headerSlot: "sortHeader",
    minWidth: 80,
    resizable: true,
  },
];

const MY_SHARE_COLUMNS: TableColumn[] = [
  {
    type: "selection",
    width: 48,
    reserveSelection: true,
  },
  {
    label: t("columnOpt.shareFile"),
    prop: "shareFile",
    slots: "name",
    headerSlot: "sortHeader",
    minWidth: 340,
    resizable: true,
    showOverflowTooltip: true,
  },
  {
    label: t("columnOpt.shareTime"),
    prop: "shareTime",
    slots: "shareTime",
    headerSlot: "sortHeader",
    minWidth: 140,
    resizable: true,
  },
  {
    label: t("columnOpt.status"),
    prop: "status",
    slots: "shareStatus",
    minWidth: 130,
    resizable: true,
  },
  {
    label: t("columnOpt.viewCount"),
    prop: "viewCount",
    minWidth: 80,
    resizable: true,
  },
];

const RECYCLE_COLUMNS: TableColumn[] = [
  {
    type: "selection",
    width: 48,
    reserveSelection: true,
  },
  {
    label: t("columnOpt.docName"),
    prop: "contentName",
    slots: "name",
    headerSlot: "sortHeader",
    minWidth: 320,
    resizable: true,
    showOverflowTooltip: true,
  },
  {
    label: t("columnOpt.deleteTime"),
    prop: "deleteTime",
    slots: "deleteTime",
    headerSlot: "sortHeader",
    minWidth: 140,
    resizable: true,
  },
  {
    label: t("columnOpt.deletedBy"),
    prop: "userName",
    minWidth: 90,
    resizable: true,
  },
  {
    label: t("columnOpt.size"),
    prop: "contentSize",
    slots: "size",
    minWidth: 100,
    resizable: true,
  },
];

function mapSortMethod(sortBy: ExplorerQueryState["sortBy"]) {
  if (sortBy === "size") return 1;
  if (sortBy === "name") return 2;
  return 0;
}

export function getExplorerContext(
  route: RouteLocationNormalizedLoaded,
): ExplorerContext {
  const rawPath = route.params.path;
  const folderPath = Array.isArray(rawPath)
    ? rawPath.filter(Boolean)
    : rawPath
      ? [rawPath]
      : [];

  const pageType = (route.meta.type ||
    ExplorerPageType.RECENT) as ExplorerPageType;
  const folderNames = String(route.query.names || "")
    .split("|")
    .filter(Boolean)
    .map((item) => decodeURIComponent(item));
  const currentFolderId = Number(folderPath[folderPath.length - 1] || 0) || 0;

  return {
    pageType,
    folderPath,
    currentFolderId,
    folderNames,
    isRoot: folderPath.length === 0,
  };
}

export function buildFolderRoute(
  pageType: ExplorerPageType.MY | ExplorerPageType.SHARED,
  currentPath: string[],
  row: { contentId: number; contentName: string },
  currentNames: string[],
) {
  const nextPath = [...currentPath, String(row.contentId)];
  const nextNames = [...currentNames, row.contentName];

  return {
    path: `/${pageType}/${nextPath.join("/")}`,
    query: {
      names: nextNames.map((item) => encodeURIComponent(item)).join("|"),
    },
  };
}

export const explorerConfigMap: Record<ExplorerPageType, ExplorerPageConfig> = {
  [ExplorerPageType.RECENT]: {
    api: getRecentViewApi,
    buildParams: (_, query) => ({
      PageIndex: query.page,
      PageSize: query.pageSize,
    }),
    columns: FILE_COLUMNS,
  },
  [ExplorerPageType.MY]: {
    api: getMySpaceContentApi,
    buildParams: (context, query) => ({
      PageIndex: query.page,
      PageSize: query.pageSize,
      ContentId: context.currentFolderId,
      SortMethod: mapSortMethod(query.sortBy),
      SortOrder: query.sortOrder,
    }),
    columns: FILE_COLUMNS,
  },
  [ExplorerPageType.SHARED]: {
    api: getShareSpace,
    buildParams: (context, query) => ({
      PageIndex: query.page,
      PageSize: query.pageSize,
      ContentId: context.currentFolderId,
      SortMethod: mapSortMethod(query.sortBy),
      SortOrder: query.sortOrder,
    }),
    columns: FILE_COLUMNS,
  },
  [ExplorerPageType.MY_SHARES]: {
    api: getMyShareListApi,
    buildParams: (_, query) => ({
      StartDate: query.startDate,
      EndDate: query.endDate,
      PageIndex: query.page,
      PageSize: query.pageSize,
      ShareFile: query.keyword,
      SortField: query.sortBy === "name" ? 0 : 1,
      SortOrder: query.sortOrder,
    }),
    columns: MY_SHARE_COLUMNS,
  },
  [ExplorerPageType.RECYCLE]: {
    api: getRecycleBinList,
    buildParams: (_, query) => ({
      PageIndex: query.page,
      PageSize: query.pageSize,
      name: query.keyword,
      SortMethod: query.sortBy === "name" ? 0 : 1,
      SortOrder: query.sortOrder,
    }),
    columns: RECYCLE_COLUMNS,
  },
  [ExplorerPageType.SEARCH]: {
    api: (params) => searchGlobalApi(params as any),
    buildParams: (_, query) => ({
      keyWord: query.keyword,
      pageIndex: query.page,
      pageSize: query.pageSize,
    }),
    columns: FILE_COLUMNS,
  },
};
