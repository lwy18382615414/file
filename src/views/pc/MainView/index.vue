<template>
  <div class="main-view-container">
    <MainHeader
      ref="mainHeaderRef"
      v-model:state="state"
      :allowUpload="allowUpload"
      :currentViewMode="currentViewMode"
      @update:state="debounceFetch"
      @showUploadModal="handleShowModal"
      @onCreateFolder="createFolder"
      @onCancelShare="cancelShare"
      @onSearch="debounceFetch"
      @recoveryOrDelete="handleRecoveryOrDelete"
      @onMultiDownload="handleMultiDownload"
      @onShareToFriend="handleShareToFriend"
      @onMultiDelete="handleMultiDelete"
    />
    <div
      class="content"
      @dragenter="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop="handleDrop"
    >
      <CommonTable
        v-if="currentViewMode === 'list'"
        ref="commonTableRef"
        height="calc(100vh - 100px)"
        :loading="loading"
        :row-key="getRowKey"
        :tableData="tableData"
        :tableColumns="pageConfig?.tableColumns"
        :header-row-class-name="'table-header-row'"
        :header-cell-class-name="'table-header-cell'"
        :is-recycle-bin="route.path === '/recycle-bin'"
        @headerClick="handleHeaderClick"
        @rowContextmenu="handleRightClick"
        @scroll="handleScroll"
        @selection-change="handleSelectionChange"
        @rowDblclick="handleDbClick"
      >
        <template #sortHeader="{ column }">
          <div v-if="!showChooseCount" class="flex items-center">
            <span>{{ t(column.label) }}</span>
            <div v-if="showSortIcon(column.label)" class="relative ml-[8px]">
              <div class="absolute left-[-2px]">
                <SvgIcon
                  name="sort-up"
                  size="14"
                  :color="isAscending ? '#4b95f3' : '#ccc'"
                />
              </div>
              <SvgIcon
                name="sort-down"
                size="14"
                :color="isAscending ? '#ccc' : '#4b95f3'"
              />
            </div>
          </div>
          <div v-else class="cursor-pointer">
            <template v-if="column.columnKey === 'showCount'">
              <span @click="handleChooseAll">{{
                shareList.length === tableData.length
                  ? t("unselectAll")
                  : t("selectAll")
              }}</span>
              <span class="ml-2">
                {{
                  t("selectedDocuments", { count: shareList.length })
                }}</span
              >
            </template>
            <span v-else>{{ t(column.label) }}</span>
          </div>
        </template>
        <template #contentName="{ row }">
          <div class="flex items-center gap-3">
            <div v-if="route.path !== '/my-share'" class="flex-shrink-0">
              <SvgIcon
                :name="row.isFolder ? 'icon_folder' : getFileIcon(row.contentName)"
                size="24"
              />
            </div>
            <template v-if="isEdit && row.contentId === getContentId(selectedRow)">
              <el-input
                ref="inputRef"
                maxlength="100"
                show-word-limit
                v-model="editingFileName"
                :placeholder="t('inputFolderName')"
                v-on:blur="saveEdit(row)"
                v-on:keydown="saveEdit(row, $event)"
              />
            </template>
            <template v-else-if="row.isDeleteAll">
              {{
                row.shareCount > 1
                  ? t("fileDeletedCount", { count: row.shareCount })
                  : t("fileDeleted")
              }}
            </template>
            <template v-else-if="!row.isDeleteAll">
              <div class="file-name-wrapper" :class="[{ 'not-my-share': route.path !== '/my-share' }, { 'not-width': route.path === '/recycle-bin' }]">
                <div class="name-text">{{ getName(row) }}</div>
                <div v-if="row.isUploading" class="loading"></div>
                <span v-if="row.shareCount > 1">{{
                  t("andItem", { count: row.shareCount })
                }}</span>
              </div>
            </template>
          </div>
        </template>
        <template #operateTime="{ row }">
          <span>{{ formatTime(row.operateTime) }}</span>
        </template>
        <template #contentSize="{ row }">
          <span>{{ row.contentSize ? formatFileSize(row.contentSize) : "-" }}</span>
        </template>
        <template #shareTime="{ row }">
          <span>{{ formatTime(row.shareTime) }}</span>
        </template>
        <template #shareStatus="{ row }">
          <span v-if="!row.isDeleteAll">{{
            getExpirationStatus(row.status, row.expireType, row.expireTime)
          }}</span>
          <span v-else>{{ t("fileDeleted") }}</span>
        </template>
        <template #deleteTime="{ row }">
          <span>{{ formatTime(row.deleteTime) }}</span>
        </template>
        <template #expireTime="{ row }">
          <span>{{ dayjs(row.expireTime).format(t("timeFormat")) }}</span>
        </template>
        <template #operation="{ row }">
          <el-button
            type="success"
            text
            style="color: #327edc"
            @click="handleRecoveryOrDelete('recovery', row)"
          >
            {{ t("restore") }}
          </el-button>
          <el-button
            type="danger"
            text
            @click="handleRecoveryOrDelete('delete', row)"
          >
            {{ t("deletePermanently") }}
          </el-button>
        </template>

        <template v-if="shouldShowUpload" #empty>
          <div class="drag-upload-area">
            <SvgIcon name="recycle-bin" size="216" style="margin: auto" />
            <div class="el-upload__text">
              <div>{{ t("noData") }}</div>
              <div>{{ t("dragUpload") }}</div>
            </div>
          </div>
        </template>
      </CommonTable>
      <IconWrapper
        v-else
        ref="iconWrapperRef"
        :file-list="tableData"
        @contextmenu="handleRightClick"
        @dbClick="handleDbClick"
        @loadMore="handleLoadMore"
      />

      <div v-if="isDraggingOver" class="dropzone"></div>
    </div>

    <PopMenu
      v-model="contextMenuVisible"
      :position="menuPosition"
      :options="filterMenu"
      @select="handleMenuSelect"
    />

    <Upload
      :visible="showUploadModal"
      :title="title"
      :type="type"
      :contentId="contentId"
      :isPersonal="fileBelong === 'mySpace'"
      @update:visible="showUploadModal = $event"
      @onRefreshData="refreshData"
    />
    <UploadFloatBubble />

    <GenerateLinkDialog v-if="showLinkDialog" />

    <Setting v-if="settingVisible" :content-id="contentId" />

    <RecycleRepeatFile
      :repeat-visible="repeatFileVisible"
      :repeat-list="repeatFileList"
      @update:repeatVisible="repeatFileVisible = $event"
      @handleRepeatFile="handleRepeatFile"
    />

    <RenameDialog
      v-if="renameVisible"
      :visible="renameVisible"
      :name="getName(selectedRow)"
      :currentContentId="getContentId(selectedRow)"
      :is-folder="getIsFolder(selectedRow)"
      @close="renameVisible = false"
      @refresh="fetchData"
    />
    <RepeatFileDialog
      :repeat-visible="showRepeatFileDialog"
      :contentId="contentId"
      @update:repeatVisible="showRepeatFileDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { handleFileEncryption } from "@/utils/upload/encrypt";
