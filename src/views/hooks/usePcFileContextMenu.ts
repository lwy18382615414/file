import { ref, unref, type Ref } from "vue";
import type { ContentType } from "@/types/type";
import { t } from "@/utils";
import { ExplorerPageType } from "@/views/fileExplorer";
import { useFileSelection } from "@/hooks/useFileSelection";
import { getRowKey } from "@/utils/typeUtils";
import {
  ensureMenuPermissions,
  getMultiMenuActionKeys,
  getSingleMenuActionKeys,
  type FileActionKey,
} from "./fileMenuPermissions";

export type PcFileContextActionKey =
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
  | "cancelShare"
  | "permission"
  | "exit";

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

  const actionLabelMap: Record<FileActionKey, string> = {
    open: t("open"),
    download: t("download"),
    share: t("shareToFriend"),
    copyLink: t("copyLink"),
    unTop: t("unpin"),
    top: t("pin"),
    rename: t("rename"),
    move: t("moveTo"),
    delete: t("delete"),
    restore: t("restore"),
    deletePermanently: t("deletePermanently"),
    cancelShare: t("cancelShare"),
  };

  const buildActions = (keys: FileActionKey[]): PcFileContextAction[] => {
    return keys.map((key) => ({
      key,
      label: actionLabelMap[key],
      ...(key === "delete" ? { danger: true } : {}),
    }));
  };

  const buildSingleActions = (
    item: ContentType,
    pageType: ExplorerPageType,
  ): PcFileContextAction[] => {
    return buildActions(getSingleMenuActionKeys(item, pageType));
  };

  const buildMultiActions = (
    items: ContentType[],
    pageType: ExplorerPageType,
  ): PcFileContextAction[] => {
    return buildActions(getMultiMenuActionKeys(items, pageType));
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

  const openForRow = async (row: ContentType, event: MouseEvent) => {
    const pageType = unref(options.pageType);
    const rowKey = getRowKey(row);
    const selectedItems = selected.value.some(
      (item) => getRowKey(item) === rowKey,
    )
      ? [...selected.value]
      : [row];

    const itemsWithPermission = await ensureMenuPermissions(selectedItems, pageType);
    const nextRow =
      itemsWithPermission.find((item) => getRowKey(item) === rowKey) ?? row;

    const nextActions =
      itemsWithPermission.length > 1
        ? buildMultiActions(itemsWithPermission, pageType)
        : buildSingleActions(nextRow, pageType);

    if (!nextActions.length) {
      close();
      return;
    }

    anchorRow.value = nextRow;
    contextItems.value = itemsWithPermission;
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
