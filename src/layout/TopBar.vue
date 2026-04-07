<template>
  <div class="mobile-top-bar">
    <van-nav-bar title="File" left-arrow>
      <template #right> </template>
    </van-nav-bar>

    <div v-if="!isSearchPage" class="search-wrapper">
      <div class="search-content" @click="handleSearchClick">
        <svg-icon name="action-search" size="18" />
        <span class="search-text">{{ $t("search") }}</span>
      </div>
      <div v-if="supportSort" class="icon" @click="handleSortClick">
        <svg-icon name="action-sort" size="20" />
      </div>
    </div>

    <div v-if="!isLongPressing" class="tabs-container">
      <template v-if="!isSearchPage">
        <tabs v-if="showTabs" />
        <breadcrumb v-else />
        <div class="tabs-action" @click="handleMoreClick">
          <svg-icon
            :name="'action-' + currentViewMode"
            size="24"
            color="#7b8290"
          />
        </div>
      </template>
    </div>
    <multi-select-toolbar v-else />
  </div>
</template>

<script lang="ts" setup>
import { SvgIcon } from "@/components";
import Breadcrumb from "./Breadcrumb.vue";
import MultiSelectToolbar from "./MultiSelectToolbar.vue";
import Tabs from "./Tabs.vue";
import { useLongPress } from "@/hooks/useLongPress";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import { useLayoutMode } from "@/hooks/useLayoutMode";

const emit = defineEmits<{
  searchClick: [];
  sortClick: [];
  moreClick: [];
}>();

const route = useRoute();
const { isLongPressing } = useLongPress();
const { supportSort } = useExplorerSort();
const { currentViewMode } = useLayoutMode();

const showTabs = computed(() => getExplorerContext(route).isRoot);

const isSearchPage = computed(
  () => getExplorerContext(route).pageType === ExplorerPageType.SEARCH,
);

const handleSearchClick = () => {
  emit("searchClick");
};

const handleSortClick = () => {
  emit("sortClick");
};

const handleMoreClick = () => {
  emit("moreClick");
};
</script>

<style lang="scss" scoped>
.mobile-top-bar {
  .search-wrapper {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: #fff;

    .search-content {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 11px 16px;
      background-color: #f1f5f9;
      border-radius: 12px;

      .search-text {
        margin-left: 8px;
        font-size: 14px;
        color: #999;
      }
    }

    .icon {
      padding: 10px;
      margin-left: 8px;
    }
  }

  .tabs-container {
    position: relative;
    padding-right: 48px;
    border-bottom: 1px solid #e2e8f0;
  }

  .tabs-action {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    width: 48px;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: #fff;
  }
}
</style>
