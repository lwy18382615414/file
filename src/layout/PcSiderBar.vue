<template>
  <div class="siderbar-container" :style="{ width: `${sidebarWidth}px` }">
    <main>
      <SearchBox />
      <div v-if="canCreateFolder" class="new" @click="handleCreateFolder">
        <SvgIcon name="action-create" size="20" />
        <span> {{ t("createFolder") }}</span>
      </div>
      <div v-else class="new-placeholder"></div>

      <NameEditDialog
        :show="createDialogVisible"
        :item="null"
        mode="create"
        @update:show="handleCreateDialogVisibleChange"
        @confirm="handleConfirmCreate"
      />
      <NameEditDialog
        :show="renameDialogVisible"
        :item="renameItem"
        mode="rename"
        @update:show="handleRenameDialogVisibleChange"
        @confirm="handleConfirmRename"
      />
      <CopyLinkDialog
        :show="shareLinkVisible"
        :items="shareLinkItems"
        @update:show="handleShareLinkVisibleChange"
      />
      <PcFileContextMenu
        :show="contextMenuVisible"
        :position="contextMenuPosition"
        :actions="contextMenuActions"
        @close="closeContextMenu"
        @select="handleContextMenuSelect"
      />
      <SettingDialog
        :show="settingVisible"
        :content-id="selectedSharedItem?.contentId ?? 0"
        @update:show="settingVisible = $event"
        @update:permission-count="handlePermissionCountUpdate"
      />

      <div class="menu-container">
        <div
          v-for="item in fixedMenu"
          :key="item.path"
          :data-path="item.path"
          :class="['menu-item-wrapper', { active: item.path === activePath }]"
          @click="menuClick(item)"
          @dblclick="menuDoubleClick(item)"
        >
          <div class="menu-item">
            <div class="menu-item-icon">
              <SvgIcon
                :name="'nav-' + item.icon"
                :color="item.path === activePath ? '#5665bb' : '#252525'"
              />
            </div>
            <div class="menu-item-title">
              {{ t(item.name) }}
            </div>
          </div>
        </div>

        <div
          :class="[
            'menu-item-wrapper',
            'shared-item',
            { expanded: sharedMenuExpanded },
          ]"
          @click="handleSharedMenuToggle"
        >
          <div class="menu-item">
            <div class="menu-item-title">
              {{ t("route.shared") }}
            </div>
            <div
              :class="['shared-item-arrow', { expanded: sharedMenuExpanded }]"
            >
              <SvgIcon name="ic_arr_down_more" />
            </div>
          </div>
        </div>

        <transition name="shared-menu-collapse">
          <div
            v-show="sharedMenuExpanded"
            ref="sharedScrollRef"
            class="shared-scroll"
          >
            <div
              v-for="item in sharedMenu"
              :key="item.path"
              :data-path="item.path"
              :class="[
                'menu-item-wrapper',
                { active: item.path === activePath },
              ]"
              @click="menuClick(item)"
              @dblclick="menuDoubleClick(item)"
              @contextmenu.stop.prevent="
                handleSharedItemContextmenu(item, $event)
              "
            >
              <div class="menu-item">
                <div class="menu-item-icon">
                  <SvgIcon :name="'file-' + item.icon" />
                </div>
                <div class="menu-item-title">
                  {{ item.name }}
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </main>
    <div class="usage-content">
      <div class="usage-info-header">
        {{ t("usage") }}
      </div>
      <el-progress :percentage="progress" :show-text="false" />

      <div class="usage">
        {{ t("spaceUsage", { spaceSize: usedCapacity }) }}
      </div>
    </div>
    <div class="resize-handle" @mousedown="startResize" />
  </div>
</template>

