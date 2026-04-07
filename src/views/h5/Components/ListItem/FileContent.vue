<template>
  <div class="file-content-item-wrapper">
    <SvgIcon
      :name="getFileIcon(getName(item))"
      :size="iconSize"
      style="margin-right: 10px"
    />
    <div
      class="file-content-item"
    >
      <div class="item-info">
        <div v-truncate-middle :key="name" class="truncate-middle">
          {{ name }}
        </div>
        <div class="meta-info-text">
          <span>{{ getSize(item) ? formatFileSize(getSize(item)) : "" }}</span>
          ·
          <span>{{ getUserName(item) }}</span>
          ·
          <span>{{ formattedTime }}</span>
        </div>
      </div>
      <SvgIcon
        v-if="!isLongPress"
        size="24"
        name="ic_h5_dots"
        @click.stop="emit('menu', item)"
      />
      <div v-else class="checkbox-content">
        <CustomCheckBox :checkBoxClass="isChecked" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { formatFileSize, formatTime, getFileIcon } from "@/utils";
import type { ContentType } from "@/types/type";
import { CustomCheckBox } from "@/components";
import { getName, getSize, getUserName } from "@/utils/typeUtils";

const props = defineProps({
  item: {
    type: Object as PropType<ContentType>,
    required: true,
  },
  iconSize: {
    type: Number,
    default: 30,
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

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
}>();

const formattedTime = computed(() => formatTime(props.item.operateTime));

const isChecked = computed(() => {
  if (props.isDisabled) return "is-disabled";
  return props.checked ? "is-all" : "";
});

const name = computed(() => {
  return getName(props.item)
})
</script>

<style lang="scss" scoped>
.file-content-item-wrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .file-content-item {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #F2F4F7FF;
    padding: 9px 0;

    .item-info {
      flex: 1;
      user-select: none;
    }
  }
}



.truncate-middle {
  font-family: PingFang SC;
  max-width: calc(100vw - 100px);
  color: #2d2d2d;
  line-height: 22px;
  margin-top: 4px;
}

.meta-info-text {
  font-size: 12px;
  line-height: 22px;
  color: #747683;
}

.checkbox-content {
  margin-left: 16px;
}
</style>
