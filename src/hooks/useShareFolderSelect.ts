import { computed, reactive, ref, type Ref } from "vue";
import { showConfirmDialog, showToast } from "vant";
import { _getMySpaceContentApi } from "@/api/mySpace";
import { saveToCloudDriveApi } from "@/api/share";
import { _getShareSpace } from "@/api/shareSpace";
import { Permission } from "@/enum/permission";
import { usePermissionGuard } from "@/hooks/composable/usePermissionGuard";
import { hasPermission, t } from "@/utils";
import type { ShareContentType } from "@/views/share/types";

export type SelectFolder = {
  contentId: number | null;
  name: string;
  isPersonal: boolean;
};

type FolderItem = SelectFolder;

type UseShareFolderSelectOptions = {
  selectedFiles: Ref<ShareContentType[]>;
  shareId: Ref<number | null>;
  onSaveSuccess?: () => void;
};

type FolderApiItem = {
  contentId: number;
  contentName: string;
  permissionType?: number;
};

const createRootFolders = (): FolderItem[] => [
  { contentId: 0, name: t("myFiles"), isPersonal: true },
  { contentId: 0, name: t("shared"), isPersonal: false },
];

const createRootBreadcrumb = (): SelectFolder[] => [
  {
    contentId: null,
    name: t("cloudDrive"),
    isPersonal: true,
  },
];

export function useShareFolderSelect({
  selectedFiles,
  shareId,
  onSaveSuccess,
}: UseShareFolderSelectOptions) {
  const isRootFolder = (target: SelectFolder) => target.contentId === 0;

  const isSameFolder = (source: SelectFolder, target: SelectFolder) => {
    return (
      source.contentId === target.contentId &&
      source.isPersonal === target.isPersonal
    );
  };

  const getTargetContentId = (target: SelectFolder) => {
    return isRootFolder(target) ? 0 : (target.contentId ?? 0);
  };

  const isSelectSharedRoot = (target: SelectFolder | null) => {
    return !!target && isRootFolder(target) && !target.isPersonal;
  };

  const { runPermissionGuard } = usePermissionGuard();

  const loading = ref(false);
  const folderList = ref<FolderItem[]>(createRootFolders());
  const breadcrumbList = ref<SelectFolder[]>(createRootBreadcrumb());
  const selectFolder = ref<SelectFolder | null>(null);

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
  });

  const showBreadcrumb = computed(() => breadcrumbList.value.length > 1);
  const isSharedRootFolder = computed(() => isSelectSharedRoot(selectFolder.value));
  const canCreateFolder = computed(() => !!selectFolder.value);
  const canConfirmTargetFolder = computed(
    () => !!selectFolder.value && !isSharedRootFolder.value,
  );
  const showBottomActions = computed(
    () => canCreateFolder.value || canConfirmTargetFolder.value,
  );
  const selectedFilesCountText = computed(() => {
    const count = selectedFiles.value.length;
    return t("selectedDocumentsCount", { count });
  });
  const currentFolder = computed<SelectFolder>(() => {
    return (
      selectFolder.value ?? {
        contentId: 0,
        name: t("myFiles"),
        isPersonal: true,
      }
    );
  });

  const getItemKey = (item: SelectFolder, index: number) => {
    return `${item.isPersonal ? "personal" : "shared"}-${item.contentId ?? "root"}-${index}`;
  };

  const resetPagination = () => {
    pagination.page = 1;
    pagination.pageSize = 10;
    pagination.total = 0;
    pagination.hasMore = true;
  };

  const resetRootState = () => {
    folderList.value = createRootFolders();
    breadcrumbList.value = createRootBreadcrumb();
    selectFolder.value = null;
    resetPagination();
  };

  const mapFolderData = (items: FolderApiItem[], isPersonal: boolean) => {
    return items
      .map((item) => ({
        contentId: item.contentId,
        name: item.contentName,
        isPersonal,
        permissionType: item.permissionType || 0,
      }))
      .filter((item) => hasPermission(item.permissionType, Permission.Upload))
      .map(({ contentId, name, isPersonal }) => ({
        contentId,
        name,
        isPersonal,
      }));
  };

  const fetchFolderPage = async (
    target: SelectFolder,
    page: number,
    append = false,
  ) => {
    const apiFunc = target.isPersonal ? _getMySpaceContentApi : _getShareSpace;
    const targetContentId = getTargetContentId(target);

    try {
      loading.value = true;
      const res = await apiFunc({
        ContentId: targetContentId,
        ContentType: 1,
        PageIndex: page,
        PageSize: pagination.pageSize,
      });
      if (res.code !== 1) return;

      const nextFolders = mapFolderData(res.data.data, target.isPersonal);
      folderList.value = append
        ? [...folderList.value, ...nextFolders]
        : nextFolders;
      pagination.total = res.data.count;
      pagination.hasMore = page * pagination.pageSize < pagination.total;
    } catch (error) {
      console.error("Error fetching folder list:", error);
    } finally {
      loading.value = false;
    }
  };

  const getFolderList = async (target: SelectFolder) => {
    selectFolder.value = target;

    const existingIndex = breadcrumbList.value.findIndex((item) =>
      isSameFolder(item, target),
    );
    if (existingIndex === -1) {
      breadcrumbList.value.push(target);
    } else {
      breadcrumbList.value.splice(existingIndex + 1);
    }

    resetPagination();
    folderList.value = [];
    await fetchFolderPage(target, pagination.page);
  };

  const onClickBreadcrumb = async (item: SelectFolder) => {
    if (item.contentId === null) {
      resetRootState();
      return;
    }

    await getFolderList(item);
  };

  const onScroll = async (scrollContainer: HTMLElement | null) => {
    if (
      !scrollContainer ||
      !pagination.hasMore ||
      loading.value ||
      !selectFolder.value
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
    if (!isBottom) return;

    pagination.page += 1;
    await fetchFolderPage(selectFolder.value, pagination.page, true);
  };

  const refreshCurrentFolder = async () => {
    if (!selectFolder.value) return;
    resetPagination();
    await fetchFolderPage(selectFolder.value, pagination.page);
  };

  const saveToCloudDrive = async () => {
    const contentIds = selectedFiles.value.map((item) => item.contentId);
    const targetContentId = selectFolder.value?.contentId ?? 0;

    await runPermissionGuard({
      contentIds,
      selectedRows: selectedFiles.value,
      request: (ids) =>
        saveToCloudDriveApi({
          contentIds: ids,
          targetContentId,
          ...(shareId.value ? { shareId: shareId.value } : {}),
        }),
      showConfirm: (count) => {
        return showConfirmDialog({
          title: t("saveToCloudDrive"),
          message: t("savePermissionWarning", { count }),
          cancelButtonText: t("cancel"),
          confirmButtonText: t("Ok"),
        });
      },
      notifySuccess: () => {},
      notifyError(type) {
        if (type === "all-denied") {
          showToast({ message: t("noSavePermission") });
        } else {
          showToast(t("operationFailedRetry"));
        }
      },
      onSuccess: () => {
        onSaveSuccess?.();
      },
    });
  };

  return {
    loading,
    folderList,
    breadcrumbList,
    selectFolder,
    currentFolder,
    showBreadcrumb,
    showBottomActions,
    canCreateFolder,
    canConfirmTargetFolder,
    selectedFilesCountText,
    isSharedRootFolder,
    getItemKey,
    resetRootState,
    getFolderList,
    onClickBreadcrumb,
    onScroll,
    refreshCurrentFolder,
    saveToCloudDrive,
  };
}
