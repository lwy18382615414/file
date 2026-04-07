<template>
  <router-view />
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useClientEnv } from "./hooks/useClientEnv";
import config from "./hooks/config";

const { isMobileApp } = useClientEnv();

const { ensureConfigReady } = config()

onMounted(() => {
  ensureConfigReady()
})
</script>

<style lang="scss" scoped></style>
