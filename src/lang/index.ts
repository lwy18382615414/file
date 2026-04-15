import { computed, ref } from "vue";
import enLocale from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { Locale } from "vant";
import enUS from "vant/es/locale/lang/en-US";
import zhCN from "vant/es/locale/lang/zh-CN";
import { createI18n } from "vue-i18n";
import en from "./en";
import zh from "./zh";
import { getLanguageCode, setLanguageCode } from "@/utils/auth";

export type AppLanguage = "zh" | "en";
export type RawLanguageCode = AppLanguage | "zh-hans";

const messages = {
  en: {
    ...en,
    ...enLocale,
  },
  zh: {
    ...zh,
    ...zhCn,
  },
};

function normalizeLanguageCode(code?: string): AppLanguage {
  if (!code) {
    return "zh";
  }

  return code.toLowerCase() === "en" ? "en" : "zh";
}

function toPersistedLanguageCode(code: AppLanguage): "zh-hans" | "en" {
  return code === "en" ? "en" : "zh-hans";
}

const currentLanguage = ref<AppLanguage>(
  normalizeLanguageCode(getLanguageCode()),
);

export const elementLocale = computed(() => {
  return currentLanguage.value === "en" ? enLocale : zhCn;
});

const i18n = createI18n({
  locale: currentLanguage.value,
  globalInjection: true,
  legacy: false,
  messages,
  missing: (_locale, key) => {
    return key;
  },
  missingWarn: false,
  fallbackWarn: false,
});

function syncVantLocale(code: AppLanguage) {
  if (code === "en") {
    Locale.use("en-US", enUS);
    return;
  }

  Locale.use("zh-CN", zhCN);
}

export function applyLanguage(code?: RawLanguageCode) {
  const nextLanguage = normalizeLanguageCode(code ?? getLanguageCode());

  currentLanguage.value = nextLanguage;
  i18n.global.locale.value = nextLanguage;
  syncVantLocale(nextLanguage);
  setLanguageCode(toPersistedLanguageCode(nextLanguage));

  return nextLanguage;
}

applyLanguage(currentLanguage.value);

export default i18n;

export { currentLanguage };

export type { AppLanguage as LocaleLanguage };
export { normalizeLanguageCode };
