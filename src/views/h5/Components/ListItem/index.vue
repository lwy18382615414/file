<template>
  <component
    :is="currentComponent"
    :item="item"
    :icon-size="envIconSize"
    :checked="checked"
    :is-disabled="isDisabled"
    :is-long-press="isLongPress"
    :is-search="isSearch"
    :is-recycle="isRecycle"
    :isSharePage="isSharePage"
    @menu="emit('menu', item)"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { ContentType } from "@/types/type";
import { getIsFolder } from "@/utils/typeUtils";

import FileContent from "./FileContent.vue";
import FolderContent from "./FolderContent.vue";
import RecycleContent from "./RecycleContent.vue";
import SharePageContent from "./SharePageContent.vue";
import SearchContent from "./SearchContent.vue";

const props = defineProps({
  item: {
    type: Object as () => ContentType,
    required: true,
  },
  iconSize: {
    type: Number,
    default: 30,
  },
  isRecycle: {
    type: Boolean,
    default: false,
  },
  isLongPress: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  isSearch: {
    type: Boolean,
    default: false,
  },
  isSharePage: {
    type: Boolean,
    default: false,
  },
});

const envIconSize = computed(() => {
  const mode = import.meta.env.MODE;
  return mode === "SG" ? 40 : 30;
});

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
}>();

const currentComponent = computed(() => {
  if (props.isRecycle) return RecycleContent;
  if (getIsFolder(props.item)) return FolderContent;
  if (props.isSharePage) return SharePageContent;
  if (props.isSearch) return SearchContent;
  return FileContent;
});
</script>
