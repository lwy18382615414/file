import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { RouteNode } from "@/types/type";
import { getDeviceType, t } from "@/utils";
import { getParentFolderContentIdApi } from "@/api/common";
import { type RouteLocationNormalizedGeneric, useRouter } from "vue-router";
import { useShareSpace } from "@/hooks/useShareSpace";

export const useRouteStackStore = defineStore("routeStack", () => {
    const { handleMenuHighlight } = useShareSpace()

  const router = useRouter();

    const stack = ref<RouteNode[]>([]);

    const forwardStack = ref<RouteNode[]>([]);

    const currentFolderName = computed(() => {
      const last = stack.value[stack.value.length - 1];
      return last ? last.name : "";
    });

    const canGoBack = computed(() => stack.value.length > 1);

    const canGoForward = computed(() => forwardStack.value.length > 0);

    function initRoot(to: RouteLocationNormalizedGeneric) {
      const { meta, fullPath } = to;
      stack.value = [{
        id: to.params.contentId as string || "root",
        name: meta.title as string,
        fullPath
      }];
      forwardStack.value = []; // 重置根目录时，清空前进历史
    }

    function pushFolder(id: number, name: string, fullPath: string) {
      const index = stack.value.findIndex(item => String(item.id) === String(id));

      if (index !== -1) {
        stack.value = stack.value.slice(0, index + 1);
        forwardStack.value = [];
      } else {
        const lastForward = forwardStack.value[forwardStack.value.length - 1];

        if (lastForward && String(lastForward.id) === String(id)) {
          forwardStack.value.pop();
        } else {
          forwardStack.value = [];
        }

        stack.value.push({
          id,
          name,
          fullPath
        });
      }
    }

    function back() {
      if (!canGoBack.value) return;
      const current = stack.value[stack.value.length - 1];
      const parent = stack.value[stack.value.length - 2];
      forwardStack.value.push(current);
      router.push(parent.fullPath);
    }

    function forward() {
      if (!canGoForward.value) return;
      const next = forwardStack.value[forwardStack.value.length - 1];
      forwardStack.value.pop()
      router.push(next.fullPath);
    }

    async function repairStack(currentId: number, currentNameFallback: string = "") {
      try {
        const res = await getParentFolderContentIdApi(currentId);

        if (!res) return;

        const pathIds = (res.data.path || "").split("/").filter(Boolean);
        const pathNames = (res.data.name || "").split("/").filter(Boolean);

        let nameIndex = res.data.isFolder ? pathNames.length - 2 : pathNames.length - 1;

        const newStack: RouteNode[] = [];

        if (res.data.isShare) {
          if (getDeviceType() === "h5") {
            newStack.push({ id: "share_root", name: t("shared"), fullPath: "/share-space" });
          }
        } else {
          newStack.push({ id: "root", name: t("myFiles"), fullPath: "/my-space" });
        }

        const ancestors: RouteNode[] = [];

        for (let i = pathIds.length - 1; i >= 0; i--) {
          if (nameIndex < 0) break;

          const id = pathIds[i];
          const name = pathNames[nameIndex];

          let nodePath = `/folder/${id}?contentName=${encodeURIComponent(name)}`;

          if (res.data.isShare && getDeviceType() !== "h5" && i === 0) {
            nodePath = `/share-space/${id}?contentName=${encodeURIComponent(name)}`;
          }

          ancestors.unshift({
            id: id,
            name: name,
            fullPath: nodePath
          });
          nameIndex--;
        }

        newStack.push(...ancestors);

        if (res.data.isFolder) {
          let realCurrentName = "";
          if (pathNames.length > 0) {
            realCurrentName = pathNames[pathNames.length - 1];
          } else {
            realCurrentName = currentNameFallback || "当前文件夹";
          }

          newStack.push({
            id: currentId,
            name: realCurrentName,
            fullPath: `/folder/${ currentId }?contentName=${ encodeURIComponent(realCurrentName) }`
          });
        }

        stack.value = newStack;
        // forwardStack.value = [];

        // 切换文件夹时，更新菜单高亮
        if (getDeviceType() === "pc") {
          const root = stack.value[0];
          if (root.id === "root") {
            handleMenuHighlight(false, 0)
          } else {
            handleMenuHighlight(true, Number(root.id))
          }
        }
      } catch (error) {
        console.error("修复面包屑失败:", error);
      }
    }

    return {
      stack,
      forwardStack,
      currentFolderName,
      canGoBack,
      canGoForward,
      initRoot,
      pushFolder,
      back,
      forward,
      repairStack
    };
  },
  {
    persist: {
      storage: sessionStorage,
    },
  }
);