import RepeatFileDialog from "@/views/pc/Layout/pop/RepeatFileDialog.vue";
import { computed, ref, watch, reactive, nextTick } from "vue";
import { useRoute } from "vue-router";
import MainHeader from "@/views/pc/Layout/mainHeader.vue";
import {
  type TableColumnKey,
  pageSortConfig,
  pageStateConfig,
  sortMethodMap,
  pageMenuMap,
} from "./constance";
import { CommonTable, IconWrapper, PopMenu } from "@/components";
import type { CollectedFileItem, ContentType } from "@/types/type";
import { storeToRefs } from "pinia";
import {
  useSetting,
  useShareFileStore,
  useUploadInfo,
  useViewMode,
  useUploadStatus,
  useRouteStackStore,
} from "@/stores";
import { useFileBelong } from "@/hooks/useFileBelong";
import {
  copyToClipboard,
  formatFileSize,
  formatTime,
  generateShareText,
  getExpirationStatus, getFileFromEntry,
  getFileIcon,
  hasPermission,
  t,
} from "@/utils";
import dayjs from "dayjs";
import { useRightClickMenu } from "@/hooks/composable/useRightClickMenu";
import { useTableDimensions } from "@/hooks/useTableDimensions";
import { debounce } from "lodash-es";
import { getFolderPermissionApi, getBatchPermissionApi } from "@/api/common";
import { Permission } from "@/enum/permission";
import Upload from "@/views/pc/Layout/pop/upload.vue";
import UploadFloatBubble from "@/views/pc/Layout/pop/UploadFloatBubble.vue";
import { getMyUserInfo } from "@/utils/auth";
import { useFileActions } from "@/hooks/composable/useFileActions";
import { autoSelectFileName } from "@/utils/fileRename";
import Setting from "@/views/pc/Layout/setting.vue";
import { ElMessage } from "element-plus";
import RecycleRepeatFile from "@/views/pc/Layout/pop/RecycleRepeatFile.vue";
import RenameDialog from "@/views/pc/Layout/pop/RenameDialog.vue";
import { createFolderApi } from "@/api/fileService";
import { useSmartUploader } from "@/hooks/upload/useSmartUpload";
import config from "@/hooks/config";
import type { PageConfig } from "./types";
import { getColumnKeyByPath, getPageConfig } from "./pageConfig";
import { getContentId, getIsFolder, getName, getRowKey } from "@/utils/typeUtils";
import { mergeList } from "@/utils/apiCache";

