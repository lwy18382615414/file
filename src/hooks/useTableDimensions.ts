import { ref, type Ref } from "vue";

interface TableDimensions {
  hasScrollbar: Ref<boolean>;
  tableHeight: Ref<number>;
  tableWrapperHeight: Ref<number>;
}

interface TableElementRef {
  getTableRef: () => {
    $refs?: {
      tableBody?: HTMLElement;
      bodyWrapper?: HTMLElement;
    };
  };
}

export function useTableDimensions(
  tableRef: TableElementRef | null
): TableDimensions {
  const hasScrollbar = ref(false);
  const tableHeight = ref(0);
  const tableWrapperHeight = ref(0);

  if (!tableRef) {
    hasScrollbar.value = false;
    tableHeight.value = 0;
    tableWrapperHeight.value = 0;
    return {
      hasScrollbar,
      tableHeight,
      tableWrapperHeight,
    };
  }

  try {
    const tableEl = tableRef.getTableRef().$refs;
    const bodyWrapper = tableEl?.bodyWrapper;
    const tableBody = tableEl?.tableBody;

    if (!bodyWrapper || !tableBody) {
      hasScrollbar.value = false;
      tableHeight.value = 0;
      tableWrapperHeight.value = 0;
      return {
        hasScrollbar,
        tableHeight,
        tableWrapperHeight,
      };
    }

    const currentTableHeight = tableBody.clientHeight;
    const currentWrapperHeight = bodyWrapper.clientHeight;

    hasScrollbar.value = currentTableHeight >= currentWrapperHeight;
    tableHeight.value = currentTableHeight;
    tableWrapperHeight.value = currentWrapperHeight;
  } catch (error) {
    console.error("Error getting table dimensions:", error);
    hasScrollbar.value = false;
    tableHeight.value = 0;
    tableWrapperHeight.value = 0;
  }

  return {
    hasScrollbar,
    tableHeight,
    tableWrapperHeight,
  };
}
