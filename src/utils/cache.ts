// cache.ts

import { SessionStorageUtil } from "./index";
import type { ContentType } from "@/types/type";

/**
 * 缓存项数据结构
 */
export interface CacheItem<T> {
  data: T[];
  count: number;
  timestamp: number; // 用于调试，不用于过期判断
  pageIndex: number; // 当前页码
  params: Record<string, any>; // 请求参数快照
}

/**
 * 统一的缓存数据结构
 * 使用嵌套结构：{ [apiPath]: { [paramsHash]: CacheItem } }
 */
interface UnifiedCacheStore {
  [apiPath: string]: {
    [paramsHash: string]: CacheItem<ContentType>;
  };
}

/**
 * 文件列表缓存工具类
 * 使用统一的缓存键，内部使用嵌套结构组织不同接口的数据
 */
export class FileListCache {
  private static readonly UNIFIED_CACHE_KEY = "file_list_cache";

  /**
   * 生成参数哈希值
   * 对参数对象进行排序后 JSON.stringify，生成简单的 hash
   */
  private static generateParamsHash(params: Record<string, any>, ignoredKeys: string[] = []): string {
    const filteredParams = { ...params };
    delete filteredParams.timeStamp;

    ignoredKeys.forEach(key => delete filteredParams[key])

    const sortedKeys = Object.keys(filteredParams).sort();
    const sortedParams: Record<string, any> = {};
    sortedKeys.forEach((key) => {
      sortedParams[key] = filteredParams[key];
    });

    const paramsStr = JSON.stringify(sortedParams);

    let hash = 0;
    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取统一的缓存存储
   */
  private static getCacheStore(): UnifiedCacheStore {
    const store = SessionStorageUtil.get<UnifiedCacheStore>(this.UNIFIED_CACHE_KEY);
    return store || {};
  }

  /**
   * 保存统一的缓存存储
   */
  private static saveCacheStore(store: UnifiedCacheStore): void {
    SessionStorageUtil.set(this.UNIFIED_CACHE_KEY, store);
  }

  /**
   * 从 sessionStorage 读取缓存
   */
  static get<T>(apiPath: string, params: Record<string, any>, ignoredKeys: string[] = []): CacheItem<T> | null {
    try {
      const store = this.getCacheStore();
      const paramsHash = this.generateParamsHash(params, ignoredKeys);
      const apiCache = store[apiPath];
      if (!apiCache) return null;
      return (apiCache[paramsHash] as CacheItem<T>) || null;
    } catch (error) {
      console.error("[FileListCache] get error:", error);
      return null;
    }
  }

  /**
   * 写入缓存到 sessionStorage
   */
  static set(
    apiPath: string,
    params: Record<string, any>,
    data: ContentType[],
    count: number,
    pageIndex: number,
    ignoredKeys: string[] = []
  ): void {
    try {
      const store = this.getCacheStore();
      const paramsHash = this.generateParamsHash(params, ignoredKeys);

      if (!store[apiPath]) {
        store[apiPath] = {};
      }

      store[apiPath][paramsHash] = {
        data,
        count,
        timestamp: Date.now(),
        pageIndex,
        params: { ...params },
      };
      this.saveCacheStore(store);

    } catch (error) {
      console.error("[FileListCache] set error:", error);
    }
  }

  /**
   * 合并缓存数据（用于分页增量更新）
   * @param existingCache 现有缓存
   * @param newData 新数据
   * @param newCount 新的总数
   * @param pageIndex 当前页码
   * @param idKey 用于去重的字段名（如 'contentId', 'id'）
   */
  static merge<T extends Record<string, any>>(
    existingCache: CacheItem<T> | null,
    newData: T[],
    newCount: number,
    pageIndex: number,
    idKey: string = "contentId"
  ): CacheItem<T> {
    // 如果是第一页，直接替换
    if (pageIndex === 1 || !existingCache) {
      return {
        data: [...newData],
        count: newCount,
        timestamp: Date.now(),
        pageIndex,
        params: existingCache?.params || {},
      };
    }

    const existingIds = new Set(
      existingCache.data.map((item) => item[idKey])
    );
    const uniqueNewData = newData.filter(
      (item) => !existingIds.has(item[idKey])
    );

    return {
      data: [...existingCache.data, ...uniqueNewData],
      count: newCount,
      timestamp: Date.now(),
      pageIndex,
      params: existingCache.params,
    };
  }

  /**
   * 更新缓存（自动处理合并逻辑）
   */
  static update(
    apiPath: string,
    params: Record<string, any>,
    newData: ContentType[],
    newCount: number,
    pageIndex: number,
    idKey: string = "contentId",
    ignoredKeys: string[] = []
  ): void {
    const existingCache = this.get<ContentType>(apiPath, params, ignoredKeys);
    const mergedCache = this.merge(
      existingCache,
      newData,
      newCount,
      pageIndex,
      idKey
    );

    this.set(apiPath, params, mergedCache.data, mergedCache.count, mergedCache.pageIndex, ignoredKeys);
  }

  /**
   * 删除指定缓存
   */
  static remove(apiPath: string, params: Record<string, any>, ignoredKeys: string[] = []): void {
    try {
      const store = this.getCacheStore();
      const paramsHash = this.generateParamsHash(params, ignoredKeys);
      if (store[apiPath] && store[apiPath][paramsHash]) {
        delete store[apiPath][paramsHash];
        // 如果该 API 路径下没有缓存了，删除整个路径
        if (Object.keys(store[apiPath]).length === 0) {
          delete store[apiPath];
        }
        this.saveCacheStore(store);
      }
    } catch (error) {
      console.error("[FileListCache] remove error:", error);
    }
  }

  /**
   * 清除所有文件列表缓存
   */
  static clearAll(): void {
    try {
      SessionStorageUtil.remove(this.UNIFIED_CACHE_KEY);
    } catch (error) {
      console.error("[FileListCache] clearAll error:", error);
    }
  }
}

