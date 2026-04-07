<template>
  <router-view />
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useClientEnv } from "./hooks/useClientEnv";

const { isMobileApp } = useClientEnv();
</script>

<style lang="scss" scoped></style>
