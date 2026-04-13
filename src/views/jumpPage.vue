<template>
  <div class="loading-container">
    <div class="loader"></div>
    <div class="loading-text">{{ $t("loading") }}...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getParentFolderContentIdApi } from "@/api/common";
import { buildFolderRoute, ExplorerPageType } from "@/views/fileExplorer";

const route = useRoute();
const router = useRouter();

const contentId = computed(() => {
  return route.query.contentId;
});

const jump = async () => {
  const id = Number(contentId.value);

  if (!id) {
    if (id === 0) {
      router.replace("/my");
      return;
    }
    await router.replace("/recent-view");
    return;
  }

  try {
    const res = await getParentFolderContentIdApi(id);

    if (!res.data) throw new Error("File not found");

    const pageType = res.data.isShare
      ? ExplorerPageType.SHARED
      : ExplorerPageType.MY;
    const parentPathIds = (res.data.path || "").split("/").filter(Boolean);
    const lastParentId = parentPathIds[parentPathIds.length - 1] || 0;
    const targetFolderId = res.data.isFolder ? id : Number(lastParentId);

    fileBelong.value = res.data.isShare ? "shareSpace" : "mySpace";

    if (!targetFolderId) {
      router.replace(`/${pageType}`);
      return;
    }

    const pathIds = (res.data.path || "").split("/").filter(Boolean);
    const rawPathNames = (res.data.name || "").split("/").filter(Boolean);
    const pathNames = rawPathNames.slice(1);
    const targetName = pathNames[pathNames.length - 1];
    const currentNames = pathNames.slice(0, -1);

    const target = buildFolderRoute(
      pageType,
      pathIds,
      { contentId: targetFolderId, contentName: targetName },
      currentNames,
    );

    router.replace(target);
  } catch (error) {
    console.error("跳转失败:", error);
    router.replace("/recent-view");
  }
};

onMounted(() => {
  jump();
});
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  color: #666;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 如果需要兼容旧版浏览器，可以添加 -webkit 前缀 */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}
</style>
