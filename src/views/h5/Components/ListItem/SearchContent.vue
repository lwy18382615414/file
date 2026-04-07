<template>
  <div class="search-content-item flex items-center px-4">
    <SvgIcon
      :name="getIsFolder(item) ? 'icon_folder' : getFileIcon(getName(item))"
      :size="iconSize"
      style="margin-right: 10px"
    />
    <div
      class="search-item"
    >
      <div class="item-info">
        <div v-truncate-middle class="truncate-middle">
          {{ getName(item) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from "vue";
import { getFileIcon } from "@/utils";
import type { ContentType } from "@/types/type";
import { getIsFolder, getName } from "@/utils/typeUtils";

defineProps({
  item: {
    type: Object as PropType<ContentType>,
    required: true,
  },
  iconSize: {
    type: Number,
    default: 30,
  },
});

defineEmits<{
  (e: "menu", item: ContentType): void;
}>();
</script>

<style lang="scss" scoped>
.search-content-item {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .search-item {
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


:deep(.van-swipe-cell__right) {
  .van-button {
    width: 80px;
    height: 100%;
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
