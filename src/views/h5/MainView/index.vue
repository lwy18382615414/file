<template>
  <div ref="containerRef" class="h5-container">
    <MainHeader
      :isLongPress="isLongPress"
      :contentId="contentId"
      :permissionType="permissionType"
      :currentName="name"
      :canCreateSharedFolder="canCreateSharedFolder"
      :currentViewMode="currentViewMode"
      :hiddenSearchAndTab="isSearchResultPage"
      @onAddFile="createEntry"
      @onEmptyRecycleBin="emptyRecycleBin"
      @onShowSort="showSort = true"
      @onChangeViewMode="changeViewMode"
    />

    <InfiniteList
      :list-data="displayFiles"
      :loading="loading"
      :hasMore="hasMore"
      :view-mode="currentViewMode"
      :isRecycle="isRecycle"
      :isSharePage="isSharePage"
      @loadMore="handleScroll"
      @menu="handleMenu"
      @open="handleOpen"
    />

    <LongPressAction @refresh="refreshList" />

    <!--  选择是上传还是新建  -->
    <CreateChooseDialog
      :createVisible="createVisible"
      @update:createVisible="createVisible = $event"
      @onAction="handleAction"
    />

    <UploadDialog
      :uploadVisible="uploadVisible"
      :contentId="contentId"
      @update:uploadVisible="uploadVisible = $event"
      @onRefreshData="refreshList"
      @onRepeat="handleRepeatFile"
    />

    <UploadStatus />

    <RepeatFilePopup
      :contentId="contentId"
      :show="showRepeatFile"
      @update:show="showRepeatFile = $event"
    />

    <SortSelect
      :showSort="showSort"
      :sortList="sortList"
      :sortMethod="state.SortMethod"
      @update:createVisible="showSort = $event"
      @onSortBy="handleSortBy"
    />

    <van-toast v-model:show="showSortWarn" style="padding: 10px">
      <template #message>
        <div class="flex flex-col items-center">
          <SvgIcon
            :name="state.SortOrder === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
            color="#fff"
            size="50"
          />
          <p>{{ sortByWarn }}{{ sortDirectionText }}</p>
        </div>
      </template>
    </van-toast>

    <CopyLink />

    <Dialog
      :renameVisible="rename.show"
      :entryInfo="rename.file"
      @update:renameVisible="rename.show = $event"
      @confirm="confirmRename"
    />

    <RestoreConflictDialog
      :showRepeatFile="showRecycleRepeatFile"
      :repeat-file-list="duplicateList"
      :selected-entry-info="selectedRecycleItems"
      @update:showRepeatFile="showRecycleRepeatFile = $event"
      @refresh="refreshList"
    />
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import { ref, reactive, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  pageStateConfig,
  pageApiMap,
  noSortPaths,
  defaultState,
  sortListMap,
  pageActionKeys,
  allActions,
} from "./constance";
import { storeToRefs } from "pinia";
import {
  usePageUtils,
  useShareFileStore,
  useViewMode,
  useRouteStackStore
} from "@/stores";
import { useFileBelong } from "@/hooks/useFileBelong";
import {
  hasPermission,
  t,
  isRootFolder,
  setAppTitle,
  showAppButton2,
  showAppButton,
  hideAppButton2,
  hideAppButton,
} from "@/utils";
import { getPermissionType, getIsSetTop, getContentId, getId, getIsShare } from "@/utils/typeUtils";
import { InfiniteList } from "@/components";
import type { ContentType } from "@/types/type";
import MainHeader from "@/views/h5/Layout/MainHeader/index.vue";
import {
  getFolderPermissionApi,
  hasCreateSharePermissionApi,
} from "@/api/common";
import { Permission } from "@/enum/permission";
import CreateChooseDialog from "@/views/h5/MainView/pop/CreateChooseDialog.vue";
import UploadDialog from "@/views/h5/MainView/pop/UploadDialog.vue";
import RepeatFilePopup from "@/views/h5/Layout/components/RepeatFilePopup.vue";
import { clearRecycleBinApi } from "@/api/recycleBin";
import type { SortOption } from "@/views/h5/MainView/type";
import SortSelect from "@/views/h5/MainView/pop/SortSelect.vue";
import ActionPopup from "@/components/ActionPopup.vue";
import { useActionPopup } from "@/hooks/useActionPopup";
import { useFileActions } from "./composable/useFileActions";
import CopyLink from "@/views/h5/Layout/components/copyLink.vue";
import Dialog from "@/components/Dialog.vue";
import { createFolderApi, renameFileApi } from "@/api/fileService";
import RestoreConflictDialog from "@/views/h5/MainView/pop/RestoreConflictDialog.vue";
import UploadStatus from "@/views/h5/MainView/pop/UploadStatus.vue";
import LongPressAction from "@/views/h5/MainView/pop/LongPressAction.vue";
import { mergeList } from "@/utils/apiCache";

