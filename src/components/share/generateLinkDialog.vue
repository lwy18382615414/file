<template>
  <el-dialog
    v-model="showLinkDialog"
    :before-close="handleClose"
    :modal="false"
    :show-close="false"
    style="
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
    :width="getLanguageCode() === 'en' ? 720 : 610"
  >
    <template #header>
      <div class="dialog-header">
        <div class="flex items-center">
          <div class="title">{{ t("shareFile") }}</div>
        </div>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>
    <div class="dialog-content">
      <div class="file-wrapper">
        <SvgIcon
          :name="
            getIsFolder(firstFile) ? 'icon_folder' : getFileIcon(getName(firstFile))
          "
          size="48"
        />
        <div class="file-name">
          <span> {{ t("fileName", { name: getName(firstFile) }) }} </span>
          <span v-if="shareList.length > 1"
            >{{ t("andItem", { count: shareList.length }) }}
          </span>
        </div>
      </div>
      <div v-if="step === 1" class="settings-wrapper">
        <div class="validity-wrapper">
          <div
            class="form-label"
            :class="{ 'is-en': getLanguageCode() === 'en' }"
          >
            {{ t("expiration") }}
          </div>
          <el-radio-group v-model="validity">
            <el-radio
              v-for="item in validityMap"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-radio>
          </el-radio-group>
        </div>
        <div class="password-wrapper">
          <div
            class="form-label"
            :class="{ 'is-en': getLanguageCode() === 'en' }"
          >
            {{ t("password") }}
          </div>
          <el-radio-group v-model="isPassword" @change="handlePasswordChange">
            <el-radio :value="0">{{ t("noNeed") }}</el-radio>
            <el-radio :value="1">{{ t("randomPassword") }}</el-radio>
            <div class="flex relative">
              <el-radio :value="2" style="margin-right: 12px">{{
                t("manualPassword")
              }}</el-radio>
              <el-input
                v-if="isPassword === 2"
                v-model="password"
                :class="{ 'is-error': errText }"
                maxlength="4"
                :placeholder="t('passwordHint')"
                style="width: 240px"
              />
              <el-text
                v-if="isPassword === 2"
                :style="{
                  color: errText ? '#E34340' : '#747683',
                }"
                class="password-tips"
                >{{ errText ? errText : t("passwordFormatError") }}
              </el-text>
            </div>
          </el-radio-group>
        </div>
      </div>
      <div v-else class="link-wrapper">
        <div class="item link">
          <div
            class="form-label"
            :class="{ 'is-en': getLanguageCode() === 'en' }"
          >
            {{ t("link") }}
          </div>
          <el-input v-model="shareLink" readonly>
            <template #suffix> {{ validityText }} </template>
          </el-input>
        </div>
        <div v-if="isPassword" class="item password">
          <div
            class="form-label"
            :class="{ 'is-en': getLanguageCode() === 'en' }"
          >
            {{ t("password") }}
          </div>
          <el-input v-model="password" readonly style="width: 120px" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button
          :disabled="disabled"
          class="confirm-btn"
          @click="handleClick"
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
import { useShareFileStore } from "@/stores";
import { copyToClipboard, getFileIcon, t } from "@/utils";
import { storeToRefs } from "pinia";
import { getLanguageCode } from "@/utils/auth";
import { getIsFolder, getName } from "@/utils/typeUtils";
import {
  buildShareCopyText,
  buildShareLink,
  getShareContentIds,
  getValidityOptions,
  handleSharePermissionResult,
  isManualPasswordInvalid,
} from "@/views/hooks/useShareLink";

const shareFileStore = useShareFileStore();
const { setShowLinkDialog, setShareList, setClearSelect } = shareFileStore;
const { shareList, showLinkDialog } = storeToRefs(shareFileStore);

const firstFile = computed(() => shareList.value[0]);
const validity = ref(3);
const validityMap = ref(getValidityOptions());
const isPassword = ref(1);
const password = ref("");
const step = ref(1);
const errText = ref("");
const shareLink = ref("");
const shareCount = ref(0);

