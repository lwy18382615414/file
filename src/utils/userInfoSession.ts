import { isJsonStr } from "@/utils";
import Cookies from "js-cookie";

const key = "myUserInfo";

export const getUserInfoSession = () => {
  let userInfo = sessionStorage.getItem(key) || "";
  if (!userInfo) {
    userInfo = Cookies.get(key);
  }
  if (isJsonStr(userInfo)) {
    return JSON.parse(userInfo);
  }
  return null;
};

export const setUserInfoSession = (userInfo: any) => {
  sessionStorage.setItem(key, JSON.stringify(userInfo));
  Cookies.set(key, JSON.stringify(userInfo));
};
