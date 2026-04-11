<template>
  <div class="file-list-skeleton">
    <div v-for="n in count" :key="n" class="file-skeleton-item">
      <van-skeleton
        :avatar-shape="'square'"
        :avatar-size="40"
        :row="1"
        animate
        avatar
        class="skeleton-line"
        title
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  count?: number;
}>();
</script>

<style scoped>
.file-list-skeleton {
  padding: 12px 0;
}
.file-skeleton-item {
  margin-bottom: 16px;
}
.skeleton-line {
  width: 100%;
}
:deep(.van-skeleton-avatar) {
  border-radius: 8px;
}
:deep(.van-skeleton__content) {
  padding-top: 0 !important;
}
</style>
