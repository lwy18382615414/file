// 设置 rem 函数
import { getDeviceType } from "@/utils/index";

export const setRem = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile)))/.test(ua);
  const designScreenWidth = isTablet ? 768 : 375; // 设计稿宽度
  const defaultHtmlFontSize = 16; // 设计稿375px下的根字体大小

  const scale = designScreenWidth / defaultHtmlFontSize;
  const htmlWidth =
    document.documentElement.clientWidth || document.body.clientWidth;
  const htmlDom = document.getElementsByTagName("html")[0];
  const bodyDom = document.getElementsByTagName("body")[0];
  const appDom = document.getElementById("app")!;
  if (getDeviceType() === "h5") {
    htmlDom.style.fontSize = htmlWidth / scale + "px";
    htmlDom.style.width = "100%";
    bodyDom.style.width = "100%";
    appDom.style.width = "100%";
  }

  const scaleRatio = htmlWidth / scale / 16;

  return {
    scaleRatio,
  };
};

export const initRem = () => {
  setRem();
  window.onresize = function () {
    setRem();
  };
};
