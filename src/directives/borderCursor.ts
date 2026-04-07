// src/directives/borderCursor.ts
import type { DirectiveBinding } from "vue";

interface BorderCursorBindingValue {
  threshold?: number;
}

interface CustomHTMLElement extends HTMLElement {
  _borderCursorHandlers?: {
    handleMouseMove: (event: MouseEvent) => void;
    handleMouseLeave: (event: MouseEvent) => void;
    handleMouseDown: (event: MouseEvent) => void;
    handleMouseUp: (event: MouseEvent) => void;
  };
}

interface BorderCursorHandlers {
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseLeave: () => void;
  handleMouseDown?: (e: MouseEvent) => void;
  handleMouseUp?: () => void;
}

export const borderCursor = {
  mounted(
    el: CustomHTMLElement,
    binding: DirectiveBinding<BorderCursorBindingValue>,
  ) {
    const threshold = binding.value?.threshold || 5;

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 计算鼠标移动的距离
        const deltaX = e.clientX - startX;
        // 更新元素的宽度
        const newWidth = startWidth + deltaX;
        // 限制元素的最小宽度
        const minWidth = 168;
        const maxWidth = 500;
        if (newWidth < minWidth) {
          el.style.width = `${minWidth}px`;
          el.style.cursor = "auto";
        } else if (newWidth > maxWidth) {
          el.style.width = `${maxWidth}px`;
        } else {
          el.style.width = `${newWidth}px`;
        }
      } else {
        // 如果不是拖动状态，检查鼠标是否在边缘
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;

        let cursor = "auto";
        const inRight = x > rect.width - threshold;
        if (inRight) {
          cursor = "col-resize";
        }
        el.style.cursor = cursor;
      }
    };

    const handleMouseLeave = () => {
      if (!isDragging) {
        el.style.cursor = "auto";
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // 检查是否在右侧边缘
      if (x > rect.width - threshold) {
        isDragging = true;
        startX = e.clientX;
        startWidth = rect.width;
        el.style.cursor = "col-resize";

        // 防止文本选中
        document.body.style.userSelect = "none";

        // 将 mousemove 和 mouseup 事件绑定到 document
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        el.style.cursor = "auto";

        // 恢复文本选中
        document.body.style.userSelect = "";

        // 解绑 document 上的事件
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    };

    // 将事件处理器绑定到元素上，方便后续解绑
    el._borderCursorHandlers = {
      handleMouseMove,
      handleMouseLeave,
      handleMouseDown,
      handleMouseUp,
    };
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousedown", handleMouseDown);
  },
  unmounted(el: CustomHTMLElement) {
    // 解绑事件
    const {
      handleMouseMove,
      handleMouseLeave,
      handleMouseDown,
      handleMouseUp,
    } = el._borderCursorHandlers as BorderCursorHandlers;
    el.removeEventListener("mousemove", handleMouseMove);
    el.removeEventListener("mouseleave", handleMouseLeave);
    el.removeEventListener("mousedown", handleMouseDown!);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp!);
  },
};