<script lang="ts" setup>
import SearchBox from "@/components/SearchBox.vue";
import { Permission } from "@/enum/permission";
import {
  cancelTopSpaceApi,
  exitSpaceApi,
  getMySpaceUsageApi,
  hasCreateSharePermissionApi,
  topSpaceApi,
} from "@/api/common";
import {
  createFolderApi,
  deleteFileOrDirApi,
  renameFileApi,
} from "@/api/fileService";
import { getShareSpace as getShareSpaceApi } from "@/api/shareSpace";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import { useSidebarLastVisited } from "@/layout/hooks/useSidebarLastVisited";
import { useSidebarResize } from "@/layout/hooks/useSidebarResize";
import type { ContentType, SharedCloudContent } from "@/types/type";
import { formatFileSize, hasPermission } from "@/utils";
import CopyLinkDialog from "@/views/components/pc/Dialog/CopyLinkDialog.vue";
import NameEditDialog from "@/views/components/pc/Dialog/NameEditDialog.vue";
import PcFileContextMenu from "@/views/components/pc/PcFileContextMenu.vue";
import SettingDialog from "@/views/components/pc/Dialog/SettingDialog.vue";
import { useShareLink } from "@/views/hooks/useShareLink";
import type { PcFileContextAction } from "@/views/hooks/usePcFileContextMenu";
import { useI18n } from "vue-i18n";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const MENU_WIDTH = 168;
const MENU_ITEM_HEIGHT = 36;
const MENU_PADDING = 8;
const VIEWPORT_GAP = 8;
const CURSOR_OFFSET = -12;

const router = useRouter();
const { t } = useI18n();
const { toast, confirm } = useUiFeedback();
const { sidebarWidth, startResize, stopResize } = useSidebarResize();
const { shareLinkVisible, shareLinkItems, openShareLink, closeShareLink } =
  useShareLink();

const CREATE_PERMISSION_POLL_INTERVAL = 30000;

const createDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const renameItem = ref<ContentType | null>(null);
const canCreateFolder = ref<boolean | null>(null);
const creating = ref(false);
const renaming = ref(false);
const settingVisible = ref(false);
const selectedSharedItem = ref<SharedCloudContent | null>(null);
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuActions = ref<PcFileContextAction[]>([]);
const sharedScrollRef = ref<HTMLElement | null>(null);
const sharedMenuExpanded = ref(true);
const usedCapacity = ref("0 B");
const progress = ref(0);
let createPermissionTimer: ReturnType<typeof setInterval> | null = null;

const fixedMenu = [
  { path: "/recent", name: "route.recentView", icon: "recent" },
  { path: "/my", name: "route.myFiles", icon: "my" },
  { path: "/my-shares", name: "route.myShares", icon: "shared" },
  { path: "/recycle-bin", name: "route.recycleBin", icon: "recycle_bin" },
] as const;

type SharedMenuItem = {
  path: string;
  name: string;
  icon: string;
  query?: Record<string, string>;
  raw: SharedCloudContent;
};

type FixedMenuItem = (typeof fixedMenu)[number];
type SidebarMenuItem = FixedMenuItem | SharedMenuItem;

const sharedMenu = ref<SharedMenuItem[]>([]);

const { activePath, isSameLocation, resolveMenuTarget } =
  useSidebarLastVisited(fixedMenu);

const isSharedMenuItem = (item: SidebarMenuItem): item is SharedMenuItem => {
  return item.path.startsWith("/shared/");
};

const scrollToSharedItem = async (path: string) => {
  if (!path.startsWith("/shared/")) return;

  await nextTick();

  const container = sharedScrollRef.value;
  const target = container?.querySelector<HTMLElement>(`[data-path="${path}"]`);

  target?.scrollIntoView({ block: "center", behavior: "smooth" });
};

const menuClick = (item: SidebarMenuItem) => {
  if (!item.path) return;

  const nextLocation = resolveMenuTarget(item);

  if (isSharedMenuItem(item)) {
    scrollToSharedItem(nextLocation.rootPath || item.path);
  }

  if (isSameLocation(nextLocation.path, nextLocation.query)) return;
  router.push({ path: nextLocation.path, query: nextLocation.query });
};

const menuDoubleClick = (item: SidebarMenuItem) => {
  if (!item.path) return;

  const nextPath = item.path;
  const nextQuery = isSharedMenuItem(item) ? item.query : undefined;

  if (isSharedMenuItem(item)) {
    scrollToSharedItem(nextPath);
  }

  if (isSameLocation(nextPath, nextQuery)) return;
  router.push({ path: nextPath, query: nextQuery });
};

const updateMenuWithShareSpace = (shareSpaces: SharedCloudContent[]) => {
  sharedMenu.value = shareSpaces.map((item) => ({
    path: `/shared/${item.contentId}`,
    name: item.contentName,
    icon: "folder",
    query: {
      names: encodeURIComponent(item.contentName),
    },
    raw: item,
  }));
};

const handleSharedMenuToggle = async () => {
  const nextExpanded = !sharedMenuExpanded.value;
  sharedMenuExpanded.value = nextExpanded;

  if (!nextExpanded) return;

  await getShareSpace();
  scrollToSharedItem(activePath.value);
};

