<template>
  <van-popup
    v-model:show="showPopup"
    :close-on-click-overlay="false"
    position="bottom"
    round
  >
    <div class="repeat-file-tip">
      <div class="header">
        <div class="title">
          <span>{{ t("fileDuplicate") }}</span>
        </div>
        <div class="close" @click="closePopup">
          <SvgIcon name="ic_close" />
        </div>
      </div>
      <div class="content">
        <p class="mb-3">
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
            :class="{ active: activeIndex === index }"
            class="operate-item"
            @click="uploadStep2(item.value, index)"
          >
            {{ item.text }}
          </div>
        </div>
        <div class="repeat-btn" @click="closePopup">
          {{ t("cancel") }}
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { replayGroupedUploadStep2 } from "@/utils/upload/uploadManager";
import type { Task } from "@/hooks/upload/useUploadFlow";
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";
import { t } from "@/utils";

const props = defineProps<{
  show: boolean;
  contentId: number;
  isTransfer?: boolean;
  duplicateList?: Record<number, string>[];
  allFileList?: Task[];
}>();

const emit = defineEmits(["update:show", "saveSuccess"]);

const {
  duplicateTasks: flowDuplicateTasks,
  allTasks: flowAllTasks,
  clearUploadState,
} = useUploadFlow();

const showPopup = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

const duplicateTasks = computed(
  () => props.duplicateList || flowDuplicateTasks.value,
);
const allTasks = computed(() => props.allFileList || flowAllTasks.value);

const activeIndex = ref(0);
const operateList = [
  { text: t("skipFiles"), value: 3 },
  { text: t("overwriteFiles"), value: 1 },
  { text: t("keep"), value: 2 },
];

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
  } else {
    showToast({ message: t("operationSuccess"), type: "success" });
    clearUploadState();
  }
  showPopup.value = false;
};

const closePopup = () => {
  showPopup.value = false;
  clearUploadState();
};
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--subtle-fill-color);

  .title {
    color: #000;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-family: Inter;
  }
}

.content {
  padding: 20px 16px;

  .file-list {
    margin-top: 14px;
    width: 100%;
    max-height: 140px;
    overflow-y: auto;
    border-radius: 6px;
    background-color: #fff;

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 0;

      &:not(:last-child) {
        border-bottom: 1px solid var(--dialog-divider-color);
      }

      .file-name {
        color: var(--text-primary-color);
        font-size: 16px;
        font-weight: bold;
        max-width: calc(100vw - 155px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .repeat-file-operate-list {
    .active {
      background-color: #ebf0ff;
    }
  }

  .repeat-btn {
    text-align: center;
    color: var(--theme-color);
    border-radius: 8px;
    border: 1px solid var(--theme-color);
    padding: 10px 0;
    margin-top: 24px;
  }
}
</style>
