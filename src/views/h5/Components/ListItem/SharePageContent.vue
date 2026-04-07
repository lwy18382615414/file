<template>
  <div class="share-content-item">
    <SvgIcon
      :name="
        item.isDeleteAll
          ? 'icon_folder'
          : handleFileAndFolderName(item.shareFile) === t('folder')
            ? 'icon_folder'
            : getFileIcon(item.shareFile)
      "
      :size="30"
      style="margin-right: 8px"
    />
    <div
      class="share-content"
    >
      <div class="item-info">
        <div v-truncate-middle class="truncate-middle">
          <template v-if="!item.isDeleteAll">
            {{ item.shareFile }}
            <span v-if="item.shareCount && item.shareCount > 1">{{
              t("andItem", { count: item.shareCount })
            }}</span>
          </template>
          <template v-else>
            <span v-if="item.shareCount && item.shareCount > 1">{{
              t("fileDeletedCount", { count: item.shareCount })
            }}</span>
            <span v-else> {{ t("fileDeleted") }}</span>
          </template>
        </div>
        <div
          class="info"
        >
          <span>{{ dayjs(item.shareTime).format(t("timeFormat")) }} </span>
          <span v-if="!item.isDeleteAll">
            {{
              getExpirationStatus(
                item.status!,
                item.expireType!,
                item.expireTime!,
              )
            }}
          </span>
          <span v-else>{{ t("fileDeleted") }}</span>
        </div>
      </div>
      <div v-if="isLongPress" class="checkbox-content">
        <CustomCheckBox :checkBoxClass="isChecked" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import {
  getExpirationStatus,
  getFileIcon,
  handleFileAndFolderName,
  t,
} from "@/utils";
import type { ContentType } from "@/types/type";
import { CustomCheckBox } from "@/components";
import dayjs from "dayjs";

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

const isChecked = computed(() => {
  if (props.isDisabled) return "is-disabled";
  return props.checked ? "is-all" : "";
});
</script>

<style lang="scss" scoped>
.share-content-item {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .share-content {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    padding: 9px 0;
    border-bottom: 1px solid #F2F4F7FF;

    .item-info {
      flex: 1;
      user-select: none;

      .info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #747683;
        font-size: 12px;
        line-height: 22px;
      }
    }
  }
}

.truncate-middle {
  font-family: PingFang SC;
  max-width: calc(100vw - 100px);
  color: #2d2d2d;
  line-height: 22px;
  margin-bottom: 4px;
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
