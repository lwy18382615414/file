import request from "@/utils/service";
import type { IResponse } from "@/type";
import type {
  CreateFolderParams,
  MergeCallbackParams,
  TransferFileItem,
  UploadFile2Params,
  UploadFileChunk2Params,
  UploadFileChunkParams,
  UploadFileStep1CallbackParams,
} from "@/api/type";
import config from "@/hooks/config";

const { cloudDriveUploadUrl } = config();

// 文件上传第一步
export function uploadFileStep1Api(
  file: FormData,
  config?: {
    onUploadProgress?: (e: ProgressEvent) => void;
  },
): Promise<IResponse<UploadFileStep1CallbackParams>> {
  return request.post(
    `${cloudDriveUploadUrl.value}/api/file/clouddrive`,
    file,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    },
  );
}

// 文件上传第二步
export function uploadFileStep2Api(
  data: UploadFile2Params,
): Promise<IResponse<Array<string>>> {
  return request.post("/rest/api/clouddrivecontent/uploadfile", data);
}

// 下载文件前获取文件的fileId
export function getDownloadFileIdApi(
  contentId: number,
): Promise<IResponse<{ fileId: string; aesKey: string; size: number }>> {
  return request.get("/rest/api/clouddrivecontent/download", {
    params: {
      contentId,
    },
  });
}

// 下载文件
export function downloadFileApi(fileId: string): Promise<IResponse<any>> {
  return request.get(
    `${cloudDriveUploadUrl.value}/api/file/download/clouddrive`,
    {
      params: {
        fileId,
      },
      responseType: "blob",
    },
  );
}

// 新建文件夹
export function createFolderApi(
  data: CreateFolderParams,
): Promise<IResponse<number>> {
  return request.post("/rest/api/clouddrivecontent/createfolder", data);
}

// 删除文件或目录
export function deleteFileOrDirApi(
  ContentIds: number[] | string[],
): Promise<IResponse<null>> {
  return request.delete("/rest/api/clouddrivecontent/bulkdeletefileandfolder", {
    data: {
      ContentIds,
    },
  });
}

// 文件重命名
export function renameFileApi(
  contentId?: number,
  rename?: string,
): Promise<IResponse<null>> {
  return request.post("/rest/api/clouddrivecontent/renamecontent", {
    contentId,
    rename,
  });
}

// 分片上传文件 - 第一步 请求文件上传
export function requestUploadFileApi(
  data: UploadFileChunkParams,
): Promise<IResponse<string>> {
  return request.post(
    `${cloudDriveUploadUrl.value}/api/file/requestuploadfile`,
    data,
  );
}

// 分片上传文件 - 第二步 上传文件
export function uploadFileChunkApi(
  data: UploadFileChunk2Params,
  signal?: AbortSignal,
): Promise<IResponse<null>> {
  return request.post(
    `${cloudDriveUploadUrl.value}/api/file/chunkuploadfile`,
    {
      ...data,
      onUploadProgress: undefined,
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal,
      onUploadProgress: data.onUploadProgress,
    },
  );
}

// 分片上传文件 - 第三步 合并文件
export function mergeFileApi(data: {
  fileId: string;
  fileName: string;
  md5: string;
  uploadResourceType: number;
}): Promise<IResponse<MergeCallbackParams>> {
  return request.post(`${cloudDriveUploadUrl.value}/api/file/filemerge`, data);
}

// 下载文件次数增加
export function downloadFileCountApi(
  contentIds: number[],
): Promise<IResponse<null>> {
  return request.post("/rest/api/clouddrivecontent/download2", contentIds);
}

// 删除文件前判断文件是否被分享
export function checkFileIsSharedApi(
  contentIds: number[],
): Promise<IResponse<any>> {
  return request.post("/rest/api/clouddrivecontent/checkshare", contentIds);
}

// 聊天文件转存云盘
export function getTransferFileInfoApi(data: {
  transferStorageFiles: TransferFileItem[];
}): Promise<IResponse<any[]>> {
  return request.post(
    `${cloudDriveUploadUrl.value}/api/file/clouddrivetransferstorage`,
    data,
  );
}
