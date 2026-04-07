import { defineStore } from "pinia";
import { ref } from "vue";
import type { SortModeType, viewModeType } from "@/stores/type";

export const useViewMode = defineStore(
  "view-model",
  () => {
    const viewMode = ref<Array<viewModeType>>([]);
    const sortMode = ref<Array<SortModeType>>([]);

    const setViewMode = (data: viewModeType) => {
      const findItem = viewMode.value.find(
        (item) => item.currentPage === data.currentPage,
      );
      if (findItem) {
        findItem.viewMode = data.viewMode;
      } else {
        viewMode.value.push(data);
      }
    };

    const setSortMode = (data: SortModeType) => {
      const findItem = sortMode.value.find(
        (item) => item.currentPage === data.currentPage,
      );
      if (findItem) {
        findItem.sortOrder = data.sortOrder;
        findItem.sortMethod = data.sortMethod;
      } else {
        sortMode.value.push(data);
      }
    };

    return {
      viewMode,
      sortMode,
      setViewMode,
      setSortMode,
    };
  },
  {
    persist: {
      storage: sessionStorage,
    },
  },
);
