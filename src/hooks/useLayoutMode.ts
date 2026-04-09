import { LayoutMode } from "@/enum/baseEnum";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

type LayoutModeMap = Record<string, LayoutMode>;

const layoutModeMap = ref<LayoutModeMap>({});

export function useLayoutMode() {
  const route = useRoute();

  const currentViewMode = computed<LayoutMode>(() => {
    return layoutModeMap.value[route.path] || LayoutMode.LIST;
  });

  const setLayoutMode = (mode: LayoutMode) => {
    layoutModeMap.value[route.path] = mode;
  };

  const toggleLayoutMode = () => {
    setLayoutMode(
      currentViewMode.value === LayoutMode.LIST
        ? LayoutMode.GRID
        : LayoutMode.LIST,
    );
  };

  return {
    currentViewMode,
    setLayoutMode,
    toggleLayoutMode,
  };
}