const route = useRoute();
const router = useRouter();

const {
  setSortBy,
  setSortDirection,
  setSortMode,
} = usePageUtils();
const { sortBy, sortDirection, sortMode } = storeToRefs(usePageUtils());

const { fileBelong } = useFileBelong();
const { viewMode } = storeToRefs(useViewMode());
const { setViewMode } = useViewMode();

const { isLongPress } = storeToRefs(useShareFileStore());
const instance = getCurrentInstance();
const { open: showFilePopup } = useActionPopup();

const routeStackStore = useRouteStackStore()

const containerRef = ref();
const state = ref();
const loading = ref(false);
const hasMore = ref(true);
const canCreateSharedFolder = ref(false);
const permissionType = ref(0);
const createVisible = ref(false);
const uploadVisible = ref(false);
const showRepeatFile = ref(false);
const showSort = ref(false);
const sortList = ref<SortOption[]>([]);
const showSortWarn = ref(false);
const sortByWarn = ref("");
const sortDirectionText = ref("");

const rename = reactive({
  show: false,
  file: {} as ContentType,
});

const showRecycleRepeatFile = ref(false);
const selectedRecycleItems = ref<Record<string, number>>({});
const duplicateList = ref<Record<number, string>[]>([]);

// 数据源分开存储
const folderList = ref<ContentType[]>([]); // 文件夹列表
const fileList = ref<ContentType[]>([]);   // 文件列表

// 视图层统一展示
const displayFiles = computed(() => {
  return [...folderList.value, ...fileList.value];
});

// 加载状态
const folderFinished = ref(false); // 文件夹是否全部加载完
const fileFinished = ref(false);   // 文件是否全部加载完

const currentViewMode = computed(() => {
  const savedViewMode = viewMode.value.find(
    (item) => item.currentPage === route.path,
  );
  return savedViewMode ? savedViewMode.viewMode : "list";
});

const name = computed<string>(() => {
  return route.meta.title || route.query.contentName;
});

const contentId = computed(() => {
  return Number(route.params.contentId) || 0;
});

const isShare = computed(() => fileBelong.value === "shareSpace");

const isRecycle = computed(() => route.path === "/recycle-bin");

const isSharePage = computed(() => route.path === "/my-share");

const isSearchResultPage = computed(() => route.path === "/search-result");

