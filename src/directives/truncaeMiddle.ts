// truncateMiddleDirective.ts
import type { Directive } from "vue";

// 增强类型声明
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    _truncateMiddle?: {
      observer: ResizeObserver;
      mutationObserver: MutationObserver;
      originalText: string;
    };
  }
}

// 文本测量工具
const getTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx!.font = font;
  return ctx!.measureText(text).width;
};

export const truncateMiddle: Directive = {
  mounted(el, binding) {
    // 保存原始文本
    const originalText = el.textContent || "";

    // 更新逻辑
    const updateText = () => {
      const currentText = el.textContent || "";
      const font = getComputedStyle(el).font;
      const maxWidth = el.offsetWidth;

      if (
        currentText === originalText &&
        getTextWidth(originalText, font) <= maxWidth
      ) {
        return;
      }

      // 当容器足够宽时恢复原始文本
      if (getTextWidth(originalText, font) <= maxWidth) {
        el.textContent = originalText;
        return;
      }

      // 执行截断逻辑
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

      el.textContent =
        best > 0
          ? originalText.substring(0, best) +
            "…" +
            originalText.substring(originalText.length - best)
          : originalText;
    };

    // 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(updateText);
    resizeObserver.observe(el);

    // 监听文本内容变化（兼容Vue的数据绑定）
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          updateText();
        }
      }
    });
    mutationObserver.observe(el, {
      characterData: true,
      subtree: true,
    });

    // 存储引用以便卸载
    el._truncateMiddle = {
      observer: resizeObserver,
      mutationObserver,
      originalText,
    };

    // 初始执行
    updateText();
  },

  unmounted(el) {
    if (el._truncateMiddle) {
      el._truncateMiddle.observer.disconnect();
      el._truncateMiddle.mutationObserver.disconnect();
    }
  },
};
