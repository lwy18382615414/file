import type { ContentType } from "@/types/type";

type RowKey = string | number;

export function getRowKey(row: ContentType): RowKey {
  if ('__tempRowId' in row) {
    return row.__tempRowId;
  }
  if ('contentId' in row) {
    return row.contentId;
  }
  if ('id' in row) {
    return row.id;
  }
  return '';
}

/**
 * 从 ContentType 中获取名称
 * 返回 contentName 或 shareFile
 */
export function getName(item: ContentType): string {
  if ('shareFile' in item) {
    return item.shareFile;
  }
  if ('contentName' in item) {
    return item.contentName;
  }
  return '';
}

/**
 * 从 ContentType 中获取大小
 * 返回 contentSize 或 0
 */
export function getSize(item: ContentType): number {
  if ('contentSize' in item) {
    return item.contentSize;
  }
  if ('size' in item) {
    return item.size;
  }
  return 0;
}

/**
 * 从 ContentType 中获取权限类型
 * 返回 permissionType 或 undefined
 */
export function getPermissionType(item: ContentType): number | undefined {
  if ('permissionType' in item) {
    return item.permissionType;
  }
  return undefined;
}

/**
 * 从 ContentType 中获取是否为文件夹
 * 返回 isFolder 或 false
 */
export function getIsFolder(item: ContentType): boolean {
  if ('isFolder' in item) {
    return item.isFolder;
  }
  return false;
}

/**
 * 从 ContentType 中获取是否置顶
 * 返回 isSetTop 或 false
 */
export function getIsSetTop(item: ContentType): boolean {
  if ('isSetTop' in item) {
    return item.isSetTop;
  }
  return false;
}

/**
 * 从 ContentType 中获取是否删除全部
 * 返回 isDeleteAll 或 false
 */
export function getIsDeleteAll(item: ContentType): boolean {
  if ('isDeleteAll' in item) {
    return item.isDeleteAll;
  }
  return false;
}

/**
 * 从 ContentType 中获取用户名
 * 返回 userName 或空字符串
 */
export function getUserName(item: ContentType): string {
  if ('userName' in item) {
    return item.userName;
  }
  return '';
}

/**
 * 从 ContentType 中获取是否来自共享空间
 * 返回 isShare 或 false
 */
export function getIsShare(item: ContentType): boolean {
  if ('isShare' in item) {
    return item.isShare;
  }
  return false;
}

/**
 * 从 ContentType 中获取父级ID
 * 返回 parentId 或 undefined
 */
export function getParentId(item: ContentType): number | undefined {
  if ('parentId' in item) {
    return item.parentId;
  }
  return undefined;
}

/**
 * 从 ContentType 中获取过期时间
 * 返回 expireTime 或 undefined
 */
export function getExpireTime(item: ContentType) {
  if ('expireTime' in item) {
    return item.expireTime;
  }
  return "";
}

/**
 * 从 ContentType 中获取内容ID
 * 返回 contentId 或 undefined（MyShareItem 没有 contentId，只有 id）
 */
export function getContentId(item: ContentType): number | undefined {
  if ('contentId' in item) {
    return item.contentId;
  }
  return undefined;
}

/**
 * 从 ContentType 中获取内容ID
 */
export function getId(item: ContentType): number | undefined {
  if ('id' in item) {
    return item.id;
  }
  return undefined;
}

// 分享次数
export function getShareCount(item: ContentType): number | undefined {
  if ('shareCount' in item) {
    return item.shareCount;
  }
  return 0;
}

//

export function getOperateTime(item: ContentType) {
  if ('operateTime' in item) {
    return item.operateTime;
  }
  return "";
}

export function getDeleteTime(item: ContentType) {
  if ('deleteTime' in item) {
    return item.deleteTime;
  }
  return "";
}

export function getShareTime(item: ContentType) {
  if ('shareTime' in item) {
    return item.shareTime;
  }
  return "";
}

export function getStatus(item: ContentType) {
  if ('status' in item) {
    return item.status;
  }
  return 0;
}

export function getExpireType(item: ContentType) {
  if ('expireType' in item) {
    return item.expireType;
  }
  return 0;
}