const validityText = computed(() => {
  const days = validityMap.value.find((item) => item.value === validity.value)?.label;
  return days ? t("daysValid", { days }) : "";
});

const disabled = computed(() => {
  if (isPassword.value !== 2) return false;
  return !password.value || !!errText.value;
});

watch(password, (val) => {
  errText.value = val && isManualPasswordInvalid(val) ? t("passwordFormatError") : "";
});

function handlePasswordChange(value: number) {
  if (value === 2) {
    password.value = "";
  }
}

function handleClick() {
  if (step.value === 1) {
    generateLink();
    return;
  }

  copyLinkToClipboard();
}

async function generateLink() {
  const contentIds = getShareContentIds(shareList.value);
  if (!contentIds.length) return;

  try {
    const shareResult = await handleSharePermissionResult({
      items: shareList.value,
      params: {
        contentIds,
        expireType: validity.value,
        passwordType: isPassword.value,
        password: password.value,
      },
    });

    if (!shareResult.result) {
      ElMessage.error(t("noSharePermission"));
      return;
    }

    password.value = shareResult.result.password;
    shareLink.value = buildShareLink(
      shareResult.result.shareKey,
      shareResult.result.password,
    );
    step.value = 2;
    shareCount.value = shareResult.contentIds.length;
  } catch {
    ElMessage.error(t("shareFailed"));
  }
}

async function copyLinkToClipboard() {
  if (!firstFile.value) return;

  try {
    await copyToClipboard(
      buildShareCopyText({
        count: shareCount.value,
        firstItem: firstFile.value,
        shareKey: shareLink.value.split("shareKey=")[1] ?? "",
        password: password.value,
      }),
    );
    ElMessage.success(t("copySuccess"));
    setShowLinkDialog(false);
    setClearSelect();
    setShareList([]);
  } catch {
    ElMessage.error(t("copyFailed"));
  }
}

function handleClose() {
  setShowLinkDialog(false);
}
</script>

<style lang="scss" scoped>
.dialog-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  font-weight: bold;
  overflow: hidden;
  font-family: Microsoft YaHei;
}

.dialog-content {
  padding: 0 16px 24px;
  border-bottom: 1px solid #e0e4eb;

  .form-label {
    text-align: right;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-weight: normal;
    line-height: 24px;
    margin-right: 16px;
    white-space: nowrap;
  }

  .file-wrapper {
    height: 80px;
    padding: 0 22px;
    background: #f2f4f8;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-bottom: 16px;

    .file-name {
      margin-left: 8px;
      font-weight: 400;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      color: #2d2d2d;
      max-width: 500px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .settings-wrapper {
    padding-left: 16px;

    .form-label {
      min-width: 48px;

      &.is-en {
        min-width: 100px;
      }
    }

    :deep(.el-radio) {
      .el-radio__inner {
        width: 16px;
        height: 16px;
        border: 2px solid #e0e0e0;
      }

      &.is-checked {
        .el-radio__inner {
          background: #ffffff;
          border: 2px solid var(--el-color-primary);

          &::after {
            width: 8px;
            height: 8px;
            background: var(--el-color-primary);
          }
        }
      }

      .el-radio__label {
        font-size: calc(var(--base--font--size--16) * var(--scale-factor));
        line-height: 24px;
        color: #2d2d2d;
      }
    }
    .validity-wrapper {
      height: 40px;
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .password-wrapper {
      display: flex;

      .form-label {
        margin-top: 7px;
      }

      :deep(.el-radio-group) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .password-tips {
        white-space: nowrap;
        position: absolute;
        top: 36px;
        left: 24px;
      }
    }
  }

  .link-wrapper {
    padding-left: 16px;
    .item {
      white-space: nowrap;
      margin-bottom: 16px;
      display: flex;
      align-items: center;

      .form-label {
        &.is-en {
          min-width: 70px;
        }
      }
    }
  }
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .el-button {
    height: 32px;
    border-radius: 4px;
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
      border: 1px solid #b7b7b7;
      background: #b7b7b7;
      color: #fff;
    }
  }
}
</style>
