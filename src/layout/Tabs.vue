<template>
  <section class="tabs-bar">
    <div ref="tabsRef" class="tabs">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        replace
        :class="{ active: isTabActive(tab.path) }"
        @contextmenu.prevent
      >
        {{ tab.title }}
      </router-link>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();
const tabsRef = ref<HTMLElement | null>(null);

const tabs = [
  { path: "/recent-view", title: t("recentView") },
  { path: "/my", title: t("myFiles") },
  { path: "/shared", title: t("shared") },
  { path: "/my-shares", title: t("myShares") },
  { path: "/recycle-bin", title: t("recycleBin") },
];

const isTabActive = (tabPath: string) => {
  return route.path === tabPath || route.path.startsWith(`${tabPath}/`);
};

const scrollActiveTabIntoView = () => {
  nextTick(() => {
    const container = tabsRef.value;
    const activeTab = container?.querySelector(".active") as HTMLElement | null;

    if (!container || !activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeTab.getBoundingClientRect();
    const offsetLeft =
      activeRect.left - containerRect.left + container.scrollLeft;

    container.scrollTo({
      left: offsetLeft - container.clientWidth / 2 + activeTab.clientWidth / 2,
      behavior: "smooth",
    });
  });
};

watch(() => route.path, scrollActiveTabIntoView, { immediate: true });
</script>

<style lang="scss" scoped>
.tabs-bar {
  background-color: #fff;
}

.tabs {
  display: flex;
  gap: 24px;
  min-width: 0;
  width: 100%;
  padding: 0 0 0 16px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  a {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    height: 42px;
    font-size: 16px;
    color: var(--text-secondary-color);

    &.active {
      color: var(--theme-color);
      font-weight: 500;

      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background-color: var(--theme-color);
        border-radius: 999px;
      }
    }
  }
}

.tabs-action {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: 48px;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}
</style>
