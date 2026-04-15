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
          <SvgIcon name="action-close" @click="handleClose" />
        </div>
      </template>

      <div class="dialog-content">
        <div class="file-select">
          <div class="form-label">{{ t("chooseFile") }}:</div>
          <el-upload
            v-if="visible"
            :ref="bindUploaderRef"
            class="hidden-uploader"
            :class="{ 'show-trigger': !hasSelectedFiles && !loading }"
            action="#"
            multiple
            drag
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleSelectChange"
          >
            <template #trigger>
              <div
                class="file-wrapper"
                :class="{ 'no-file': !hasSelectedFiles }"
              >
                <div class="empty-file">
                  <SvgIcon
                    name="action-upload_file"
                    size="54"
                    color="var(--theme-color)"
                  />
                  <span class="text">{{ t("clickToChoose") }}</span>
                </div>
              </div>
            </template>
          </el-upload>

          <div v-if="hasSelectedFiles || loading">
            <div
              class="file-list"
              v-loading="loading"
              :element-loading-text="t('fileLoading') + '...'"
              :class="{ clickable: hasSelectedFiles && !loading }"
              @click="hasSelectedFiles && !loading && openFileDialog()"
              @dragover="handleDragOver"
              @drop="handleDrop"
            >
              <div
                v-for="file in selectedFiles"
                :key="file.name"
                class="file-item"
              >
                <div class="file-main">
                  <SvgIcon :name="getFileIcon(file.name)" size="24" />
                  <div class="file-name">{{ file.name }}</div>
                </div>
                <SvgIcon
                  name="action-close_bg"
                  @click.stop="handleRemove(file.name)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-btn" @click="handleClose">
            {{ t("cancel") }}
          </el-button>
          <el-button
            :disabled="loading"
            class="confirm-btn"
            @click="handleUpload"
          >
            {{ t("Ok") }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <RepeatFileDialog
      :repeat-visible="showRepeatFileDialog"
      :content-id="contentId"
      @update:repeatVisible="handleRepeatVisibleChange"
      @saveSuccess="emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UploadProps } from "element-plus";
import { SvgIcon } from "@/components";
import { getFileIcon } from "@/utils";
import { useI18n } from "vue-i18n";
import RepeatFileDialog from "./RepeatFileDialog.vue";

const props = defineProps<{
  show: boolean;
  title?: string;
  contentId?: number;
  isPersonal?: boolean;
  bindUploaderRef: unknown;
  selectedFiles: File[];
  loading: boolean;
  hasSelectedFiles: boolean;
  showRepeatFileDialog: boolean;
  openFileDialog: () => void;
  handleSelectChange: UploadProps["onChange"];
  handleDragOver: (event: DragEvent) => void;
  handleDrop: (event: DragEvent) => void;
  handleRemove: (fileName: string) => void;
  handleUpload: () => void | Promise<void>;
  handleRepeatVisibleChange: (value: boolean) => void;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "refresh"): void;
}>();

const { t } = useI18n();

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const title = computed(() => props.title || t("uploadFile"));
const contentId = computed(() => props.contentId || 0);
const bindUploaderRef = computed(() => props.bindUploaderRef);
const selectedFiles = computed(() => props.selectedFiles);
const loading = computed(() => props.loading);
const hasSelectedFiles = computed(() => props.hasSelectedFiles);
const showRepeatFileDialog = computed(() => props.showRepeatFileDialog);
const openFileDialog = () => props.openFileDialog();
const handleSelectChange: UploadProps["onChange"] = (...args) =>
  props.handleSelectChange?.(...args);
const handleDragOver = (event: DragEvent) => props.handleDragOver(event);
const handleDrop = (event: DragEvent) => props.handleDrop(event);
const handleRemove = (fileName: string) => props.handleRemove(fileName);
const handleUpload = () => props.handleUpload();
const handleRepeatVisibleChange = (value: boolean) =>
  props.handleRepeatVisibleChange(value);

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
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid var(--dialog-divider-color);
  font-weight: bold;
  overflow: hidden;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid var(--dialog-divider-color);

  .file-wrapper {
    width: 400px;
    height: 140px;
    border-radius: 6px;
    background-color: #fff;
    display: flex;

    &.no-file {
      border: 1px dashed var(--theme-color);
    }

    .empty-file {
      margin: auto;
      display: flex;
      flex-direction: column;
      align-items: center;

      .text {
        color: var(--text-primary-color);
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

    &.clickable {
      cursor: pointer;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px;

      &:not(:last-child) {
        border-bottom: 1px solid var(--dialog-divider-color);
      }

      .file-main {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .file-name {
        color: var(--text-primary-color);
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
}

.form-label {
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: var(--text-primary-color);
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
      background: var(--theme-color-light);
      border: 2px dashed var(--theme-color);
    }
  }
}
</style>
