<template>
  <el-dialog
    :model-value="show"
    width="460"
    :modal="false"
    destroy-on-close
    :show-close="false"
    class="name-edit-dialog-pc"
    @close="handleCancel"
  >
    <template #header>
      <div class="dialog-header">
        <span>{{ title }}</span>
        <SvgIcon name="action-close" @click="handleCancel" />
      </div>
    </template>

    <div class="dialog-content">
      <p class="message">{{ message }}</p>
      <el-input
        ref="inputRef"
        v-model.trim="name"
        :placeholder="placeholderContent"
        maxlength="100"
        clearable
        show-word-limit
        @keydown.enter="handleConfirm"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleCancel">
          {{ t("cancel") }}
        </el-button>
        <el-button
          class="confirm-btn"
          type="primary"
          :disabled="!name"
          @click="handleConfirm"
        >
          {{ t("Ok") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { ElInput } from "element-plus";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { SvgIcon } from "@/components";
import type { ContentType } from "@/types/type";
import { checkNameValidity } from "@/utils";
import { getIsFolder, getName } from "@/utils/typeUtils.ts";

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
const inputRef = ref<InstanceType<typeof ElInput> | null>(null);

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
  async (value) => {
    if (!value) {
      name.value = "";
      return;
    }

    name.value = isCreate.value ? "" : (getName(props.item!) ?? "");
    await nextTick();
    inputRef.value?.focus();
  },
);

const handleCancel = () => {
  emit("update:show", false);
};

const handleConfirm = () => {
  const { isValid, message } = checkNameValidity(name.value);
  if (!isValid) {
    ElMessage.error(message);
    return;
  }

  emit("confirm", name.value.trim());
};
</script>

<style scoped lang="scss">
:deep(.el-dialog) {
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #f2f4f8;
  box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
}

:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-dialog__footer) {
  padding: 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid var(--dialog-divider-color);
  font-weight: bold;
}

.dialog-content {
  border-bottom: 1px solid var(--dialog-divider-color);
}

.message {
  margin: 0 0 12px;
  color: #99a1af;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}

.cancel-btn,
.confirm-btn {
  width: 80px;
  border-radius: 4px;
}

.cancel-btn {
  border: 1px solid var(--theme-color);
  background: #f2f4f8;
  color: var(--theme-color);
}
</style>
