<template>
  <div class="breadcrumb">
    <span v-for="(node, index) in store.stack" :key="node.id" class="crumb-item">
      <span
        @click="handleBreadcrumbClick(node)"
        class="crumb-item-text"
        :class="{ active: index === store.stack.length - 1 }"
      >
        {{ t(node.name) }}
      </span>
      <span v-if="index < store.stack.length - 1"> - </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useRouteStackStore } from "@/stores";
import { t } from "@/utils";

const router = useRouter();

const store = useRouteStackStore();

const handleBreadcrumbClick = (node: any) => {
  router.push({
    path: node.fullPath,
    query: {
      contentName: node.name
    }
  });
};
</script>

<style scoped lang="scss">
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
}
.crumb-item-text {
  cursor: pointer;
}
.active {
  color: #2d2d2d;
  font-weight: 500;
}
</style>
