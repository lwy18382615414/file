<template>
  <div class="layout" :class="{ 'is-mobile-app': isMobileApp }">
    <div v-if="isPcClient">
      <pc-sider-bar />
    </div>
    <div v-else-if="isMobileApp">
      <top-bar
        @searchClick="handleSearchClick"
        @sortClick="handleSortClick"
        @moreClick="handleMoreClick"
      />
    </div>
    <div class="main">
      <router-view />
    </div>

    <sort-popup
      v-model:show="showSort"
      v-model:show-warn="showSortWarn"
      :sort-list="sortList"
      :current-sort-method="currentSortMethod"
      :current-sort-order="currentSortOrder"
      :sort-by-warn="sortByWarn"
      :sort-direction-text="sortDirectionText"
      @select="handleSortBy"
    />
  </div>
</template>

<script setup lang="ts">
import { useClientEnv } from "@/hooks/useClientEnv";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import SortPopup from "@/views/components/h5/pop/SortPopup.vue";
import PcSiderBar from "./PcSiderBar.vue";
import TopBar from "./TopBar.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const { isMobileApp, isPcClient } = useClientEnv();
const { toggleLayoutMode } = useLayoutMode();
const {
  sortList,
  currentSortMethod,
  currentSortOrder,
  showSort,
  showSortWarn,
  sortByWarn,
  sortDirectionText,
  openSortPopup,
  updateSort,
} = useExplorerSort();

const handleSearchClick = () => {
  router.push({ path: "/search" });
};

const handleSortClick = () => {
  openSortPopup();
};

const handleSortBy = (sortMethod: number, warn: string) => {
  updateSort(sortMethod, warn);
};

const handleMoreClick = () => {
  toggleLayoutMode();
};
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  width: 100%;
  height: 100vh;

  &.is-mobile-app {
    flex-direction: column;
  }

  .main {
    flex: 1;
    overflow: hidden;
  }
}
</style>
