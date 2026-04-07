import type { TableColumn, PageDataItemMap } from "@/types/type";
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
import type { IResponse } from "@/type";

// 列映射类型定义
export type TableColumnKey =
  | "recent"
  | "my"
  | "myShare"
  | "recycleBin"
  | "shareSpace"
  | "folder"
  | "searchResult";


// API参数类型映射
export type PageParamsMap = {
  recent: MySpaceParams;
  my: MySpaceParams;
  folder: MySpaceParams | ShareSpaceParams;
  shareSpace: ShareSpaceParams;
  recycleBin: {
    PageIndex: number;
    PageSize: number;
    name?: string;
  };
  myShare: MyShareParams;
  searchResult: {
    keyWord: string;
    pageIndex: number;
    pageSize: number;
  };
};

// API响应类型映射
export type PageResponseMap = {
  recent: RecentViewBachParams;
  my: MySpaceCallbackParams;
  folder: MySpaceCallbackParams | ShareSpaceCallbackParams;
  shareSpace: ShareSpaceCallbackParams;
  recycleBin: RecycleBinCallbackParams;
  myShare: MyShareCallbackParams;
  searchResult: CloudSearchCallBackParams;
};

// 页面配置接口
export interface PageConfig<
  TKey extends TableColumnKey,
  TParams = PageParamsMap[TKey],
  TResponse = PageResponseMap[TKey],
  TDataItem = PageDataItemMap[TKey],
> {
  /** API函数 */
  api: (params: TParams) => Promise<IResponse<TResponse>>;
  /** 请求参数类型（用于类型推断） */
  paramsType?: TParams;
  /** 返回数据类型（用于类型推断） */
  responseType?: TResponse;
  /** 单个数据项类型（用于类型推断，API返回的原始类型） */
  dataItemType?: TDataItem;
  /** 表格列配置 */
  tableColumns: TableColumn[];
  /** 右键菜单键列表 */
  menuKeys: string[];
  /** 页面状态配置 */
  stateConfig?: Partial<TParams>;
  /** 排序配置 */
  sortConfig?: {
    defaultSortMethod: number;
    labelMap: Record<number, string>;
  };
}
