import request from "@/utils/service";
import type { IResponse } from "@/type";
import type { RecycleBinCallbackParams } from "@/api/type";
import { withFileListCache } from "@/utils/apiCache";

// 原始 API 函数
function _getRecycleBinList(params: {
  PageIndex: number;
  PageSize: number;
  name?: string;
  SortMethod?: number;
  SortOrder?: string;
}): Promise<IResponse<RecycleBinCallbackParams>> {
  return request.get("/rest/api/clouddriverecyclebin", {
    params: {
      pageIndex: params.PageIndex,
      pageSize: params.PageSize,
      name: params.name,
      sortMethod: params.SortMethod,
      sortOrder: params.SortOrder,
    },
  });
}

// 使用缓存包装的 API 函数
// 注意：这里需要将 pageIndex 转换为 PageIndex 以保持参数一致性
export const getRecycleBinList = withFileListCache(
  _getRecycleBinList,
  {
    apiPath: "RecycleBin",
    idKey: "contentId",
    pageIndexKey: "PageIndex",
  }
);

// 删除文件
export function deleteFileApi(data: {
  ids: number[];
}): Promise<IResponse<null>> {
  return request.post(`/rest/api/clouddriverecyclebin/batchdeletefile`, data);
}

// 还原文件
export function restoreFile(data: {
  restoreFiles: {
    id: number;
    contentId: number;
  }[];
  repeatFileOperateType: number;
}): Promise<IResponse<Record<string, string>[]>> {
  return request.post(`/rest/api/clouddriverecyclebin/batchrestorefiles`, data);
}

// 清空回收站
export function clearRecycleBinApi(): Promise<IResponse<null>> {
  return request.post("/rest/api/clouddriverecyclebin/emptyingrecyclebin");
}
