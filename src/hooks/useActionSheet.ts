import { createApp, h, ref, type App, type Ref } from "vue";
import { ActionSheet, type ActionSheetAction } from "vant";

export type ActionSheetOptions = {
  actions: ActionSheetAction[];
  title?: string;
  cancelText?: string;
  description?: string;
  closeOnClickAction?: boolean;
};

export function useActionSheet() {
  let instance: App | null = null;
  const show: Ref<boolean> = ref(false);

  const destroy = () => {
    if (instance) {
      instance.unmount();
      document.body.removeChild(instance._container);
      instance = null;
    }
  };

  const showActionSheet = (
    options: ActionSheetOptions
  ): Promise<ActionSheetAction | null> => {
    return new Promise((resolve) => {
      // 销毁旧实例
      destroy();

      // 创建新实例
      const container = document.createElement("div");
      document.body.appendChild(container);

      instance = createApp({
        setup() {
          const handleSelect = (action: ActionSheetAction) => {
            resolve(action);
            close();
          };

          const handleCancel = () => {
            resolve(null);
            close();
          };

          const close = () => {
            show.value = false;
            setTimeout(destroy, 300); // 等待动画结束
          };

          return () =>
            h(ActionSheet, {
              show: show.value,
              "onUpdate:show": (val: boolean) => (show.value = val),
              actions: options.actions,
              title: options.title,
              cancelText: options.cancelText,
              description: options.description,
              closeOnClickAction: options.closeOnClickAction,
              onSelect: handleSelect,
              onCancel: handleCancel,
            });
        },
      });

      // 挂载并显示
      instance.mount(container);
      show.value = true;
    });
  };

  return {
    showActionSheet,
  };
}
