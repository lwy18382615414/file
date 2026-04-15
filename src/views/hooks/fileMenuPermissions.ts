import { getBatchPermissionApi } from "@/api/common";
import { Permission } from "@/enum/permission";
import type { ContentType } from "@/types/type";
import { hasPermission } from "@/utils";
import {
  getContentId,
  getIsDeleteAll,
  getIsFolder,
  getIsSetTop,
  getIsShare,
  getPermissionType,
} from "@/utils/typeUtils";
import { ExplorerPageType } from "@/views/fileExplorer";

export type FileActionKey =
  | "open"
  | "download"
  | "share"
  | "copyLink"
  | "unTop"
  | "top"
  | "rename"
  | "move"
  | "delete"
  | "restore"
  | "deletePermanently"
  | "cancelShare";

export function needsExplicitPermission(
  item: ContentType,
  pageType: ExplorerPageType,
) {
  if (pageType === ExplorerPageType.SHARED) return true;
  if (
    pageType === ExplorerPageType.SEARCH ||
    pageType === ExplorerPageType.RECENT
  ) {
    return getIsShare(item);
  }
  return false;
}

export function canUsePermission(
  item: ContentType,
  permission: Permission,
  pageType: ExplorerPageType,
) {
  const permissionType = getPermissionType(item);

  if (needsExplicitPermission(item, pageType) && permissionType == null) {
    return false;
  }

  return hasPermission(permissionType, permission);
}

export async function ensureMenuPermissions<T extends ContentType>(
  items: T[],
  pageType: ExplorerPageType,
): Promise<T[]> {
  const itemsToFetch = items.filter((item) => {
    if (!needsExplicitPermission(item, pageType)) return false;
    return (getContentId(item) ?? 0) > 0;
  });

  if (!itemsToFetch.length) return items;

  const contentIds = Array.from(
    new Set(
      itemsToFetch
        .map((item) => getContentId(item) ?? 0)
        .filter((id) => id > 0),
    ),
  );

  if (!contentIds.length) return items;

  try {
    const res = await getBatchPermissionApi(contentIds);
    const permissionMap = res.data ?? {};

    return items.map((item) => {
      const contentId = getContentId(item);
      if (contentId == null) return item;
      const permissionType = permissionMap[contentId];
      if (permissionType == null) return item;
      return {
        ...item,
        permissionType,
      } as T;
    });
  } catch {
    return items;
  }
}

export function getSingleMenuActionKeys(
  item: ContentType,
  pageType: ExplorerPageType,
): FileActionKey[] {
  if (pageType === ExplorerPageType.RECYCLE) {
    return ["restore", "deletePermanently"];
  }

  if (pageType === ExplorerPageType.MY_SHARES) {
    const nextActions: FileActionKey[] = ["cancelShare"];
    if (!getIsDeleteAll(item)) {
      nextActions.unshift("copyLink");
    }
    return nextActions;
  }

  const nextActions: FileActionKey[] = [];

  if (getIsFolder(item)) {
    if (canUsePermission(item, Permission.View, pageType)) {
      nextActions.push("open");
    }
  } else if (canUsePermission(item, Permission.View, pageType)) {
    nextActions.push("download");
  }

  if (canUsePermission(item, Permission.Share, pageType)) {
    nextActions.push("share", "copyLink");
  }

  nextActions.push(getIsSetTop(item) ? "unTop" : "top");

  if (
    (pageType === ExplorerPageType.MY ||
      pageType === ExplorerPageType.SHARED) &&
    canUsePermission(item, Permission.Upload, pageType)
  ) {
    nextActions.push("move");
  }

  if (canUsePermission(item, Permission.Edit, pageType)) {
    nextActions.push("rename");
    nextActions.push("delete");
  }

  return nextActions;
}

export function getMultiMenuActionKeys(
  items: ContentType[],
  pageType: ExplorerPageType,
): FileActionKey[] {
  if (pageType === ExplorerPageType.RECYCLE) {
    return ["restore", "deletePermanently"];
  }

  if (pageType === ExplorerPageType.MY_SHARES) {
    return ["cancelShare"];
  }

  const nextActions: FileActionKey[] = [];
  const allFiles = items.every((item) => !getIsFolder(item));

  if (
    items.every((item) => canUsePermission(item, Permission.Share, pageType))
  ) {
    nextActions.push("share", "copyLink");
  }

  if (
    (pageType === ExplorerPageType.MY ||
      pageType === ExplorerPageType.SHARED) &&
    items.every((item) => canUsePermission(item, Permission.Upload, pageType))
  ) {
    nextActions.push("move");
  }

  if (
    items.every((item) => canUsePermission(item, Permission.Edit, pageType))
  ) {
    nextActions.push("delete");
  }

  if (
    allFiles &&
    items.every((item) => canUsePermission(item, Permission.View, pageType))
  ) {
    nextActions.unshift("download");
  }

  return nextActions;
}
