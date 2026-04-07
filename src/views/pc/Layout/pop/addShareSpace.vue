<template>
  <el-dialog
    :model-value="show"
    :show-close="false"
    :before-close="handleClose"
    :modal="false"
    destroy-on-close
    style="
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
      background: #f2f4f8;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
    width="460"
  >
    <template #header>
      <div class="dialog-header">
        <span>{{ title }}</span>
        <SvgIcon name="ic_close" size="24" @click="handleClose" />
      </div>
    </template>
    <div class="dialog-content">
      <div class="label">
        <span>{{ t("folderName") }}: </span>
      </div>
      <el-input
        v-model="shareSpaceName"
        :placeholder="t('inputFolderName')"
        maxlength="100"
        show-word-limit
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn cancel-btn" @click="handleClose">{{
          t("cancel")
        }}</el-button>
        <el-button class="btn confirm-btn" @click="handleUpload">{{
          t("Ok")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/utils";

const props = defineProps({
  visible: Boolean,
  spaceName: String,
  title: String,
});
const emits = defineEmits(["update:visible", "create-share-space"]);
const shareSpaceName = ref(props.spaceName);

const show = computed(() => props.visible);

const handleClose = () => {
  emits("update:visible", false);
  shareSpaceName.value = "";
};

const handleUpload = () => {
  emits("create-share-space", shareSpaceName.value);
  shareSpaceName.value = "";
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e6ec80;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  font-weight: bold;
  overflow: hidden;
}

.dialog-content {
  display: flex;
  align-items: center;
  padding: 8px 30px 24px;
  border-bottom: 1px solid #e3e6ec80;
  .label {
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    color: #2d2d2d;
    font-weight: bold;
    white-space: nowrap;
    margin-right: 16px;
  }

  .encrypt-tip {
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    color: #747683;
    text-align: left;
  }
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    width: 80px;
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
