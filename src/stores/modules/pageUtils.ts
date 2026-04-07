import { defineStore } from "pinia";
import { ref } from "vue";
import type { SortModeType } from "@/stores/type";

export const usePageUtils = defineStore(
  "page-utils",
  () => {
    const sortBy = ref(0);
    const sortDirection = ref("desc");
    const sortMode = ref<Array<SortModeType>>([]);

    // 清空回收站
    const isClearRecycle = ref(false);
    const setClearRecycle = (value: boolean) => {
      isClearRecycle.value = value;
    };

    // 添加成员后
    const isAddMember = ref(false);
    const setAddMember = (value: boolean) => {
      isAddMember.value = value;
    };

    const setSortBy = (sort: number) => {
      sortBy.value = sort;
    };

    const setSortDirection = (direction: string) => {
      sortDirection.value = direction;
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
      sortBy.value = data.sortMethod;
      sortDirection.value = data.sortOrder;
    };

    return {
      sortBy,
      sortDirection,
      sortMode,
      isClearRecycle,
      isAddMember,
      setSortBy,
      setSortDirection,
      setSortMode,
      setClearRecycle,
      setAddMember,
    };
  },
  {
    persist: {
      storage: sessionStorage,
    },
  },
);
