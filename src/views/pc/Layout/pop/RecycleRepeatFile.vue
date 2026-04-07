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
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <span>{{ t("fileDuplicate") }}</span>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>

    <div class="dialog-content">
      <p class="mb-3">
        {{ t("duplicateFilesWarning", { count: repeatList.length }) }}
      </p>
      <div class="repeat-file-operate-list">
        <div
          v-for="(item, index) in operateList"
          :key="item.name"
          class="operate-item"
          :class="{ active: index === activeIndex }"
          @click="item.fn"
        >
          {{ item.name }}
        </div>
      </div>
      <div v-if="false" class="file-list">
        <div v-for="file in repeatList" :key="file.name" class="file-item py-2">
          <div class="flex items-center gap-[12px]">
            <SvgIcon :name="getFileIcon(file.name)" size="24" />
            <div class="file-name">{{ file.name }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 按钮 -->
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
import { getFileIcon, t } from "@/utils";
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({
  repeatVisible: {
    type: Boolean,
    default: false,
  },
  repeatList: {
    type: Array as PropType<Record<string, string>[]>,
    default: () => [],
  },
});

const emit = defineEmits(["update:repeatVisible", "handleRepeatFile"]);
const activeIndex = ref(0);
const visible = computed(() => props.repeatVisible);

const handleClose = () => {
  emit("update:repeatVisible", false); // 关闭对话框时将 visible 设置为 false
};

const skipUpload = () => {
  activeIndex.value = 0;
  emit("handleRepeatFile", 3);
};

const coverUpload = () => {
  activeIndex.value = 1;
  emit("handleRepeatFile", 1);
};

const reserveUpload = () => {
  activeIndex.value = 2;
  emit("handleRepeatFile", 2);
};

// 定义操作列表
const operateList = [
  { name: t("skipFiles"), fn: skipUpload },
  { name: t("overwriteFiles"), fn: coverUpload },
  { name: t("keepAll"), fn: reserveUpload },
];
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
  font-family:
    Microsoft YaHei,
    Microsoft YaHei;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid #e3e6ec80;

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
