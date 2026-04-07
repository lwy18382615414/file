import enLocale from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { createI18n } from "vue-i18n";
import en from "./en";
import zh from "./zh";
import { getLanguageCode } from "@/utils/auth";

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

console.log("getLanguage", getLanguageCode());

let languageCode;

switch (getLanguageCode()) {
  case "en":
    languageCode = "en";
    break;
  case "zh-hans":
    languageCode = "zh";
    break;
  default:
    languageCode = "zh";
    break;
}

const i18n = createI18n({
  locale: languageCode,
  globalInjection: true,
  legacy: false,
  messages,
  missing: (locale, key) => {
    return key; // 直接返回键名作为默认文本
  },
  missingWarn: false, // 关闭缺失键名警告
  fallbackWarn: false, // 关闭回退警告
});

export default i18n;
