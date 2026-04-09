import { SessionStorageUtil } from "@/utils";
import { ref, computed, onMounted } from "vue";

const isFromAppStr = ref<number | null>(null);
const useByPcStr = ref<number | null>(null);

const refreshClientEnv = () => {
  isFromAppStr.value = SessionStorageUtil.get<number>("isFromApp");
  useByPcStr.value = SessionStorageUtil.get<number>("useByPc");
};

const waitClientEnvReady = () => {
  refreshClientEnv();

  if (isFromAppStr.value !== null || useByPcStr.value !== null) {
    return;
  }

  let count = 0;
  const timer = window.setInterval(() => {
    refreshClientEnv();
    count += 1;

    if (
      isFromAppStr.value !== null ||
      useByPcStr.value !== null ||
      count >= 20
    ) {
      window.clearInterval(timer);
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
    refreshClientEnv,
  };
}
