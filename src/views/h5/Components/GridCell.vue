<template>
  <template v-if="type === 'folder'">
    <div class="list-cell" :class="{ 'is-checked': canCheck }">
      <div class="cell">
        <span>
          <SvgIcon name="icon_folder" size="30" />
        </span>
        <div class="cell-title">{{ getName(item) }}</div>
      </div>
      <span v-if="!isLongPress" @click.stop="emit('menu', item)">
        <SvgIcon name="ic_h5_dots" size="24" />
      </span>
      <div v-else class="checkbox-content">
        <CustomCheckBox :checkBoxClass="isChecked" />
      </div>
    </div>
  </template>

  <template v-else>
    <div class="grid-cell" :class="{ 'is-checked': canCheck }">
      <div class="file-bg">
        <div class="file-content">
          <span class="file-icon">
            <SvgIcon
              :name="getIsFolder(item) ? 'icon_folder' : getFileIcon(getName(item))"
              size="90"
            />
          </span>
        </div>
      </div>
      <div class="file-info">
        <div class="file-title">
          <span class="file-name">{{ getName(item) }}</span>
          <span
            v-if="!isLongPress"
            class="file-icon"
            @click.stop="emit('menu', item)"
          >
            <SvgIcon name="ic_h5_dots" size="30" />
          </span>
          <div v-else class="checkbox-content">
            <CustomCheckBox :checkBoxClass="isChecked" />
          </div>
        </div>

        <div class="file-desc">
          <span v-if="getIsFolder(item)"> {{ t("folder") }} </span>
          <span v-else> {{ handleFileAndFolderName(getName(item)) }} </span>

          <span v-if="getSize(item)">
            ·
            {{ formatFileSize(getSize(item)) }}
          </span>
          <span v-if="getExpireTime(item)">
            ·
            {{ countdown(getExpireTime(item)!) }}
          </span>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import SvgIcon from "@/components/SvgIcon.vue";
import {
  countdown,
  formatFileSize,
  getFileIcon,
  handleFileAndFolderName,
  t,
} from "@/utils";
import { computed, type PropType } from "vue";
import type { ContentType } from "@/types/type";
import { getName, getSize, getIsFolder, getExpireTime } from "@/utils/typeUtils";
import { CustomCheckBox } from "@/components";

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
}>();

const props = defineProps({
  item: {
    type: Object as PropType<ContentType>,
    default: () => ({}),
  },
  type: {
    type: String,
    default: "file",
  },
  isLongPress: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
});

const canCheck = computed(() => {
  if (props.isDisabled) return false;
  return props.checked;
});

const isChecked = computed(() => {
  if (props.isDisabled) return "is-disabled";
  return props.checked ? "is-all" : "";
});
</script>

<style scoped lang="scss">
.list-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #e8ecf2;
  padding: 10px 6px;

  &.is-checked {
    border-radius: 4px;
    box-shadow: 0 0 0 1px #327edc;
  }

  .cell {
    display: flex;
    align-items: center;

    .cell-title {
      margin-left: 12px;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      font-weight: 500;
      color: #2d2d2d;
      max-width: 92px;
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
.grid-cell {
  width: 100%;
  display: flex;
  flex-direction: column;

  &.is-checked {
    border-radius: 4px;
    box-shadow: 0 0 0 1px #327edc;
  }

  .file-bg {
    height: 104px;
    padding: 8px 8px 0 8px;
    border: 1px solid #f2f4f7;
    border-bottom: transparent;
    border-radius: 4px 4px 0 0;
    position: relative;

    .file-content {
      width: 100%;
      height: 100%;
    }

    .file-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .file-info {
    border: 1px solid #f2f4f7;
    border-radius: 0 0 4px 4px;
    padding: 6px 12px 8px;
    user-select: none;

    .file-title {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .file-name {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: calc(var(--base--font--size--15) * var(--scale-factor));
        font-weight: 500;
        color: #2d2d2d;
      }
    }

    .file-desc {
      font-size: calc(var(--base--font--size--12) * var(--scale-factor));
      margin-bottom: 4px;
      color: #747683;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
