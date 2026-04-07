import { ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { useViewMode } from "@/stores";

const sortLabelMap: Record<number, string> = {
  0: "columnOpt.lastUpdated",
  1: "columnOpt.size",
  2: "columnOpt.docName",
};

const sortMethodMap: Record<string, number> = {
  "columnOpt.docName": 2,
  "columnOpt.size": 1,
  "columnOpt.lastUpdated": 0,
};

export function usePageSort() {
  const route = useRoute();
  const viewMode = useViewMode();

  const initState = {
    PageIndex: 1,
    PageSize: 20,
    hasMore: true,
  };
  const state = reactive({
    ...initState,
    SortMethod: 0, // 排序方式,0-时间先后，1-文档大小，2-文件名
    SortOrder: "desc",
  });

  const currentSortLabel = ref("columnOpt.lastUpdated");
  const isAscending = ref(false);

  const syncSortFromStore = () => {
    const savedSort = viewMode.sortMode.find(
      (item) => item.currentPage === route.path,
    );

    if (savedSort) {
      state.SortMethod = savedSort.sortMethod;
      state.SortOrder = savedSort.sortOrder;
      currentSortLabel.value =
        sortLabelMap[savedSort.sortMethod] || "columnOpt.lastUpdated";
      isAscending.value = savedSort.sortOrder === "asc";
    } else {
      viewMode.setSortMode({
        currentPage: route.path as string,
        sortMethod: state.SortMethod,
        sortOrder: state.SortOrder,
      });
    }
  };

  syncSortFromStore();

  watch(
    () => route.path,
    () => {
      syncSortFromStore();
    },
  );

  // 点击表头切换排序
  const onHeaderClick = (
    column: { label: string; type?: string },
    options?: { showChooseCount?: boolean; resetTableData?: () => void },
  ) => {
    if (options?.showChooseCount) return;
    if (column.type === "selection") return;
    if (column.label === "columnOpt.updatedBy") return;

    isAscending.value = !isAscending.value;
    currentSortLabel.value = column.label;

    state.SortMethod = sortMethodMap[column.label] ?? 0;
    state.SortOrder = isAscending.value ? "asc" : "desc";

    viewMode.setSortMode({
      currentPage: route.path as string,
      sortMethod: state.SortMethod,
      sortOrder: state.SortOrder,
    });

    options?.resetTableData?.();
  };

  return {
    initState,
    state,
    currentSortLabel,
    isAscending,
    onHeaderClick,
  };
}
