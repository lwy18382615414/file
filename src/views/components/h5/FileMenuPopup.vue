<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    @click-overlay="close"
    @update:show="handleShowChange"
    @closed="handleClosed"
  >
    <div v-if="item" class="file-popup">
      <div class="header">
        <span class="flex-shrink-0">
          <SvgIcon
            :name="
              getIsFolder(item) ? 'file-folder' : getFileIcon(getName(item))
            "
            size="48"
          />
        </span>
        <div class="file-content">
          <div class="file-name">
            {{ getName(item) }}
          </div>
          <div class="file-actions">
            <div v-if="getUserName(item)">
              {{ t("creator", { name: getUserName(item) }) }}
            </div>
            <div v-if="!getIsFolder(item)" class="line"></div>
            <div v-if="!getIsFolder(item)">
              {{ t("size") }}: {{ formatFileSize(getSize(item)) }}
            </div>
          </div>
        </div>
        <span class="close-btn" @click="close">
          <SvgIcon name="ic_retract" size="24" />
        </span>
      </div>

      <div class="actions">
        <div
          v-for="action in actions"
          :key="action.key"
          class="action-item"
          @click="selectAction(action.key)"
        >
          <div class="item">
            <div class="icon">
              <SvgIcon :name="'action-' + action.icon" :size="30" />
            </div>
            <div class="action">{{ action.label }}</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="cancel" @click="close">{{ t("cancel") }}</div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { SvgIcon } from "@/components";
import type { ContentType } from "@/types/type";
import { formatFileSize, getFileIcon, t } from "@/utils";
import { getIsFolder, getName, getSize, getUserName } from "@/utils/typeUtils";

export type FileMenuAction = {
  key: string;
  label: string;
  icon: string;
};

defineProps<{
  show: boolean;
  item: ContentType | null;
  actions: FileMenuAction[];
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "select", key: string): void;
  (e: "close"): void;
}>();

const close = () => {
  emit("update:show", false);
};

const handleShowChange = (value: boolean) => {
  emit("update:show", value);
};

const handleClosed = () => {
  emit("close");
};

const selectAction = (key: string) => {
  emit("select", key);
  close();
};
</script>

<style scoped lang="scss">
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
    line-height: 22px;
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
