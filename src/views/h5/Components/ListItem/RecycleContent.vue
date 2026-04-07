<template>
  <div class="recycle-content-item">
    <SvgIcon
      :name="getIsFolder(item) ? 'icon_folder' : getFileIcon(getName(item))"
      :size="iconSize"
      style="margin-right: 10px"
    />
    <div
      class="recycle-content"
    >
      <div class="info-item">
        <div v-truncate-middle class="truncate-middle">
          {{ getName(item) }}
        </div>
        <div class="meta-info-text">
          <span>{{ formattedTime }}</span>
          ·
          <span>{{ remainingTime }}</span>
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
import { countdown, formatTime, getFileIcon } from "@/utils";
import type { ContentType } from "@/types/type";
import { CustomCheckBox } from "@/components";
import { getIsFolder, getName } from "@/utils/typeUtils";

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

const formattedTime = computed(() => formatTime(props.item.deleteTime));
const remainingTime = computed(() => countdown(props.item.expireTime ?? 0));

const isChecked = computed(() => {
  if (props.isDisabled) return "is-disabled";
  return props.checked ? "is-all" : "";
});
</script>

<style lang="scss" scoped>
.recycle-content-item {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .recycle-content {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #F2F4F7FF;
    padding: 9px 0;

    .info-item {
      flex: 1;
      user-select: none;
      margin-bottom: 4px;
    }
  }
}


.truncate-middle {
  font-family: PingFang SC;
  max-width: calc(100vw - 100px);
  color: #2d2d2d;
  line-height: 22px;
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
