import { h, render, type Component, type VNode, type AppContext } from "vue";

type PopupOptions<T> = {
  // 组件 Props
  component: Component;
  props?: Record<string, unknown>;
  // 容器配置
  containerClass?: string;
  // 上下文传递
  appContext?: AppContext;
  // 回收站文件
  isRecycle?: boolean;
  // 事件处理
  onClose?: () => void;
  // 自定义内容
  fileInfo?: T;
  actions?: Array<{
    name: string;
    icon: string;
    action: (data: T) => void;
  }>;
};

export function useActionPopup() {
  let container: HTMLElement | null = null;
  let vnode: VNode | null = null;

  const close = () => {
    if (container) {
      // 销毁组件
      render(null, container);
      document.body.removeChild(container);
      container = null;
      vnode = null;
    }
  };

  const open = <T>(options: PopupOptions<T>) => {
    // 清理旧实例
    close();

    // 创建容器
    container = document.createElement("div");
    if (options.containerClass) {
      container.className = options.containerClass;
    }
    document.body.appendChild(container);

    // 处理文件操作
    const handleAction = (actionName: string) => {
      const target = options.actions?.find((a) => a.name === actionName);
      if (target && options.fileInfo) {
        target.action(options.fileInfo);
      }
      close();
    };

    // 创建虚拟节点
    vnode = h(options.component, {
      ...options.props,
      // 控制显示状态
      visible: true,
      // 文件信息传递
      file: options.fileInfo,
      // 操作列表传递
      actions: options.actions,
      // 回收站文件
      isRecycle: options.isRecycle,
      // 事件处理
      onAction: handleAction,
      onClose: () => {
        options.onClose?.();
        close();
      },
      "onUpdate:visible": (val: boolean) => {
        if (!val) close();
      },
      "onClick-overlay": () => {
        close();
      }
    });
    if (options.appContext) {
      vnode.appContext = options.appContext;
    }

    // 渲染组件
    render(vnode, container);
  };

  return { open, close };
}