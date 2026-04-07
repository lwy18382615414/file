import { ref, unref, type Ref } from "vue";
import type { ContentType } from "@/types/type";
import { Permission } from "@/enum/permission";
import { hasPermission, t } from "@/utils";
import { ExplorerPageType } from "@/views/fileExplorer";
import { useFileSelection } from "@/hooks/useFileSelection";
import {
  getIsDeleteAll,
  getIsFolder,
  getIsSetTop,
  getPermissionType,
  getRowKey,
} from "@/utils/typeUtils";

export type PcFileContextActionKey =
  | "open"
  | "download"
  | "share"
  | "copyLink"
  | "unTop"
  | "top"
  | "rename"
  | "delete"
  | "restore"
  | "deletePermanently"
  | "cancelShare";

export type PcFileContextAction = {
  key: PcFileContextActionKey;
  label: string;
  danger?: boolean;
};

const MENU_WIDTH = 168;
const MENU_ITEM_HEIGHT = 36;
const MENU_PADDING = 8;
const VIEWPORT_GAP = 8;
const CURSOR_OFFSET = -12;

export function usePcFileContextMenu(options: {
  pageType: Ref<ExplorerPageType>;
}) {
  const { selected } = useFileSelection();

  const visible = ref(false);
  const position = ref({ x: 0, y: 0 });
  const actions = ref<PcFileContextAction[]>([]);
  const contextItems = ref<ContentType[]>([]);
  const anchorRow = ref<ContentType | null>(null);

  const canUsePermission = (
    item: ContentType,
    permission: Permission,
    pageType: ExplorerPageType,
  ) => {
    const permissionType = getPermissionType(item);

    if (
      pageType === ExplorerPageType.SHARED ||
      pageType === ExplorerPageType.SEARCH
    ) {
      if (permissionType == null) return false;
    }

    return hasPermission(permissionType, permission);
  };

  const buildSingleActions = (
    item: ContentType,
    pageType: ExplorerPageType,
  ): PcFileContextAction[] => {
    if (pageType === ExplorerPageType.RECYCLE) {
      return [
        { key: "restore", label: t("restore") },
        { key: "deletePermanently", label: t("deletePermanently") },
      ];
    }

    if (pageType === ExplorerPageType.MY_SHARES) {
      const nextActions: PcFileContextAction[] = [
        { key: "cancelShare", label: t("cancelShare") },
      ];
      if (!getIsDeleteAll(item)) {
        nextActions.unshift({ key: "copyLink", label: t("copyLink") });
      }
      return nextActions;
    }

    const nextActions: PcFileContextAction[] = [];
    const isFolder = getIsFolder(item);

    if (isFolder) {
      if (canUsePermission(item, Permission.View, pageType)) {
        nextActions.push({ key: "open", label: t("open") });
      }
    } else if (canUsePermission(item, Permission.View, pageType)) {
      nextActions.push({ key: "download", label: t("download") });
    }

    if (canUsePermission(item, Permission.Share, pageType)) {
      nextActions.push({ key: "share", label: t("shareToFriend") });
      nextActions.push({ key: "copyLink", label: t("copyLink") });
    }

    if (getIsSetTop(item)) {
      nextActions.push({ key: "unTop", label: t("unpin") });
    } else {
      nextActions.push({ key: "top", label: t("pin") });
    }

    if (canUsePermission(item, Permission.Edit, pageType)) {
      nextActions.push({ key: "rename", label: t("rename") });
      nextActions.push({ key: "delete", label: t("delete"), danger: true });
    }

    return nextActions;
  };

  const buildMultiActions = (
    items: ContentType[],
    pageType: ExplorerPageType,
  ): PcFileContextAction[] => {
    if (
      pageType === ExplorerPageType.RECYCLE ||
      pageType === ExplorerPageType.MY_SHARES
    ) {
      return [];
    }

    const nextActions: PcFileContextAction[] = [];
    const allFiles = items.every((item) => !getIsFolder(item));

    if (
      items.every((item) => canUsePermission(item, Permission.Share, pageType))
    ) {
      nextActions.push({ key: "share", label: t("shareToFriend") });
      nextActions.push({ key: "copyLink", label: t("copyLink") });
    }

    if (
      items.every((item) => canUsePermission(item, Permission.Edit, pageType))
    ) {
      nextActions.push({ key: "delete", label: t("delete"), danger: true });
    }

    if (
      allFiles &&
      items.every((item) => canUsePermission(item, Permission.View, pageType))
    ) {
      nextActions.unshift({ key: "download", label: t("download") });
    }

    return nextActions;
  };

  const resolvePosition = (event: MouseEvent, actionCount: number) => {
    const menuHeight = actionCount * MENU_ITEM_HEIGHT + MENU_PADDING * 2;
    const rawX = event.clientX + CURSOR_OFFSET;
    const rawY = event.clientY + CURSOR_OFFSET;
    const maxX = window.innerWidth - MENU_WIDTH - VIEWPORT_GAP;
    const maxY = window.innerHeight - menuHeight - VIEWPORT_GAP;

    return {
      x: Math.max(VIEWPORT_GAP, Math.min(rawX, maxX)),
      y: Math.max(VIEWPORT_GAP, Math.min(rawY, maxY)),
    };
  };

  const close = () => {
    visible.value = false;
    actions.value = [];
    contextItems.value = [];
    anchorRow.value = null;
  };

  const openForRow = (row: ContentType, event: MouseEvent) => {
    const pageType = unref(options.pageType);
    const rowKey = getRowKey(row);
    const selectedItems = selected.value.some(
      (item) => getRowKey(item) === rowKey,
    )
      ? [...selected.value]
      : [row];

    const nextActions =
      selectedItems.length > 1
        ? buildMultiActions(selectedItems, pageType)
        : buildSingleActions(row, pageType);

    if (!nextActions.length) {
      close();
      return;
    }

    anchorRow.value = row;
    contextItems.value = selectedItems;
    actions.value = nextActions;
    position.value = resolvePosition(event, nextActions.length);
    visible.value = true;
  };

  return {
    visible,
    position,
    actions,
    contextItems,
    anchorRow,
    openForRow,
    close,
  };
}
