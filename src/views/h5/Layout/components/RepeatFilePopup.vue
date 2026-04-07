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
import { uploadFileStep2Api } from "@/api/fileService";
import { type Task, useUploadInfo, useUploadStatus } from "@/stores";
import { t } from "@/utils";

const props = defineProps<{
  show: boolean;
  contentId: number;
  isTransfer?: boolean;
  duplicateList?: Record<number, string>[];
  allFileList?: Task[];
}>();

const emit = defineEmits(["update:show", "saveSuccess"]);

const uploadInfo = useUploadInfo();

const showPopup = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

const duplicateTasks = computed(
  () => props.duplicateList || uploadInfo.duplicateTasks,
);
const allTasks = computed(() => props.allFileList || uploadInfo.allTasks);

const activeIndex = ref(0);
const operateList = [
  { text: t("skipFiles"), value: 3 },
  { text: t("overwriteFiles"), value: 1 },
  { text: t("keep"), value: 2 },
];

const uploadStep2 = async (repeatType: number, index: number) => {
  activeIndex.value = index;
  const res = await uploadFileStep2Api({
    fileInfos: allTasks.value,
    contentId: props.contentId,
    repeatFileOperateType: repeatType,
    viewRanges: [],
    editRanges: [],
  });
  if (res.code === 1) {
    if (props.isTransfer) {
      emit("saveSuccess");
    } else {
      showToast({ message: t("operationSuccess"), type: "success" });
      useUploadStatus().updateAddFolder(true);
      uploadInfo.clearUploadingStatus();
    }
    showPopup.value = false;
  }
};

const closePopup = () => {
  showPopup.value = false;
  uploadInfo.clearUploadingStatus();
};
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ebeff6;

  .title {
    color: #000;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-family: PingFang SC;
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
        border-bottom: 1px solid #e3e6ec80;
      }

      .file-name {
        color: #2d2d2d;
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
    color: #327edc;
    border-radius: 8px;
    border: 1px solid #327edc;
    padding: 10px 0;
    margin-top: 24px;
  }
}
</style>
