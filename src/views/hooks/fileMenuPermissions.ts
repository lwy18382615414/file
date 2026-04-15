import { getBatchPermissionApi, getFolderPermissionApi } from "@/api/common";
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
import type { AuthHeaderActionKey } from "@/types/headerActionTypes";

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
    canUsePermission(item, Permission.Edit, pageType)
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
    items.every((item) => canUsePermission(item, Permission.Edit, pageType))
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

export type BatchActionPermissionState = {
  allowedItems: ContentType[];
  deniedItems: ContentType[];
  deniedCount: number;
};

export function createEmptyBatchActionPermissionState(
  items: ContentType[] = [],
): BatchActionPermissionState {
  return {
    allowedItems: items,
    deniedItems: [],
    deniedCount: 0,
  };
}

const HEADER_ACTION_PERMISSION_MAP: Record<AuthHeaderActionKey, Permission> = {
  download: Permission.View,
  share: Permission.Share,
  move: Permission.Edit,
  copyLink: Permission.Share,
  delete: Permission.Edit,
};

export async function resolveBatchActionPermissions(
  items: ContentType[],
  action: AuthHeaderActionKey,
  pageType: ExplorerPageType,
): Promise<BatchActionPermissionState> {
  if (!items.length) {
    return createEmptyBatchActionPermissionState([]);
  }

  const itemsWithPermissions = await ensureMenuPermissions(items, pageType);
  const permission = HEADER_ACTION_PERMISSION_MAP[action];

  const allowedItems = itemsWithPermissions.filter((item) => {
    if (action === "download" && getIsFolder(item)) {
      return false;
    }

    return canUsePermission(item, permission, pageType);
  });

  const deniedItems = itemsWithPermissions.filter(
    (item) => !allowedItems.includes(item),
  );

  return {
    allowedItems,
    deniedItems,
    deniedCount: deniedItems.length,
  };
}

export async function isHavNewAuth(
  contentId: number,
  pageType: ExplorerPageType,
) {
  if (
    pageType === ExplorerPageType.RECENT ||
    pageType === ExplorerPageType.MY
  ) {
    return true;
  }

  if (
    pageType === ExplorerPageType.MY_SHARES ||
    pageType === ExplorerPageType.RECYCLE ||
    pageType === ExplorerPageType.SEARCH
  ) {
    return false;
  }

  if (pageType === ExplorerPageType.SHARED) {
    const res = await getFolderPermissionApi(contentId);
    if (res.code !== 1) return false;

    const permissionType = res.data.permissionType;
    return hasPermission(permissionType, Permission.Upload);
  }

  return false;
}
