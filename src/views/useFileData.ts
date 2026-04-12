import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { ContentType } from "@/types/type";
import { useClientEnv } from "@/hooks/useClientEnv";
import {
  explorerConfigMap,
  ExplorerPageType,
  getExplorerContext,
  type ExplorerQueryState,
} from "./fileExplorer";
import { FileTypeEnum } from "@/enum/baseEnum";
import { Permission } from "@/enum/permission";
import { mergeList } from "@/utils/apiCache";
import { getIsFolder } from "@/utils/typeUtils";
import { mapSortMethodToSortBy } from "@/hooks/sort/config";
import { syncExplorerQuerySort } from "@/hooks/sort/state";
import { hasPermission } from "@/utils";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import { getFolderPermissionApi } from "@/api/common";

const queryDefaults: ExplorerQueryState = {
  page: 1,
  pageSize: 20,
  sortBy: "time",
  sortOrder: "desc",
  keyword: "",
  startDate: "",
  endDate: "",
};

export function useFileData() {
  const route = useRoute();
  const { isMobileApp } = useClientEnv();

  const { currentSort } = useExplorerSort();

  const query = reactive<ExplorerQueryState>({ ...queryDefaults });
  const context = computed(() => getExplorerContext(route));
  const pageConfig = computed(() => explorerConfigMap[context.value.pageType]);

  const shouldLoadMobileFoldersFirst = computed(
    () =>
      isMobileApp.value &&
      (context.value.pageType === ExplorerPageType.MY ||
        (context.value.pageType === ExplorerPageType.SHARED &&
          !context.value.isRoot)),
  );

  const loading = ref(false);
  const hasMore = ref(true);
  const list = ref<ContentType[]>([]);
  const total = ref(0);
  const mobileContentType = ref<FileTypeEnum | undefined>();
  const currentFolderPermissionType = ref<number | null>(null);
  const currentFolderPermissionCount = ref<number | null>(null);
  const initialFetchDone = ref(false);

  const allowUpload = computed(() => {
    if (
      context.value.pageType === ExplorerPageType.RECENT ||
      context.value.pageType === ExplorerPageType.MY
    ) {
      return true;
    }

    if (
      context.value.pageType === ExplorerPageType.MY_SHARES ||
      context.value.pageType === ExplorerPageType.RECYCLE ||
      context.value.pageType === ExplorerPageType.SEARCH
    ) {
      return false;
    }

    if (
      context.value.pageType === ExplorerPageType.SHARED &&
      !context.value.isRoot
    ) {
      if (currentFolderPermissionType.value == null) return false;
      return hasPermission(
        currentFolderPermissionType.value,
        Permission.Upload,
      );
    }

    return true;
  });

  function resetQuery() {
    Object.assign(query, queryDefaults);
  }

  function applyStoredSort() {
    syncExplorerQuerySort(context.value.pageType, route.path, query);
  }

  function resetData() {
    list.value = [];
    total.value = 0;
    hasMore.value = true;
    mobileContentType.value = undefined;
    initialFetchDone.value = false;
  }

  async function syncFolderPermission() {
    if (
      context.value.pageType !== ExplorerPageType.SHARED ||
      context.value.isRoot
    ) {
      currentFolderPermissionType.value = null;
      return;
    }

    const contentId = context.value.currentFolderId;
    if (!contentId) {
      currentFolderPermissionType.value = null;
      return;
    }

    try {
      const res = await getFolderPermissionApi(contentId);
      if (res.code !== 1) {
        currentFolderPermissionType.value = null;
        currentFolderPermissionCount.value = null;
        return;
      }

      currentFolderPermissionType.value = res.data.permissionType;
      currentFolderPermissionCount.value = res.data.personCount;
    } catch {
      currentFolderPermissionType.value = null;
    }
  }

  async function fetchList() {
    if (loading.value || !hasMore.value) return;

    loading.value = true;

    const params = pageConfig.value.buildParams(context.value, query);

    // 移动端在“我的”根目录和“共享”非根目录需要先返回文件夹，没有文件夹后再返回文件
    if (shouldLoadMobileFoldersFirst.value) {
      params.ContentType = mobileContentType.value ?? FileTypeEnum.Folder;
    }

    const currentContentType = params.ContentType;
    const page: number = params.PageIndex;
    const pageSize: number = params.PageSize;

    const handleBackgroundUpdate = (newData: {
      count: number;
      data: ContentType[];
    }) => {
      const folderList = list.value.filter((item) => getIsFolder(item));
      const fileList = list.value.filter((item) => !getIsFolder(item));

      if (currentContentType === FileTypeEnum.Folder) {
        list.value = [
          ...mergeList(folderList, newData.data, page, pageSize),
          ...fileList,
        ];
      } else if (currentContentType === FileTypeEnum.File) {
        list.value = [
          ...folderList,
          ...mergeList(fileList, newData.data, page, pageSize),
        ];
      } else {
        list.value = mergeList(list.value, newData.data, page, pageSize);
      }
    };

    const api = pageConfig.value.api;

    try {
      const res = await api({
        ...params,
        onBackgroundUpdate: handleBackgroundUpdate,
      });

      if (res.code === 1) {
        const resultList = res.data.data;
        const totalCount = res.data.count;
        const folderList = list.value.filter((item) => getIsFolder(item));
        const fileList = list.value.filter((item) => !getIsFolder(item));

        total.value = totalCount;

        if (currentContentType === FileTypeEnum.Folder) {
          const nextFolderList =
            page === 1
              ? resultList
              : mergeList(folderList, resultList, page, pageSize);

          list.value = [...nextFolderList, ...fileList];

          const isFolderDone = nextFolderList.length >= totalCount;
          if (isFolderDone) {
            mobileContentType.value = FileTypeEnum.File;
            query.page = 0;
          }
          hasMore.value = true;
        } else if (currentContentType === FileTypeEnum.File) {
          const nextFileList =
            page === 1
              ? resultList
              : mergeList(fileList, resultList, page, pageSize);

          list.value = [...folderList, ...nextFileList];
          hasMore.value = nextFileList.length < totalCount;
        } else {
          if (page === 1) {
            list.value = resultList;
          } else {
            list.value.push(...resultList);
          }
          hasMore.value = totalCount > page * pageSize;
        }
      } else {
        hasMore.value = false;
      }
    } catch {
      hasMore.value = false;
    } finally {
      loading.value = false;
      initialFetchDone.value = true;
    }
  }

  async function refreshList() {
    query.page = 1;
    resetData();
    await fetchList();
  }

  async function searchList(
    payload: Pick<ExplorerQueryState, "keyword" | "startDate" | "endDate">,
  ) {
    query.keyword = payload.keyword;
    query.startDate = payload.startDate;
    query.endDate = payload.endDate;
    query.page = 1;
    resetData();
    await fetchList();
  }

  async function loadMore() {
    if (!initialFetchDone.value || loading.value || !hasMore.value) return;
    query.page += 1;
    await fetchList();
  }

  watch(
    () => route.fullPath,
    async () => {
      resetQuery();
      applyStoredSort();
      resetData();
      currentFolderPermissionType.value = null;

      if (route.meta.type === ExplorerPageType.SEARCH) {
        query.keyword = String(route.query.key || "");
        query.page = 1;
        query.pageSize = Number(route.query.total) || query.pageSize;
      }

      await syncFolderPermission();
      fetchList();
    },
    { immediate: true },
  );

  watch(
    [() => currentSort.value.sortMethod, () => currentSort.value.sortOrder],
    ([sortMethod, sortOrder]) => {
      if (sortMethod === undefined || !sortOrder) return;

      console.log(sortMethod, sortOrder);
      const nextSortBy = mapSortMethodToSortBy(
        context.value.pageType,
        sortMethod,
      );
      const nextSortOrder = sortOrder as ExplorerQueryState["sortOrder"];

      if (query.sortBy === nextSortBy && query.sortOrder === nextSortOrder) {
        return;
      }

      query.sortBy = nextSortBy;
      query.sortOrder = nextSortOrder;
      query.page = 1;
      resetData();
      fetchList();
    },
  );


  return {
    isMobileApp,
    query,
    context,
    pageConfig,
    loading,
    list,
    total,
    hasMore,
    initialFetchDone,
    shouldLoadMobileFoldersFirst,
    currentFolderPermissionType,
    currentFolderPermissionCount,
    allowUpload,
    fetchList,
    refreshList,
    searchList,
    loadMore,
    resetQuery,
    resetData,
  };
}
