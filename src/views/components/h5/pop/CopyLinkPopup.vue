<template>
  <van-action-sheet v-model:show="visible" @click-overlay="clearState">
    <template #default>
      <div class="action-sheet-header">
        <div class="close-text" @click="onCancel">
          {{ settings ? t("return") : t("cancel") }}
        </div>
        <div class="title">
          {{ title }}
        </div>
        <div class="copy-link" @click="onConfirm">
          {{ settings ? t("Ok") : t("copyLink") }}
        </div>
      </div>
      <div class="action-sheet-content">
        <template v-if="!settings">
          <van-cell
            :value="validTime"
            is-link
            :title="t('expiration')"
            @click="setValidTime"
          />
          <van-cell
            :title="pswCellTitle"
            :value="extracode"
            is-link
            @click="setPassword"
          />
        </template>
        <template v-else-if="settings === 'validTime'">
          <van-cell-group>
            <van-cell
              v-for="item in validTimeList"
              :key="item.value"
              :title="item.label"
              @click="changeValidTime(item.value)"
            >
              <template v-if="item.value === validKey" #right-icon>
                <SvgIcon name="ic_check" size="16" />
              </template>
            </van-cell>
          </van-cell-group>
        </template>
        <template v-else-if="settings === 'password'">
          <van-cell-group class="password-cell-group">
            <van-cell
              v-for="item in passwordList"
              :key="item.value"
              :title="item.label"
              @click="changePassword(item.value)"
            >
              <template v-if="item.value === passwordKey" #right-icon>
                <SvgIcon name="ic_check" size="16" />
              </template>
            </van-cell>
          </van-cell-group>
          <div v-if="passwordKey === 2">
            <van-field
              v-model="extracode"
              clearable
              maxlength="4"
              :placeholder="t('passwordHint')"
            />
            <div
              v-if="
                (extracode.length > 0 && isRightPassword) || showPasswordTips
              "
              class="password-tips"
            >
              {{ t("passwordFormatError") }}
            </div>
          </div>
        </template>
      </div>
    </template>
  </van-action-sheet>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import type { ContentType } from "@/types/type";
import { t } from "@/utils";
import { useShareLinkSettings } from "../../../hooks/useShareLink.ts";

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

const shareList = computed(() => props.items ?? []);

const {
  validTimeList,
  passwordList,
  title,
  pswCellTitle,
  settings,
  validKey,
  passwordKey,
  extracode,
  showPasswordTips,
  validTime,
  isRightPassword,
  clearState,
  setValidTime,
  setPassword,
  changeValidTime,
  changePassword,
  onCancel,
  onConfirm,
} = useShareLinkSettings({
  visible,
  items: shareList,
});

watch(
  () => visible.value,
  (val) => {
    if (!val) {
      setTimeout(() => {
        clearState();
      }, 300);
    }
  },
);
</script>

<style lang="scss" scoped>
.action-sheet-header {
  background-color: var(--subtle-fill-color);
  display: flex;
  align-items: center;
  padding: 16px;
  font-family: Inter;
  white-space: nowrap;

  .close-text {
    color: var(--text-secondary-color);
  }

  .title {
    font-family: PingFang;
    color: var(--text-primary-color);
    margin: 0 auto;
  }

  .copy-link {
    color: var(--el-color-primary);
  }
}

:deep(.van-cell) {
  align-items: center;
  padding: 17px 16px 17px 25px;

  .van-cell__title {
    color: var(--text-primary-color);
    white-space: nowrap;
  }

  .van-cell__value {
    color: var(--text-secondary-color);
  }
}

.action-sheet-content {
  :deep(.van-cell__right-icon) {
    color: var(--text-weak-color);
  }
}

.password-cell-group {
  &::after {
    border: none;
  }
}

:deep(.van-field) {
  padding-top: 0;

  .van-field__control {
    color: var(--text-primary-color);
    font-size: 14px;
  }
}

.password-tips {
  padding: 4px 16px 12px;
  color: #ee3f3f;
  font-size: 12px;
}
</style>