const route = useRoute();
const { setShareList, clearSelection, setShowShareDialog } = useShareFileStore();
const { shareList, showChooseCount, showLinkDialog } =
  storeToRefs(useShareFileStore());
const { sortMode, viewMode } = storeToRefs(useViewMode());
const { setSortMode } = useViewMode();
const { fileBelong, permissionCount } = useFileBelong();
const { settingVisible } = storeToRefs(useSetting());
const { addUploadingTask, showOrHideUploadDialog } = useUploadInfo();
const { uploadStatus } = storeToRefs(useUploadStatus());
const { showUpload } = storeToRefs(useUploadInfo());
const routeStackStore = useRouteStackStore();
const { uploadFilesSmart } = useSmartUploader();
const { fileMaxSize } = config()

const mainHeaderRef = ref();
const pageConfig = ref<PageConfig<TableColumnKey>>();
const contentId = ref(0);
const permissionType = ref(0);
const defaultState = {
  PageIndex: 1,
  PageSize: 50,
};
const state = ref();
const tableData = ref<ContentType[]>([]);
const isAscending = ref(false);
const currentSortLabel = ref("");
const hasMore = ref(true);
const loading = ref(false); // 添加 loading 状态
const commonTableRef = ref();
const allowUpload = ref(true);
const title = ref("");
const type = ref("");
const showUploadModal = ref(false);
const repeatFileVisible = ref(false);
const repeatFileList = ref<Record<number, string>[]>([]);
const renameVisible = ref(false);
let controller = new AbortController();
const showRepeatFileDialog = ref(false);

const isDraggingOver = ref<boolean>(false);
let dragLeaveTimeout: number | undefined;
const pageApiPath = ref("");

const currentViewMode = computed(() => {
  const savedViewMode = viewMode.value.find(
    (item) => item.currentPage === route.path,
  );
  return savedViewMode ? savedViewMode.viewMode : "list";
});

const columnKey = computed<TableColumnKey>(
  () => route.meta.columnKey as TableColumnKey,
);

const tableRef = computed(() => commonTableRef.value?.getTableRef());

const shouldShowUpload = computed(() => {
  return (
    !["/recent-view", "/my-share", "/recycle-bin"].includes(route.path) &&
    allowUpload.value
  );
});

const isSearchResultPage = computed(() => route.path === "/search-result");

watch(
  () => showLinkDialog.value,
  (val: boolean) => {
    if (!val) clearSelection(tableRef.value);
  },
);

watch(
  () => uploadStatus.value,
  (val) => {
    if (val) {
      refreshData();
      uploadStatus.value = false;
    }
  },
);

const setContentId = () => {
  const key = route.params?.contentId;

  if (!key) {
    return Number(route.query.contentId) || 0;
  }

  const num = Number(key);
  return isNaN(num) ? 0 : num;
}

const showSortIcon = (label: string) => {
  if (!route.meta.isSort) return false;
  return currentSortLabel.value === label;
};

const handleHeaderClick = (column: any, event: Event) => {
  event.stopPropagation();
  if (showChooseCount.value) return;
  if (!column.sortable) return;

  if (column.label === currentSortLabel.value) {
    isAscending.value = !isAscending.value;
  } else {
    currentSortLabel.value = column.label;
    isAscending.value = true;
  }

  state.value.SortMethod =
    route.path === "/my-share"
      ? column.label === t("shareFile")
        ? 0
        : 1
      : sortMethodMap[column.label];
  state.value.SortOrder = isAscending.value ? "asc" : "desc";

  state.value.PageIndex = 1;
  tableData.value = [];

  setSortMode({
    currentPage: route.path,
    sortMethod: state.value.SortMethod,
    sortOrder: state.value.SortOrder,
  });

  fetchData();
};

