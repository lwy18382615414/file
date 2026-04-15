/// <reference types="vite/client" />
declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.svg" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

declare module "virtual:*" {
  const component: any;
  export default component;
}

declare global {
  interface Window {
    rightBtnClick?: () => void;
    rightBtnClick2?: () => void;
    userLeftBackClick?: () => void;
    setLanguageCode?: (code?: "zh" | "zh-hans" | "en") => void;
  }
}

export {};
