<template>
  <div
    v-if="!isLongPress"
    :style="{ top: getFromApp() ? '0' : '46px' }"
    class="tabs-wrapper"
  >
    <Tabs v-if="!route.path.includes('/folder')" />
    <Breadcrumb v-else />
    <span
      v-if="route.path !== '/my-share'"
      class="icon-view"
      @click="emit('changeViewMode')"
    >
      <SvgIcon
        :name="currentViewMode === 'list' ? 'ic_view_list' : 'ic_view_grid'"
        size="22"
      />
    </span>
  </div>
</template>
<script lang="ts" setup>
import { getFromApp } from "@/utils/auth";
import Breadcrumb from "@/views/h5/Layout/Breadcrumb.vue";
import Tabs from "@/views/h5/Layout/Tabs.vue";

import { useRoute } from "vue-router";

const route = useRoute();

defineProps({
  currentViewMode: {
    type: String,
    default: "list",
  },
  isLongPress: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["changeViewMode"]);
</script>
<style lang="scss" scoped>
.tabs-wrapper {
  width: 100%;
  position: sticky;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #f2f4f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon-view {
  padding: 0 16px;
  //z-index: 1000;
  //position: absolute;
  //top: 50%;
  //transform: translateY(-50%);
  //right: 16px;
}
</style>
