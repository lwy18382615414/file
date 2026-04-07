<template>
  <div class="folder-content-item-wrapper">
    <SvgIcon name="icon_folder" :size="iconSize" style="margin-right: 10px" />
    <div
      class="folder-item"
    >
      <div class="item-info">
        <div v-truncate-middle :key="getName(item)" class="truncate-middle">
          {{ getName(item) }}
        </div>
      </div>
      <template v-if="!isSearch">
        <SvgIcon
          v-if="!isLongPress"
          size="24"
          name="ic_h5_dots"
          @click.stop="emit('menu', item)"
        />
        <div v-else class="checkbox-content">
          <CustomCheckBox :checkBoxClass="isChecked" />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import type { ContentType } from "@/types/type";
import { CustomCheckBox } from "@/components";
import { getName } from "@/utils/typeUtils";

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
  isSearch: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
}>();

const isChecked = computed(() => {
  if (props.isDisabled) return "is-disabled";
  return props.checked ? "is-all" : "";
});
</script>

<style lang="scss" scoped>
.folder-content-item-wrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .folder-item {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #F2F4F7FF;
    padding: 18px 0;

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
}

.checkbox-content {
  margin-left: 16px;
}
</style>
