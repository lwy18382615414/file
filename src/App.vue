<template>
  <router-view />
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useClientEnv } from "./hooks/useClientEnv";
import config from "./hooks/config";
import i18n from "@/lang";
import { getLanguageCode, getToken } from "./utils/auth";
import useMyUserInfo from "./hooks/useMyUserInfo";
const { isMobileApp } = useClientEnv();

const { ensureConfigReady } = config();
const { getMyInfoByApi } = useMyUserInfo();

const curCode = ref("zh-hans");

window.setLanguageCode = (code: "zh" | "en") => {
  if (code) {
    i18n.global.locale.value = code;
    curCode.value = code;
  } else {
    const languageCode = getLanguageCode();
    curCode.value = languageCode;
    i18n.global.locale.value = languageCode === "zh-hans" ? "zh" : languageCode;
  }
};

const asyncMyInfo = () => {
  const token = getToken();

  if (token) {
    getMyInfoByApi();
  }
};

onMounted(() => {
  ensureConfigReady();
  asyncMyInfo();
});
</script>

<style lang="scss" scoped></style>
