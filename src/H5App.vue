<template>
  <router-view />
</template>

<script lang="ts" setup>
import config from "@/hooks/config";
import { onMounted } from "vue";
import { setToastDefaultOptions } from "vant";
import successIcon from '@/assets/icons/vant-success.svg'
import failIcon from '@/assets/icons/vant-fail.svg'

setToastDefaultOptions({
  wordBreak: "break-word",
});

setToastDefaultOptions('success', { icon: successIcon })
setToastDefaultOptions('fail', { icon: failIcon })

const { ensureConfigReady } = config();

onMounted(async () => {
  await ensureConfigReady(true);
});
</script>
