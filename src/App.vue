<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import config from "./hooks/config";
import { applyLanguage, elementLocale, type RawLanguageCode } from "@/lang";
import { getToken } from "./utils/auth";
import useMyUserInfo from "./hooks/useMyUserInfo";

const { ensureConfigReady } = config();
const { getMyInfoByApi } = useMyUserInfo();

window.setLanguageCode = (code?: RawLanguageCode) => {
  applyLanguage(code);
};

const asyncMyInfo = () => {
  const token = getToken();

  if (token) {
    getMyInfoByApi();
  }
};

onMounted(() => {
  ensureConfigReady();
  applyLanguage();
  asyncMyInfo();
});
</script>

<style lang="scss" scoped></style>
