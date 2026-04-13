import { computed } from "vue";
import { useClientEnv } from "@/hooks/useClientEnv";
import { getToken } from "@/utils/auth";

const isMobileDevice = () => {
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    ua,
  );
};

export const useEnv = () => {
  const { isMobileApp, isPcClient, isWebBrowser } = useClientEnv();

  const hasToken = computed(() => !!getToken());
  const isPublicBrowserView = computed(
    () => isWebBrowser.value || (!hasToken.value && isPcClient.value),
  );
  const isClient = computed(() => !isPublicBrowserView.value);
  const isBrowser = computed(() => isPublicBrowserView.value);

  const isMobile = computed(() => {
    if (isMobileApp.value) return true;

    if (isBrowser.value) {
      return isMobileDevice();
    }

    return false;
  });

  const isPc = computed(() => !isMobile.value);

  return {
    isClient,
    isBrowser,
    isMobile,
    isPc,
    hasToken,
    isPublicBrowserView,
    isMobileApp,
    isPcClient,
    isWebBrowser,
  };
};
