import { SessionStorageUtil } from "@/utils";
import { ref, computed } from "vue";

const isInit = ref(false);
const isFromAppStr = ref(null);
const useByPcStr = ref(null);

const initEnv = () => {
  isFromAppStr.value = SessionStorageUtil.get("isFromApp");
  useByPcStr.value = SessionStorageUtil.get("useByPc");
  isInit.value = true;
};

export function useClientEnv() {
  if (!isInit.value) {
    initEnv();
  }

  // 转换为响应式的布尔值
  const isMobileApp = computed(() => isFromAppStr.value === 1);
  const isPcClient = computed(() => useByPcStr.value === 1);

  console.log("Client Environment:", {
    isMobileApp: isMobileApp.value,
    isPcClient: isPcClient.value,
  });

  // 兜底判断：如果都不是，说明可能是普通浏览器访问（便于本地开发调试）
  const isWebBrowser = computed(() => !isMobileApp.value && !isPcClient.value);

  return {
    isMobileApp,
    isPcClient,
    isWebBrowser,
  };
}
