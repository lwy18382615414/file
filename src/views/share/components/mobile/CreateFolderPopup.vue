<template>
  <van-popup
    v-model:show="showBottom"
    round
    position="bottom"
    style="height: 240px"
  >
    <div class="van-popup__container">
      <div class="van-popup__header">
        <div
          class="van-popup__header-left"
          @click="emit('update:visible', false)"
        >
          {{ t("cancel") }}
        </div>
        <div class="van-popup__header-title">{{ t("createFolder") }}</div>
        <div
          class="van-popup__header-right"
          :class="{ disabled: !canConfirmCreate }"
          @click="handleConfirm"
        >
          {{ t("Ok") }}
        </div>
      </div>
      <div class="van-popup__content">
        <div class="new-folder-icon">
          <SvgIcon name="file-all-folder" size="68" />
        </div>
        <div class="van-intro-input">
          <van-field
            ref="vanFieldRef"
            v-model.trim="folderName"
            :placeholder="t('inputFolderName')"
            clearable
          />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { showDialog, showToast } from "vant";
import { createFolderApi } from "@/api/fileService";
import SvgIcon from "@/components/SvgIcon.vue";
import { checkNameValidity, t } from "@/utils";

type ISelectFolder = {
  contentId: number | null;
  name: string;
  isPersonal: boolean;
};

const props = withDefaults(
  defineProps<{
    visible: boolean;
    chooseFolder: ISelectFolder;
    canCreate?: boolean;
  }>(),
  {
    visible: false,
  },
);

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "confirm"): void;
}>();

const showBottom = ref(false);
const folderName = ref("");
const vanFieldRef = ref();
const canConfirmCreate = computed(
  () => !!props.canCreate && !!folderName.value,
);

const handleConfirm = async () => {
  if (!canConfirmCreate.value) return;

  const { isValid, message } = checkNameValidity(folderName.value);
  if (!isValid) {
    showToast({ message });
    return;
  }

  const { contentId, isPersonal } = props.chooseFolder;
  const res = await createFolderApi({
    currentContentId: contentId ?? 0,
    viewRanges: [],
    editRanges: [],
    folderName: folderName.value,
    isPersonal,
  });

  if (res.code === 1) {
    emit("confirm");
    folderName.value = "";
    showBottom.value = false;
    return;
  }

  if (res.code === 701) {
    showDialog({
      title: t("hint"),
      message: t("folderAlreadyExists"),
      confirmButtonColor: "var(--theme-color)",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
    }).then(() => {});
    return;
  }

  if (res.code === 1109 || res.code === 702) {
    showDialog({
      title: t("hint"),
      message: t("noEditPermission"),
      confirmButtonColor: "var(--theme-color)",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
    }).then(() => {});
  }
};

watch(
  () => props.visible,
  (value) => {
    showBottom.value = value;
    if (!value) {
      folderName.value = "";
      return;
    }

    nextTick(() => {
      vanFieldRef.value?.focus();
    });
  },
  { immediate: true },
);

watch(showBottom, (value) => {
  emit("update:visible", value);
  if (!value) {
    folderName.value = "";
  }
});
</script>

<style scoped lang="scss">
.van-popup__container {
  font-family: Inter;
}

.van-popup__header {
  display: flex;
  align-items: center;
  padding: 16px;
  justify-content: center;
  background-color: var(--subtle-fill-color);

  &-left {
    position: absolute;
    left: 16px;
    color: var(--text-secondary-color);
  }

  &-right {
    position: absolute;
    right: 16px;
    color: var(--theme-color);

    &.disabled {
      color: var(--text-secondary-color);
    }
  }

  &-title {
    color: var(--text-primary-color);
  }
}

.van-popup__content {
  display: flex;
  flex-direction: column;
  align-items: center;

  .new-folder-icon {
    margin: 30px 0 14px;
  }

  .van-intro-input {
    width: 100%;
    padding: 0 32px;

    .van-field {
      border-radius: 4px;
      background: var(--input-bg-color);
      padding: 6px 16px;
    }
  }
}
</style>
