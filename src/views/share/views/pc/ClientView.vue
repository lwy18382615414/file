<template>
  <div class="client-view">
    <ShareConetent />
  </div>
</template>

<script setup lang="ts">
import ShareConetent from "@/views/share/components/pc/ShareContent.vue";
</script>

<style lang="scss" scoped>
.client-view {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  :deep(.share-content-container) {
    flex: 1;
    height: 100%;
  }
}
</style>
