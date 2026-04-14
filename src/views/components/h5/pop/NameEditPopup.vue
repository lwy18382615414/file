<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    @click-overlay="handleCancel"
    @update:show="handleShowChange"
  >
    <div class="name-edit-sheet">
      <div class="sheet-header">
        <span class="sheet-title">{{ title }}</span>
        <button class="close-btn" type="button" @click="handleCancel">
          <SvgIcon name="action-close" size="18" color="var(--btn-primary-text-color)" />
        </button>
      </div>

      <div class="sheet-body">
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
      </div>

      <div class="sheet-actions">
        <button
          class="action-btn cancel-btn"
          type="button"
          @click="handleCancel"
        >
          {{ t("cancel") }}
        </button>
        <button
          class="action-btn confirm-btn"
          type="button"
          :disabled="!name.trim()"
          @click="handleConfirm"
        >
          {{ t("Ok") }}
        </button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { showToast } from "vant";
import { SvgIcon } from "@/components";
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

const placeholderContent = computed(() => {
  if (isCreate.value) return t("inputFolderName");
  if (!props.item) return t("inputFolderName");
  return getIsFolder(props.item) ? t("inputFolderName") : t("inputFileName");
});

watch(
  () => [props.show, props.mode, props.item] as const,
  ([value]) => {
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
  const trimmedName = name.value.trim();
  const { isValid, message } = checkNameValidity(trimmedName);
  if (!isValid) {
    showToast({ message, type: "fail" });
    return;
  }

  emit("confirm", trimmedName);
};
</script>

<style scoped lang="scss">
.name-edit-sheet {
  width: 100%;
  padding: 0 16px 24px;
  background: var(--btn-default-bg);
  border-radius: 20px 20px 0 0;
  box-sizing: border-box;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.sheet-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 25px;
  color: var(--text-primary-color);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
}

.sheet-body {
  padding: 8px 0 24px;
}

:deep(.van-field) {
  background: var(--content-bg-color);
  border-radius: 12px;
}

:deep(.van-field__control) {
  min-height: 22px;
  color: var(--text-primary-color);
}

:deep(.van-field__word-limit) {
  margin-top: 6px;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  height: 44px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn {
  color: var(--text-primary-color);
  background: var(--content-bg-color);
}

.confirm-btn {
  color: var(--btn-primary-text-color);
  background: var(--btn-primary-color);
}

.confirm-btn:disabled {
  opacity: 0.5;
}
</style>
