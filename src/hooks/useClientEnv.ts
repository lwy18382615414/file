import { SessionStorageUtil } from "@/utils";
import { getFromApp } from "@/utils/auth";
import { ref, computed, onMounted } from "vue";

const isFromAppStr = ref<number | null>(null);
const useByPcStr = ref<number | null>(null);
const isClientEnvLoading = ref(true);

const getFallbackClientEnv = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  if (isMobileDevice) {
    return {
      isFromApp: 1,
    };
  }

  return {
    useByPc: 1,
  };
};

const applyFallbackClientEnv = () => {
  if (isFromAppStr.value !== null || useByPcStr.value !== null) {
    return;
  }

  const fallbackEnv = getFallbackClientEnv();
  if (fallbackEnv.isFromApp) {
    SessionStorageUtil.set("isFromApp", fallbackEnv.isFromApp);
    isFromAppStr.value = fallbackEnv?.isFromApp;
  }

  if (fallbackEnv.useByPc) {
    SessionStorageUtil.set("useByPc", fallbackEnv.useByPc);
    useByPcStr.value = fallbackEnv?.useByPc;
  }
};

const refreshClientEnv = () => {
  isFromAppStr.value = Number(getFromApp());
  useByPcStr.value = SessionStorageUtil.get<number>("useByPc");
};

const waitClientEnvReady = () => {
  isClientEnvLoading.value = true;
  refreshClientEnv();

  if (isFromAppStr.value !== null || useByPcStr.value !== null) {
    isClientEnvLoading.value = false;
    return;
  }

  let count = 0;
  const timer = window.setInterval(() => {
    refreshClientEnv();
    count += 1;

    const hasClientEnv =
      isFromAppStr.value !== null || useByPcStr.value !== null;
    const hasTimedOut = count >= 20;

    if (hasClientEnv || hasTimedOut) {
      window.clearInterval(timer);

      if (!hasClientEnv) {
        applyFallbackClientEnv();
      }

      isClientEnvLoading.value = false;
    }
  }, 100);
};

export function useClientEnv() {
  onMounted(() => {
    waitClientEnvReady();
  });

  const isMobileApp = computed(() => isFromAppStr.value === 1);
  const isPcClient = computed(() => useByPcStr.value === 1);
  const isWebBrowser = computed(() => !isMobileApp.value && !isPcClient.value);

  return {
    isMobileApp,
    isPcClient,
    isWebBrowser,
    isClientEnvLoading,
    refreshClientEnv,
  };
}
