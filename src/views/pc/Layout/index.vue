<template>
  <div class="pc-layout">
    <Menu />
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Menu from "./menu.vue";
</script>

<style scoped lang="scss">
.pc-layout {
  display: flex;

  .main {
    flex: 1;
    overflow: hidden;
  }
}
.content {
  max-height: calc(100vh - 113px);
  padding: 0 16px;
}
</style>
