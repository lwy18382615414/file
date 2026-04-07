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

import { borderCursor } from "@/directives/borderCursor";
import { truncateMiddle } from "@/directives/truncaeMiddle";
import { longPress } from "@/directives/longpress";
import "./styles/scrollbar.scss";

import { initRem } from "@/utils/rem";

const app = createApp(App);

app.directive("border-cursor", borderCursor);
app.directive("truncate-middle", truncateMiddle);
app.directive("long-press", longPress);

initRem();

app.use(i18n).use(pinia).use(router);

app.mount("#app");
