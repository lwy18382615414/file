import { ref } from "vue";
import type { SharedCloudContent } from "@/types/type";
import { getShareSpace as getShareSpaceApi } from "@/api/shareSpace";

// 模块级别的 ref 存储状态（实现跨组件共享）
const shareRoutes = ref<SharedCloudContent[]>([]);
const activeIndex = ref<null | number>(null);
const activeSubIndex = ref<null | number>(null);
const isSharedDirChanged = ref(false);

// 暂时注释掉 sessionStorage 持久化相关代码
// const STORAGE_KEYS = {
//   shareRoutes: "shareSpace_shareRoutes",
//   activeIndex: "shareSpace_activeIndex",
//   activeSubIndex: "shareSpace_activeSubIndex",
//   isSharedDirChanged: "shareSpace_isSharedDirChanged",
// };

// const initFromStorage = () => {
//   const storedRoutes = sessionStorage.getItem(STORAGE_KEYS.shareRoutes);
//   if (storedRoutes) {
//     try {
//       shareRoutes.value = JSON.parse(storedRoutes);
//     } catch (e) {
//       console.error("Failed to parse shareRoutes from storage", e);
//     }
//   }
//
//   const storedActiveIndex = sessionStorage.getItem(STORAGE_KEYS.activeIndex);
//   if (storedActiveIndex !== null) {
//     activeIndex.value = storedActiveIndex === "null" ? null : Number(storedActiveIndex);
//   }
//
//   const storedActiveSubIndex = sessionStorage.getItem(STORAGE_KEYS.activeSubIndex);
//   if (storedActiveSubIndex !== null) {
//     activeSubIndex.value = storedActiveSubIndex === "null" ? null : Number(storedActiveSubIndex);
//   }
//
//   const storedIsSharedDirChanged = sessionStorage.getItem(STORAGE_KEYS.isSharedDirChanged);
//   if (storedIsSharedDirChanged !== null) {
//     isSharedDirChanged.value = storedIsSharedDirChanged === "true";
//   }
// };

// watch(shareRoutes, (newVal) => {
//   sessionStorage.setItem(STORAGE_KEYS.shareRoutes, JSON.stringify(newVal));
// });

// watch(activeIndex, (newVal) => {
//   sessionStorage.setItem(STORAGE_KEYS.activeIndex, newVal === null ? "null" : String(newVal));
// });

// watch(activeSubIndex, (newVal) => {
//   sessionStorage.setItem(STORAGE_KEYS.activeSubIndex, newVal === null ? "null" : String(newVal));
// });

// watch(isSharedDirChanged, (newVal) => {
//   sessionStorage.setItem(STORAGE_KEYS.isSharedDirChanged, String(newVal));
// });

// 初始化时从 sessionStorage 恢复状态
// initFromStorage();

export function useShareSpace() {

  const getShareSpace = async () => {
    const shareSpaceRes = await getShareSpaceApi({
      PageIndex: 0,
      PageSize: 0,
      onBackgroundUpdate: (newData: { count: number, data: SharedCloudContent[] }) => {
        shareRoutes.value = newData.data;
      }
    });
    if (shareSpaceRes.code === 1) {
      shareRoutes.value = shareSpaceRes.data.data;
    }
  };

  const handleMenuHighlight = async (isShared: boolean, contentId: number) => {
    console.log("高亮菜单")
    if (!isShared) {
      activeIndex.value = 1;
      activeSubIndex.value = null;
      return;
    }
    if (!shareRoutes.value.length) {
      await getShareSpace()
    }

    const index = shareRoutes.value.findIndex((item) => item.contentId === contentId);

    if (index !== -1) {
      activeIndex.value = null;
      activeSubIndex.value = index;
    }
  }

  return {
    shareRoutes,
    activeIndex,
    activeSubIndex,
    isSharedDirChanged,
    handleMenuHighlight,
  };
}

