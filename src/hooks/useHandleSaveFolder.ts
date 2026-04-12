import { getParentFolderContentIdApi } from "@/api/common.ts";
import { ref } from "vue";
import { t } from "@/utils";

interface HandleSaveFolderParams {
  targetFolderName: string;
  targetFolderId: number | null;
}

export const useHandleSaveFolder = () => {
  const folderName = ref(t("myFiles"));
  const targetFolderContentId = ref(0);
  const isSelectFolder = ref(false);

  const saveFolder = async ({
    targetFolderName,
    targetFolderId,
  }: HandleSaveFolderParams) => {
    // 存储最近选择的信息
    sessionStorage.setItem("lastSelectedName", targetFolderName);
    sessionStorage.setItem("lastSelectedId", String(targetFolderId));

    const pathRes = await getParentFolderContentIdApi(
      typeof targetFolderId === "number" ? targetFolderId : 0,
    );

    if (pathRes.code === 1) {
      const rootName = pathRes.data.isShare ? t("shared") : t("myFiles");

      if (pathRes.data.name === "") {
        folderName.value = rootName;
      } else {
        const folderNames = pathRes.data.name.split("/").filter(Boolean);
        if (folderNames.length > 0) {
          folderNames[0] = rootName;
        }
        folderName.value = folderNames.join("/");
      }

      targetFolderContentId.value = Number(targetFolderId);
    } else {
      folderName.value = t("myFiles");
    }

    isSelectFolder.value = false;
  };

  return {
    folderName,
    targetFolderContentId,
    isSelectFolder,
    saveFolder,
  };
};