async function fetchData() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  const api =
    pageApiMap[route.path] ||
    (isShare.value ? pageApiMap["/share-space"] : pageApiMap["/my-space"]);

  const currentContentType = state.value.ContentType;

  let index: number;
  let size: number;
  if (isSearchResultPage.value) {
    size = state.value.pageSize;
    index = state.value.pageIndex;
  } else {
    size = state.value.PageSize;
    index = state.value.PageIndex;
  }

  try {
    const handleBackgroundUpdate = (newData: { count: number, data: ContentType[] }) => {
      if (currentContentType === 1) {
        folderList.value = mergeList(
          folderList.value,
          newData.data,
          index,
          size
        );
      } else if (currentContentType === 2) {
        fileList.value = mergeList(
          fileList.value,
          newData.data,
          index,
          size
        );
      } else {
        fileList.value = mergeList(fileList.value, newData.data, index, size);
      }
    };

    const res = await api({
      ...state.value,
      onBackgroundUpdate: handleBackgroundUpdate
    });

    if (res.code === 1) {
      const resultData = res.data.data;
      const resultCount = res.data.count;

      if (currentContentType === 1) {
        if (index === 1) {
          folderList.value = resultData; // 刷新
        } else {
          folderList.value = mergeList(folderList.value, resultData, index, size);
        }

        const isFolderDone = folderList.value.length >= resultCount;

        if (isFolderDone) {
          folderFinished.value = true;

          state.value.ContentType = 2;
          state.value.PageIndex = 0;

          hasMore.value = true;
        } else {
          hasMore.value = true;
        }

      } else if (currentContentType === 2) {
        if (index === 1) {
          fileList.value = resultData;
        } else {
          fileList.value = mergeList(fileList.value, resultData, index, size);
        }

        const isFileDone = fileList.value.length >= resultCount;
        if (isFileDone) {
          fileFinished.value = true;
          hasMore.value = false; // 彻底结束
        } else {
          hasMore.value = true;
        }

      } else {
        if (index === 1) {
          fileList.value = [...resultData];
        } else {
          fileList.value.push(...resultData);
        }
        hasMore.value = res.data.count > size * index;
      }
    } else {
      showToast({ message: t("errorOccurred") });
      hasMore.value = false;
    }
  } catch (err) {
    console.error("数据获取失败:", err);
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

function generateState(path: string) {
  if (isSearchResultPage.value) {
    return reactive({
      pageIndex: 1,
      pageSize: route.query.total,
      keyWord: route.query.key
    })
  }

  const extraState = pageStateConfig[path] || {
    ContentType: 1,
    SortMethod: 0,
    SortOrder: "desc",
    ContentId: contentId.value,
  };

  return reactive({ ...defaultState, ...extraState });
}

function handleScroll() {
  if (hasMore.value) {
    state.value.PageIndex += 1;
    fetchData();
  }
}

// 是否有权限创建共享文件夹
async function isHavePermissionToCreate() {
  const res = await hasCreateSharePermissionApi();
  if (res.code === 1) {
    canCreateSharedFolder.value = res.data;
  } else {
    canCreateSharedFolder.value = false;
  }
}

function setIsPersonal() {
  let isPersonal = true;

  if (route.name === "MySpace") {
    isPersonal = true;
  } else if (route.name === "ShareSpace") {
    isPersonal = false;
  } else if (route.name === "Folder") {
    isPersonal = !isShare.value;
  }

  return isPersonal;
}

//
async function createEntry() {
  const isShareSpace = route.path === "/share-space";

  if (isShareSpace) {
    await isHavePermissionToCreate();

    if (canCreateSharedFolder.value) {
      rename.file = {} as ContentType;
      rename.show = true;
    } else {
      showFailToast(t("noPermission"));
    }
    return;
  }

  if (hasPermission(permissionType.value, Permission.Upload)) {
    createVisible.value = true;
  }
}

// 选择上传文件或新建文件夹
function handleAction(action: string) {
  if (action === "createFolder") {
    rename.show = true;
    rename.file = {} as ContentType;
  } else if (action === "createFile") {
    uploadVisible.value = true;
  }
}

// 上传文件重复
function handleRepeatFile() {
  showRepeatFile.value = true;
}

// 清空回收站
function emptyRecycleBin() {
  showDialog({
    title: t("emptyRecycleBin"),
    message: t("confirmEmptyRecycleBin"),
    showCancelButton: true,
    confirmButtonText: t("Ok"),
    cancelButtonText: t("cancel"),
    width: "80%",
  })
    .then(async () => {
      const res = await clearRecycleBinApi();
      if (res.code === 1) {
        showToast({ message: t("emptySuccess"), type: "success" });
        refreshList();
      }
    })
    .catch(() => {});
}

function handleSortBy(method: number) {
  state.value.SortOrder = state.value.SortOrder === "asc" ? "desc" : "asc";
  state.value.SortMethod = name;

  setSortMode({
    currentPage: route.path,
    sortMethod: method,
    sortOrder: state.value.SortOrder,
  });

  sortByWarn.value = sortList.value.find((item) => item.name === method)!.warn;
  sortDirectionText.value =
    state.value.SortOrder === "asc" ? t("ascending") : t("descending");

  showSort.value = false;
  showSortWarn.value = true;
}

function changeViewMode() {
  const currentPath = route.path;
  const findMode = viewMode.value.find((item) => {
    return item.currentPage === currentPath;
  })?.viewMode;
  if (findMode === "list" || findMode === undefined) {
    setViewMode({
      viewMode: "grid",
      currentPage: currentPath,
    });
  } else {
    setViewMode({
      viewMode: "list",
      currentPage: currentPath,
    });
  }
}

function initSort(newPath: string) {
  if (isSearchResultPage.value) return

  const savedSort = sortMode.value.find((item) => item.currentPage === newPath);
  if (savedSort) {
    const { sortMethod, sortOrder } = savedSort;
    state.value.SortMethod = sortMethod;
    state.value.SortOrder = sortOrder;
    setSortBy(sortMethod);
    setSortDirection(sortOrder);
  } else {
    if (!noSortPaths.has(newPath)) {
      setSortMode({
        currentPage: newPath,
        sortMethod: state.value.SortMethod,
        sortOrder: state.value.SortOrder,
      });
    }
  }
}

async function getPermissionInfo() {
  try {
    const permissionRes = await getFolderPermissionApi(contentId.value);
    if (permissionRes.code === 1) {
      permissionType.value = permissionRes.data.permissionType;
    } else {
      permissionType.value = 0;
    }
  } catch (error) {
    console.error(error);
    permissionType.value = 0;
  }
}

const fileActions = useFileActions({
  contentId: contentId,
  onRefresh: () => {
    refreshList();
  },
  onRenameDialog: (item: ContentType) => {
    rename.show = true;
    rename.file = item;
  },
  onDuplicateFile: (item: ContentType, list) => {
    duplicateList.value = list;
    selectedRecycleItems.value.id = getId(item)!;
    selectedRecycleItems.value.contentId = getContentId(item)!;
    showRecycleRepeatFile.value = true;
  },
});

const confirmRename = async (renameText: string, cid?: number) => {
  if (!renameText) return;

  if (cid != null) {
    const res = await renameFileApi(cid, renameText);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("renameSuccess"),
      });
      rename.show = false;
      refreshList();
    }
  } else {
    const res = await createFolderApi({
      currentContentId: contentId.value,
      viewRanges: [],
      editRanges: [],
      folderName: renameText,
      isPersonal: setIsPersonal(),
    });
    if (res.code === 1) {
      showToast({ message: t("createSuccess"), type: "success" });
      rename.show = false;
      refreshList();
    } else if (res.code === 701) {
      showDialog({
        title: t("hint"),
        message: t("folderAlreadyExists"),
        confirmButtonColor: "#327edc",
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
      }).then(() => {});
    } else if (res.code === 1109 || res.code === 702) {
      showDialog({
        title: t("hint"),
        message: t("noEditPermission"),
        confirmButtonColor: "#327edc",
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
      }).then(() => {});
    }
  }
};

