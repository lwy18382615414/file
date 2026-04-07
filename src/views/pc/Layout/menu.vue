<template>
  <div
    v-border-cursor
    class="sidebar-container"
  >
    <div class="header-section">
      <SearchBox/>
      <div
        v-if="canCreateFolder"
        class="root-folder-btn"
        @click="createShareFolder"
      >
        {{ t("createFolder") }}
      </div>
      <div v-else class="empty-placeholder"></div>
    </div>

    <div class="menu-container">
      <div
        v-for="(item, index) in menu"
        :key="item.path"
        :class="{
          active: index === activeIndex,
          menu: index !== 4,
        }"
        @click="menuClick(item, index)"
      >
        <div class="menu-item">
          <div :class="{ sub: index === 4 }" class="menu-row">
            <SvgIcon
              v-if="item.path === '/share-space'"
              :style="{
                transform: isExpand ? 'rotate(0deg)' : 'rotate(-90deg)',
                marginBottom: '4px',
                marginRight: '2px',
                transition: 'transform 0.3s ease-in-out',
              }"
              name="ic_expand"
              size="18"
            />

            <div class="menu-item-title">
              {{ t(item.name) }}
            </div>
          </div>
        </div>
        <div
          v-if="item.children && item.children.length > 0 && isExpand"
          ref="subMenuContainer"
          class="sub-menu-container"
        >
          <div
            v-for="(sub, subIndex) in item.children"
            :key="sub.contentId"
            :ref="(el) => setSubRef(el, subIndex)"
            :class="{ active: subIndex === activeSubIndex }"
            class="sub-menu"
            @click.stop="subMenuClick(sub, subIndex)"
            @contextmenu.stop.prevent="handleRightClick(sub, subIndex, $event)"
          >
            <div class="sub-menu-item">
              <div class="sub-menu-row">
                <span class="">
                  <SvgIcon name="ic_root-folder" size="18"/>
                </span>
                <div class="menu-item-title">
                  {{ sub.contentName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="progress-bar">
      <div class="usage-info-header">
        <div class="flex-center">
          {{ t("spaceUsage", { spaceSize: usedCapacity }) }}
          <div v-if="false" class="red-dot"></div>
        </div>
        <div v-if="false" class="flex-center">
          <div class="line"></div>
          <span>
            <SvgIcon name="ic_dots" size="14"/>
          </span>
        </div>
      </div>
      <el-progress :percentage="progress" :show-text="false"/>
    </div>
  </div>
  <AddShareSpace
    v-if="show"
    :space-name="shareSpaceName"
    :title="shareDialogTitle"
    :visible="show"
    @createShareSpace="newSharedFolder"
    @update:visible="show = $event"
  />
  <PopMenu
    v-model="contextMenuVisible"
    :options="filterMenu"
    :position="menuPosition"
    :width="180"
    @select="handleMenuSelect"
  />
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { MenuType } from "./type";
import type { ContentType, SharedCloudContent } from "@/types/type";
import SvgIcon from "@/components/SvgIcon.vue";
import SearchBox from "@/components/SearchBox.vue";
import { getMySpaceUsageApi, hasCreateSharePermissionApi } from "@/api/common";
import { useSetting, useShareFileStore } from "@/stores";
import { formatFileSize, t } from "@/utils";
import AddShareSpace from "@/views/pc/Layout/pop/addShareSpace.vue";
import { PopMenu } from "@/components";
import { useRightClickMenu } from "@/hooks/composable/useRightClickMenu";
import { useFileActions } from "@/hooks/composable/useFileActions";
import { useShareSpace } from "@/hooks/useShareSpace";
import { getContentId, getName } from "@/utils/typeUtils";
import { getShareSpace as getShareSpaceApi } from "@/api/shareSpace";

const { setShareList, setShowChooseCount } = useShareFileStore();
const {
  shareRoutes,
  activeIndex: storeActiveIndex,
  activeSubIndex: storeActiveSubIndex,
  isSharedDirChanged,
} = useShareSpace();
const route = useRoute();
const router = useRouter();
const menu = ref<Array<MenuType>>([
  { path: "/recent-view", name: "route.recentView" },
  { path: "/my-space", name: "route.myFiles" },
  { path: "/my-share", name: "route.myShares" },
  { path: "/recycle-bin", name: "route.recycleBin" },
  { path: "/share-space", name: "route.shared", children: [] },
]);
const activeIndex = ref<number | null>(0);
const activeSubIndex = ref<number | null>(null);
const isExpand = ref(true);
const subMenuContainer = ref<HTMLElement | null>(null);
const subMenuRefs = ref<HTMLElement[]>([]);
const usedCapacity = ref("");
const progress = ref(0);
const canCreateFolder = ref(false);

let timer: number | null | undefined = null;

watch([storeActiveIndex, storeActiveSubIndex], ([newIndex, newSubIndex]) => {
  activeIndex.value = newIndex;
  activeSubIndex.value = newSubIndex;
});

watch(
  () => isSharedDirChanged.value,
  (isChange) => {
    if (isChange) {
      getShareSpace();
      isSharedDirChanged.value = !isSharedDirChanged.value;
    }
  },
);

const setSubRef = (el: HTMLElement | null, index: number) => {
  if (el) subMenuRefs.value[index] = el;
};

const goToShareSpace = async (contentId: number, name: string) => {
  await router.push({ path: `/share-space/${ contentId }`, query: { contentName: name } });
};

const resetFileViewState = () => {
  setShareList([]);
  setShowChooseCount(false);
};

const {
  filterMenu,
  selectedRow,
  contextMenuVisible,
  menuPosition,
  handleRightClick,
} = useRightClickMenu({
  includeKeys: [
    "top",
    "add",
    "permission",
    "rootRename",
    "export",
    "copyLink",
    "rootDelete",
    "exit",
  ],
  onSelectRow: (row, value) => {
    const contentId = getContentId(row) || 0;
    const folderIndex = shareRoutes.value.findIndex(
      (item) => item.contentId === contentId,
    );
    storeActiveIndex.value = null;
    if (storeActiveSubIndex.value !== value) resetFileViewState();
    goToShareSpace(contentId, getName(row));
    if (folderIndex) {
      storeActiveSubIndex.value = folderIndex;
    } else {
      storeActiveSubIndex.value = 0;
    }
  },
});

const {
  shareSpaceName,
  show,
  shareDialogTitle,
  topFile,
  cancelTopFile,
  handleExportFile,
  handleCopyLink,
  deleteRootFolder,
  createSharedFolder,
  exitShareSpace,
} = useFileActions({
  onRefresh: () => {
    refreshMenu();
  },
  clearSelection: () => {
    selectedRow.value = {} as ContentType;
  },
});

const menuClick = async (item: MenuType, index: number) => {
  if (activeIndex.value === index) return;
  setShareList([]);
  setShowChooseCount(false);
  getSpaceUsage();
  if (index === 4) {
    isExpand.value = !isExpand.value;
    if (isExpand.value) await getShareSpace();
  } else {
    storeActiveSubIndex.value = null;
    storeActiveIndex.value = index;
    activeSubIndex.value = null;
    activeIndex.value = index;
    await router.push(item.path);
  }
};

const subMenuClick = async (item: SharedCloudContent, index: number) => {
  if (activeSubIndex.value === index) return;
  setShareList([]);
  setShowChooseCount(false);
  storeActiveIndex.value = null;
  storeActiveSubIndex.value = index;
  activeIndex.value = null;
  activeSubIndex.value = index;
  await router.push({
    path: `/share-space/${ item.contentId }`,
    query: {
      contentName: item.contentName,
    },
  });
  await scrollToSubItem(index);
};

const handleMenuSelect = (key: string) => {
  switch (key) {
    case "top":
      topFile(selectedRow.value);
      break;
    case "add":
      useSetting().updateSettingVisible(true);
      break;
    case "permission":
      useSetting().updateSettingVisible(true);
      break;
    case "rootRename":
      shareSpaceName.value = getName(selectedRow.value);
      shareDialogTitle.value = t("renameFolder");
      show.value = true;
      break;
    case "rootDelete":
      deleteRootFolder(selectedRow.value);
      break;
    case "export":
      handleExportFile();
      break;
    case "copyLink":
      handleCopyLink();
      break;
    case "exit":
      exitShareSpace(selectedRow.value);
      break;
    case "cancelTop":
      cancelTopFile(selectedRow.value);
      break;
  }
};

const createShareFolder = () => {
  hasCreateSharePermissionApi().then((res) => {
    if (res.code === 1) {
      if (res.data) {
        show.value = true;
        shareSpaceName.value = "";
        shareDialogTitle.value = t("createFolder");
      }
      canCreateFolder.value = res.data;
    } else {
      canCreateFolder.value = false;
    }

    if (!canCreateFolder.value) {
      ElMessage.warning(t("noPermission"));
    }
  }).catch(() => {
    canCreateFolder.value = false;
  });
};

const getSpaceUsage = async () => {
  const res = await getMySpaceUsageApi();
  if (res.code === 1) {
    const { userCapacityCount, personalCapacityCount } = res.data;
    usedCapacity.value = formatFileSize(userCapacityCount);
    progress.value =
      (userCapacityCount / 1024 / 1024 / 1024 / personalCapacityCount) * 100;
  }
};

const canCreateFolderFn = async () => {
  try {
    const res = await hasCreateSharePermissionApi();
    if (res.code === 1) {
      canCreateFolder.value = res.data;
    }
  } catch (e) {
    canCreateFolder.value = false;
  }
};

const startPolling = () => {
  canCreateFolderFn();
  timer = setInterval(() => {
    canCreateFolderFn();
  }, 30000);
};

const newSharedFolder = (name: string) => {
  createSharedFolder(name, getContentId(selectedRow.value));
  shareSpaceName.value = name;
};

const initIndex = () => {
  if (storeActiveSubIndex.value === null && storeActiveIndex.value === null) {
    storeActiveIndex.value = activeIndex.value;
    storeActiveSubIndex.value = null;
  } else if (
    storeActiveSubIndex.value === null &&
    storeActiveIndex.value !== null
  ) {
    activeIndex.value = storeActiveIndex.value;
  } else if (
    storeActiveSubIndex.value !== null &&
    storeActiveIndex.value === null
  ) {
    activeSubIndex.value = storeActiveSubIndex.value;
    activeIndex.value = null;
  }
};

const scrollToSubItem = async (index: number) => {
  await nextTick();
  const targetElement = subMenuRefs.value[index];
  const container = subMenuContainer.value;
  if (!targetElement || !container) return;
  targetElement.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const getShareSpace = (waitForUpdate = false) => {
  return new Promise((resolve) => {
    const run = async () => {
      try {
        const shareSpaceRes = await getShareSpaceApi({
          PageIndex: 0,
          PageSize: 0,
          onBackgroundUpdate: (newData: { count: number, data: SharedCloudContent[] }) => {
            shareRoutes.value = newData.data;
            menu.value[4].children = shareRoutes.value;
            if (waitForUpdate) {
              resolve(newData.data);
            }
          }
        });

        if (shareSpaceRes.code === 1) {
          shareRoutes.value = shareSpaceRes.data.data;
          menu.value[4].children = shareRoutes.value;
          if (!waitForUpdate) {
            resolve(shareSpaceRes.data.data);
          }
        }
      } catch (error) {
        console.error("加载共享空间失败", error);
        if (waitForUpdate) resolve([]);
      }
    };
    run();
  });
};

const refreshMenu = async () => {
  await getShareSpace(true);


  const list = shareRoutes.value;
  if (list.length === 0) {
    const defaultPath = "/my-space";
    if (route.path !== defaultPath) resetFileViewState();
    storeActiveIndex.value = 0;
    storeActiveSubIndex.value = null;
    activeIndex.value = 0;
    activeSubIndex.value = null;
    await router.push(defaultPath);
    return;
  }

  const targetIndex = list.findIndex((item) =>
    getContentId(selectedRow.value)
      ? item.contentId === getContentId(selectedRow.value)
      : item.contentName === shareSpaceName.value,
  );

  const fallbackIndex = 0;
  const indexToUse = targetIndex !== -1 ? targetIndex : fallbackIndex;
  const target = list[indexToUse];
  const targetPath = `/share-space/${ target.contentId }`;

  if (route.path !== targetPath) {
    resetFileViewState();
  }

  storeActiveIndex.value = null;
  storeActiveSubIndex.value = indexToUse;
  activeIndex.value = null;
  activeSubIndex.value = indexToUse;
  await router.push({
    path: targetPath,
    query: { contentName: target.contentName },
  });

  await scrollToSubItem(indexToUse);
};

onMounted(() => {
  getShareSpace();
  getSpaceUsage();
  startPolling();
  initIndex();
  if (storeActiveSubIndex.value !== null) {
    scrollToSubItem(storeActiveSubIndex.value!);
  }
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style lang="scss" scoped>
.sidebar-container {
  position: relative;
  width: 164px;
  height: 100vh;
  background-color: #eff0f1;
  border-right: 1px solid #e5e6e8;
}

.header-section {
  padding: 30px 9px 0 9px;
  border-bottom: 1px solid #e5e6e8;
}

.empty-placeholder {
  height: 40px;
}

.menu-row {
  display: flex;
  align-items: center;
}

.sub-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #747683;
  line-height: 16px;
  margin-bottom: 8px;
}

.flex-center {
  display: flex;
  align-items: center;
}

.app-title {
  margin-bottom: 22px;
  font-size: calc(var(--base--font--size--18) * var(--scale-factor));
  font-weight: bold;
  line-height: 16px;
  font-family: PingFangSC-Medium,
  PingFang SC;
  margin-left: 7px;
  color: #2d2d2d;
}

.root-folder-btn {
  text-align: center;
  background-color: #327edc;
  border-radius: 4px;
  color: #fff;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  padding: 8px 16px;
  margin: 12px 0 12px;
  cursor: context-menu;
}

.menu-container {
  padding: 8px;
  cursor: context-menu;

  .active {
    background: #0000000f;
    border-radius: 6px;
  }

  .menu {
    padding: 8px;
  }

  .sub-menu-container {
    max-height: calc(100vh - 360px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      background-color: transparent;
    }
  }

  .sub-menu {
    padding: 8px;
  }

  .sub {
    padding: 8px;
  }

  .menu-item-title {
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    color: #2d2d2d;
    max-width: calc(500px - 62px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.progress-bar {
  width: 100%;
  padding: 0 16px;
  position: absolute;
  bottom: 16px;

  .red-dot {
    margin-left: 4px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: #fe6666;
  }

  :deep(.el-progress-bar__outer) {
    background-color: #2d2d2d1a;
  }

  .line {
    width: 1px;
    height: 11px;
    background: #2d2d2d1a;
    margin-right: 10px;
  }
}
</style>