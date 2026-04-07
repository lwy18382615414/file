<template>
  <el-dialog
    v-model="isVisible"
    :width="width || 300"
    class="custom-dialog"
    :modal="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    style="
      padding: 0;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ title }}</span>
        <span @click="closeDialog">
          <SvgIcon name="ic_close" />
        </span>
      </div>
    </template>

    <!-- 内容 -->
    <div class="dialog-content">
      <div v-if="content === '文件夹名不能为空'" class="error-tip">
        <SvgIcon name="ic_err_file" size="54" />
        <span class="text">文件夹名不能为空</span>
      </div>
      <p v-else class="text-[#1a1a1a]">
        {{ content }}
      </p>
      <p class="flex gap-3 my-3">
        <span>{{ extraContent }}</span>
      </p>
    </div>

    <!-- 按钮 -->
    <template #footer>
      <template v-if="buttons">
        <div class="btn-group">
          <el-button
            v-for="button in buttons"
            :key="button.text"
            :color="button.color"
            @click="button.onClick"
          >
            {{ button.text }}
          </el-button>
        </div>
      </template>

      <template v-else>
        <div class="dialog-footer">
          <el-button type="default" @click="closeDialog">{{
            cancelText || t("cancel")
          }}</el-button>
          <el-button type="primary" @click="confirmDialog">{{
            confirmText || t("Ok")
          }}</el-button>
        </div>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { t } from "@/utils";

const props = defineProps<{
  width?: number;
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  visible: boolean;
  extraContent?: string;
  extraContentType?: string;
  buttons?: {
    text: string;
    color: string;
    onClick: () => void;
  }[];
}>();

const emit = defineEmits(["confirm", "close", "extra-button-click"]);
const isVisible = ref(props.visible);

watch(
  () => props.visible,
  (newVal) => {
    isVisible.value = newVal;
  }
);

const closeDialog = () => {
  isVisible.value = false;
  emit("close");
};

const confirmDialog = () => {
  isVisible.value = false;
  emit("confirm");
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  color: #1a1a1a;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid #e3e6ec80;
  line-height: 24px;
  overflow: hidden;
  font-family: PingFang SC;
}

.dialog-content {
  padding: 8px 16px 0;
  border-bottom: 1px solid #e3e6ec80;
}

.error-tip {
  border-radius: 6px;
  display: flex;
  gap: 6px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.btn-group {
  padding: 0 16px 16px;
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    width: 50%;
    border-radius: 4px;
  }

  .cancel-btn {
    border: 1px solid #327edc;
    background: #f2f4f8;
    color: #327edc;
  }
  .confirm-btn {
    background: #327edc;
    color: #fff;
  }
}
</style>
