<template>
  <section v-if="crumbs.length" class="breadcrumb-bar">
    <div class="breadcrumb">
      <span
        v-for="(node, index) in crumbs"
        :key="index"
        :ref="
          (el) => {
            if (el) crumbRefs[index] = el as HTMLElement;
          }
        "
        class="crumb-item"
      >
        <span
          :class="{ active: index === crumbs.length - 1 }"
          @click="index < crumbs.length - 1 && handleClick(node, index)"
        >
          {{ node.label }}
        </span>
        <span v-if="index < crumbs.length - 1" class="separator"> &gt; </span>
      </span>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { useClientEnv } from "@/hooks/useClientEnv";

interface CrumbNode {
  label: string;
  path: string;
  query?: Record<string, string>;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isPcClient } = useClientEnv();

const crumbRefs = ref<HTMLElement[]>([]);

const ROOT_LABEL: Partial<Record<ExplorerPageType, string>> = {
  [ExplorerPageType.RECENT]: "recentView",
  [ExplorerPageType.MY]: "myFiles",
  [ExplorerPageType.SHARED]: "shared",
  [ExplorerPageType.MY_SHARES]: "myShares",
  [ExplorerPageType.RECYCLE]: "recycleBin",
  [ExplorerPageType.SEARCH]: "searchResult",
};

function buildFolderCrumbs(pageType: ExplorerPageType, path: string[], names: string[]) {
  return path.map((segment, index) => ({
    label: names[index] || segment,
    path: `/${pageType}/${path.slice(0, index + 1).join("/")}`,
    query: {
      names: names
        .slice(0, index + 1)
        .map((name) => encodeURIComponent(name))
        .join("|"),
    },
  }));
}

const crumbs = computed<CrumbNode[]>(() => {
  const ctx = getExplorerContext(route);
  const rootLabel = ROOT_LABEL[ctx.pageType];

  if (!rootLabel) return [];

  const folderCrumbs = buildFolderCrumbs(
    ctx.pageType,
    ctx.folderPath,
    ctx.folderNames,
  );

  if (ctx.pageType !== ExplorerPageType.MY && ctx.pageType !== ExplorerPageType.SHARED) {
    return [
      {
        label: t(rootLabel),
        path: `/${ctx.pageType}`,
      },
    ];
  }

  if (isPcClient.value && ctx.pageType === ExplorerPageType.SHARED) {
    return folderCrumbs;
  }

  return [
    {
      label: t(rootLabel),
      path: `/${ctx.pageType}`,
    },
    ...folderCrumbs,
  ];
});

const handleClick = (node: CrumbNode, index: number) => {
  scrollToIndex(index);
  router.push({ path: node.path, query: node.query });
};

function scrollToIndex(index: number) {
  const el = crumbRefs.value[index];
  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
}

watch(crumbs, () => {
  nextTick(() => {
    scrollToIndex(crumbs.value.length - 1);
  });
});
</script>

<style lang="scss" scoped>
.breadcrumb-bar {
  background-color: #fff;
}

.breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
  height: 48px;
  padding-left: 16px;
  font-size: 14px;
  color: var(--text-secondary-color);
  white-space: nowrap;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.crumb-item {
  span:first-child {
    cursor: pointer;
  }

  .active {
    color: var(--text-primary-color);
    font-weight: 500;
    cursor: default;
  }

  .separator {
    margin: 0 4px;
    color: var(--text-secondary-color);
    cursor: default;
  }
}
</style>
