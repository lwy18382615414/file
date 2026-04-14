import { showConfirmDialog, showToast } from "vant";
import { ElMessage, ElMessageBox } from "element-plus";
import { useClientEnv } from "@/hooks/useClientEnv";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { getDeviceType } from "@/utils";
import { DeviceType } from "@/enum/baseEnum";

type FeedbackType = "success" | "warning" | "error" | "info";

export function useUiFeedback() {
  const { isMobileApp, isPcClient } = useClientEnv();
  const { t } = useI18n();

  const isPc = computed(() => {
    if (isPcClient.value) return true;

    const device = getDeviceType();

    if (device === DeviceType.PC) return true;

    return false;
  });

  const toast = (message: string, type: FeedbackType = "info") => {
    if (isPc.value) {
      ElMessage({
        message,
        type: type === "error" ? "error" : type,
      });
      return;
    }

    showToast({
      message,
      type:
        type === "success"
          ? "success"
          : type === "error"
            ? "fail"
            : type === "warning"
              ? "text"
              : "text",
    });
  };

  const confirm = async (options: {
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    showCancelButton?: boolean;
    width?: string;
    type?: FeedbackType;
  }) => {
    if (isPc.value) {
      await ElMessageBox.confirm(options.message, options.title, {
        confirmButtonText: options.confirmButtonText,
        cancelButtonText: options.cancelButtonText || t("cancel"),
        type:
          options.type === "error"
            ? "error"
            : options.type === "info"
              ? "info"
              : options.type,
        showClose: false,
        customClass: "pc-ElMessageBox",
        cancelButtonClass: "btn-custom-cancel",
      });
      return;
    }

    await showConfirmDialog({
      title: options.title,
      message: options.message,
      confirmButtonText: options.confirmButtonText,
      cancelButtonText: options.cancelButtonText,
      confirmButtonColor: options.confirmButtonColor,
      showCancelButton: options.showCancelButton,
      width: options.width ?? "80%",
    });
  };

  return {
    toast,
    confirm,
    isMobileApp,
    isPcClient,
  };
}
