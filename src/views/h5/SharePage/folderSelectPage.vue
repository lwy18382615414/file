<template>
  <FolderSelectCom
    ref="folderSelectComRef"
    :fileInfo="fileInfo"
    :save-type="type"
    @setChooseFolder="setChooseFolder"
    @showCreatPop="showCreatFolder = $event"
  />

  <CreateFolderComponent
    :chooseFolder="choosedFolder!"
    :visible="showCreatFolder"
    @confirm="refresh"
    @update:visible="hiddenOrShowCreatFolder"
  />
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import type { ISelectFolder } from "./type";
import FolderSelectCom from "./components/folderSelectCom.vue";
import CreateFolderComponent from "@/views/h5/SharePage/pop/createFolder.vue";

const showCreatFolder = ref(false);
const folderSelectComRef = ref();
const choosedFolder = ref<ISelectFolder>({} as ISelectFolder);
const route = useRoute();

const type = ref(Number(route.query.type));

const fileInfo = computed(() => {
  const fileInfoQuery = route.query.fileInfo;
  if (typeof fileInfoQuery === "string") {
    try {
      return JSON.parse(fileInfoQuery);
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  return [];
});

const hiddenOrShowCreatFolder = (val: boolean) => {
  showCreatFolder.value = val;
};

const setChooseFolder = (chooseFolder: ISelectFolder) => {
  choosedFolder.value = chooseFolder;
};

const refresh = () => {
  folderSelectComRef.value.getFolderList(choosedFolder.value);
};
</script>

<style lang="scss" scoped></style>
