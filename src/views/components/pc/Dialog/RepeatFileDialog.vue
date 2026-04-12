<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    :before-close="handleClose"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
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
        <span>{{ t("fileDuplicate") }}</span>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>

    <div class="dialog-content">
      <p class="mb-3 text-[var(--text-primary-color)] font-bold">
        {{
          t("duplicateFilesWarning", {
            count: duplicateTasks.length,
          })
        }}
      </p>
      <div class="repeat-file-operate-list">
        <div
          v-for="(item, index) in operateList"
          :key="item.value"
          class="operate-item"
          :class="{ active: index === activeIndex }"
          @click="uploadStep2(item.value, index)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">{{
          t("cancel")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, type PropType, ref } from "vue";
import type { Task } from "@/hooks/upload/useUploadFlow";
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";
import { t } from "@/utils";
import { replayGroupedUploadStep2 } from "@/utils/upload/uploadManager";

const props = defineProps({
  isTransfer: {
    type: Boolean,
    default: undefined,
  },
  repeatVisible: {
    type: Boolean,
    default: false,
  },
  contentId: {
    type: Number as PropType<number>,
    default: () => 0,
  },
  duplicateList: {
    type: Array as PropType<Record<number, string>[]>,
    default: undefined,
  },
  allFileList: {
    type: Array as PropType<Task[]>,
    default: undefined,
  },
});

const emit = defineEmits(["update:repeatVisible", "saveSuccess"]);

const {
  duplicateTasks: flowDuplicateTasks,
  allTasks: flowAllTasks,
  clearUploadState,
} = useUploadFlow();
const visible = computed(() => props.repeatVisible);
const operateList = [
  { text: t("skipFiles"), value: 3 },
  { text: t("overwriteFiles"), value: 1 },
  { text: t("keep"), value: 2 },
];
const activeIndex = ref(0);

const duplicateTasks = computed(() => props.duplicateList ?? flowDuplicateTasks.value);
const allTasks = computed(() => props.allFileList ?? flowAllTasks.value);

const handleClose = () => {
  clearUploadState();
  emit("update:repeatVisible", false);
};

const uploadStep2 = async (repeatType: number, index: number) => {
  activeIndex.value = index;
  const result = await replayGroupedUploadStep2({
    tasks: allTasks.value,
    defaultContentId: props.contentId,
    repeatFileOperateType: repeatType,
  });

  if (result.failedTasks.length || result.duplicateTasks.length) {
    return;
  }

  if (props.isTransfer) {
    emit("saveSuccess");
    emit("update:repeatVisible", false);
  } else {
    ElMessage.success(t("operationSuccess"));
    handleClose();
  }
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
  font-family:
    Microsoft YaHei,
    Microsoft YaHei;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid var(--dialog-divider-color);
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));

  .file-list {
    max-height: 140px;
    overflow-y: auto;

    .file-item {
      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    border: 1px solid var(--theme-color);
    background: #f2f4f8;
    color: var(--theme-color);
  }
}
</style>
