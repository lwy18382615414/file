import "core-js/stable";
import "regenerator-runtime/runtime";
import "element-plus/dist/index.css";
import "vant/lib/index.css";
import "normalize.css/normalize.css";
import "./styles/index.css";
import "virtual:svg-icons-register";

import { createApp } from "vue";
import App from "./App.vue";
import router from "@/routers/index";
import i18n from "@/lang";
import pinia from "./stores/index";
import { applyTheme } from "@/theme/applyTheme";
import { defaultTheme } from "@/theme/themes";

import { borderCursor } from "@/directives/borderCursor";
import { truncateMiddle } from "@/directives/truncaeMiddle";
import { longPress } from "@/directives/longpress";

import { initRem } from "@/utils/rem";
import { getDeviceType } from "./utils";
import { DeviceType } from "./enum/baseEnum";

const enablePcVConsoleDrag = () => {
  if (typeof window === "undefined") {
    return;
  }

  const bindDrag = (switchEl: HTMLElement) => {
    if (switchEl.dataset.pcDragBound === "true") {
      return;
    }

    switchEl.dataset.pcDragBound = "true";

    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let moved = false;

    const getRight = () => {
      const right = Number.parseFloat(switchEl.style.right);
      if (!Number.isNaN(right)) {
        return right;
      }

      return window.innerWidth - switchEl.getBoundingClientRect().right;
    };

    const getBottom = () => {
      const bottom = Number.parseFloat(switchEl.style.bottom);
      if (!Number.isNaN(bottom)) {
        return bottom;
      }

      return window.innerHeight - switchEl.getBoundingClientRect().bottom;
    };

    const handleMouseMove = (event: MouseEvent) => {
      moved = true;
      const nextRight = startRight - (event.clientX - startX);
      const nextBottom = startBottom - (event.clientY - startY);
      const maxRight = Math.max(window.innerWidth - switchEl.offsetWidth, 0);
      const maxBottom = Math.max(window.innerHeight - switchEl.offsetHeight, 0);

      switchEl.style.left = "auto";
      switchEl.style.top = "auto";
      switchEl.style.right = `${Math.min(Math.max(nextRight, 0), maxRight)}px`;
      switchEl.style.bottom = `${Math.min(Math.max(nextBottom, 0), maxBottom)}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.setTimeout(() => {
        moved = false;
      }, 0);
    };

    switchEl.addEventListener("mousedown", (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      startX = event.clientX;
      startY = event.clientY;
      startRight = getRight();
      startBottom = getBottom();
      moved = false;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      event.preventDefault();
    });

    switchEl.addEventListener(
      "click",
      (event) => {
        if (!moved) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        moved = false;
      },
      true,
    );
  };

  const tryBind = () => {
    const switchEl = document.querySelector<HTMLElement>(".vc-switch");
    if (switchEl) {
      bindDrag(switchEl);
      return true;
    }

    return false;
  };

  if (tryBind()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (tryBind()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

applyTheme(defaultTheme);

const app = createApp(App);

app.directive("border-cursor", borderCursor);
app.directive("truncate-middle", truncateMiddle);
app.directive("long-press", longPress);

const deviceType = getDeviceType();

if (deviceType === DeviceType.H5) {
  initRem();
} else {
  import("./styles/scrollbar.scss");
  enablePcVConsoleDrag();
}

app.use(i18n).use(pinia).use(router);

app.mount("#app");
