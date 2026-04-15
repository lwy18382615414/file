import { setThemeColors } from "./themeHelper.ts";
import Cookies from "js-cookie";

const loaded = new Set<string>();
let currentAssets: any = {};

// 更具主题名称 切换主题色样式表 （暂时弃用）
export async function applyTheme(name: string) {
  // if (!loaded.has(name)) {
  //   // const mod = await import(`./${name || 'light'}/index.ts`)
  //   const mod = await import(`./light/index.ts`);
  //   currentAssets = mod.default.assets;
  //   loaded.add(name);
  // }
  document.documentElement.setAttribute("data-theme", name);
}

// 根据明暗 切换 图片
function setImageUrl(imageName: string) {
  // light or dark
  const currentTheme = localStorage.getItem("SWTheme") || "light";
  const url = new URL(`./assets/${currentTheme}/${imageName}`, import.meta.url)
    .href;
  if (url && url.includes("undefined")) {
    return new URL(`./assets/light/${imageName}`, import.meta.url).href;
  }
  return url;
}

export function getThemeImageUrl(imageUrl: string) {
  return setImageUrl(imageUrl);
}

export function useThemeAssets() {
  return currentAssets;
}

// 外部样式表json 映射方案
function toCssVarName(key: string) {
  // chatBgColor -> --chat-bg-color
  // list-bg-color -> --list-bg-color
  const kebab = key
    .trim()
    .replace(/([A-Z])/g, "-$1")
    .replace(/_/g, "-")
    .toLowerCase();
  return kebab.startsWith("--") ? kebab : `--${kebab}`;
}

type ThemeVars = Record<string, string | number | null | undefined>;
type ThemeVarsInput = ThemeVars | string | null | undefined;
const injectedVarNames = new Set<string>();

export function applyThemeVars(
  vars: ThemeVarsInput,
  el: HTMLElement = document.documentElement,
) {
  const parsedVars =
    typeof vars === "string"
      ? parseThemeVars(vars)
      : isThemeVarsObject(vars)
        ? vars
        : null;

  if (!parsedVars) return;

  sessionStorage.setItem(THEME_VAR_KEYS[0], JSON.stringify(parsedVars));

  const nextNames = new Set<string>();

  Object.entries(parsedVars).forEach(([key, raw]) => {
    if (raw == null) return;
    const name = toCssVarName(key);
    const value = String(raw).trim();
    // 主题色特殊处理，兼容 Element Plus 组件库
    if (name === "--theme-color") {
      setThemeColors({ primary: value });
    }
    if (name === "--warning-red-color") {
      setThemeColors({ danger: value, error: value });
    }
    if (name === "--warning-green-color") {
      setThemeColors({ success: value });
    }
    if (name === "--warning-yellow-color") {
      setThemeColors({ warning: value });
    }
    el.style.setProperty(name, value);
    nextNames.add(name);
  });

  // 清理本次没有下发的旧变量，避免主题切换残留
  injectedVarNames.forEach((name) => {
    if (!nextNames.has(name)) el.style.removeProperty(name);
  });

  injectedVarNames.clear();

  nextNames.forEach((n) => injectedVarNames.add(n));
}

// 通过cookie或session中获取主题设置，优先级：cookie > sessionStorage > localStorage，获取到对象后调用 applyThemeVars 应用到页面
const THEME_VAR_KEYS = ["themeConfig"];
export function initTheme() {
  const vars =
    getThemeVarsFromCookie() ||
    getThemeVarsFromStorage(sessionStorage) ||
    getThemeVarsFromStorage(localStorage);
  if (vars) applyThemeVars(JSON.stringify(vars));
}

function isThemeVarsObject(value: unknown): value is ThemeVars {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseThemeVars(raw: string | null | undefined): ThemeVars | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isThemeVarsObject(parsed)) return null;
    const parsedRecord = parsed as Record<string, unknown>;
    if (isThemeVarsObject(parsedRecord)) {
      return parsedRecord;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getThemeVarsFromCookie() {
  for (const key of THEME_VAR_KEYS) {
    const vars = parseThemeVars(Cookies.get(key) || null);
    if (vars) return vars;
  }
  return null;
}

function getThemeVarsFromStorage(storage: Storage) {
  for (const key of THEME_VAR_KEYS) {
    const vars = parseThemeVars(storage.getItem(key));
    if (vars) return vars;
  }
  return null;
}
