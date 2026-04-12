<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    :before-close="handleClose"
    :modal="false"
    destroy-on-close
    width="640"
    class="copy-link-pc-dialog"
    style="
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
  >
    <template #header>
      <div class="dialog-header">
        <div class="title">{{ t("shareFile") }}</div>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>

    <div class="dialog-content">
      <div v-if="firstFile" class="file-wrapper">
        <SvgIcon
          :name="
            getIsFolder(firstFile)
              ? 'file-folder'
              : getFileIcon(getName(firstFile))
          "
          size="48"
        />
        <div class="file-name">
          <span>{{ t("fileName", { name: getName(firstFile) }) }}</span>
          <span v-if="props.items.length > 1">
            {{ t("andItem", { count: props.items.length }) }}
          </span>
        </div>
      </div>

      <div v-if="step === 1" class="settings-wrapper">
        <div class="setting-row">
          <div class="form-label">{{ t("expiration") }}</div>
          <el-radio-group v-model="validity" class="radio-group validity-group">
            <el-radio
              v-for="item in validityOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </div>

        <div class="setting-row password-row">
          <div class="form-label">{{ t("password") }}</div>
          <div class="password-content">
            <el-radio-group
              v-model="passwordType"
              class="radio-group password-group"
            >
              <el-radio
                v-for="item in passwordOptions"
                :key="item.value"
                :value="item.value"
                @change="handlePasswordTypeChange"
              >
                {{ item.label }}
              </el-radio>
            </el-radio-group>
            <div v-if="passwordType === 2" class="password-input-wrapper">
              <el-input
                v-model="password"
                maxlength="4"
                :placeholder="t('passwordHint')"
                class="password-input"
              />
              <div class="password-tips" :class="{ 'is-error': passwordError }">
                {{ passwordError || t("passwordFormatError") }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="result-wrapper">
        <div class="result-row">
          <div class="form-label link">{{ t("link") }}</div>
          <el-input v-model="shareLink" readonly>
            <template #suffix>
              {{ validityText }}
            </template>
          </el-input>
        </div>
        <div v-if="generatedPassword" class="result-row">
          <div class="form-label password">{{ t("password") }}</div>
          <el-input v-model="generatedPassword" style="width: 20%" readonly />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">
          {{ t("cancel") }}
        </el-button>
        <el-button
          class="confirm-btn"
          :disabled="disabled"
          @click="handleCopyLink"
        >
          {{ step === 1 ? t("createLink") : t("copyLinkAndPassword") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { ContentType } from "@/types/type";
import { copyToClipboard, getFileIcon, t } from "@/utils";
import { getIsFolder, getName } from "@/utils/typeUtils.ts";
import {
  buildShareCopyText,
  buildShareLink,
  getPasswordOptions,
  getShareContentIds,
  getValidityOptions,
  handleSharePermissionResult,
  isManualPasswordInvalid,
} from "../../../hooks/useShareLink.ts";

const props = defineProps<{
  show: boolean;
  items: ContentType[];
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const firstFile = computed(() => props.items[0]);
const validity = ref(3);
const passwordType = ref(1);
const password = ref("");
const passwordError = ref("");
const step = ref(1);
const shareLink = ref("");
const generatedPassword = ref("");
const shareCount = ref(0);

const validityOptions = computed(() => getValidityOptions());
const passwordOptions = computed(() => getPasswordOptions());
const validityText = computed(() => {
  const days = validityOptions.value.find(
    (item) => item.value === validity.value,
  )?.label;
  return days ? t("daysValid", { days }) : "";
});

const disabled = computed(() => {
  if (step.value === 2) return false;
  if (passwordType.value !== 2) return false;
  return !password.value || !!passwordError.value;
});

watch(password, (value) => {
  passwordError.value =
    value && isManualPasswordInvalid(value) ? t("passwordFormatError") : "";
});

watch(
  () => props.show,
  (value) => {
    if (!value) {
      resetState();
    }
  },
);

function handlePasswordTypeChange(value: number | string | boolean) {
  if (Number(value) === 2) {
    password.value = "";
    passwordError.value = "";
    return;
  }

  password.value = "";
  passwordError.value = "";
}

async function handleCopyLink() {
  if (!firstFile.value) return;

  if (step.value === 1) {
    const contentIds = getShareContentIds(props.items);
    if (!contentIds.length) return;

    try {
      const shareResult = await handleSharePermissionResult({
        items: props.items,
        params: {
          contentIds,
          expireType: validity.value,
          passwordType: passwordType.value,
          password: password.value,
        },
      });

      if (!shareResult.result) {
        ElMessage.error(t("noSharePermission"));
        return;
      }

      generatedPassword.value = shareResult.result.password;
      shareLink.value = buildShareLink(
        shareResult.result.shareKey,
        generatedPassword.value,
      );
      shareCount.value = shareResult.contentIds.length;
      step.value = 2;
      return;
    } catch {
      ElMessage.error(t("copyFailed"));
      return;
    }
  }

  try {
    await copyToClipboard(
      buildShareCopyText({
        count: shareCount.value,
        firstItem: firstFile.value,
        shareKey: shareLink.value.split("shareKey=")[1] ?? "",
        password: generatedPassword.value,
      }),
    );

    ElMessage.success(t("copySuccess"));
    visible.value = false;
    resetState();
  } catch {
    ElMessage.error(t("copyFailed"));
  }
}

function handleClose() {
  visible.value = false;
  resetState();
}

function resetState() {
  validity.value = 3;
  passwordType.value = 1;
  password.value = "";
  passwordError.value = "";
  step.value = 1;
  shareLink.value = "";
  generatedPassword.value = "";
  shareCount.value = 0;
}
</script>

<style lang="scss" scoped>
.dialog-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  font-weight: bold;
  overflow: hidden;
  font-family: Microsoft YaHei;
}

.dialog-content {
  padding: 0 16px 24px;
  border-bottom: 1px solid #e0e4eb;
}

.file-wrapper {
  min-height: 80px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: linear-gradient(180deg, #f7f9fc 0%, #f2f4f8 100%);
  display: flex;
  align-items: center;
  gap: 12px;

  .file-name {
    color: var(--text-primary-color);
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    line-height: 24px;
    max-width: 520px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.settings-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 16px;

  &.password-row {
    align-items: flex-start;
  }
}

.form-label {
  min-width: 80px;
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  line-height: 24px;
  text-align: right;
  flex-shrink: 0;

  &.link,
  &.password {
    text-align: left;
  }
}

.password-content {
  flex: 1;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.validity-group {
  padding-top: 4px;
}

.password-group {
  flex-direction: column;
  align-items: flex-start;
}

.password-input-wrapper {
  margin-top: 12px;
  width: 260px;
}

.password-input {
  width: 100%;
}

.password-tips {
  margin-top: 6px;
  color: var(--text-secondary-color);
  font-size: 12px;
  line-height: 18px;

  &.is-error {
    color: #e34340;
  }
}

.result-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.result-row .el-input) {
  width: 100%;
}

:deep(.result-row .el-input__wrapper) {
  min-height: 40px;
}

:deep(.result-row .el-input__suffix-inner) {
  color: var(--text-secondary-color);
  font-size: 12px;
}

:deep(.el-radio) {
  margin-right: 0;

  .el-radio__inner {
    width: 16px;
    height: 16px;
    border: 2px solid #e0e0e0;
  }

  &.is-checked {
    .el-radio__inner {
      background: #fff;
      border-color: var(--el-color-primary);

      &::after {
        width: 8px;
        height: 8px;
        background: var(--el-color-primary);
      }
    }
  }

  .el-radio__label {
    color: var(--text-primary-color);
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    line-height: 24px;
  }
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 88px;
    height: 32px;
    border-radius: 4px;
  }
}

.cancel-btn {
  border: 1px solid var(--el-color-primary);
  background: #fff;
  color: var(--el-color-primary);
}

.confirm-btn {
  border: 1px solid var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;

  &.is-disabled {
    border-color: #b7b7b7;
    background: #b7b7b7;
    color: #fff;
  }
}
</style>
