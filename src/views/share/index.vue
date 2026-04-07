<template>
  <div class="share-layout">
    <component :is="currentView" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, watchEffect } from "vue";
import { useEnv } from "./hooks/useEnv";
import MobileView from "./views/mobile/index.vue";

import PCBrowserView from "./views/pc/BrowserView.vue";
import PCClientView from "./views/pc/ClientView.vue";
import config from "@/hooks/config";

const { ensureConfigReady } = config();

const { isMobile, isClient } = useEnv();
const currentView = shallowRef();

watchEffect(() => {
  if (isMobile.value) {
    currentView.value = MobileView;
  } else {
    currentView.value = isClient.value ? PCClientView : PCBrowserView;
  }
});

onMounted(async () => {
  await ensureConfigReady(true);
});
</script>

<style lang="scss" scoped>
.share-layout {
  width: 100%;
  height: 100vh;
  background: #fff;
}
</style>
