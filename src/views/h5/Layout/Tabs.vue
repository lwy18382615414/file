<template>
  <div
    class="tabs"
    :class="{ 'is-full-width': route.path === '/my-share' }"
    ref="tabsContainer"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      replace
      :class="{ active: route.path.startsWith(tab.path) }"
      @contextmenu.prevent
    >
      {{ tab.title }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { t } from "@/utils";

const route = useRoute();
const tabsContainer = ref<HTMLElement | null>(null);

const tabs = [
  { path: "/recent-view", title: t("recentView") },
  { path: "/my-space", title: t("myFiles") },
  { path: "/share-space", title: t("shared") },
  { path: "/my-share", title: t("myShares") },
  { path: "/recycle-bin", title: t("recycleBin") },
];

function smoothScrollIntoView(container: HTMLElement, target: HTMLElement) {
  if (!container || !target) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // 计算目标元素相对容器的偏移量
  const offset = targetRect.left - containerRect.left + container.scrollLeft;

  // 平滑滚动
  container.scrollTo({
    left: offset - container.clientWidth / 2 + target.clientWidth / 2,
    behavior: "smooth"
  });
}


watch(() => route.path, () => {
  nextTick(() => {
    const activeTab = tabsContainer.value?.querySelector(".active") as HTMLElement;
    if (activeTab && tabsContainer.value) {
      smoothScrollIntoView(tabsContainer.value, activeTab);
    }
  });
});
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  flex: 1;
  padding: 0 12px;
  white-space: nowrap;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  &.is-full-width {
    width: 100%;
  }
}
.tabs a {
  font-family: PingFang SC;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #2d2d2d;
  font-weight: 600;
  padding: 17px 0;
  position: relative;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;

  &:not(:last-child) {
    margin-right: 40px;
  }
}
.tabs a.active {
  color: #327edc;

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    display: inline-block;
    width: 83px;
    height: 2px;
    border-radius: 10px;
    background-color: #327edc;
  }
}
</style>
