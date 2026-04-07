import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getExplorerPageType,
  getExplorerSortOptions,
  getExplorerSortToastText,
  isExplorerSortSupported,
} from "./config";
import { getExplorerSortValue, toggleExplorerSort } from "./state";

export function useExplorerSort() {
  const route = useRoute();
  const { t } = useI18n();

  const showSort = ref(false);
  const showSortWarn = ref(false);
  const sortByWarn = ref("");
  const sortDirectionText = ref("");

  const pageType = computed(() => getExplorerPageType(route.meta.type));
  const supportSort = computed(() => isExplorerSortSupported(pageType.value));
  const sortList = computed(() => getExplorerSortOptions(pageType.value, t));
  const currentSort = computed(() =>
    getExplorerSortValue(pageType.value, route.path),
  );
  const currentSortMethod = computed(() => currentSort.value.sortMethod);
  const currentSortOrder = computed(() => currentSort.value.sortOrder);

  function openSortPopup() {
    if (!supportSort.value) return;
    showSort.value = true;
  }

  function updateSort(sortMethod: number, warn: string) {
    const next = toggleExplorerSort(pageType.value, route.path, sortMethod);
    sortByWarn.value = warn;
    sortDirectionText.value = getExplorerSortToastText(next.sortOrder, t);
    showSort.value = false;
    showSortWarn.value = true;
  }

  return {
    pageType,
    supportSort,
    sortList,
    currentSort,
    currentSortMethod,
    currentSortOrder,
    showSort,
    showSortWarn,
    sortByWarn,
    sortDirectionText,
    openSortPopup,
    updateSort,
  };
}