function handleShareToFriend() {
  setShowShareDialog(tableRef.value);
}

function generateState(path: string) {
  if (isSearchResultPage.value) {
    return reactive({
      pageIndex: 1,
      pageSize: Number(route.query.total),
      keyWord: route.query.key as string,
    })
  }

  const extraState = pageStateConfig[path] || {
    SortMethod: 0,
    ContentId: contentId.value,
    SortOrder: "desc",
  };
  return reactive({
    ...defaultState,
    ...extraState,
  });
}

const debounceFetch = debounce(fetchData, 500);

async function fetchData() {
  if (loading.value || !pageConfig.value) return;
  loading.value = true;
  const api = pageConfig.value?.api
  let index: number;
  let size: number;
  if (isSearchResultPage.value) {
    const { pageSize, pageIndex } = state.value;
    size = pageSize;
    index = pageIndex;
  } else {
    const { PageSize, PageIndex } = state.value;
    size = PageSize;
    index = PageIndex;
  }

  try {
    const res = await api({
      ...state.value,
      onBackgroundUpdate: (newData: { count: number, data: ContentType[] }, apiPath: string) => {
        if (apiPath !== pageApiPath.value) return
        tableData.value = mergeList(
          tableData.value,
          newData.data,
          index,
          size
        );
      }
    });

    if (res.code === 1) {
      hasMore.value = res.data.count > index * size;
      const data = res.data.data;
      if (index === 1) {
        tableData.value = data;
      }
    }

    setTimeout(() => {
      const needCreate = sessionStorage.getItem("needCreateFolder");
      if (needCreate === "true") {
        sessionStorage.removeItem("needCreateFolder"); // 清除标志
        createFolder(); // 执行新建逻辑
      }
    }, 300);
  } catch (error) {
    console.error("数据获取失败:", error);
  } finally {
    loading.value = false;
  }
}

const {
  isEdit,
  isCreating,
  editingFileName,
  inputRef,
  openFile,
  deleteFile,
  handleMultiDelete,
  topFile,
  cancelTopFile,
  downloadFile,
  saveEdit,
  handleExportFile,
  handleCopyLink,
  handleSelectionChange,
  cancelShare,
  deletePermanently,
  onRestoreFile,
  handleMultiDownload
} = useFileActions({
  onRefresh: () => {
    clearSelection(tableRef.value);
    isCreating.value = false;
    refreshData();
  },
  onEditDone: () => {
    isEdit.value = false;
    editingFileName.value = "";
    isCreating.value = false;
  },
  onDuplicateFiles: (data) => {
    repeatFileVisible.value = true;
    repeatFileList.value = data;
  },
});

// 批量获取权限的包装函数
const getBatchPermission = async (
  contentIds: number[],
): Promise<Record<number, number>> => {
  try {
    const res = await getBatchPermissionApi(contentIds);
    if (res.code === 1) {
      return res.data;
    }
    return {};
  } catch (error) {
    console.error("批量获取权限接口调用失败:", error);
    return {};
  }
};

// 判断是否需要进行权限校验（共享空间或搜索结果页）
const isShareSpace = computed(() => 
  fileBelong.value === "shareSpace" || isSearchResultPage.value
);

const {
  filterMenu,
  selectedRow,
  contextMenuVisible,
  menuPosition,
  handleRightClick,
} = useRightClickMenu({
  includeKeys: computed(() => pageMenuMap[columnKey.value]),
  isEditRef: isEdit,
  onSelectRow: (row) => {
    tableRef.value?.clearSelection();
    tableRef.value?.toggleRowSelection(row);
    selectedRow.value = row;
  },
  onShareRow: (row) => {
    setShareList([row]);
  },
  shareListRef: shareList,
  getBatchPermission,
  isShareSpaceRef: isShareSpace,
});

const handleChooseAll = () => {
  tableRef.value.toggleAllSelection();
};

