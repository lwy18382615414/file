// types/i18n.d.ts
import { i18n } from "@/lang";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: typeof i18n.global.t;
  }
}
