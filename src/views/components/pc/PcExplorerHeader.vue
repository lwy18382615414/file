<template>
  <div class="pc-explorer-header-shell">
    <component
      :is="headerComponent"
      :page-type="pageType"
      :context="context"
      :query="query"
      :total="total"
      :current-view-mode="currentViewMode"
      :support-sort="allowSort"
      :current-folder-permission-count="props.currentFolderPermissionCount"
      :has-selection="props.hasSelection"
      @action="handleHeaderAction"
      @toggle-view="toggleLayoutMode"
      @sort="openSortPopup"
      @update-keyword="handleKeywordUpdate"
      @update-date-range="handleDateRangeUpdate"
      @search="handleSearch"
    />

    <SortPopup
      v-model:show="showSort"
      v-model:show-warn="showSortWarn"
      :sort-list="sortList"
      :current-sort-method="currentSortMethod"
      :current-sort-order="currentSortOrder"
      :sort-by-warn="sortByWarn"
      :sort-direction-text="sortDirectionText"
      @select="handleSortSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SortPopup from "@/views/components/h5/pop/SortPopup.vue";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { useExplorerSort } from "@/hooks/sort/useExplorerSort";
import {
  ExplorerPageType,
  getExplorerContext,
  type ExplorerQueryState,
} from "@/views/fileExplorer";
import type { HeaderActionKey } from "../../../types/headerActionTypes";
import { useRoute } from "vue-router";
import PcExplorerCommonHeader from "./PcExplorerCommonHeader.vue";
import PcExplorerSpecialHeader from "./PcExplorerSpecialHeader.vue";

const props = defineProps<{
  pageType: ExplorerPageType;
  query: ExplorerQueryState;
  total: number;
  hasSelection: boolean;
  currentFolderPermissionCount: number | null;
}>();

const emit = defineEmits<{
  (e: "action", key: HeaderActionKey): void;
  (e: "search"): void;
  (e: "updateKeyword", value: string): void;
  (e: "updateDateRange", value: [Date, Date] | null): void;
}>();

const handleHeaderAction = (key: HeaderActionKey) => {
  emit("action", key);
};

const route = useRoute();
const context = computed(() => getExplorerContext(route));
const { currentViewMode, toggleLayoutMode } = useLayoutMode();
const {
  supportSort,
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

const headerComponent = computed(() => {
  if (
    props.pageType === ExplorerPageType.MY_SHARES ||
    props.pageType === ExplorerPageType.RECYCLE
  ) {
    return PcExplorerSpecialHeader;
  }

  return PcExplorerCommonHeader;
});

const allowSort = computed(
  () => supportSort.value && props.pageType !== ExplorerPageType.SEARCH,
);

const handleSortSelect = (sortMethod: number, warn: string) => {
  updateSort(sortMethod, warn);
};

const handleKeywordUpdate = (value: string) => {
  emit("updateKeyword", value);
};

const handleDateRangeUpdate = (value: [Date, Date] | null) => {
  emit("updateDateRange", value);
};

const handleSearch = () => {
  emit("search");
};
</script>

<style scoped lang="scss">
.pc-explorer-header-shell {
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
}
</style>
