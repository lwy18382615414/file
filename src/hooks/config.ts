import { ref } from "vue";
import { getConfig } from "@/api/config";

interface WebConfig {
  avatarUrl: string;
  policyUrl: string;
  cloudDriveUploadUrl: string;
  fileChunkSize: number;
  fileMaxSize?: number;
  fileUrl?: string;
  docUrl?: string;
  appResource?: string;
  [key: string]: any;
}

// 状态声明
const avatarUrl = ref("");
const fileUrl = ref("");
const appResource = ref("");
const docUrl = ref("");
const policyUrl = ref("");
const configData = ref<WebConfig>();
const fileChunkSize = ref(0);
const fileMaxSize = ref(0);
const cloudDriveUploadUrl = ref("");
const isConfigReady = ref(false);
const configLoading = ref(false);
let configPromise: Promise<WebConfig | undefined> | null = null;

const updateState = (data: WebConfig) => {
  configData.value = data;
  avatarUrl.value = `${data.avatarUrl}?fileId=`;
  policyUrl.value = `${data.policyUrl}/`;
  fileChunkSize.value = data.fileChunkSize || 1024 * 1024 * 5;
  fileMaxSize.value = data.fileMaxSize || 1024 * 1024 * 300;
  fileUrl.value = data.fileUrl || "";
  docUrl.value = data.docUrl || "";
  appResource.value = data.appResource || "";
  cloudDriveUploadUrl.value = data.cloudDriveUploadUrl || "";
  isConfigReady.value = true;
};

const loadConfig = async (isRefresh: boolean = false) => {
  const webConfigStr = sessionStorage.getItem("webConfig");

  if (webConfigStr && !isRefresh) {
    const data = JSON.parse(webConfigStr) as WebConfig;
    updateState(data);
    return data;
  }

  const res = await getConfig();
  const data = res.data;
  sessionStorage.setItem("webConfig", JSON.stringify(data));
  updateState(data);
  return data;
};

export default () => {
  const getConfigFetch = async (isRefresh: boolean = false) => {
    if (!isRefresh && isConfigReady.value && configData.value) {
      return configData.value;
    }

    if (configPromise) {
      return configPromise;
    }

    if (isRefresh) {
      isConfigReady.value = false;
    }

    configLoading.value = true;
    configPromise = loadConfig(isRefresh)
      .catch((error) => {
        isConfigReady.value = false;
        console.error("获取配置失败", error);
        return undefined;
      })
      .finally(() => {
        configLoading.value = false;
        configPromise = null;
      });

    return configPromise;
  };

  const ensureConfigReady = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      return getConfigFetch(true);
    }

    if (isConfigReady.value && configData.value) {
      return configData.value;
    }

    return getConfigFetch();
  };

  return {
    avatarUrl,
    fileUrl,
    docUrl,
    policyUrl,
    appResource,
    fileChunkSize,
    fileMaxSize,
    configData,
    isConfigReady,
    configLoading,
    getConfigFetch,
    ensureConfigReady,
    cloudDriveUploadUrl,
  };
};
