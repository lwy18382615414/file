<template>
  <div class="icon-container">
    <div class="title">
      <span>{{ t("file") }}</span>
      <div class="flex items-center">
        <span class="mr-4">{{ t("thumbnailSize") }}</span>
        <div class="size-control flex items-center">
          <SvgIcon
            name="ic_grid-small"
            size="14"
            class="cursor-pointer"
            @click="smallSize"
          />
          <div class="slider flex items-center mx-2">
            <template v-for="(_, index) in 3" :key="index">
              <div
                class="dot cursor-pointer"
                :class="{ active: index === active }"
                @click="active = index"
              ></div>
              <div v-if="index < 2" class="line" :key="'line-' + index"></div>
            </template>
          </div>
          <SvgIcon
            name="ic_grid-large"
            size="14"
            class="cursor-pointer"
            @click="largeSize"
          />
        </div>
      </div>
    </div>
    <div
      v-if="fileListCopy.length > 0"
      ref="gridWrapper"
      class="icon-wrapper"
      :style="{
        gridTemplateColumns: `repeat(auto-fill, ${currentWidth}px)`,
        justifyContent:
          active === 0
            ? 'space-between'
            : active === 1
              ? 'space-around'
              : 'space-evenly',
      }"
      @scroll.passive="handleScroll"
    >
      <div
        v-for="file in fileListCopy"
        :key="file.contentId"
        class="file-item"
        :class="{
          'is-focus': file.contentId === currentFileId,
        }"
        :style="{ width: currentWidth + 'px', height: currentHeight + 'px' }"
        @click="handleClick(file)"
        @contextmenu.prevent="handleRightClick(file, $event)"
        @dblclick.stop.prevent="handleDoubleClick(file)"
      >
        <div class="thumbnail-container" :style="thumbnailPadding">
          <div class="file-type-icon">
            <SvgIcon
              :name="
                  file.isFolder
                    ? 'icon_folder'
                    : getFileIcon(file.contentName || '')
                "
              :size="active === 0 ? 48 : active === 1 ? 80 : 180"
            />
          </div>
        </div>

        <div class="file-name">
          <div class="text select-none">{{ file.contentName }}</div>
          <div class="type">
            {{ handleFileAndFolderName(file.contentName) }}
          </div>
        </div>
      </div>
    </div>
    <template v-if="fileListCopy.length === 0">
      <div class="empty-state">
        <SvgIcon name="recycle-bin" size="216" />
        <p class="empty-text">{{ t("noData") }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from "vue";
import type { PropType } from "vue";
import { getFileIcon, handleFileAndFolderName } from "@/utils";
import { throttle } from "lodash-es";
import { t } from "@/utils";

// 定义一个通用的文件信息类型
interface CommonFileInfo {
  contentId: string;
  contentName?: string;
  name?: string;
  isFolder?: boolean;
}

const emits = defineEmits(["contextmenu", "dbClick", "load-more"]);

const props = defineProps({
  fileList: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
});

// 重新规划尺寸，以适应不同的显示模式，更宽一些
const sizeList = [
  { width: 108 },
  { width: 180 },
  { width: 350 },
];

const active = ref(0);
const currentFileId = ref("");
const gridWrapper = ref<HTMLDivElement | null>(null);
const retryCount = ref(0); // 当前重试次数
const MAX_RETRY = 5; // 最大重试次数（根据业务需求调整）
const loading = ref(false);

const fileListCopy = computed(() => {
  return props.fileList.map((file) => ({
    ...file,
    contentName: file.contentName || file.name || "",
    isFolder: file.isFolder || false,
  }));
});

const currentWidth = computed(() => sizeList[active.value].width);
const currentHeight = computed(() => sizeList[active.value].height);

const thumbnailPadding = computed(() => {
  const baseSize = [4, 6, 12][active.value] || 4;
  return {
    padding: `${baseSize}px ${baseSize}px 0 ${baseSize}px`,
  };
});

const handleClick = (file: CommonFileInfo) => {
  currentFileId.value = file.contentId;
};

const smallSize = () => {
  if (active.value > 0) active.value--;
};

const largeSize = () => {
  if (active.value < sizeList.length - 1) active.value++;
};

const handleRightClick = (file: CommonFileInfo, event: MouseEvent) => {
  emits("contextmenu", file, {}, event);
};

const handleDoubleClick = (file: CommonFileInfo) => {
  emits("dbClick", file);
};

// 触底检测逻辑
const handleScroll = throttle((e: Event) => {
  const el = e.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const bottomDistance = scrollHeight - (scrollTop + clientHeight);

  if (bottomDistance < 50) {
    emits("load-more");
  }
}, 200);

// 新增全局点击监听逻辑
const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // 检查点击目标是否在文件项内部
  const isInsideFileItem = target.closest(".file-item");
  if (!isInsideFileItem) {
    currentFileId.value = "";
  }
};

const checkVerticalScroll = async (isInitialCheck = false) => {
  await nextTick(); // 确保 DOM 渲染
  setTimeout(
    async () => {
      if (!gridWrapper.value) return;

      const { scrollHeight, clientHeight } = gridWrapper.value!;
      const hasVerticalScroll = scrollHeight > clientHeight;

      if (!hasVerticalScroll && retryCount.value < MAX_RETRY) {
        if (loading.value) return;

        loading.value = true;
        retryCount.value += 1;

        await emitsWithAwait("load-more");
        loading.value = false;

        await nextTick();
        checkVerticalScroll();
      } else {
        retryCount.value = 0;
      }
    },
    isInitialCheck ? 300 : 0,
  );
};

const emitsWithAwait = (eventName: "load-more") => {
  return new Promise<void>((resolve) => {
    emits(eventName, resolve);
  });
};

defineExpose({
  checkVerticalScroll,
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);

  checkVerticalScroll(true);
});

onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style scoped lang="scss">
.icon-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 113px);
  padding: 0 12px;
  position: relative;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 0;
    border-bottom: 1px solid #edeeef;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    color: #909399;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #ccc;
      transition: background-color 0.2s;

      &.active {
        background-color: #327edc;
      }
    }

    .line {
      width: 40px;
      height: 2px;
      background-color: #ccc;
      margin: 0 4px;
    }
  }

  .icon-wrapper {
    display: grid;
    grid-gap: 16px;
    padding: 16px 0;
    overflow: auto;
    max-height: calc(100vh - 113px - 34px);

    .file-item {
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;
      border-radius: 2px;
      transition: border-color 0.2s;
      border: 1px solid transparent;

      &.is-focus {
        border-color: #65a4f5;
      }

      &:hover {
        background-color: #f5f5f5;
      }

      .thumbnail-container {
        width: 100%;
        aspect-ratio: 1;
        flex: 1;
        border: 1px solid #f2f4f7;
        border-bottom: none;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .file-name {
        width: 100%;
        padding: 8px 6px 4px;
        border: 1px solid #f2f4f7;
        border-radius: 0 0 4px 4px;

        .text {
          font-size: calc(var(--base--font--size--14) * var(--scale-factor));
          color: #2d2d2d;
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          word-break: break-all;
        }

        .type {
          font-weight: 400;
          font-size: calc(var(--base--font--size--12) * var(--scale-factor));
          color: #747683;
          margin-top: 3px;
        }
      }
    }
  }

  .empty-state {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;

    .empty-icon {
      color: #c0c4cc;
      margin-bottom: 12px;
    }

    .empty-text {
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: #909399;
    }
  }
}
</style>
