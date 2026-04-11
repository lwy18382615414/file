import { computed, ref } from "vue";
import type { ContentType } from "@/types/type";
import {
  getContentId,
  getIsFolder,
  getIsSetTop,
  getPermissionType,
} from "@/utils/typeUtils";
import type { FileMenuAction } from "../components/h5/FileMenuPopup.vue";
import { useI18n } from "vue-i18n";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { useRoute, useRouter } from "vue-router";

export function useFileMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();

  const menuVisible = ref(false);
  const activeItem = ref<ContentType | null>(null);

  const menuActions = computed<FileMenuAction[]>(() => {
    if (!activeItem.value) return [];

    const isSetTop = getIsSetTop(activeItem.value);

    const context = getExplorerContext(route);
    const commonActions: FileMenuAction[] = [
      { key: "share", label: t("shareToFriend"), icon: "co_share" },
      { key: "copy", label: t("copyLink"), icon: "co_copy" },
      { key: "rename", label: t("rename"), icon: "co_rename" },
      ...(context.pageType === ExplorerPageType.MY ||
      (context.pageType === ExplorerPageType.SHARED && !context.isRoot)
        ? [{ key: "move", label: t("move"), icon: "co_move" }]
        : []),
      {
        key: isSetTop ? "unTop" : "top",
        label: isSetTop ? t("unpin") : t("pin"),
        icon: "co_topSet",
      },
      { key: "delete", label: t("delete"), icon: "co_delete" },
    ];

    if (getIsFolder(activeItem.value)) {
      return [
        { key: "open", label: t("open"), icon: "co_open" },
        ...commonActions,
      ];
    }

    return [
      { key: "download", label: t("download"), icon: "co_download" },
      ...commonActions,
    ];
  });

  const handleMenu = (item: ContentType) => {
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

    activeItem.value = item;
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