const handleMenuSelect = (key: string) => {
  switch (key) {
    case "open":
      handleOpenFile();
      break;
    case "export":
      handleExportFile();
      break;
    case "copyLink":
      copyLink();
      break;
    case "delete":
      if (shareList.value.length > 1) {
        handleMultiDelete();
      } else {
        deleteFile(selectedRow.value);
      }
      break;
    case "top":
      topFile(selectedRow.value);
      break;
    case "rename":
      handelRenameFile();
      break;
    case "download":
      if (shareList.value.length > 1) {
        handleMultiDownload();
      } else {
        downloadFile(selectedRow.value);
      }
      break;
    case "cancelTop":
      cancelTopFile(selectedRow.value);
      break;
    case "cancelShare":
      cancelShare();
      break;
    default:
      break;
  }
};

// 打开文件夹
async function handleOpenFile() {
  const title = mainHeaderRef.value.title;
  if (tableRef.value) clearSelection(tableRef.value);
  const newPageParam = {
    path: route.path,
    title,
    contentId: contentId.value, // 顶级目录
  }
  if (isSearchResultPage.value) {
    Object.assign(newPageParam, {
      key: route.query.key,
      total: route.query.total
    })
  }
  await openFile(selectedRow.value, isSearchResultPage.value);
}

const handleDbClick = (file: ContentType) => {
  const noDbClickPaths = ["/my-share", "/recycle-bin"];
  if (noDbClickPaths.includes(route.path)) return;
  if (!getContentId(file)) return
  selectedRow.value = file;
  handleMenuSelect("open");
};

const handelRenameFile = () => {
  if (currentViewMode.value === "list") {
    editingFileName.value = getName(selectedRow.value);
    isEdit.value = true;
    contextMenuVisible.value = false;
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        autoSelectFileName({
          inputRef: inputRef.value,
          fileName: editingFileName.value,
          isFolder: getIsFolder(selectedRow.value) || false,
        });
      }
    });
  } else {
    renameVisible.value = true;
  }
};

// 复制链接
async function copyLink() {
  if (route.path === "/my-share") {
    const prefix = window.location.origin + location.pathname;
    const link = `${prefix}#/share-page?shareKey=${selectedRow.value?.shareKey}`;
    const copyText = generateShareText({
      count: selectedRow.value?.shareCount || 0,
      fileName: getName(selectedRow.value),
      shareLink: link,
      password: selectedRow.value?.sharePassword || "",
    });
    try {
      await copyToClipboard(copyText);
      ElMessage.success(t("copySuccess"));
    } catch (err) {
      console.error(err);
      ElMessage.error(t("copyFailed"));
    }
  } else {
    handleCopyLink();
  }
}

// 滚动事件
const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
  const { tableHeight, tableWrapperHeight } = useTableDimensions(
    commonTableRef.value,
  );
  if (scrollTop + tableWrapperHeight.value === tableHeight.value) {
    if (hasMore.value) {
      state.value.PageIndex += 1;
      fetchData();
    }
  }
};

const handleLoadMore = async (done?: () => void) => {
  if (!hasMore.value) return;
  state.value.PageIndex += 1;
  await fetchData();
  done?.();
};

const updateUploadRight = async () => {
  if (!contentId.value) {
    allowUpload.value = true;
  } else {
    if (fileBelong.value === "mySpace") {
      allowUpload.value = true;
    } else {
      allowUpload.value = false;

      const permissionRes = await getFolderPermissionApi(contentId.value);
      if (permissionRes.code === 1) {
        permissionType.value = permissionRes.data.permissionType;
        permissionCount.value = permissionRes.data.personCount;
        allowUpload.value = hasPermission(
          permissionType.value,
          Permission.Upload,
        );
      }
    }
  }
};

const handleShowModal = (visible: boolean, uploadType: string) => {
  showUploadModal.value = visible;
  type.value = uploadType;
};

const createFolder = () => {
  if (currentViewMode.value === "list") {
    if (isCreating.value) return;
    isCreating.value = true;
    const nickName = getMyUserInfo().nickName;
    const newFolder = {
      contentId: undefined,
      contentName: "",
      operateTime: new Date().toLocaleString(),
      userName: nickName,
      isFolder: true,
      contentSize: 0,
    };
    selectedRow.value = newFolder;
    isEdit.value = true;
    tableData.value.unshift(newFolder);

    setTimeout(() => {
      inputRef.value?.focus();
    }, 200);
  } else {
    showUploadModal.value = true;
    type.value = "folder";
    title.value = t("newFolder");
  }
};

