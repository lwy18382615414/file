import request from "@/utils/service";
import type { IResponse } from "@/type";
import type { MySpaceParams, RecentViewBachParams } from "@/api/type";
import { withFileListCache } from "@/utils/apiCache";

// 原始 API 函数
function _getRecentViewApi(
  params: MySpaceParams,
): Promise<IResponse<RecentViewBachParams>> {
  const { PageIndex, PageSize } = params
  return request.get("/rest/api/clouddriveoperationlogs/recentlyviewed", {
    params: {
      PageIndex,
      PageSize,
    }
  });
}

// 使用缓存包装的 API 函数
export const getRecentViewApi = withFileListCache(
  _getRecentViewApi,
  {
    apiPath: "RecentView",
    idKey: "contentId",
    pageIndexKey: "PageIndex",
    pageSizeKey: "PageSize"
  }
);
