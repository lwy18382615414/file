<template>
  <van-popup v-model:show="isVisible" position="bottom" round>
    <div class="file-popup">
      <!-- 文件信息展示 -->
      <div class="header">
        <span class="flex-shrink-0">
          <SvgIcon
            :name="getIsFolder(file) ? 'icon_folder' : getFileIcon(getName(file))"
            size="48"
          />
        </span>
        <div class="file-content">
          <div class="file-name">
            {{ getName(file) }}
          </div>
          <div class="file-actions">
            <div v-if="getUserName(file)">{{ t("creator", { name: getUserName(file) }) }}</div>
            <div v-if="!getIsFolder(file)" class="line"></div>
            <div v-if="!getIsFolder(file)">
              {{ t("size") }}: {{ formatFileSize(getSize(file)) }}
            </div>
          </div>
        </div>
        <span class="close-btn" @click="emit('close')">
          <SvgIcon name="ic_retract" size="24" />
        </span>
      </div>
      <template v-if="!isRecycle">
        <!-- 操作按钮展示 -->
        <div class="actions">
          <div
            v-for="action in actions"
            :key="action.name"
            @click="handleAction(action.name)"
            class="action-item"
          >
            <div class="item">
              <div class="icon">
                <SvgIcon :name="action.icon" :size="30" />
              </div>

              <div class="action">{{ action.name }}</div>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="cancel" @click="emit('close')">{{ t("cancel") }}</div>
      </template>
      <div v-else class="recycle-actions">
        <div
          v-for="action in actions"
          :key="action.name"
          @click="handleAction(action.name)"
          class="action-item"
        >
          <span>
            <SvgIcon :name="action.icon" size="30" />
          </span>
          <div class="action">{{ action.name }}</div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { formatFileSize, getFileIcon } from "@/utils";
import type { ContentType } from "@/types/type";
import SvgIcon from "@/components/SvgIcon.vue";
import { t } from "@/utils";
import { getName, getSize, getIsFolder, getUserName } from "@/utils/typeUtils";
import { useRoute } from "vue-router";

const route = useRoute()
const props = defineProps<{
  visible: boolean;
  file: ContentType;
  actions: Array<{
    name: string;
    icon: string;
  }>;
  isRecycle?: boolean;
}>();


const emit = defineEmits(["update:visible", "action", "close"]);

const isVisible = ref(false);

watch(
  () => props.visible,
  (value) => {
    isVisible.value = value;
  },
  { immediate: true },
);

watch(() => route.path, () => {
  emit("update:visible", false);
})

const handleAction = (action: string) => {
  emit("action", action);
  emit("update:visible", false);
};
</script>

<style lang="scss" scoped>
.file-popup {
  width: 100%;
  max-width: 600px;
  background-color: #fff;
}
.header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #f7f8fa;

  .close-btn {
    position: absolute;
    right: 16px;
  }
}

.file-content {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .file-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100vw - 124px);
  }

  .line {
    height: 10px;
    width: 1px;
    overflow: hidden;
    background-color: #dee0e1;
    margin: 0 8px;
  }

  .file-actions {
    display: flex;
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    color: #999;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 12px;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));

  .action-item {
    font-size: 12px;
    width: 76px;
    height: 72px;
    position: relative;
    background-color: #ebeff6ff;
    border-radius: 12px;
    white-space: nowrap;
    .item {
      width: 90%;
      white-space: wrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }
    }

    .action {
      text-align: center;
      color: #2d2d2d;
    }
  }
}

.recycle-actions {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: #ebeff6ff;
    border-radius: 8px;
  }
}

.divider {
  height: 8px;
  width: 100%;
  background-color: #f7f8fa;
  padding: 0 16px;
}

.cancel {
  color: #2d2d2d;
  text-align: center;
  padding: 14px 0;
}
</style>
