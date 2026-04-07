<template>
  <div class="empty-state">
    <slot name="icon">
      <SvgIcon name="common-empty_state" :size="iconSize" />
    </slot>
    <p v-if="text" class="empty-text">{{ text }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { SvgIcon } from "@/components";
import { t } from "@/utils";

withDefaults(
  defineProps<{
    text?: string;
    iconSize?: number | string;
  }>(),
  {
    text: () => t("noData"),
    iconSize: 240,
  },
);
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.empty-text {
  margin-top: 12px;
  color: #999;
  text-align: center;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}
</style>
