<template>
  <svg
    aria-hidden="true"
    :style="{
      width: iconSize,
      height: iconSize,
      color: color,
    }"
  >
    <use :xlink:href="`#icon-${props.name}`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  // 图标名称（对应 SVG 文件名）
  name: {
    type: String,
    required: true,
  },
  // 图标尺寸
  size: {
    type: [Number, String],
    default: 16,
  },
  // 图标颜色
  color: {
    type: String,
    default: "currentColor",
  },
});

const iconSize = computed(() =>
  typeof props.size === "number"
    ? `${props.size / 16}rem`
    : parseInt(props.size) / 16 + "rem",
);
</script>

<style scoped>
svg {
  vertical-align: -0.15em;
  fill: currentColor;
}
</style>