function getActions(
  item: ContentType,
  fileActionHook: ReturnType<typeof useFileActions>,
) {
  let keys = pageActionKeys[route.path] || [
    "open",
    "download",
    "shareToFriend",
    "copyLink",
    "rename",
    "top",
    "delete",
  ];

  keys = keys.map((key) => {
    if (key === "top" || key === "unTop") {
      return getIsSetTop(item) ? "unTop" : "top";
    }
    return key;
  });

  return keys
    .map((key) => {
      const action = allActions[key];
      if (!action) return null;

      if (
        action.permission !== undefined &&
        !hasPermission(getPermissionType(item) ?? 0, action.permission)
      ) {
        return null;
      }

      if (action.visible && !action.visible(item)) return null;
      return {
        name: action.name,
        icon: action.icon,
        action: () => action.action(item, fileActionHook),
      };
    })
    .filter(Boolean);
}

function handleMenu(item: ContentType) {
  const actions = getActions(item, fileActions);
  if (route.path === "/share-space") {
    isRootFolder("/space-setting");
    router.push({
      path: "/space-setting",
      query: {
        contentId: getContentId(item)!,
        permissionType: getPermissionType(item),
      },
    });
  } else if (route.path === "/my-share") {
    isRootFolder("/share-detail");
    router.push({
      path: "/share-detail",
      state: {
        shareInfo: JSON.stringify(item),
      },
    });
  } else {
    showFilePopup({
      appContext: instance?.appContext,
      component: ActionPopup,
      fileInfo: item,
      actions,
      isRecycle: isRecycle.value,
    });
  }
}

