import type { AxiosProgressEvent } from "axios";

// 获取验证码参数
export type SmsCodeParams = {
  areaCode: string;
  phoneNo: string;
  type: number;
};

// 登录参数
export type LoginByCodeParams = {
  areaCode: string;
  phoneNo: string;
  code: string;
};

// 登录回调参数
export type LoginCallbackParams = {
  expiration: number;
  tenantId: string;
  token: string;
};

// 获取企业信息回调参数
export type EnterPriseCallbackParams = {
  enterpriseID: string;
  name: string;
  shortName: string;
  tenantId: number;
};

// 获取个人云盘空间列表
export type MySpaceParams = {
  PageIndex: number;
  PageSize: number;
  SortMethod?: number; // number-文档大小，1-时间先后
  ContentName?: string;
  ContentId?: number;
  ContentType?: number; // 1-文件夹，2-文件
  SortOrder?: string; // 1-升序，number-降序
};

// 获取个人空间内容列表回调参数
export type MySpaceCallbackParams = {
  count: number;
  data: Array<{
    contentId: number;
    contentSize: number;
    isFolder: boolean;
    isSetTop: boolean;
    contentName: string;
    operateTime: string;
    parentId: number;
    path: string;
    userName: string;
  }>;
};

// 获取共享空间列表
export type ShareSpaceParams = {
  PageIndex: number;
  PageSize: number;
  SortMethod?: number; // number0-文档大小，1-时间先后， 2文件名
  ContentName?: string;
  ContentId?: number;
  ContentType?: number;
  SortOrder?: string; // 1-升序，number-降序
};

export type RecentViewBachParams = {
  count: number;
  data: Array<{
    id: number;
    tenantId: number;
    contentId: number;
    contentName: string;
    operateTime: string;
    userName: string;
    contentSize: number;
    fileId: string;
  }>;
};

// 上传文件回调参数
export type UploadFileStep1CallbackParams = {
  name: string;
  fileId: string;
  size: number;
};

// 获取共享空间内容列表回调参数
export type ShareSpaceCallbackParams = {
  count: number;
  data: Array<{
    contentId: number;
    parentId: number;
    contentName: string;
    operateTime: string;
    userName: string;
    contentSize: number;
    isFolder: true;
    path: string;
    permissionType: number;
    isSetTop: boolean;
  }>;
};

// 回收站内容列表回数
export type RecycleBinCallbackParams = {
  count: number;
  data: {
    id: number; // 回收站记录 ID
    contentId: number; // 原内容 ID（文件 / 文件夹）
    contentName: string;
    isFolder: boolean; // 是否为文件夹
    deleteTime: string; // 删除时间（ISO 8601）
    userName: string; // 删除人
    contentSize: number; // 文件大小（文件夹通常为 0）
    expireTime: string; // 过期时间（自动清理时间）
    fileId: string; // 文件唯一标识（文件夹可能为空字符串）
    path: string; // 原路径
  }[];
};

// 搜索结果回参
export type CloudSearchCallBackParams = {
  count: number;
  data: {
    contentId: number;
    parentId: number;
    contentName: string;
    operateTime: string; // ISO 8601 时间字符串
    userName: string;
    contentSize: number; // 文件大小（文件夹通常为 0）
    isFolder: boolean; // 是否为文件夹
    path: string; // 完整路径
    isSetTop: boolean; // 是否置顶
    isShare: boolean; // 是否来自共享空间
  }[];
};

// 组织树回参
export type OrgTreeCallbackParams = {
  id: number;
  isSearch: boolean;
  isShow: boolean;
  orgName: string;
  orgType: number;
  parentOrgId: number;
  children: OrgTreeCallbackParams[];
  user: {
    avatar: string;
    englishName: string;
    isSearch: boolean;
    isShow: boolean;
    jobnumber: string;
    nickName: string;
    orgJson: string;
    userId: number;
  }[];
};

// 文件上传第二部
export type UploadFile2Params = {
  fileInfos: {
    name: string;
    fileId: string;
    size: number;
    aesKey?: string;
  }[];
  contentId: number;
  repeatFileOperateType: number;
  viewRanges:
    | {
        userId: string;
        orgId: string;
        tagId: string;
      }[]
    | [];
  editRanges:
    | {
        userId: string;
        orgId: string;
        tagId: string;
      }[]
    | [];
  aesKey?: string;
};

