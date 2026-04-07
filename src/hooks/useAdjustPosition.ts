import { ref, type Ref } from "vue";

interface PositionAdjustmentOptions {
  popoverWidth?: number;
  popoverHeight?: number;
  rightOffset?: number;
  leftPadding?: number;
}

interface Position {
  x: number;
  y: number;
}

export function useAdjustPosition(options: PositionAdjustmentOptions = {}) {
  const config = {
    popoverWidth: 120,
    popoverHeight: 150,
    rightOffset: 30,
    leftPadding: 20,
    ...options,
  };

  const adjustPosition = (event: MouseEvent): Position => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = event.clientX;
    let y = event.clientY;

    // 水平调整
    if (
      windowWidth - event.clientX <
      config.popoverWidth + config.rightOffset
    ) {
      x = event.clientX - config.popoverWidth - config.leftPadding;
    }

    // 垂直调整
    if (y + config.popoverHeight > windowHeight) {
      y = event.clientY - config.popoverHeight;
    }

    return { x, y };
  };

  // 如果需要响应式坐标
  const position: Ref<Position> = ref({ x: 0, y: 0 });

  const updatePosition = (event: MouseEvent) => {
    position.value = adjustPosition(event);
  };

  return {
    adjustPosition,
    position,
    updatePosition,
  };
}