function handleOpen(item: ContentType) {
  if (isSharePage.value) {
    isRootFolder("/share-detail");
    router.push({
      path: "/share-detail",
      state: {
        shareInfo: JSON.stringify(item),
      },
    });
  } else {
    if (isSearchResultPage.value) {
      fileBelong.value = getIsShare(item) ? 'shareSpace' : 'mySpace'
    }
    fileActions.openEntry(item, isSearchResultPage.value);
  }
}

window.rightBtnClick2 = () => {
  createEntry();
  hideAppButton();
  hideAppButton2();
};

window.rightBtnClick = () => {
  if (route.path.includes("/folder") && fileBelong.value === "shareSpace") {
    router.push({
      path: "/space-setting",
      query: {
        contentId: contentId.value,
      },
    });
  } else {
    if (route.name === "RecycleBin") {
      emptyRecycleBin();
      return;
    }
    createEntry();
    hideAppButton();
  }
};

// 刷新数据
function refreshList(newPath = route.path) {
  state.value = generateState(newPath);

  initSort(newPath);

  fileList.value = [];
  folderList.value = [];

  if (!isSearchResultPage.value) {
    sortList.value = sortListMap[newPath] ?? sortListMap["default"];
  }

  hasMore.value = true;

  if (containerRef.value) {
    containerRef.value.scrollTo({ top: 0, behavior: "auto" });
  }

  fetchData();
}

async function handlePermissionCheck(path: string) {
  if (path === "/share-space" || isShare.value) {
    await isHavePermissionToCreate();
  }
  if (isShare.value) {
    await getPermissionInfo();
  }
}

function handleBaseState(path: string) {
  isRootFolder(path);
  let appTitle = t("cloudDrive")
  if (isSearchResultPage.value) {
    appTitle = t("searchResult")
  }
  setAppTitle(appTitle);
  refreshList(path);
}

function handleAppButtons(path: string) {
  if (path.includes("/folder")) {
    if (isShare.value) {
      showAppButton(2, "navi_more_dot_white.png");
      if (hasPermission(permissionType.value, Permission.Upload)) {
        showAppButton2(2, "navi_add_white.png");
      }
    } else {
      showAppButton(1, t("upload"));
      hideAppButton2();
    }
  } else {
    switch (path) {
      case "/my-space":
        showAppButton(1, t("upload"));
        break;
      case "/share-space":
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        canCreateSharedFolder.value
          ? showAppButton(1, t("new"))
          : hideAppButton();
        break;
      case "/recycle-bin":
        showAppButton(1, t("clear"));
        break;
      default:
        hideAppButton();
        break;
    }
    hideAppButton2();
  }
}

// 监听 route.path 变化
watch(
  () => route.path,
  async (newPath) => {
    handleBaseState(newPath);
    await handlePermissionCheck(newPath);
    handleAppButtons(newPath);

    if (route.name === 'Folder') {
      const contentId = Number(route.params.contentId);
      const contentName = (route.query.contentName as string) || '';

      if (contentId) {
        const lastItem = routeStackStore.stack[routeStackStore.stack.length - 1];

        const isBroken = !lastItem || String(lastItem.id) !== String(contentId);

        if (isBroken) {
          console.log('检测到路由栈断层，开始修复...');
          await routeStackStore.repairStack(contentId, contentName);
        } else {
          console.log('路由栈正常，无需修复');
        }
      }
    }
  },
  { immediate: true },
);

// 监听排序字段变化
watch([sortBy, sortDirection], () => {
  refreshList(route.path);
});

watch(
  () => [createVisible.value, rename.show],
  ([newAdd, newVal]) => {
    if (!newAdd && !newVal) {
      handleAppButtons(route.path);
    }
    if (newAdd || newVal) {
      hideAppButton2();
    }
  },
);
</script>

<style scoped lang="scss">
.h5-container {
  width: 100%;
  max-height: 100vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch; /* 移动端滚动优化 */
}
</style>
