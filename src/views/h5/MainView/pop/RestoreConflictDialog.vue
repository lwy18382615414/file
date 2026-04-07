<template>
  <van-popup
    v-model:show="visible"
    :close-on-click-overlay="false"
    position="bottom"
    round
  >
    <div class="repeat-file-tip">
      <div class="header">
        <div class="title">
          <span>{{ t("fileDuplicate") }}</span>
        </div>
        <div class="close" @click="closeRepeatFile">
          <SvgIcon name="ic_close" />
        </div>
      </div>
      <div class="content">
        <p class="mb-3">
          {{ t("duplicateFilesWarning", { count: repeatFileList.length }) }}
        </p>
        <div class="repeat-file-operate-list">
          <div
            v-for="(item, index) in operateList"
            :key="item.value"
            :class="{ active: activeIndex === index }"
            class="operate-item"
            @click="handleRepeatFile(item.value, index)"
          >
            {{ item.text }}
          </div>
        </div>
        <div class="cancel-btn" @click="closeRepeatFile">{{ t("cancel") }}</div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { t } from "@/utils";
import { type PropType, watch, ref } from "vue";
import { restoreFile } from "@/api/recycleBin.ts";

const props = defineProps({
  showRepeatFile: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  selectedEntryInfo: {
    type: Object as PropType<Record<string, number>>,
    default: () => {},
  },
  repeatFileList: {
    type: Array as PropType<Record<string, string>[]>,
    default: () => [],
  },
});

const emits = defineEmits(["update:showRepeatFile", "refresh"]);

const visible = ref(props.showRepeatFile);
const activeIndex = ref(0);

const operateList = [
  { text: t("skipFiles"), value: 3 },
  { text: t("overwriteFiles"), value: 1 },
  { text: t("keep"), value: 2 },
];

const closeRepeatFile = () => {
  visible.value = false;
};

const handleRepeatFile = async (operateType: number, index: number) => {
  activeIndex.value = index;
  const res = await restoreFile({
    restoreFiles: [
      {
        id: props.selectedEntryInfo.id,
        contentId: props.selectedEntryInfo.contentId!,
      },
    ],
    repeatFileOperateType: operateType,
  });
  if (res.code === 1) {
    showToast({
      type: "success",
      message: t("operationSuccess"),
    });
    emits("refresh");
    visible.value = false;
  }
};

watch(
  () => props.showRepeatFile,
  (val) => {
    visible.value = val;
  },
);

watch(visible, (val) => {
  emits("update:showRepeatFile", val);
});
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ebeff6;

  .title {
    color: #000;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-family:
      PingFang SC,
      PingFang SC;
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
        font-size: calc(var(--base--font--size--16) * var(--scale-factor));
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

  .cancel-btn {
    text-align: center;
    color: #327edc;
    border-radius: 8px;
    border: 1px solid #327edc;
    padding: 10px 0;
    margin-top: 24px;
  }
}
</style>
