<template>
  <div class="search-bar">
    <div class="search-bar-input" @click="goSearch">
      <SvgIcon name="ic_search" size="22" />
      <span class="search">{{ t("search") }}</span>
    </div>
    <SvgIcon
      v-if="
        ['MySpace', 'ShareSpace', 'Folder', 'MyShare'].includes(
          route.name as string,
        )
      "
      name="ic_sort"
      size="24"
      @click="emit('showSort')"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { t, isRootFolder } from "@/utils";

const router = useRouter();
const route = useRoute();

const emit = defineEmits(["showSort"]);

const goSearch = () => {
  isRootFolder("/search");
  router.push("/search");
};
</script>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
  height: 54px;
  gap: 10px;
  padding: 10px 16px;
}
.search-bar-input {
  width: 100%;
  height: 100%;
  background: #f2f4f7;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #c4c4c4;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  gap: 4px;
  padding-left: 8px;

  .search {
    font-size: 15px;
    color: #747683;
  }
}
</style>
