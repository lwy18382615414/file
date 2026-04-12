import { ref } from "vue";
import type {
  ExplorerPageType,
  ExplorerQueryState,
} from "@/views/fileExplorer";
import { getDefaultSortMethod, mapSortMethodToSortBy } from "./config";

export type SortModeType = {
  sortOrder: string; // 'asc' | 'desc'
  sortMethod: number; // 0 - 时间 | 1 - 文档大小 | 2 - 文件名
  currentPage: string;
};

const explorerSortMode = ref<Record<string, SortModeType>>({});

export function setExplorerSortMode(data: SortModeType) {
  console.log(explorerSortMode.value);
  explorerSortMode.value[data.currentPage] = { ...data };
}

export function ensureExplorerSort(
  currentPage: string,
  pageType: ExplorerPageType,
) {
  const current = explorerSortMode.value[currentPage];
  if (current) return current;

  const next: SortModeType = {
    currentPage,
    sortMethod: getDefaultSortMethod(pageType),
    sortOrder: "desc",
  };
  setExplorerSortMode(next);
  return next;
}

export function getExplorerSortValue(
  pageType: ExplorerPageType,
  currentPage: string,
) {
  const current = explorerSortMode.value[currentPage];

  return {
    sortMethod: current?.sortMethod ?? getDefaultSortMethod(pageType),
    sortOrder: current?.sortOrder || "desc",
  };
}

export function toggleExplorerSort(
  pageType: ExplorerPageType,
  currentPage: string,
  sortMethod: number,
) {
  const current = getExplorerSortValue(pageType, currentPage);
  const sortOrder = current.sortOrder === "asc" ? "desc" : "asc";

  setExplorerSortMode({
    currentPage,
    sortMethod,
    sortOrder,
  });

  return { sortMethod, sortOrder };
}

export function syncExplorerQuerySort(
  pageType: ExplorerPageType,
  currentPage: string,
  query: ExplorerQueryState,
) {
  const current = ensureExplorerSort(currentPage, pageType);
  query.sortBy = mapSortMethodToSortBy(pageType, current.sortMethod);
  query.sortOrder = current.sortOrder as ExplorerQueryState["sortOrder"];
}
