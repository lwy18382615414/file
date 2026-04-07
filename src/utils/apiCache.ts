import type { IResponse } from "@/type";
import { FileListCache } from "./cache";
import type { ContentType } from "@/types/type";

/**
 * 文件列表 API 响应数据结构
 */
interface FileListResponse<T> {
  count: number;
  data: T[];
}

/**
 * 缓存包装选项
 */
interface CacheWrapperOptions {
  /**
   * API 路径（用于生成缓存键）
   */
  apiPath: string;
  /**
   * 用于去重的字段名，默认为 'contentId'
   * 不同接口可能使用不同的 ID 字段：
   * - 个人空间/共享空间: 'contentId'
   * - 回收站: 'id'
   * - 最近查看: 'id'
   * - 我的分享: 'id'
   */
  idKey?: string;
  /**
   * 页码字段名，默认为 'PageIndex'
   * 搜索接口使用 'pageIndex'
   */
  pageIndexKey?: string;
  pageSizeKey?: string; // 新增：通常分页大小也需要排除
}


type ParamsWithCallback<T> = T & {
  onBackgroundUpdate?: (data: FileListResponse<ContentType>, apiPath: string) => void;
};

/**
 * 包装文件列表 API 函数，实现缓存功能
 *
 * 1. 首次调用：直接请求接口，缓存结果
 * 2. 后续调用：立即返回缓存数据（如果存在），同时后台请求接口更新缓存
 * 3. 分页处理：第一页（PageIndex=1）替换，其他页追加
 *
 * @param apiFunction 原始 API 函数
 * @param options 缓存配置选项
 * @returns 包装后的 API 函数
 */
export function withFileListCache<TDataItem extends ContentType, TParams extends Record<string, any>>(
  apiFunction: (params: TParams) => Promise<IResponse<FileListResponse<TDataItem>>>,
  options: CacheWrapperOptions
): (params: TParams) => Promise<IResponse<FileListResponse<TDataItem>>> {
  const {
    apiPath,
    idKey = "contentId",
    pageIndexKey = "PageIndex",
    pageSizeKey = "PageSize"
  } = options;

  const ignoredHashKeys = [pageIndexKey, pageSizeKey];

  return async (params: ParamsWithCallback<TParams>): Promise<IResponse<FileListResponse<TDataItem>>> => {
    const pageIndex = (params[pageIndexKey] as number) || 1;
    const pageSize = (params[pageSizeKey] as number) || 20;

    let newApiPath = apiPath
    if (params['ContentId']) {
      newApiPath = newApiPath + `_${params['ContentId']}`
    }

    const cachedData = FileListCache.get<TDataItem>(newApiPath, params, ignoredHashKeys);

    const fetchAndUpdate = async (isBackground: boolean) => {
      try {
        const response = await apiFunction(params);
        if (response.code === 1 && response.data) {
          // 更新缓存
          FileListCache.update(
            newApiPath,
            params,
            response.data.data,
            response.data.count,
            pageIndex,
            idKey,
            ignoredHashKeys // 传递忽略 Key
          );

          // 只在后台更新时回调，避免与调用方的主逻辑重复处理
          if (isBackground && params.onBackgroundUpdate) {
            params.onBackgroundUpdate(response.data, newApiPath);
          }
        }
        return response;
      } catch (error) {
        console.error(`[apiCache] Update failed:`, error);
        throw error;
      }
    }

    // 2. 命中缓存逻辑
    if (cachedData) {
      // 按页码切片，只返回当前页对应的数据，避免返回全部累积数据导致重复
      const startIndex = (pageIndex - 1) * pageSize;
      const pageData = cachedData.data.slice(startIndex, startIndex + pageSize);

      // 如果缓存中没有当前页的数据，直接走接口请求
      if (pageData.length === 0) {
        return await fetchAndUpdate(false);
      }

      // 后台静默刷新，通过 onBackgroundUpdate 回调通知调用方
      fetchAndUpdate(true);

      return {
        code: 1,
        data: {
          count: cachedData.count,
          data: pageData,
        },
        msg: 'Loaded from cache'
      } as IResponse<FileListResponse<TDataItem>>;
    }

    return await fetchAndUpdate(false);
  };
}


/**
 * 合并列表
 * @param currentList 当前完整的 UI 列表
 * @param newData 接口返回的当前页新数据
 * @param pageIndex 当前页码
 * @param pageSize 每页条数
 */
export function mergeList<T>(
  currentList: T[],
  newData: T[],
  pageIndex: number,
  pageSize: number
): T[] {
  if (pageIndex === 1) {
    const restList = currentList.slice(pageSize); // 保留第 2 页之后的数据
    return [...newData, ...restList];
  }
  const startIndex = (pageIndex - 1) * pageSize;
  const resultList = [...currentList];
  resultList.splice(startIndex, pageSize, ...newData);
  return resultList;
}

