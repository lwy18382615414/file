<template>
  <div class="loading-container">
    <div class="loader"></div>
    <div class="loading-text">{{ t("loading") }}...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getParentFolderContentIdApi } from "@/api/common";
import { useFileBelong } from "@/hooks/useFileBelong";
import { t } from "@/utils";
import { useShareSpace } from "@/hooks/useShareSpace";

const route = useRoute();
const router = useRouter();

const { fileBelong } = useFileBelong();
const { handleMenuHighlight } = useShareSpace()

const contentId = computed(() => {
  return route.query.contentId;
});

const jump = async () => {
  const id = Number(contentId.value);

  if (!id) {
    await router.replace("/recent-view");
    return;
  }

  try {
    const res = await getParentFolderContentIdApi(id);

    if (!res.data) throw new Error("File not found");

    // 解析 ID 和 Name 数组
    const pathIds = (res.data.path || "").split("/").filter(Boolean);
    const pathNames = (res.data.name || "").split("/").filter(Boolean);

    fileBelong.value = res.data.isShare ? "shareSpace" : "mySpace";

    if (res.data.isFolder) {
      const currentName = pathNames[pathNames.length - 1] || "文件夹";

      if (pathIds.length < 1) {
        handleMenuHighlight(true, id)
        router.replace({
          path: `/share-space/${id}`,
          query: {
            contentName: currentName
          }
        })
      } else {
        router.replace({
          name: "Folder",
          params: { contentId: id },
          query: { contentName: currentName },
        });
      }
    } else {
      if (pathIds.length < 1) {
        router.replace("/my-space");
        return;
      }
      const parentId = pathIds[pathIds.length - 1];
      const parentName = pathNames[pathNames.length - 2] || "父文件夹";

      router.replace({
        name: "Folder",
        params: { contentId: parentId },
        query: { contentName: parentName },
      });
    }
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
