<template>
  <van-dialog
    :show="show"
    :title="title"
    :before-close="beforeClose"
    :confirm-button-disabled="!name"
    width="80%"
    show-cancel-button
    :cancel-button-text="t('cancel')"
    :confirm-button-text="t('Ok')"
    @update:show="handleShowChange"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div class="message-content">
      <p>{{ message }}</p>
    </div>
    <van-field
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
import { computed, ref, watch } from "vue";
import { showToast } from "vant";
import type { ContentType } from "@/types/type";
import { checkNameValidity } from "@/utils";
import { useI18n } from "vue-i18n";
import { getIsFolder, getName } from "@/utils/typeUtils";

const props = defineProps<{
  show: boolean;
  item: ContentType | null;
  mode?: "rename" | "create";
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", name: string): void;
}>();

const { t } = useI18n();
const name = ref("");

const isCreate = computed(() => props.mode === "create");

const title = computed(() => {
  return isCreate.value ? t("newFolder") : t("rename");
});

const message = computed(() => {
  if (isCreate.value) return t("inputFolderName");
  if (!props.item) return t("inputFolderName");
  return getIsFolder(props.item)
    ? t("inputNewFolderName")
    : t("inputNewFileName");
});

const placeholderContent = computed(() => {
  if (isCreate.value) return t("inputFolderName");
  if (!props.item) return t("inputFolderName");
  return getIsFolder(props.item) ? t("inputFolderName") : t("inputFileName");
});

watch(
  () => props.show,
  (value) => {
    if (!value) return;
    name.value = isCreate.value ? "" : (getName(props.item!) ?? "");
  },
);

const handleShowChange = (value: boolean) => {
  emit("update:show", value);
};

const handleCancel = () => {
  emit("update:show", false);
};

const handleConfirm = () => {
  const { isValid, message } = checkNameValidity(name.value);
  if (!isValid) {
    showToast({ message, type: "fail" });
    return;
  }

  emit("confirm", name.value.trim());
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
