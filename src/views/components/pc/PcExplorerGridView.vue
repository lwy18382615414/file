<template>
  <div class="pc-explorer-grid-view">
    <template v-if="list.length">
      <slot v-for="item in list" :key="getItemKey(item)" name="item" :item="item" />
    </template>
    <div v-else-if="loading" v-loading="true" class="grid-loading"></div>
    <EmptyState v-else />
  </div>
</template>

<script lang="ts" setup>
import type { ContentType } from "@/types/type";

const props = withDefaults(
  defineProps<{
    list: ContentType[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const getItemKey = (item: ContentType) => {
  return (
    (item as Record<string, any>).id ??
    (item as Record<string, any>).contentId ??
    (item as Record<string, any>).fileId ??
    (item as Record<string, any>).shareId ??
    JSON.stringify(item)
  );
};
</script>

<style lang="scss" scoped>
.pc-explorer-grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
</style>
