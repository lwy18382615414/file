import { ref, watch } from "vue";

export type FileBelongType = "mySpace" | "shareSpace" | "";

const fileBelong = ref<FileBelongType>("");
const permissionCount = ref(0);

const STORAGE_KEY = "fileBelong";
const PERMISSION_COUNT_KEY = "permissionCount";

const initFromStorage = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    fileBelong.value = stored as FileBelongType;
  }
  
  const storedCount = sessionStorage.getItem(PERMISSION_COUNT_KEY);
  if (storedCount) {
    permissionCount.value = Number(storedCount);
  }
};

watch(fileBelong, (newVal) => {
  if (newVal) {
    sessionStorage.setItem(STORAGE_KEY, newVal);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
});

watch(permissionCount, (newVal) => {
  sessionStorage.setItem(PERMISSION_COUNT_KEY, String(newVal));
});

// 初始化
initFromStorage();

export function setFileBelongByRoute(toPath: string, fromPath: string = "") {
  if (toPath === "/my-space" || toPath.startsWith("/my-space/")) {
    fileBelong.value = "mySpace";
  } else if (toPath === "/share-space" || toPath.startsWith("/share-space/")) {
    fileBelong.value = "shareSpace";
  } else if (toPath.startsWith("/folder/")) {
    if (!fileBelong.value) {
      if (fromPath === "/my-space" || fromPath.startsWith("/my-space/")) {
        fileBelong.value = "mySpace";
      } else if (fromPath === "/share-space" || fromPath.startsWith("/share-space/")) {
        fileBelong.value = "shareSpace";
      }
    }
  } else if (toPath === '/space-setting' || toPath === '/space-staff' || toPath === '/add-staff') {
    return
  } else if (toPath === '/search-result' && fromPath.startsWith("/folder")) {
    return
  } else {
    fileBelong.value = "";
  }
}

export function useFileBelong() {
  return {
    fileBelong,
    permissionCount,
  };
}