watch(
  [activePath, sharedMenu],
  ([path]) => {
    scrollToSharedItem(path);
  },
  { immediate: true },
);

const resolveContextMenuPosition = (event: MouseEvent, actionCount: number) => {
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

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuActions.value = [];
};

const buildSharedContextActions = (item: SharedCloudContent) => {
  const actions: PcFileContextAction[] = [];

  if (hasPermission(item.permissionType, Permission.View)) {
    actions.push({
      key: item.isSetTop ? "unTop" : "top",
      label: item.isSetTop ? t("unpin") : t("pin"),
    });
    actions.push({ key: "copyLink", label: t("copyLink") });
    actions.push({ key: "exit", label: t("exitRootDir") });
  }

  if (hasPermission(item.permissionType, Permission.Admin)) {
    actions.push({ key: "permission", label: t("permissionManagement") });
  }

  if (hasPermission(item.permissionType, Permission.SuperAdmin)) {
    actions.push({ key: "rename", label: t("rename") });
    actions.push({ key: "delete", label: t("delete"), danger: true });
  }

  return actions;
};

const handleSharedItemContextmenu = (
  item: SharedMenuItem,
  event: MouseEvent,
) => {
  const actions = buildSharedContextActions(item.raw);
  if (!actions.length) {
    closeContextMenu();
    return;
  }

  selectedSharedItem.value = item.raw;
  contextMenuActions.value = actions;
  contextMenuPosition.value = resolveContextMenuPosition(event, actions.length);
  menuClick(item);
  contextMenuVisible.value = true;
};

const handleCreateDialogVisibleChange = (value: boolean) => {
  createDialogVisible.value = value;
};

const handleRenameDialogVisibleChange = (value: boolean) => {
  renameDialogVisible.value = value;
  if (!value) {
    renameItem.value = null;
  }
};

const handleShareLinkVisibleChange = (value: boolean) => {
  if (value) return;
  closeShareLink();
};

const handlePermissionCountUpdate = async () => {
  await getShareSpace();
};

const syncCreateFolderPermission = async () => {
  try {
    const res = await hasCreateSharePermissionApi();
    canCreateFolder.value = res.code === 1 ? res.data : false;
    return canCreateFolder.value;
  } catch (error) {
    console.error("获取新建共享目录权限失败", error);
    canCreateFolder.value = false;
    return false;
  }
};

const startCreatePermissionPolling = () => {
  syncCreateFolderPermission();
  createPermissionTimer = setInterval(() => {
    syncCreateFolderPermission();
  }, CREATE_PERMISSION_POLL_INTERVAL);
};

const stopCreatePermissionPolling = () => {
  if (!createPermissionTimer) return;
  clearInterval(createPermissionTimer);
  createPermissionTimer = null;
};

const handleCreateFolder = async () => {
  if (creating.value) return;

  const hasPermission = await syncCreateFolderPermission();
  if (!hasPermission) {
    toast(t("noPermission"), "warning");
    return;
  }

  closeContextMenu();
  createDialogVisible.value = true;
};

const handleConfirmCreate = async (name: string) => {
  if (creating.value) return;

  const folderName = name.trim();
  if (!folderName) return;

  creating.value = true;

  try {
    const res = await createFolderApi({
      currentContentId: 0,
      viewRanges: [],
      editRanges: [],
      folderName,
      isPersonal: false,
    });

    if (res.code !== 1) {
      toast(t("newFolderFailed"), "error");
      return;
    }

    const nextPath = `/shared/${res.data}`;
    const nextQuery = {
      names: encodeURIComponent(folderName),
    };

    toast(t("createSuccess"), "success");
    createDialogVisible.value = false;
    await getShareSpace();
    await router.push({ path: nextPath, query: nextQuery });
    scrollToSharedItem(nextPath);
  } catch (error) {
    console.error("侧边栏新建文件夹失败", error);
    toast(t("folderCreationError"), "error");
  } finally {
    creating.value = false;
  }
};

const getFallbackSharedLocation = (excludedContentId?: number) => {
  const target = sharedMenu.value.find(
    (item) => item.raw.contentId !== excludedContentId,
  );

  if (!target) {
    return { path: "/my" };
  }

  return {
    path: target.path,
    query: target.query,
  };
};

