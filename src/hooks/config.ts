import { computed, ref } from "vue";
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

const CACHE_KEY = "webConfig";
const DEFAULT_FILE_CHUNK_SIZE = 1024 * 1024 * 5;
const DEFAULT_FILE_MAX_SIZE = 1024 * 1024 * 300;

const configData = ref<WebConfig>();
const isConfigReady = ref(false);
const configLoading = ref(false);
let configPromise: Promise<WebConfig | undefined> | null = null;

const getSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

const getCachedConfig = () => {
  const storage = getSessionStorage();
  const configStr = storage?.getItem(CACHE_KEY);

  if (!configStr) {
    return undefined;
  }

  try {
    return JSON.parse(configStr) as WebConfig;
  } catch (error) {
    console.error("解析缓存配置失败", error);
    storage?.removeItem(CACHE_KEY);
    return undefined;
  }
};

const setCachedConfig = (data: WebConfig) => {
  getSessionStorage()?.setItem(CACHE_KEY, JSON.stringify(data));
};

const applyConfig = (data?: WebConfig) => {
  configData.value = data;
  isConfigReady.value = !!data;
};

applyConfig(getCachedConfig());

const avatarUrl = computed(() => {
  const value = configData.value?.avatarUrl || "";
  return value ? `${value}?fileId=` : "";
});

const fileUrl = computed(() => configData.value?.fileUrl || "");
const appResource = computed(() => configData.value?.appResource || "");
const docUrl = computed(() => configData.value?.docUrl || "");
const policyUrl = computed(() => {
  const value = configData.value?.policyUrl || "";
  return value ? `${value}/` : "";
});
const fileChunkSize = computed(
  () => configData.value?.fileChunkSize || DEFAULT_FILE_CHUNK_SIZE,
);
const fileMaxSize = computed(
  () => configData.value?.fileMaxSize || DEFAULT_FILE_MAX_SIZE,
);
const cloudDriveUploadUrl = computed(
  () => configData.value?.cloudDriveUploadUrl || "",
);

const loadConfig = async (forceRefresh: boolean = false) => {
  if (!forceRefresh) {
    const cachedConfig = configData.value || getCachedConfig();
    if (cachedConfig) {
      if (configData.value !== cachedConfig) {
        applyConfig(cachedConfig);
      }
      return cachedConfig;
    }
  }

  const res = await getConfig();
  const data = res.data as WebConfig;
  setCachedConfig(data);
  applyConfig(data);
  return data;
};

const getConfigFetch = async (forceRefresh: boolean = false) => {
  if (!forceRefresh && isConfigReady.value && configData.value) {
    return configData.value;
  }

  if (configPromise) {
    return configPromise;
  }

  configLoading.value = true;
  configPromise = loadConfig(forceRefresh)
    .catch((error) => {
      if (!configData.value) {
        isConfigReady.value = false;
      }
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

const configStore = {
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

export default () => configStore;
