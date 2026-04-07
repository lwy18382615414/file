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
          :class="{ disabled: !folderName }"
          @click="handleComfirm"
        >
          {{ t("Ok") }}
        </div>
      </div>
      <div class="van-popup__content">
        <div class="new-folder-icon">
          <SvgIcon name="all-folder" size="68" />
        </div>
        <div class="van-intro-input">
          <van-field
            ref="vanFiledRef"
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
import { nextTick, ref, watch } from "vue";
import { t } from "@/utils";
import { checkNameValidity } from "@/utils";
import { createFolderApi } from "@/api/fileService.ts";
import type { ISelectFolder } from "@/views/h5/SharePage/type";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    chooseFolder: ISelectFolder;
  }>(),
  {
    visible: false,
  },
);

const showBottom = ref(false);
const folderName = ref("");
const vanFiledRef = ref();

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "confirm"): void;
}>();

const handleComfirm = async () => {
  if (!folderName.value) return;
  const { isValid, message } = checkNameValidity(folderName.value);
  if (!isValid) {
    showToast({ message: message });
    return;
  }
  const { contentId, isPersonal } = props.chooseFolder;
  const res = await createFolderApi({
    currentContentId: (contentId === "myFiles" ? 0 : Number(contentId)) || 0,
    viewRanges: [],
    editRanges: [],
    folderName: folderName.value,
    isPersonal: isPersonal,
  });
  if (res.code === 1) {
    emit("confirm");
    folderName.value = "";
    showBottom.value = false;
  } else if (res.code === 701) {
    showDialog({
      title: t("hint"),
      message: t("folderAlreadyExists"),
      confirmButtonColor: "#327edc",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
    }).then(() => {});
  } else if (res.code === 1109 || res.code === 702) {
    showDialog({
      title: t("hint"),
      message: t("noEditPermission"),
      confirmButtonColor: "#327edc",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
    }).then(() => {});
  }
  // showBottom.value = false;
  // emit("confirm", folderName.value);
  // folderName.value = "";
};

// 监听父组件传值变化
watch(
  () => props.visible,
  (val) => {
    showBottom.value = val;
    if (val) {
      nextTick(() => {
        vanFiledRef.value?.focus();
      });
    }
  },
);

// 监听弹窗状态变化并通知父组件
watch(showBottom, (val) => {
  emit("update:visible", val);
});
</script>

<style scoped lang="scss">
.van-popup__container {
  font-family: PingFang SC;
}

.van-popup__header {
  display: flex;
  align-items: center;
  padding: 16px;
  justify-content: center;
  background-color: #ebeff6;

  &-left {
    position: absolute;
    left: 16px;
    color: #747683;
  }

  &-right {
    position: absolute;
    right: 16px;
    color: #327edc;

    &.disabled {
      color: #747683;
    }
  }

  &-title {
    color: #2d2d2d;
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
      background: #f2f4f7;
      padding: 6px 16px;
    }
  }
}
</style>
