import Cookies from "js-cookie";

const TokenKey = "steady_work_token";
const fromKey = "isFromApp";
const webConfigKey = "webConfig";
const deviceIdKey = "DeviceId";

export function getToken() {
  return Cookies.get(TokenKey) || sessionStorage.getItem(TokenKey);
}

export function setToken(token: string) {
  sessionStorage.setItem(TokenKey, token);
  Cookies.set(TokenKey, token);
}

export function removeToken() {
  Cookies.remove(TokenKey);
  sessionStorage.removeItem(TokenKey);
}
export function removeAll() {
  sessionStorage.clear();
}

export function getFromApp() {
  return Cookies.get(fromKey) || sessionStorage.getItem(fromKey);
}

export function getMyUserInfo() {
  const myUserInfo =
    sessionStorage.getItem("myUserInfo") || Cookies.get("myUserInfo");
  if (myUserInfo) {
    return JSON.parse(myUserInfo);
  }
  return null;
}

function getBrowserLanguage() {
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.includes("zh")) {
    return "zh-hans";
  }
  return "en";
}

export function getLanguageCode() {
  const languageCode =
    Cookies.get("languageCode") ||
    sessionStorage.getItem("languageCode") ||
    getBrowserLanguage() ||
    "zh-hans";
  return languageCode.toLowerCase();
}

export function setLanguageCode(code: "zh-hans" | "en") {
  sessionStorage.setItem("languageCode", code);
  Cookies.set("languageCode", code);
}

export function getFromPc() {
  return Cookies.get("useByPc") || sessionStorage.getItem("useByPc");
}

export function getDeviceId() {
  return Cookies.get(deviceIdKey) || "default-device-id";
}
