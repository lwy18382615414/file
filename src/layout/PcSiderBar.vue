<template>
  <div class="siderbar-container" :style="{ width: `${sidebarWidth}px` }">
    <main>
      <SearchBox />
      <div class="new">
        <SvgIcon name="action-create" size="20" />
        <span> {{ t("createFolder") }}</span>
      </div>

      <div class="menu-container">
        <div
          v-for="item in fixedMenu"
          :key="item.path"
          :data-path="item.path"
          :class="['menu-item-wrapper', { active: item.path === activePath }]"
          @click="menuClick(item)"
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

        <div class="menu-item-wrapper shared-item">
          <div class="menu-item">
            <div class="menu-item-title">
              {{ t("route.shared") }}
            </div>
          </div>
        </div>

        <div ref="sharedScrollRef" class="shared-scroll">
          <div
            v-for="item in sharedMenu"
            :key="item.path"
            :data-path="item.path"
            :class="['menu-item-wrapper', { active: item.path === activePath }]"
            @click="menuClick(item)"
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
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { getMySpaceUsageApi } from "@/api/common";
import { getShareSpace as getShareSpaceApi } from "@/api/shareSpace";
import type { SharedCloudContent } from "@/types/type";
import { formatFileSize } from "@/utils";
import { S } from "vue-router/dist/router-CWoNjPRp.mjs";

const SIDEBAR_WIDTH_STORAGE_KEY = "pc-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 360;

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const fixedMenu = ref([
  { path: "/recent", name: "route.recentView", icon: "recent" },
  { path: "/my", name: "route.myFiles", icon: "my" },
  { path: "/my-shares", name: "route.myShares", icon: "shared" },
  { path: "/recycle-bin", name: "route.recycleBin", icon: "recycle_bin" },
]);

const sharedMenu = ref<
  { path: string; name: string; icon: string; query?: Record<string, string> }[]
>([]);
const sharedScrollRef = ref<HTMLElement | null>(null);
const sidebarWidth = ref(DEFAULT_SIDEBAR_WIDTH);
const usedCapacity = ref("0 B");
const progress = ref(0);

const activePath = computed(() => {
  const currentPath = route.path;

  if (currentPath.startsWith("/shared/")) {
    return currentPath;
  }

  const matchedMenu = fixedMenu.value.find(
    (item) =>
      currentPath === item.path || currentPath.startsWith(`${item.path}/`),
  );

  return matchedMenu?.path ?? currentPath;
});

const clampWidth = (width: number) => {
  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
};

const getStoredSidebarWidth = () => {
  const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  const parsedWidth = storedWidth ? Number(storedWidth) : NaN;

  if (!Number.isFinite(parsedWidth)) {
    return DEFAULT_SIDEBAR_WIDTH;
  }

  return clampWidth(parsedWidth);
};

const updateSidebarWidth = (width: number) => {
  const nextWidth = clampWidth(width);
  sidebarWidth.value = nextWidth;
  window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(nextWidth));
};

const handleResize = (event: MouseEvent) => {
  updateSidebarWidth(event.clientX);
};

const stopResize = () => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
};

const startResize = (event: MouseEvent) => {
  event.preventDefault();
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
};

const scrollToSharedItem = async (path: string) => {
  if (!path.startsWith("/shared/")) return;

  await nextTick();

  const container = sharedScrollRef.value;
  const target = container?.querySelector<HTMLElement>(`[data-path="${path}"]`);

  target?.scrollIntoView({ block: "start", behavior: "smooth" });
};

const menuClick = (item: { path: string; query?: Record<string, string> }) => {
  if (!item.path) return;

  if (item.path.startsWith("/shared/")) {
    scrollToSharedItem(item.path);
  }

  if (item.path === route.path) return;
  router.push({ path: item.path, query: item.query });
};

watch(
  [activePath, sharedMenu],
  ([path]) => {
    scrollToSharedItem(path);
  },
  { immediate: true },
);

const updateMenuWithShareSpace = (shareSpaces: SharedCloudContent[]) => {
  sharedMenu.value = shareSpaces.map((item) => ({
    path: `/shared/${item.contentId}`,
    name: item.contentName,
    icon: "folder",
    query: {
      names: encodeURIComponent(item.contentName),
    },
  }));
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
  return new Promise((resolve) => {
    const run = async () => {
      try {
        const shareSpaceRes = await getShareSpaceApi({
          PageIndex: 0,
          PageSize: 0,
          onBackgroundUpdate: (newData: {
            count: number;
            data: SharedCloudContent[];
          }) => {
            console.log("共享空间后台缓存更新", newData);
            updateMenuWithShareSpace(newData.data);
            if (waitForUpdate) {
              resolve(newData.data);
            }
          },
        });

        if (shareSpaceRes.code === 1) {
          if (!waitForUpdate) {
            console.log("共享空间数据接口更新", shareSpaceRes.data.data);
            updateMenuWithShareSpace(shareSpaceRes.data.data);
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

onMounted(() => {
  sidebarWidth.value = getStoredSidebarWidth();
  getShareSpace();
  getSpaceUsage();
});

onBeforeUnmount(() => {
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

    .new {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      margin: 12px 0;
      font-size: 14px;
      border-radius: 8px;
      background-color: #5665bb;
      text-align: center;
      font-weight: 600;
      line-height: 20px;
      color: #fff;
      cursor: pointer;
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
          cursor: default;
          .menu-item-title {
            font-size: 12px;
            color: #9ca3af;
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
