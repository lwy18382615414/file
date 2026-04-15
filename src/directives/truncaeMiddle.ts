// truncateMiddleDirective.ts
import type { Directive } from "vue";

type TruncateMiddleState = {
  observer: ResizeObserver;
  mutationObserver: MutationObserver;
  originalText: string;
  updating: boolean;
};

type TruncateMiddleElement = HTMLElement & {
  _truncateMiddle?: TruncateMiddleState;
};

// 文本测量工具
const getTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx!.font = font;
  return ctx!.measureText(text).width;
};

const getTruncatedText = (
  originalText: string,
  font: string,
  maxWidth: number,
) => {
  if (!originalText) return "";

  if (getTextWidth(originalText, font) <= maxWidth) {
    return originalText;
  }

  let low = 0;
  let high = Math.floor(originalText.length / 2);
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testText =
      originalText.substring(0, mid) +
      "…" +
      originalText.substring(originalText.length - mid);

    if (getTextWidth(testText, font) <= maxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best > 0
    ? originalText.substring(0, best) +
        "…" +
        originalText.substring(originalText.length - best)
    : originalText;
};

export const truncateMiddle: Directive = {
  mounted(el) {
    const element = el as TruncateMiddleElement;

    const state: TruncateMiddleState = {
      observer: null as unknown as ResizeObserver,
      mutationObserver: null as unknown as MutationObserver,
      originalText: element.textContent || "",
      updating: false,
    };

    const render = () => {
      const font = getComputedStyle(element).font;
      const maxWidth = element.offsetWidth;
      const nextText = getTruncatedText(state.originalText, font, maxWidth);

      if (element.textContent === nextText) return;

      state.updating = true;
      element.textContent = nextText;
      state.updating = false;
    };

    const syncOriginalText = () => {
      if (state.updating) return;
      state.originalText = element.textContent || "";
      render();
    };

    state.observer = new ResizeObserver(() => {
      render();
    });
    state.observer.observe(element);

    state.mutationObserver = new MutationObserver((mutations) => {
      if (state.updating) return;

      for (const mutation of mutations) {
        if (
          mutation.type === "characterData" ||
          mutation.type === "childList"
        ) {
          syncOriginalText();
          break;
        }
      }
    });

    state.mutationObserver.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    element._truncateMiddle = state;
    render();
  },

  updated(el) {
    const element = el as TruncateMiddleElement;
    const state = element._truncateMiddle;

    if (!state || state.updating) return;

    state.originalText = element.textContent || "";

    const font = getComputedStyle(element).font;
    const maxWidth = element.offsetWidth;
    const nextText = getTruncatedText(state.originalText, font, maxWidth);

    if (element.textContent === nextText) return;

    state.updating = true;
    element.textContent = nextText;
    state.updating = false;
  },

  unmounted(el) {
    const element = el as TruncateMiddleElement;
    if (element._truncateMiddle) {
      element._truncateMiddle.observer.disconnect();
      element._truncateMiddle.mutationObserver.disconnect();
    }
  },
};
