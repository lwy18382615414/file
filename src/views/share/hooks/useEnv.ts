import { computed } from "vue";
import { useClientEnv } from "@/hooks/useClientEnv";

export const useEnv = () => {
  const { isMobileApp, isPcClient, isWebBrowser } = useClientEnv();

  const isClient = computed(() => isMobileApp.value || isPcClient.value);

  const isBrowser = computed(() => !isClient.value);

  const isMobile = computed(() => {
    if (isMobileApp.value) return true;

    if (isWebBrowser.value) {
      const ua = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        ua,
      );
    }

    return false;
  });

  const isPc = computed(() => !isMobile.value);

  return {
    isClient,
    isBrowser,
    isMobile,
    isPc,

    isMobileApp,
    isPcClient,
    isWebBrowser,
  };
};
