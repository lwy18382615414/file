<template>
  <van-popup
    v-model:show="showBottom"
    round
    position="bottom"
    style="height: 34.375rem"
  >
    <FolderSelectCom
      ref="folderSelectComRef"
      @update:visible="showBottom = $event"
      @setChooseFolder="setChooseFolder"
      @showCreatPop="onShow"
      @refresh="onRefresh"
    />
  </van-popup>
  <CreateFolderComponent
    :visible="showCreatFolder"
    :chooseFolder="selectFolder!"
    @update:visible="hiddenOrShowCreatFolder"
    @confirm="refresh"
  />
  <van-dialog
    v-model:show="showSaveSuccess"
    show-cancel-button
    width="80%"
    :confirm-button-text="t('clickToView')"
    confirm-button-color="#327edc"
    cancel-button-color="#2d2d2d"
    :cancel-button-text="t('cancel')"
    @cancel="cancleSaveSuccess"
    @confirm="goToCloudDrive"
  >
    <div class="van-dialog__content">
      <SvgIcon name="ic_save-success" size="50" />
      <div class="success-text">{{ t("fileSaveSuccess") }}</div>
      <div class="taget-folder">
        <span>{{ t("savedTo") }}：</span>
        <span class="folder-name">{{ selectFolder?.name }}</span>
      </div>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import { t } from "@/utils";
import FolderSelectCom from "../components/folderSelectCom.vue";
import { useRouter } from "vue-router";
import CreateFolderComponent from "@/views/h5/SharePage/pop/createFolder.vue";
import type { ISelectFolder } from "../type";

const router = useRouter();

const props = withDefaults(
  defineProps<{
    visible: boolean;
  }>(),
  {
    visible: false,
  },
);

const emit = defineEmits(["update:visible"]);

const showBottom = ref(false);
const selectFolder = ref<ISelectFolder>({} as ISelectFolder);
const showCreatFolder = ref(false);
const showSaveSuccess = ref(false);
const folderSelectComRef = ref();

const setChooseFolder = (val: ISelectFolder) => {
  selectFolder.value = val;
};

const refresh = () => {
  folderSelectComRef.value.getFolderList(selectFolder.value);
};

const onRefresh = () => {
  folderSelectComRef.value.getFolderList(selectFolder.value);
  showSaveSuccess.value = true;
};

const cancleSaveSuccess = () => {
  showSaveSuccess.value = false;
  showBottom.value = false;
};

const goToCloudDrive = () => {
  const contentId =
    (selectFolder.value?.contentId === "myFiles"
      ? 0
      : Number(selectFolder.value?.contentId)) || 0;

  router.push({
    path: "/jump-page",
    query: {
      contentId,
    },
  });
};

const onShow = () => {
  showCreatFolder.value = true;
  showBottom.value = false;
};

const hiddenOrShowCreatFolder = (val: boolean) => {
  showCreatFolder.value = val;
  if (!val) {
    showBottom.value = true;
  }
};
// 监听父组件传值变化
watch(
  () => props.visible,
  (val) => {
    showBottom.value = val;
  },
);

// 监听弹窗状态变化并通知父组件
watch(showBottom, (val) => {
  emit("update:visible", val);
});
</script>
<style lang="scss" scoped>
.van-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 32px 0 28px;

  .success-text {
    color: #2d2d2d;
    padding: 12px 0 8px;
  }

  .taget-folder {
    font-size: 14px;
    color: #747683;

    .folder-name {
      color: #327edc;
    }
  }
}
</style>
