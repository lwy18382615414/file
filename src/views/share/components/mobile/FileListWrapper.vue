<template>
  <div class="share-file-list">
    <div class="checkbox-wrapper">
      <div>{{ t("selectedItems", { count: selectedFiles.length }) }}</div>
      <div class="selector-btn" @click="$emit('select-all')">
        <span class="selector-text">
          {{ isAllSelected ? t("unselectAll") : t("selectAll") }}
        </span>
        <CustomCheckBox :check-box-class="checkAllClass" />
      </div>
    </div>

    <div v-if="!isTopFolder" ref="breadcrumbWrapperRef" class="breadcrumb">
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbList"
          :key="`${item.contentId}-${item.name}`"
          :class="[
            'breadcrumb-item',
            { 'is-current': index === breadcrumbList.length - 1 },
          ]"
          @click="$emit('breadcrumb-click', item)"
        >
          {{ item.name }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div
      v-if="fileList.length > 0"
      class="list"
      :class="{ 'with-breadcrumb': !isTopFolder }"
    >
      <div
        v-for="item in fileList"
        :key="item.contentId"
        class="item"
        @click="$emit('item-click', item)"
      >
        <div class="item-left">
          <div class="item-icon">
            <SvgIcon
              :name="item.isFolder ? 'file-folder' : getFileIcon(item.name)"
              size="30"
            />
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-time-size">
              <span class="time-text">
                {{ dayjs(item.updateAt).format(t("timeFormat")) }}
              </span>
              <span>{{ item.size ? formatFileSize(item.size) : "-" }}</span>
            </div>
          </div>
        </div>
        <div class="item-right" @click.stop>
          <CustomCheckBox
            :check-box-class="itemCheckClass(item) ? 'is-all' : ''"
            @click="$emit('choose-file', item)"
          />
        </div>
      </div>
    </div>

    <div v-else class="empty-wrapper">
      <SvgIcon name="empty-folder" size="106" />
      <div class="item-select__title">{{ t("noFiles") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import { ArrowRight } from "@element-plus/icons-vue";
import { CustomCheckBox, SvgIcon } from "@/components";
import { formatFileSize, getFileIcon } from "@/utils";
import type { ShareContentType } from "@/views/share/types";

const props = defineProps<{
  fileList: ShareContentType[];
  selectedFiles: ShareContentType[];
  breadcrumbList: ShareContentType[];
  isTopFolder: boolean;
}>();

defineEmits<{
  (e: "select-all"): void;
  (e: "breadcrumb-click", item: ShareContentType): void;
  (e: "item-click", item: ShareContentType): void;
  (e: "choose-file", item: ShareContentType): void;
}>();

const { t } = useI18n();
const breadcrumbWrapperRef = ref<HTMLDivElement>();

const scrollToCurrentBreadcrumb = async () => {
  await nextTick();
  const breadcrumbWrapper = breadcrumbWrapperRef.value;
  if (!breadcrumbWrapper) return;

  breadcrumbWrapper.scrollTo({
    left: breadcrumbWrapper.scrollWidth,
    behavior: "smooth",
  });
};

watch(
  () => props.breadcrumbList,
  () => {
    scrollToCurrentBreadcrumb();
  },
  { deep: true, flush: "post" },
);

const isAllSelected = computed(
  () =>
    props.fileList.length > 0 &&
    props.selectedFiles.length === props.fileList.length,
);

const checkAllClass = computed(() => {
  if (isAllSelected.value) return "is-all";
  if (props.selectedFiles.length === 0) return "";
  return "is-partial";
});

const itemCheckClass = (item: ShareContentType) => {
  return props.selectedFiles.some((file) => file.contentId === item.contentId);
};
</script>

<style lang="scss" scoped>
.share-file-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.checkbox-wrapper {
  color: #747683;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;

  .selector-btn {
    display: flex;
    align-items: center;
  }

  .selector-text {
    margin-right: 4px;
  }
}

.breadcrumb {
  padding: 0 16px 16px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.el-breadcrumb) {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  :deep(.el-breadcrumb__inner) {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  :deep(.el-breadcrumb__separator) {
    white-space: nowrap;
  }

  :deep(.el-breadcrumb__item) {
    flex-shrink: 0;
  }
}

.breadcrumb-item {
  flex-shrink: 0;

  &.is-current {
    :deep(.el-breadcrumb__inner) {
      color: #5665bb;
      font-weight: 500;
    }
  }
}

.list {
  flex: 1;
  overflow-y: auto;

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #f2f4f7;

    .item-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .item-info {
        padding: 13px 0;
        width: calc(100vw - 32px - 30px - 10px - 32px);

        .item-name {
          line-height: 1.4;
          font-size: 16px;
          color: #131314;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .item-time-size {
          font-size: 12px;
          color: #747683;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      }
    }
  }
}

.time-text {
  margin-right: 4px;
}

.empty-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #747683;
}
</style>
