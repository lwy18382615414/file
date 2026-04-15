import { computed, onUnmounted, watch, type Ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import {
  hideAppButton,
  hideAppButton2,
  setAppTitle,
  showAppButton,
  showAppButton2,
  showNavLeftCloseBtn,
} from "@/utils";

export function useExplorerMobileHeader(options: {
  isMobileApp: Ref<boolean>;
  canCreateSharedFolder: Ref<boolean>;
  isHeaderBlocked?: Ref<boolean>;
  onOpenCreateEntry: () => void;
  onOpenCreateFolder: () => void;
  onOpenShareSettings: () => void;
  onClearRecycleBin: () => void;
  onBack?: () => void;
}) {
  const route = useRoute();
  const { t } = useI18n();

  const context = computed(() => getExplorerContext(route));
  const isHeaderBlocked = options.isHeaderBlocked ?? computed(() => false);

  const pageTitle = computed(() => {
    if (context.value.pageType === ExplorerPageType.SEARCH) {
      return t("searchResult");
    }

    const currentFolderName =
      context.value.folderNames[context.value.folderNames.length - 1];

    if (currentFolderName) {
      return currentFolderName;
    }

    return String(route.meta.title || t("cloudDrive"));
  });

  const clearCallbacks = () => {
    window.rightBtnClick = undefined;
    window.rightBtnClick2 = undefined;
    window.userLeftBackClick = undefined;
  };

  const clearRightCallbacks = () => {
    window.rightBtnClick = undefined;
    window.rightBtnClick2 = undefined;
  };

  const hideAllButtons = () => {
    hideAppButton();
    hideAppButton2();
    clearRightCallbacks();
  };

  const syncHeader = () => {
    if (!options.isMobileApp.value) {
      hideAllButtons();
      return;
    }

    setAppTitle(pageTitle.value);
    showNavLeftCloseBtn(false, "cloud");
    window.userLeftBackClick = options.onBack;

    if (isHeaderBlocked.value) {
      hideAllButtons();
      return;
    }

    switch (context.value.pageType) {
      case ExplorerPageType.MY:
        showAppButton(1, t("upload"));
        hideAppButton2();
        window.rightBtnClick = options.onOpenCreateEntry;
        window.rightBtnClick2 = undefined;
        return;
      case ExplorerPageType.SHARED:
        if (context.value.isRoot) {
          hideAppButton2();
          window.rightBtnClick2 = undefined;
          if (options.canCreateSharedFolder.value) {
            showAppButton(1, t("new"));
            window.rightBtnClick = options.onOpenCreateFolder;
          } else {
            hideAppButton();
            window.rightBtnClick = undefined;
          }
          return;
        }

        showAppButton(2, "navi_more_dot_white.png");
        window.rightBtnClick = options.onOpenShareSettings;
        showAppButton2(2, "navi_add_white.png");
        window.rightBtnClick2 = options.onOpenCreateEntry;
        return;
      case ExplorerPageType.RECYCLE:
        showAppButton(1, t("clear"));
        hideAppButton2();
        window.rightBtnClick = options.onClearRecycleBin;
        window.rightBtnClick2 = undefined;
        return;
      case ExplorerPageType.RECENT:
      case ExplorerPageType.MY_SHARES:
      case ExplorerPageType.SEARCH:
      default:
        hideAllButtons();
        return;
    }
  };

  watch(
    () => [
      route.fullPath,
      options.isMobileApp.value,
      options.canCreateSharedFolder.value,
      isHeaderBlocked.value,
    ],
    syncHeader,
    { immediate: true },
  );

  onUnmounted(() => {
    hideAppButton();
    hideAppButton2();
    clearCallbacks();
    showNavLeftCloseBtn(false, "cloud");
  });

  return {
    syncHeader,
  };
}
