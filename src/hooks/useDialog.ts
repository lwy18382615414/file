import { h, render } from "vue";
import { DialogComponent } from "@/components/index";

export type T = {
  text: string;
  color: string;
  onClick: () => void;
};

interface DialogOptions {
  width?: number;
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  extraContent?: string;
  extraContentType?: string;
  buttons?: Array<T>;
}

export function useDialog(options: DialogOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");

    const handleClose = () => {
      render(null, container);
      document.body.removeChild(container);
    };

    const handleConfirm = () => {
      handleClose();
      resolve();
    };

    const handleCancel = () => {
      handleClose();
      reject('cancel');
    };

    options.buttons = options.buttons?.map((button) => ({
      ...button,
      onClick: () => {
        button.onClick();
        handleClose();
      },
    }));

    const vnode = h(DialogComponent, {
      ...options,
      visible: true,
      onConfirm: handleConfirm,
      onClose: handleCancel,
    });

    render(vnode, container);
    document.body.appendChild(container);
  });
}
