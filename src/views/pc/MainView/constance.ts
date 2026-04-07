// 常量文件
import { getRecentViewApi } from "@/api/recentView";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getMyShareListApi } from "@/api/share";
import { getRecycleBinList } from "@/api/recycleBin";
import { searchGlobalApi } from "@/api/common";
import type { TableColumn } from "@/types/type";

// 列映射类型定义（可选，增强类型提示）
export type TableColumnKey =
  | "recent"
  | "my"
  | "myShare"
  | "recycleBin"
  | "shareSpace"
  | "folder"
  | "searchResult";

export const RECENT_COLUMN: TableColumn[] = [
  {
    type: "selection",
    width: 30,
    reserveSelection: true,
  },
  {
    label: "columnOpt.docName",
    prop: "contentName",
    slots: "contentName",
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
    columnKey: "showCount",
  },
  {
    label: "columnOpt.lastUpdated",
    prop: "operateTime",
    width: 180,
    slots: "operateTime",
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.updatedBy",
    prop: "userName",
    width: 120,
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.size",
    prop: "contentSize",
    width: 100,
    slots: "contentSize",
    headerSlot: "sortHeader",
  },
];

export const MY_COLUMN: TableColumn[] = [
  {
    type: "selection",
    width: 30,
    reserveSelection: true,
  },
  {
    label: "columnOpt.docName",
    prop: "contentName",
    slots: "contentName",
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
    sortable: "custom",
    columnKey: "showCount",
  },
  {
    label: "columnOpt.lastUpdated",
    prop: "operateTime",
    width: 180,
    headerSlot: "sortHeader",
    slots: "operateTime",
    sortable: "custom",
  },
  {
    label: "columnOpt.updatedBy",
    prop: "userName",
    width: 120,
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.size",
    prop: "contentSize",
    width: 100,
    headerSlot: "sortHeader",
    slots: "contentSize",
    sortable: "custom",
  },
];

export const MY_SHARE_COLUMN: TableColumn[] = [
  {
    type: "selection",
    width: 30,
  },
  {
    label: "columnOpt.shareFile",
    prop: "shareFile",
    slots: "contentName",
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
    sortable: "custom",
    columnKey: "showCount",
  },
  {
    label: "columnOpt.shareTime",
    prop: "shareTime",
    width: 180,
    headerSlot: "sortHeader",
    slots: "shareTime",
    sortable: "custom",
  },
  {
    label: "columnOpt.status",
    prop: "shareStatus",
    width: 220,
    slots: "shareStatus",
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.viewCount",
    prop: "viewCount",
    width: 120,
    headerSlot: "sortHeader",
  },
];

export const RECYCLE_BIN_COLUMN: TableColumn[] = [
  {
    type: "selection",
    width: 42,
  },
  {
    label: "columnOpt.docName",
    prop: "contentName",
    slots: "contentName",
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
    columnKey: "showCount",
  },
  {
    label: "columnOpt.deleteTime",
    prop: "deleteTime",
    width: 190,
    slots: "deleteTime",
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.deletedBy",
    prop: "userName",
    width: 100,
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.size",
    prop: "contentSize",
    width: 100,
    slots: "contentSize",
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.expirationTime",
    prop: "expireTime",
    width: 190,
    slots: "expireTime",
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.operation",
    width: 220,
    slots: "operation",
    headerSlot: "sortHeader",
  },
];

export const SHARE_SPACE: TableColumn[] = [
  {
    type: "selection",
    width: 30,
    reserveSelection: true,
  },
  {
    label: "columnOpt.docName",
    prop: "contentName",
    slots: "contentName",
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
    sortable: "custom",
    columnKey: "showCount",
  },
  {
    label: "columnOpt.lastUpdated",
    prop: "operateTime",
    width: 180,
    headerSlot: "sortHeader",
    slots: "operateTime",
    sortable: "custom",
  },
  {
    label: "columnOpt.updatedBy",
    prop: "userName",
    width: 120,
    showOverflowTooltip: true,
    headerSlot: "sortHeader",
  },
  {
    label: "columnOpt.size",
    prop: "contentSize",
    width: 100,
    headerSlot: "sortHeader",
    slots: "contentSize",
    sortable: "custom",
  },
];

// 配置每个页面的排序信息
export const pageSortConfig: Record<
  string,
  {
    defaultSortMethod: number;
    labelMap: Record<number, string>;
  }
> = {
  "/my-share": {
    defaultSortMethod: 1,
    labelMap: {
      0: "columnOpt.shareFile",
      1: "columnOpt.shareTime",
    },
  },
  default: {
    defaultSortMethod: 0,
    labelMap: {
      0: "columnOpt.lastUpdated",
      1: "columnOpt.size",
      2: "columnOpt.docName",
    },
  },
};

export const sortMethodMap: Record<string, number> = {
  "columnOpt.docName": 2,
  "columnOpt.size": 1,
  "columnOpt.lastUpdated": 0,
};

// 按路径区分每个页面的额外参数
export const pageStateConfig: Record<string, Partial<any>> = {
  "/recent-view": {},
  "/my-share": {
    StartDate: "",
    EndDate: "",
    ShareFile: "",
    SortMethod: 1,
    SortOrder: "desc",
  },
  "/recycle-bin": {
    name: "",
  }, // 不需要额外参数的页面
};

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
export const pageMenuMap: Record<TableColumnKey, string[]> = {
  recent: RECENT_MENU,
  my: COMMON_MENU,
  folder: COMMON_MENU,
  myShare: MY_SHARE_MENU,
  shareSpace: COMMON_MENU,
  recycleBin: [],
  searchResult: COMMON_MENU
};
