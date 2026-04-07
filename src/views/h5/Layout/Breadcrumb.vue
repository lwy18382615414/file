<template>
  <div class="breadcrumb">
    <span v-for="(node, index) in store.stack" :key="node.id" class="crumb-item">
      <span
        @click="handleBreadcrumbClick(node)"
        :class="{ active: index === store.stack.length - 1 }"
      >
        {{ node.name }}
      </span>
      <span v-if="index < store.stack.length - 1"> > </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useRouteStackStore } from '@/stores';

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

<style lang="scss" scoped>
.breadcrumb {
  padding: 12px 16px;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #747683ff;
  max-width: calc(100vw - 50px);
  //text-overflow: ellipsis;
  white-space: nowrap;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  .active {
    color: #2d2d2d;
    font-weight: 500;
  }
}
</style>
