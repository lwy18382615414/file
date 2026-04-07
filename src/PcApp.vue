<template>
  <el-config-provider :locale="curCode === 'zh-hans' ? zhCn : en">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import { useShareSpace } from "@/hooks/useShareSpace";
import { getLanguageCode } from "@/utils/auth";
import config from "@/hooks/config";
import { onMounted, ref } from "vue";
import i18n from "@/lang";

const { ensureConfigReady } = config();
const curCode = ref("zh-hans");
const { shareRoutes } = useShareSpace();

window.setLanguageCode = (code: "zh" | "en") => {
  if (code) {
    i18n.global.locale.value = code;
    curCode.value = code;
  } else {
    const languageCode = getLanguageCode();
    console.info("languageCode", languageCode);
    curCode.value = languageCode;
    i18n.global.locale.value = languageCode === "zh-hans" ? "zh" : languageCode;
  }
};

onMounted(async () => {
  shareRoutes.value = [];
  await ensureConfigReady(true);
});
</script>
