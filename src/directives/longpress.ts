import { readonly, ref, type Directive, type DirectiveBinding } from "vue";

const LONG_PRESS_TIME = 500;
const isLongPressingRef = ref(false);

interface LongPressBinding extends DirectiveBinding {
  value: () => void;
}

interface LongPressHandlers {
  start: () => void;
  handleMove: () => void;
  cancel: () => void;
  preventContextMenu: (event: Event) => void;
  preventSelect: (event: Event) => void;
}

type LongPressElement = HTMLElement & {
  _longPressHandlers?: LongPressHandlers;
  _longPressUserSelect?: string;
};

const resetLongPressState = () => {
  isLongPressingRef.value = false;
};

const disableTextSelection = (element: LongPressElement) => {
  element._longPressUserSelect = element.style.userSelect;
  element.style.userSelect = "none";
};

const restoreTextSelection = (element: LongPressElement) => {
  element.style.userSelect = element._longPressUserSelect ?? "";
  delete element._longPressUserSelect;
};

export const clearLongPressState = resetLongPressState;
export const longPressState = readonly(isLongPressingRef);

export const longPress: Directive = {
  mounted(el: HTMLElement, binding: LongPressBinding) {
    const element = el as LongPressElement;
    let timer: number | null = null;
    let isMoved = false;

    const preventContextMenu = (event: Event) => {
      event.preventDefault();
    };

    const preventSelect = (event: Event) => {
      event.preventDefault();
    };

    const removeMoveListener = () => {
      element.removeEventListener("touchmove", handleMove);
    };

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const clearPressState = () => {
      clearTimer();
      removeMoveListener();
      restoreTextSelection(element);
    };

    const start = () => {
      isMoved = false;
      disableTextSelection(element);
      clearTimer();

      timer = window.setTimeout(() => {
        if (!isMoved) {
          isLongPressingRef.value = true;
          binding?.value?.();
        }
        clearTimer();
        removeMoveListener();
      }, LONG_PRESS_TIME);

      element.addEventListener("touchmove", handleMove, { passive: true });
    };

    const handleMove = () => {
      isMoved = true;
      clearPressState();
    };

    const cancel = () => {
      clearPressState();
    };

    element.addEventListener("contextmenu", preventContextMenu);
    element.addEventListener("selectstart", preventSelect);
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchend", cancel);
    element.addEventListener("touchcancel", cancel);

    element._longPressHandlers = {
      start,
      handleMove,
      cancel,
      preventContextMenu,
      preventSelect,
    };
  },

  beforeUnmount(el: HTMLElement) {
    const element = el as LongPressElement;
    const handlers = element._longPressHandlers;

    if (!handlers) {
      return;
    }

    const { start, handleMove, cancel, preventContextMenu, preventSelect } =
      handlers;

    element.removeEventListener("contextmenu", preventContextMenu);
    element.removeEventListener("selectstart", preventSelect);
    element.removeEventListener("touchstart", start);
    element.removeEventListener("touchmove", handleMove);
    element.removeEventListener("touchend", cancel);
    element.removeEventListener("touchcancel", cancel);
    restoreTextSelection(element);
    delete element._longPressHandlers;
  },
};
