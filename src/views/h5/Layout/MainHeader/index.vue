<template>
  <HeaderBar
    v-if="!getFromApp()"
    :contentId="contentId"
    :currentName="currentName"
    :hasCreateSharePermission="canCreateSharedFolder"
    :isLongPress="isLongPress"
    :permissionType="permissionType"
    @addFile="emits('onAddFile')"
    @clearAllRecycle="emits('onEmptyRecycleBin')"
  />
  <SearchBar
    v-if="!hiddenSearchAndTab"
    :style="{ pointerEvents: isLongPress ? 'none' : 'auto' }"
    @showSort="emits('onShowSort')"
  />
  <TabBar
    v-if="!hiddenSearchAndTab"
    :currentViewMode="currentViewMode"
    :isLongPress="isLongPress"
    @changeViewMode="emits('onChangeViewMode')"
  />
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { t } from "@/utils";
import { getFromApp } from "@/utils/auth";

import HeaderBar from "@/views/h5/Layout/components/headerBar.vue";
import SearchBar from "@/views/h5/Layout/components/searchBar.vue";
import TabBar from "@/views/h5/Layout/components/tabBar.vue";

defineProps({
  contentId: {
    type: Number as PropType<number>,
    default: () => 0,
  },
  permissionType: {
    type: Number as PropType<number>,
    default: () => 0,
  },
  currentName: {
    type: String as PropType<string>,
    default: () => t("cloudDrive"),
  },
  canCreateSharedFolder: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  isLongPress: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  currentViewMode: {
    type: String as PropType<string>,
    default: () => "list",
  },
  hiddenSearchAndTab: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  }
});

const emits = defineEmits([
  "onAddFile",
  "onEmptyRecycleBin",
  "onShowSort",
  "onChangeViewMode",
]);
</script>

<style scoped lang="scss"></style>
