import request from "@/utils/service";
import type { IResponse } from "@/type";
import type {
  MyShareCallbackParams,
  MyShareParams,
  ShareContentCallbackParams,
  ShareLinkCallbackParams,
  ShareLinkParams,
  ShareFolderCallbackParams,
  ShareContentByMsgCallbackParams,
  ChatUploadFileParams
} from "@/api/type";
import { withFileListCache } from "@/utils/apiCache";

// 原始 API 函数
function _getMyShareListApi(
  params: MyShareParams
): Promise<IResponse<MyShareCallbackParams>> {
  const { PageIndex, PageSize, ShareFile, SortOrder, SortField, StartDate, EndDate } = params
  return request.get("/rest/api/clouddrivesharemanagement/myshare", {
    params: {
      PageIndex, PageSize, ShareFile, SortOrder, SortField, StartDate, EndDate
    }
  });
}

// 使用缓存包装的 API 函数
export const getMyShareListApi = withFileListCache(
  _getMyShareListApi,
  {
    apiPath: "MyShare",
    idKey: "id",
    pageIndexKey: "PageIndex",
  }
);

// 生成分享链接
export function generateShareLinkApi(
  data: ShareLinkParams
): Promise<IResponse<ShareLinkCallbackParams>> {
  const payload: ShareLinkParams = {
    ...data,
    canShare: data.canShare ?? true,
  }
  return request.post(
    "/rest/api/clouddrivesharemanagement/createsharelink",
    payload
  );
}

// 获取链接分享内容（匿名）
export function getShareLinkContentApi(
  shareKey: string,
  psw?: string
): Promise<IResponse<ShareContentCallbackParams>> {
  return request.get("/rest/api/clouddriveshare/detailwithanonymous", {
    params: {
      shareKey,
      psw,
    },
  });
}

// 获取链接分享内容（登录）
export function getShareLinkContentWithLoginApi(
  shareKey: string,
  psw?: string
): Promise<IResponse<ShareContentCallbackParams>> {
  return request.get("/rest/api/clouddriveshare/detail", {
    params: {
      shareKey,
      psw,
    },
  });
}

// 取消分享
export function cancelShareApi(ids: number[]): Promise<IResponse<null>> {
  return request.post("/rest/api/clouddrivesharemanagement/cancelshare", ids);
}

// 客户端外部下载
export function downloadFileOutApi(
  shareId: number,
  contentId: number[]
): Promise<
  IResponse<
    { fileId: string; aesKey: string; fileName: string; size: number }[]
  >
> {
  return request.post("/rest/api/clouddriveshare/download", {
    shareId,
    contentIds: contentId,
  });
}

// 获取分享内容中文件夹中的内容
export function getShareFolderContentApi(
  id: number
): Promise<IResponse<ShareFolderCallbackParams[]>> {
  return request.get("/rest/api/clouddriveshare/share", {
    params: {
      id,
    },
  });
}

// 保存到云盘
export function saveToCloudDriveApi(data: {
  contentIds: number[];
  targetContentId: number;
  shareId?: number;
}): Promise<IResponse<any>> {
  return request.post(
    "/rest/api/clouddrivesharemanagement/savesharefiles",
    data
  );
}

// 消息获取分享内容
export function getShareContentByMessageApi(
  contentIds: number[]
): Promise<IResponse<ShareContentByMsgCallbackParams[]>> {
  return request.post("/rest/api/clouddriveshare/contentinfo", contentIds);
}

// 检查是否可以分享
export function checkSharePermissionApi(
  contentIds: number[]
): Promise<IResponse<null>> {
  return request.post("/rest/api/clouddrivesharemanagement/check", contentIds);
}

// 客户端内下载文件获取下载参数
export function getShareDownloadParamsApi(
  data: { contentIds: number[] }
): Promise<IResponse<any>> {
  return request.post("/rest/api/clouddriveshare/contentdownload", data);
}

// 聊天窗口上传文件后分享
export function shareContentByChatApi(
  data: ChatUploadFileParams
): Promise<IResponse<any>> {
  return request.post("/rest/api/clouddrivecontent/uploadthenshare", data);
}
