import {
  clearLongPressState as clearLongPressStateInternal,
  longPressState,
} from "@/directives/longpress";

export function useLongPress() {
  return {
    isLongPressing: longPressState,
    clearLongPressState: clearLongPressStateInternal,
  };
}

export const clearLongPressState = clearLongPressStateInternal;