const handleRecoveryOrDelete = async (
  actionType: string,
  row?: ContentType,
) => {
  selectedRow.value = row!;
  if (actionType === "delete") {
    deletePermanently(row);
  } else {
    await onRestoreFile(row);
  }
};

const handleRepeatFile = async (handleType: number) => {
  await onRestoreFile(selectedRow.value, handleType);
  repeatFileVisible.value = false;
  repeatFileList.value = [];
};

const handleDragEnter = () => {
  isDraggingOver.value = true;
};

const handleDragOver = (e: Event) => {
  e.preventDefault();
  clearTimeout(dragLeaveTimeout as number);
};

const handleDragLeave = () => {
  dragLeaveTimeout = setTimeout(() => {
    isDraggingOver.value = false;
  }, 100);
};

const createFolderFn = async (
  folderName: string,
  currentContentId: number = contentId.value,
) => {
  return await createFolderApi({
    currentContentId,
    folderName,
    viewRanges: [],
    editRanges: [],
    isPersonal: fileBelong.value === "mySpace",
  });
};

function readDirectory(
  entry: FileSystemDirectoryEntry,
  contentId: number,
  collector: CollectedFileItem[]
): Promise<void> {
  return new Promise((resolve) => {
    const reader = entry.createReader();
    const subDirectories: Array<{
      entry: FileSystemDirectoryEntry;
      contentId: number;
    }> = [];

    const readEntries = () => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
          for (const sub of subDirectories) {
            await readDirectory(sub.entry, sub.contentId, collector);
          }
          resolve();
          return;
        }

        // --- 处理当前层级的文件 ---
        const fileEntries = entries.filter((ent) => ent.isFile) as FileSystemFileEntry[];
        const files = await Promise.all(fileEntries.map(getFileFromEntry));
        // 收集文件
        files.forEach((file) => {
          collector.push({
            file: file,
            parentId: contentId
          })
        });

        // contentID，这里必须先在后端创建文件夹
        const dirEntries = entries.filter((ent) => ent.isDirectory) as FileSystemDirectoryEntry[];
        for (const dirEntry of dirEntries) {
          let res = await createFolderFn(dirEntry.name, contentId);
          if (res.code !== 1) {
            res = await createFolderFn(`${dirEntry.name}_${Date.now()}`, contentId);
          }
          const childId: number = res.data;
          subDirectories.push({ entry: dirEntry, contentId: childId });
        }
        readEntries();
      })
    };
    readEntries();
  });
}

const handleDrop = async (e: DragEvent) => {
  if (!shouldShowUpload.value) return;
  e.preventDefault();
  clearTimeout(dragLeaveTimeout as number);
  isDraggingOver.value = false;

  const items = Array.from(e.dataTransfer?.items || []);
  if (items.length === 0) return;

  let allCollectedFiles: CollectedFileItem[] = [];

  const entries: FileSystemEntry[] = items
    .map(item => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => !!entry);

  for (const entry of entries) {
    if (entry.isFile) {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      allCollectedFiles.push({
        file: file,
        parentId: contentId.value
      });
    } else if (entry.isDirectory) {
      let entryName = entry.name;
      let res = await createFolderFn(entry.name, contentId.value);
      if (res.code !== 1) {
        entryName = `${entry.name}_${Date.now()}`
        res = await createFolderFn(`${entry.name}_${Date.now()}`, contentId.value);
      }
      // 虚拟数据
      const nickName = getMyUserInfo().nickName;
      const newFolder = {
        contentId: undefined,
        contentName: entryName,
        operateTime: new Date().toLocaleString(),
        userName: nickName,
        isFolder: true,
        contentSize: 0,
        isUploading: true
      };
      tableData.value.unshift(newFolder);
      const topDirId = res.data;
      await readDirectory(entry as FileSystemDirectoryEntry, topDirId, allCollectedFiles);
    }
  }

  if (allCollectedFiles.length === 0) {
    refreshData();
    return;
  }

  // 移除文件大小超过限制的文件
  if (allCollectedFiles.some(item => item.file.size > fileMaxSize.value)) {
    const invalidCount = allCollectedFiles.filter(item => item.file.size > fileMaxSize.value).length;
    ElMessage.warning(t('fileSizeExceededFiltered', { count: invalidCount }));
    allCollectedFiles = allCollectedFiles.filter(item => item.file.size <= fileMaxSize.value - 5 * 1024 * 1024);
  }

  if (allCollectedFiles.length === 0) {
    return;
  }

  for (const t of allCollectedFiles) addUploadingTask(t.file.name);

  if (!showUpload.value) {
    showOrHideUploadDialog(true);
  }

  const rawFiles = allCollectedFiles.map(item => item.file);
  const encryptedResults = await handleFileEncryption(rawFiles, controller.signal);
  const uploadTasks = encryptedResults.map((enc, index) => {
    const originalInfo = allCollectedFiles[index];
    return {
      file: enc.file,
      fileName: enc.name,
      aesKey: enc.key,
      parentId: originalInfo.parentId
    };
  });
  console.log("加密后的要上传的全部文件", uploadTasks)
  await uploadFilesSmart({
    uploadTasks,
    onRefreshData: refreshData,
    findDuplicateFiles: () => {
      showRepeatFileDialog.value = true
    }
  })
};