const handleConfirmRename = async (name: string) => {
  if (renaming.value) return;

  const item = selectedSharedItem.value;
  const nextName = name.trim();
  if (!item || !nextName) return;

  if (nextName === item.contentName.trim()) {
    renameDialogVisible.value = false;
    renameItem.value = null;
    return;
  }

  renaming.value = true;

  try {
    const res = await renameFileApi(item.contentId, nextName);
    if (res.code !== 1) {
      toast(t("renameFailed"), "error");
      return;
    }

    const nextPath = `/shared/${item.contentId}`;
    const nextQuery = {
      names: encodeURIComponent(nextName),
    };

    toast(t("renameSuccess"), "success");
    renameDialogVisible.value = false;
    renameItem.value = null;
    selectedSharedItem.value = {
      ...item,
      contentName: nextName,
    };
    await getShareSpace();

    if (activePath.value === nextPath) {
      await router.replace({ path: nextPath, query: nextQuery });
    }

    scrollToSharedItem(nextPath);
  } catch (error) {
    console.error("侧边栏重命名共享根目录失败", error);
    toast(t("renameFailed"), "error");
  } finally {
    renaming.value = false;
  }
};

const handleContextMenuSelect = async (key: string) => {
  const item = selectedSharedItem.value;
  closeContextMenu();

  if (!item) return;

  const nextPath = `/shared/${item.contentId}`;
  const isActiveRoot = activePath.value === nextPath;

  if (key === "copyLink") {
    openShareLink([item as ContentType]);
    return;
  }

  if (key === "permission") {
    settingVisible.value = true;
    return;
  }

  if (key === "rename") {
    renameItem.value = item as ContentType;
    renameDialogVisible.value = true;
    return;
  }

  if (key === "top" || key === "unTop") {
    try {
      const res =
        key === "top"
          ? await topSpaceApi(item.contentId)
          : await cancelTopSpaceApi(item.contentId);

      if (res.code !== 1) {
        toast(key === "top" ? t("pinFailed") : t("unpinFailed"), "error");
        return;
      }

      toast(key === "top" ? t("pinSuccess") : t("unpinSuccess"), "success");
      selectedSharedItem.value = {
        ...item,
        isSetTop: key === "top",
      };
      await getShareSpace();
      scrollToSharedItem(nextPath);
    } catch (error) {
      console.error("侧边栏切换共享根目录置顶失败", error);
      toast(key === "top" ? t("pinFailed") : t("unpinFailed"), "error");
    }
    return;
  }

  if (key === "delete") {
    try {
      await confirm({
        title: t("deleteRootDir"),
        message: t("deleteRootDirWarning"),
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
        type: "warning",
      });
    } catch {
      return;
    }

    try {
      const res = await deleteFileOrDirApi([item.contentId]);
      if (res.code !== 1) {
        toast(t("deletePermissionError"), "error");
        return;
      }

      toast(t("deleteSuccess"), "success");
      await getShareSpace();

      if (isActiveRoot) {
        await router.replace(getFallbackSharedLocation(item.contentId));
      }
    } catch (error) {
      console.error("侧边栏删除共享根目录失败", error);
      toast(t("operationFailed"), "error");
    }
    return;
  }

  if (key === "exit") {
    try {
      await confirm({
        title: t("exitRootDir"),
        message: t("exitFolderWarning"),
        confirmButtonText: t("Ok"),
        cancelButtonText: t("cancel"),
        type: "warning",
      });
    } catch {
      return;
    }

    try {
      const res = await exitSpaceApi(item.contentId);
      if (res.code !== 1) {
        toast(t("exitFailed"), "error");
        return;
      }

      toast(t("exitSuccess"), "success");
      await getShareSpace();

      if (isActiveRoot) {
        await router.replace(getFallbackSharedLocation(item.contentId));
      }
    } catch (error) {
      console.error("侧边栏退出共享根目录失败", error);
      toast(t("exitFailed"), "error");
    }
  }
};

const getSpaceUsage = async () => {
  try {
    const res = await getMySpaceUsageApi();
    if (res.code !== 1) return;

    const { userCapacityCount, personalCapacityCount } = res.data;
    usedCapacity.value = formatFileSize(userCapacityCount);

    if (!personalCapacityCount || personalCapacityCount <= 0) {
      progress.value = 0;
      return;
    }

    const percentage =
      (userCapacityCount / 1024 / 1024 / 1024 / personalCapacityCount) * 100;
    progress.value = Math.min(
      Math.max(Number.isFinite(percentage) ? percentage : 0, 0),
      100,
    );
  } catch (error) {
    console.error("加载空间用量失败", error);
    usedCapacity.value = "0 B";
    progress.value = 0;
  }
};

