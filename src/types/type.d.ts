import type { ElTableColumn } from "element-plus";

// 最近查看
export type RecentViewItem = {
  contentId: number;
  contentName: string;
  fileId: string;
  id: number;
  operateTime: string;
  userName: string;
  contentSize: number;
  tenantId: number;
};

// 个人云盘空间
export type PersonalCloudContent = {
  contentId: number;
  parentId: number;
  contentName: string;
  operateTime: string; // ISO 8601 时间字符串
  userName: string;
  contentSize: number; // 文件大小（文件夹通常为 0）
  isFolder: boolean; // 是否为文件夹
  path: string; // 完整路径
  isSetTop: boolean; // 是否置顶
};

// 共享云盘空间
export type SharedCloudContent = {
  contentId: number;
  parentId: number;
  contentName: string;
  operateTime: string; // ISO 8601 时间字符串
  userName: string;
  contentSize: number; // 文件大小（文件夹通常为 0）
  isFolder: boolean; // 是否为文件夹
  path: string; // 完整路径
  isSetTop: boolean; // 是否置顶
  permissionType: number; // 权限类型（如：0=只读，1=可编辑，2=管理等）
};

// 回收站
export type RecycleBinItem = {
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
};

// 我的分享
export type MyShareItem = {
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
};

// 搜索结果
export type CloudSearchResultItem = {
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
};

// 页面数据项类型映射
export type PageDataItemMap = {
  recent: RecentViewItem;
  my: PersonalCloudContent;
  folder: PersonalCloudContent;
  shareSpace: SharedCloudContent;
  recycleBin: RecycleBinItem;
  myShare: MyShareItem;
  searchResult: CloudSearchResultItem;
};

export type ContentType = PageDataItemMap[keyof PageDataItemMap];

// 人员权限
export interface PermissionItem {
  id: number;
  label: string;
  canEdit: boolean;
  avatar?: string;
  permissionType: number;
  userId?: number;
  orgId?: string | number;
  tagId?: string | number;
  children?: PermissionItem[];
}

// 定义列的类型选项
export type TableColumnType = "selection" | "index" | "expand" | undefined;

// 路由栈的节点结构
export interface RouteNode {
  id: number | string; // 文件夹ID
  name: string; // 文件夹名称
  fullPath: string; // 对应的完整路由路径
}

// 定义列配置类型
export type TableColumn<T = any> = {
  type?: TableColumnType;
  label?: string;
  prop?: keyof T; // 确保prop是T的键
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  fixed?: boolean | string;
  slots?: string;
  renderType?: string;
  align?: "left" | "center" | "right";
  headerSlot?: string;
  selectable?: boolean;
  resizable?: boolean;
} & Omit<
  Partial<InstanceType<typeof ElTableColumn>["$props"]>,
  "type" | "prop" | "label"
>;

export type FileIconType =
  | "file-pic"
  | "file-excel"
  | "file-music"
  | "file-pdf"
  | "file-ppt"
  | "file-txt"
  | "file-video"
  | "file-work"
  | "file-zip"
  | "file-known";

export type DownloadOptions = {
  apiFunction: (fileId: string) => Promise<any>; // 文件下载API函数
  contentId: number; // 文件ID
  fileName: string; // 下载文件名
  blobOptions?: BlobPropertyBag; // Blob配置项（可选）
};

export type DownloadAppOptions = {
  contentId: number; // 文件ID
  fileName: string; // 下载文件名
  fileSize: number; // 文件大小
};

export type TransFileInfo = {
  fileId: string;
  fileUrl: string;
  fileSize: number;
  fileName: string;
};

// 定义收集到的项结构
export type CollectedFileItem = {
  file: File;
  parentId: number | undefined; // undefined 表示根目录
};