const initSort = (path: string) => {
  if (!route.meta.isSort) return;

  // 获取配置，未匹配则使用 default 配置
  const config = pageSortConfig[path] || pageSortConfig.default;
  const { defaultSortMethod, labelMap } = config;

  const savedSort = sortMode.value.find(
    (item) => item.currentPage === route.path,
  );

  const method = savedSort?.sortMethod ?? defaultSortMethod;
  const order = savedSort?.sortOrder ?? "desc";

  currentSortLabel.value = labelMap[method] || Object.values(labelMap)[0];
  isAscending.value = order === "asc";

  state.value.SortMethod = method;
  state.value.SortOrder = order;

  // 如果没有保存记录，写入默认值
  if (!savedSort) {
    setSortMode({
      currentPage: path,
      sortMethod: defaultSortMethod,
      sortOrder: "desc",
    });
  }
};

function setPageApiPath(path: string) {
  if (path === '/recent-view') return 'RecentView';
  if (path === '/my-space') return 'Personal';
  if (path === '/my-share') return 'MyShare';
  if (path === '/recycle-bin') return 'RecycleBin';
  if (path.startsWith('/share-space')) return `ShareSpace_${contentId.value}`
  if (path.startsWith('/folder')) return `${fileBelong.value === "mySpace" ? "Personal" : "ShareSpace"}_${contentId.value}`
  return ""
}

function refreshData() {
  console.log("刷新数据")
  tableData.value = [];
  const path = route.path;
  state.value = generateState(path);
  initSort(path);
  fetchData();
}

window.refreshData = refreshData;

watch(
  () => route.path,
  (newPath) => {
    // 新页面contentId
    contentId.value = setContentId();
    // 接口请求参数
    state.value = generateState(newPath); // 重新赋值
    // 页面排序
    initSort(newPath);
    // 生成页面配置
    const columnKey = getColumnKeyByPath(newPath);
    pageConfig.value = getPageConfig(columnKey, fileBelong.value);

    pageApiPath.value = setPageApiPath(newPath)

    tableData.value = [];
    updateUploadRight();
    fetchData();
    clearSelection(tableRef.value);

    if (route.name === 'Folder') {
      const contentId = Number(route.params.contentId);
      const contentName = (route.query.contentName as string) || '';

      if (contentId) {
        const lastItem = routeStackStore.stack[routeStackStore.stack.length - 1];

        const isBroken = !lastItem || String(lastItem.id) !== String(contentId);

        if (isBroken) {
          console.log('检测到路由栈断层，开始修复...');
          routeStackStore.repairStack(contentId, contentName);
        } else {
          console.log('路由栈正常，无需修复');
        }
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.content {
  padding: 0 16px;
  position: relative;
}

:deep(.el-button) {
  &.is-text {
    padding: 0;
  }
}

.file-name-wrapper {
  width: calc(100% - 50px);
  display: flex;

  &.not-width {
    width: 100%;
  }

  &.not-my-share {
    justify-content: space-between;
    align-items: center;
  }
}

.name-text {
  max-width: calc(100% - 30px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading {
  border: 3px solid hsla(213, 71%, 53%, 0.2);
  border-top-color: #327EDC;
  border-radius: 50%;
  width: 21px;
  height: 21px;
  animation: spin 1s linear infinite;


  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.dropzone {
  position: absolute;
  inset: 0;
  z-index: 9999;
}
</style>
