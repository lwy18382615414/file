<template>
  <div class="upload-dialog">
    <el-dialog
      :model-value="visible"
      :show-close="false"
      :before-close="handleClose"
      :modal="false"
      destroy-on-close
      width="460"
      style="
        padding: 0;
        overflow: hidden;
        border-radius: 8px;
        background: #f2f4f8;
        box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
      "
    >
      <template #header>
        <div class="dialog-header">
          <span>{{ title }}</span>
          <SvgIcon name="ic_close" @click="handleClose" />
        </div>
      </template>

      <div class="dialog-content">
        <div class="file-select">
          <div class="form-label">{{ t("chooseFile") }}:</div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-btn" @click="handleClose">
            {{ t("cancel") }}
          </el-button>
          <el-button class="confirm-btn">
            {{ t("Ok") }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { SvgIcon } from "@/components";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  show: boolean;
  title?: string;
  contentId?: number;
  isPersonal?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const { t } = useI18n();

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const title = computed(() => props.title || t("uploadFile"));

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid #e3e6ec80;
  font-weight: bold;
  overflow: hidden;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid #e3e6ec80;

  .file-wrapper {
    width: 400px;
    height: 140px;
    border-radius: 6px;
    background-color: #fff;
    display: flex;

    &.no-file {
      border: 1px dashed #5665bb;
    }

    .empty-file {
      margin: auto;
      display: flex;
      flex-direction: column;
      align-items: center;

      .text {
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        margin-top: 6px;
      }
    }
  }

  .file-list {
    width: 400px;
    height: 140px;
    overflow-y: auto;
    border-radius: 6px;
    background-color: #fff;

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px;

      &:not(:last-child) {
        border-bottom: 1px solid #e3e6ec80;
      }

      .file-name {
        color: #2d2d2d;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: bold;
        max-width: 290px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 24px;
      }
    }
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
    border: 1px solid #5665bb;
    background: #f2f4f8;
    color: #5665bb;
  }
  .confirm-btn {
    background: #5665bb;
    color: #fff;

    &.is-disabled {
      background: #3370ff80;
      color: #fff;
    }
  }
}

.form-label {
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #2d2d2d;
  font-weight: bold;
  margin-right: 14px;
  margin-bottom: 14px;
}

.file-select {
  display: flex;
  flex-direction: column;
}

.hidden-uploader {
  display: none;
}
.hidden-uploader.show-trigger {
  display: block;
}

:deep(.el-upload-dragger) {
  padding: 0;
  border: none;
  overflow: unset;

  &.is-dragover {
    .file-wrapper {
      background: #ecf5ffff;
      border: 2px dashed #5665bb;
    }
  }
}
</style>
