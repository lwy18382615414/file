import { computed, ref } from "vue";
import { createFolderApi, renameFileApi } from "@/api/fileService";
import { useUiFeedback } from "@/hooks/useUiFeedback";
import type { ContentType } from "@/types/type";
import { getContentId, getName } from "@/utils/typeUtils";
import { useI18n } from "vue-i18n";
import { ExplorerPageType, getExplorerContext } from "@/views/fileExplorer";
import { useRoute } from "vue-router";

export function useRenameDialog(options?: {
  onRefresh?: () => void | Promise<void>;
}) {
  const route = useRoute();
  const { t } = useI18n();
  const { toast } = useUiFeedback();
  const onRefresh = options?.onRefresh;

  const renameVisible = ref(false);
  const renameItem = ref<ContentType | null>(null);
  const mode = ref<"rename" | "create">("rename");
  const context = computed(() => getExplorerContext(route));

  const openRename = (item: ContentType) => {
    mode.value = "rename";
    renameItem.value = item;
    renameVisible.value = true;
  };

  const openCreate = () => {
    mode.value = "create";
    renameItem.value = null;
    renameVisible.value = true;
  };

  const closeRename = () => {
    renameVisible.value = false;
    renameItem.value = null;
    mode.value = "rename";
  };

  const confirmRename = async (renameText: string) => {
    const nextName = renameText.trim();
    if (!nextName) return;

    if (mode.value === "create") {
      const isPersonal = context.value.pageType !== ExplorerPageType.SHARED;
      const res = await createFolderApi({
        currentContentId: context.value.currentFolderId,
        viewRanges: [],
        editRanges: [],
        folderName: nextName,
        isPersonal,
      });

      if (res.code === 1) {
        toast(t("createSuccess"), "success");
        closeRename();
        await onRefresh?.();
        return;
      }
      return;
    }

    const item = renameItem.value;
    if (!item) return;

    const contentId = getContentId(item);
    const currentName = (getName(item) ?? "").trim();

    if (!contentId) return;

    if (nextName === currentName) {
      closeRename();
      return;
    }

    const res = await renameFileApi(contentId, nextName);

    if (res.code === 1) {
      toast(t("renameSuccess"), "success");
      closeRename();
      await onRefresh?.();
      return;
    }

    toast(t("renameFailed"), "error");
  };

  return {
    renameVisible,
    renameItem,
    mode,
    openRename,
    openCreate,
    closeRename,
    confirmRename,
  };
}
