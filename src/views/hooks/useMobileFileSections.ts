import { computed, type ComputedRef, type Ref } from "vue";
import { FileTypeEnum } from "@/enum/baseEnum";
import type { ContentType } from "@/types/type";
import { getIsFolder } from "@/utils/typeUtils";
import { useI18n } from "vue-i18n";

export function useMobileFileSections(options: {
  list: Ref<ContentType[]>;
  shouldLoadMobileFoldersFirst: Ref<boolean>;
}) {
  const { t } = useI18n();
  const { list, shouldLoadMobileFoldersFirst } = options;

  const folderList = computed(() =>
    list.value.filter((item) => getIsFolder(item)),
  );
  const fileList = computed(() =>
    list.value.filter((item) => !getIsFolder(item)),
  );

  const sections = computed(() => [
    {
      title: t("folder"),
      data: folderList.value,
      showCondition:
        folderList.value.length > 0 && shouldLoadMobileFoldersFirst.value,
      class: "",
      type: FileTypeEnum.Folder,
    },
    {
      title: t("file"),
      data: fileList.value,
      showCondition:
        fileList.value.length > 0 && shouldLoadMobileFoldersFirst.value,
      class: "",
      type: FileTypeEnum.File,
    },
  ]) as ComputedRef<
    Array<{
      title: string;
      data: ContentType[];
      showCondition: boolean;
      class: string;
      type: FileTypeEnum;
    }>
  >;

  return {
    sections,
    folderList,
    fileList,
  };
}