// 创建文件夹
export type CreateFolderParams = {
  currentContentId: number;
  folderName: string;
  viewRanges:
    | {
        userId: string;
        orgId: string;
        tagId: string;
      }[]
    | [];

  editRanges:
    | {
        userId: string;
        orgId: string;
        tagId: string;
      }[]
    | [];
  isPersonal?: boolean;
};

// 文件分片上传 - 第一步 请求文件上传
export type UploadFileChunkParams = {
  fileName: string;
  chunks: number;
  fileLength: number;
};

// 文件分片上传 - 第二步 上传文件
export type UploadFileChunk2Params = {
  fileId: string;
  chunkId: number;
  Md5: string;
  File: File;
  onUploadProgress?: (e: AxiosProgressEvent) => void | undefined;
};

// 合并分片上传的回参
export type MergeCallbackParams = {
  name: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  extension: string;
  thumbnailUrl: string;
};

// 获取我的分享列表
export type MyShareParams = {
  PageIndex: number;
  PageSize: number;
  StartDate?: string; // 开始时间
  EndDate?: string; // 结束时间
  ShareFile?: string; // 分享文件名称
  SortField?: number; // 排序字段 0-分享文件 1-分享时间
  SortOrder?: string; // 排序方式
};

// 我的分享列表回参
export type MyShareCallbackParams = {
  count: number;
  data: {
    id: number; // 分享记录 ID
    shareFile: string; // 分享的文件 / 文件夹名称或标识
    shareTime: string; // 分享时间
    expireType: number; // 过期类型
    expireTime: string; // 过期时间
    status: number; // 分享状态
    shareCount: number; // 分享次数
    shareKey: string; // 分享访问 key
    sharePassword: string; // 提取码（可能为空）
    canShare: boolean; // 是否允许再次分享
    downloadCount: number; // 下载次数
    saveCount: number; // 转存次数
    viewCount: number; // 浏览次数
    isDeleteAll: boolean; // 取消分享时是否删除全部
  }[];
};

// 生成分享链接参数
export type ShareLinkParams = {
  contentIds: number[];
  expireType: number; // 0 - none, 1 - 1天, 2 - 7天, 3 - 1月, 4 - 1年, 5 - 永久
  passwordType: number; // 0 - none, 1 - 系统随机, 2 - 自定义
  password?: string;
  canShare?: boolean;
};

export type ShareLinkCallbackParams = {
  shareKey: string;
  password: string;
};

export type ShareContentCallbackParams = {
  avatar: string;
  userName: string;
  name: string;
  shareTime: string;
  expiredTime: string;
  contents: {
    contentId: number;
    name: string;
    isFolder: boolean;
    size: number;
    updateAt: string;
    isDelete: boolean;
  }[];
  needPassword: boolean;
  expiredType: number;
  shareId: number;
};

export type ShareFolderCallbackParams = {
  contentId: number;
  parentId: number;
  contentName: string;
  operateTime: string;
  contentSize: number;
  isFolder: boolean;
  path: string;
  isSetTop: boolean;
};

export type ShareContentByMsgCallbackParams = {
  contentId: number;
  name: string;
  isFolder: boolean;
  size: number;
  updateAt: string;
  isDelete: boolean;
};

// 聊天文件转存云盘
export type TransferFileItem = {
  fileId: string;
  fileUrl: string;
  aesKey: string;
};

// 聊天窗口上传云盘并分享
export type ChatUploadFileParams = {
  fileInfos: {
    name: string;
    fileId: string;
    size: number;
    aesKey?: string;
  }[];
  contentId: number;
};

// 云盘周统计
export type WeeklyReportParams = {
  StartTime: string;
  EndTime: string;
  PageIndex: number;
  PageSize: number;
};

export type WeeklyReportType = {
  contentName: string;
  operateTime: string;
  userName: string;
  operationType: number;
  isFolder: boolean;
};

export type WeeklyReportBack = {
  count: number;
  data: WeeklyReportType[];
};
