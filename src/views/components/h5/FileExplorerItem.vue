<template>
  <div v-long-press class="file-explorer-item-wrapper" @click="handleClick">
    <SvgIcon :name="computedIcon" :size="36" class="item-icon" />

    <div class="explorer-content">
      <div class="item-info">
        <div v-truncate-middle class="truncate-middle">
          <template v-if="isSharePage">
            <template v-if="!itemData.isDeleteAll">
              {{ itemData.name }}
              <span v-if="itemData.shareCount">
                {{ t("andItem", { count: itemData.shareCount }) }}
              </span>
            </template>
            <template v-else>
              <span v-if="itemData.shareCount">
                {{ t("fileDeletedCount", { count: itemData.shareCount }) }}
              </span>
              <span v-else>{{ t("fileDeleted") }}</span>
            </template>
          </template>

          <template v-else>
            {{ itemData.name }}
          </template>
        </div>

        <div v-if="hasMetaInfo" class="meta-info-text">
          <template v-if="isNormalPage">
            <span>{{ formatTime(itemData.operateTime) }}</span>
            <span v-if="itemData.size">
              · {{ formatFileSize(itemData.size) }}</span
            >
            <span> · {{ itemData.userName }}</span>
          </template>

          <template v-else-if="isRecyclePage">
            <span>{{ formatTime(itemData.deleteTime) }}</span>
            <span> · {{ countdown(itemData.expireTime) }}</span>
          </template>

          <div v-else-if="isSharePage" class="share-meta-flex">
            <span>{{ dayjs(itemData.shareTime).format(t("timeFormat")) }}</span>
            <span v-if="!itemData.isDeleteAll">
              {{
                getExpirationStatus(
                  itemData.status,
                  itemData.expireType,
                  itemData.expireTime,
                )
              }}
            </span>
            <span v-else>{{ t("fileDeleted") }}</span>
          </div>
        </div>
      </div>

      <div v-if="isLongPressing" class="checkbox-content">
        <CustomCheckBox :class="selected ? 'is-all' : ''" />
      </div>
      <SvgIcon
        v-else-if="!isSharePage"
        size="16"
        name="action-menu_dots"
        @click.stop="emit('menu', content)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CustomCheckBox } from "@/components";
import { FileTypeEnum } from "@/enum/baseEnum";
import { useLongPress } from "@/hooks/useLongPress";
import type { ContentType } from "@/types/type";
import { ExplorerPageType } from "@/views/fileExplorer";
import {
  t,
  countdown,
  formatFileSize,
  formatTime,
  getExpirationStatus,
} from "@/utils";
import dayjs from "dayjs";
import { useFileExplorerItemData } from "../../hooks/useFileExplorerItemData";

const props = defineProps<{
  content: ContentType;
  type: FileTypeEnum;
  pageType: ExplorerPageType;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: "menu", item: ContentType): void;
  (e: "open", item: ContentType): void;
  (e: "selection-change", item: ContentType): void;
}>();

const { isLongPressing } = useLongPress();
const {
  isSharePage,
  isRecyclePage,
  isNormalPage,
  isFolderItem,
  itemData,
  computedIcon,
  hasMetaInfo,
} = useFileExplorerItemData({
  content: () => props.content,
  type: () => props.type,
  pageType: () => props.pageType,
});

const handleClick = () => {
  if (isLongPressing.value) {
    emit("selection-change", props.content);
  } else if (isSharePage.value || isFolderItem.value) {
    emit("open", props.content);
  }
};
</script>

<style lang="scss" scoped>
.file-explorer-item-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #eaedf2;

  .item-icon {
    flex-shrink: 0;
  }

  .explorer-content {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    min-width: 0;

    .item-info {
      flex: 1;
      user-select: none;
      min-width: 0;

      .meta-info-text {
        font-weight: 400;
        font-size: 12px;
        line-height: 16px;
        color: #7b8290;

        .share-meta-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }
    }
  }
}

.truncate-middle {
  width: 100%;
  color: #252525;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.checkbox-content {
  margin-left: 16px;
  flex-shrink: 0;
}
</style>
