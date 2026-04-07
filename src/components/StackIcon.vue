<template>
  <div class="icon-stack">
    <div
      v-for="(file, index) in files"
      :key="file.contentId"
      class="icon-stack-item"
      :style="getOffsetStyle(index)"
    >
      <SvgIcon
        :name="('isFolder' in file && file.isFolder) ? 'icon_folder' : getFileIcon(getName(file))"
        :size="size"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ContentType } from "@/types/type";
import type { PropType } from "vue";
import { getFileIcon } from "@/utils";
import { getName } from "@/utils/typeUtils";

const props = defineProps({
  files: {
    type: Array as PropType<ContentType[]>,
    default: () => [],
  },
  size: {
    type: Number,
    default: 30,
  },
  offset: {
    type: Number,
    default: 1,
  },
});

// 生成偏移样式
const getOffsetStyle = (index: number) => {
  return {
    transform: `translate(
      calc(${props.offset * index}px),
      calc(-${props.offset * index}px)
    )`,
    zIndex: index + 1, // 确保后面的图标在上层
  };
};
</script>

<style scoped lang="scss">
.icon-stack {
  width: 100%;
  position: relative;
  display: inline-block;
}
.icon-stack-item {
  position: absolute;
  transition: transform 0.3s ease-in-out;
  pointer-events: none;
}
</style>
