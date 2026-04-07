<!--修改或新建文件时修改名字输入框弹窗-->
<template>
  <van-dialog
    v-model:show="isVisible"
    :title="title"
    :before-close="beforeClose"
    :confirmButtonDisabled="!name"
    width="80%"
    show-cancel-button
    :cancel-button-text="t('cancel')"
    :confirm-button-text="t('Ok')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div class="message-content">
      <p>{{ message }}</p>
    </div>
    <van-field
      ref="fieldRef"
      v-model="name"
      required
      :placeholder="placeholderContent"
      autofocus
      clearable
      :clear-trigger="'always'"
      maxlength="100"
      show-word-limit
    />
  </van-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from "vue";
import type { ContentType } from "@/types/type";
import type { FieldInstance } from "vant";
import { checkNameValidity } from "@/utils";
import { t } from "@/utils";
import { getContentId, getIsFolder, getName } from "@/utils/typeUtils";

const props = defineProps({
  renameVisible: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  entryInfo: {
    type: Object as PropType<ContentType>,
    default: () => {},
  },
});

const emits = defineEmits(["update:renameVisible", "confirm"]);

const isVisible = ref(props.renameVisible);
const name = ref("");
const fieldRef = ref<FieldInstance>();

const isCreate = computed(() => Object.keys(props.entryInfo).length === 0);

const title = computed(() => {
  return !isCreate.value ? t("rename") : t("newFolder");
});

const message = computed(() => {
  if (isCreate.value) return t("inputFolderName");
  return getIsFolder(props.entryInfo)
    ? t("inputNewFolderName")
    : t("inputNewFileName");
});

const placeholderContent = computed(() => {
  if (isCreate.value) return t("inputFolderName");
  if (!props.entryInfo) return t("inputFolderName");
  return getIsFolder(props.entryInfo) ? t("inputFolderName") : t("inputFileName");
});

watch(
  () => props.renameVisible,
  (val) => {
    isVisible.value = val;
    if (val) {
      name.value = getName(props.entryInfo);
      // nextTick(() => {
      //   fieldRef.value?.focus();
      //   if (!isCreate.value) {
      //     autoSelectFileName({
      //       inputRef: fieldRef.value,
      //       fileName: name.value,
      //       isFolder: props.entryInfo?.isFolder || false,
      //     });
      //   }
      // });
    }
  },
);

watch(isVisible, (val) => {
  emits("update:renameVisible", val);
});

const handleCancel = () => {
  isVisible.value = false;
};

const handleConfirm = () => {
  const { isValid, message } = checkNameValidity(name.value);
  if (!isValid) {
    showToast({ message: message, type: "fail" });
    return;
  }
  const contentId = getContentId(props.entryInfo);
  if (contentId) {
    emits("confirm", name.value, contentId);
  } else {
    emits("confirm", name.value);
  }
};

const beforeClose = (action: string) => {
  if (action === "confirm") {
    return false;
  }
};
</script>

<style scoped lang="scss">
:deep(.van-field__control) {
  background-color: #f3f3f4;
  padding: 6px 8px;
}

:deep(.upload-wrapper) {
  width: 320px;
  text-align: center;
  padding: 10px 0;
}

:deep(.van-cell__title) {
  max-width: calc(100vw - 100px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-content {
  text-align: center;
  font-size: 14px;
  color: #99a1af;
  padding: 8px 0;
}
</style>
