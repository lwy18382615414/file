import { computed, ref } from "vue";
import type { ContentType } from "@/types/type";
import { getContentId, getPermissionType } from "@/utils/typeUtils";
import type { FileMenuAction } from "../components/h5/pop/FileMenuPopup.vue";
import { useI18n } from "vue-i18n";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { useRoute, useRouter } from "vue-router";
import {
  ensureMenuPermissions,
  type FileActionKey,
  getSingleMenuActionKeys,
} from "./fileMenuPermissions";

const actionIconMap: Record<FileActionKey, string> = {
  open: "co_open",
  download: "co_download",
  share: "co_share",
  copyLink: "co_copy",
  rename: "co_rename",
  move: "co_move",
  top: "co_topSet",
  unTop: "co_topSet",
  delete: "co_delete",
  restore: "co_restore",
  deletePermanently: "co_delete",
  cancelShare: "co_delete",
};

const actionLabelKeyMap: Record<FileActionKey, string> = {
  open: "open",
  download: "download",
  share: "shareToFriend",
  copyLink: "copyLink",
  rename: "rename",
  move: "move",
  top: "pin",
  unTop: "unpin",
  delete: "delete",
  restore: "restore",
  deletePermanently: "deletePermanently",
  cancelShare: "cancelShare",
};

const buildMenuActions = (
  keys: FileActionKey[],
  t: (key: string) => string,
): FileMenuAction[] => {
  return keys.map((key) => ({
    key: key === "copyLink" ? "copy" : key,
    label: t(actionLabelKeyMap[key]),
    icon: actionIconMap[key],
  }));
};

export function useFileMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();

  const menuVisible = ref(false);
  const activeItem = ref<ContentType | null>(null);

  const menuActions = computed<FileMenuAction[]>(() => {
    if (!activeItem.value) return [];
    const context = getExplorerContext(route);
    return buildMenuActions(
      getSingleMenuActionKeys(activeItem.value, context.pageType),
      t,
    );
  });

  const handleMenu = async (item: ContentType) => {
    const context = getExplorerContext(route);

    if (context.pageType === ExplorerPageType.SHARED && context.isRoot) {
      router.push({
        path: "/space-setting",
        query: {
          contentId: getContentId(item),
          permissionType: getPermissionType(item),
        },
      });
      return;
    }

    const [itemWithPermission] = await ensureMenuPermissions(
      [item],
      context.pageType,
    );
    activeItem.value = itemWithPermission ?? item;
    menuVisible.value = true;
  };

  const handleMenuClose = () => {
    activeItem.value = null;
  };

  return {
    menuVisible,
    activeItem,
    menuActions,
    handleMenu,
    handleMenuClose,
  };
}
