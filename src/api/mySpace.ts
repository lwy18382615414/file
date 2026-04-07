import request from "@/utils/service";
import type { MySpaceCallbackParams, MySpaceParams } from "@/api/type";
import type { IResponse } from "@/type";
import { withFileListCache } from "@/utils/apiCache";

// 原始 API 函数
export function _getMySpaceContentApi(
  params: MySpaceParams,
): Promise<IResponse<MySpaceCallbackParams>> {
  const { PageIndex, PageSize, SortMethod, ContentId, ContentType, SortOrder } =
    params;
  return request.get("/rest/api/clouddrivecontent/personal", {
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
export const getMySpaceContentApi = withFileListCache(_getMySpaceContentApi, {
  apiPath: "Personal",
  idKey: "contentId",
  pageIndexKey: "PageIndex",
  pageSizeKey: "PageSize",
});
