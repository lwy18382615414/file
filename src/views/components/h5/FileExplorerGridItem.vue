<template>
  <div
    v-long-press
    :class="['file-explorer-grid-item', { 'is-selected': selected }]"
    @click="handleClick"
  >
    <div class="grid-preview">
      <SvgIcon :name="computedIcon" :size="72" class="item-icon" />
      <div v-if="isLongPressing" class="select-indicator">
        <CustomCheckBox :class="selected ? 'is-all' : ''" />
      </div>
      <SvgIcon
        v-else-if="!isSharePage"
        size="18"
        name="action-menu_dots"
        class="menu-icon"
        @click.stop="emit('menu', content)"
      />
    </div>

    <div class="grid-info">
      <div class="grid-title">{{ primaryText }}</div>
      <div v-if="metaLines.length" class="grid-meta">
        <span v-for="(meta, index) in metaLines" :key="`${meta}-${index}`">
          {{ meta }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CustomCheckBox, SvgIcon } from "@/components";
import { FileTypeEnum } from "@/enum/baseEnum";
import { useLongPress } from "@/hooks/useLongPress";
import type { ContentType } from "@/types/type";
import { ExplorerPageType } from "@/views/fileExplorer";
import { useFileExplorerItemData } from "../../hooks/useFileExplorerItemData";

const props = defineProps<{
  content: ContentType;
  type: FileTypeEnum;
  pageType: ExplorerPageType;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
  (e: "open", item: ContentType): void;
  (e: "selection-change", item: ContentType): void;
}>();

const { isLongPressing } = useLongPress();
const { isSharePage, isFolderItem, computedIcon, primaryText, metaLines } =
  useFileExplorerItemData({
    content: () => props.content,
    type: () => props.type,
    pageType: () => props.pageType,
  });

const handleClick = () => {
  if (isLongPressing.value) {
    emit("selection-change", props.content);
  } else if (isSharePage.value || isFolderItem.value) {
    emit("open", props.content);
  }
};
</script>

<style lang="scss" scoped>
.file-explorer-grid-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 0 0 1px #eaedf2;

  &.is-selected {
    box-shadow: 0 0 0 1px #5665bb;
  }
}

.grid-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid #eaedf2;

  .item-icon {
    flex-shrink: 0;
  }

  .menu-icon,
  .select-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.grid-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.grid-title {
  color: #252525;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.grid-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #7b8290;
  font-size: 12px;
  line-height: 16px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
