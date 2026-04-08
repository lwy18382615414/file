import { ref } from "vue";

const SIDEBAR_WIDTH_STORAGE_KEY = "pc-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 360;

export function useSidebarResize() {
  const sidebarWidth = ref(DEFAULT_SIDEBAR_WIDTH);

  const clampWidth = (width: number) => {
    return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
  };

  const getStoredSidebarWidth = () => {
    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const parsedWidth = storedWidth ? Number(storedWidth) : NaN;

    if (!Number.isFinite(parsedWidth)) {
      return DEFAULT_SIDEBAR_WIDTH;
    }

    return clampWidth(parsedWidth);
  };

  const updateSidebarWidth = (width: number) => {
    const nextWidth = clampWidth(width);
    sidebarWidth.value = nextWidth;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(nextWidth));
  };

  const handleResize = (event: MouseEvent) => {
    updateSidebarWidth(event.clientX);
  };

  const stopResize = () => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  };

  const startResize = (event: MouseEvent) => {
    event.preventDefault();
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  sidebarWidth.value = getStoredSidebarWidth();

  return {
    sidebarWidth,
    startResize,
    stopResize,
  };
}
