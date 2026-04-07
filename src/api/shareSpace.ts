import request from "@/utils/service";
import type { IResponse } from "@/type";
import type { ShareSpaceCallbackParams, ShareSpaceParams } from "@/api/type";
import { withFileListCache } from "@/utils/apiCache";

// 原始 API 函数
export function _getShareSpace(
  params: ShareSpaceParams,
): Promise<IResponse<ShareSpaceCallbackParams>> {
  const { PageIndex, PageSize, SortMethod, ContentId, ContentType, SortOrder } =
    params;
  return request.get("/rest/api/clouddrivecontent/share", {
    params: {
      PageIndex,
      PageSize,
      SortMethod,
      ContentId,
      ContentType,
      SortOrder,
    },
  });
}

// 使用缓存包装的 API 函数
export const getShareSpace = withFileListCache(_getShareSpace, {
  apiPath: "ShareSpace",
  idKey: "contentId",
  pageIndexKey: "PageIndex",
});