const getShareSpace = (waitForUpdate = false) => {
  return new Promise<SharedCloudContent[]>((resolve) => {
    const run = async () => {
      try {
        const shareSpaceRes = await getShareSpaceApi({
          PageIndex: 0,
          PageSize: 0,
          onBackgroundUpdate: (newData: {
            count: number;
            data: SharedCloudContent[];
          }) => {
            updateMenuWithShareSpace(newData.data);
            if (waitForUpdate) {
              resolve(newData.data);
            }
          },
        });

        if (shareSpaceRes.code === 1 && !waitForUpdate) {
          updateMenuWithShareSpace(shareSpaceRes.data.data);
          resolve(shareSpaceRes.data.data);
        }
      } catch (error) {
        console.error("加载共享空间失败", error);
        resolve([]);
      }
    };

    run();
  });
};

onMounted(() => {
  getShareSpace();
  getSpaceUsage();
  startCreatePermissionPolling();
});

onBeforeUnmount(() => {
  stopCreatePermissionPolling();
  stopResize();
});
</script>

<style lang="scss" scoped>
.siderbar-container {
  position: relative;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fbfbfb;

  main {
    flex: 1;
    padding: 12px;
    border-right: 1px solid #e7edf4;

    .new,
    .new-placeholder {
      margin: 12px 0;
    }

    .new {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      font-size: 14px;
      border-radius: 8px;
      background-color: #5665bb;
      text-align: center;
      font-weight: 600;
      line-height: 20px;
      color: #fff;
      cursor: pointer;
    }

    .new-placeholder {
      height: 36px;
    }

    .menu-container {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .shared-scroll {
        display: flex;
        flex-direction: column;
        gap: 4px;
        height: calc(100vh - 388px);
        overflow-y: auto;
        transform-origin: top;
      }

      .shared-menu-collapse-enter-active,
      .shared-menu-collapse-leave-active {
        transition:
          max-height 0.24s ease,
          opacity 0.24s ease,
          transform 0.24s ease;
        overflow: hidden;
      }

      .shared-menu-collapse-enter-from,
      .shared-menu-collapse-leave-to {
        max-height: 0;
        opacity: 0;
        transform: translateY(-6px);
      }

      .shared-menu-collapse-enter-to,
      .shared-menu-collapse-leave-from {
        max-height: calc(100vh - 388px);
        opacity: 1;
        transform: translateY(0);
      }

      .menu-item-wrapper {
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;

        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;

          .menu-item-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 20px;
            font-size: 14px;
            color: #475569;
            user-select: none;
          }
        }

        &.active {
          background-color: #e7edf4;

          .menu-item-title {
            font-weight: 600;
            color: #5665bb;
          }
        }

        &.shared-item {
          cursor: pointer;

          .menu-item {
            justify-content: space-between;
          }

          .menu-item-title {
            font-size: 12px;
            color: #9ca3af;
          }

          .shared-item-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            transition: color 0.2s ease;

            :deep(svg) {
              width: 14px;
              height: 14px;
              transform: rotate(-90deg);
              transition: transform 0.24s ease;
            }

            &.expanded {
              :deep(svg) {
                transform: rotate(0deg);
              }
            }
          }

          &.expanded {
            .menu-item-title,
            .shared-item-arrow {
              color: #5665bb;
            }
          }
        }
      }
    }
  }

  .usage-content {
    height: 72px;
    position: relative;
    padding: 12px;
    background-color: #fff;
    border-radius: 4px;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background-color: #e7edf4;
    }

    .usage-info-header {
      font-weight: 700;
      font-size: 10px;
      line-height: 15px;
      color: #707681;
    }

    .el-progress {
      margin: 4px 0 8px;
    }

    :deep(.el-progress-bar__outer) {
      background-color: #e2e8f0;
    }

    .usage {
      font-weight: 400;
      font-size: 10px;
      line-height: 15px;
      color: #707681;
    }
  }

  .resize-handle {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
    z-index: 99;

    &:hover {
      background-color: rgba(86, 101, 187, 0.12);
    }
  }
}
</style>
