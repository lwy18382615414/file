<template>
  <div
    v-if="isLongPress"
    :style="{ top: getFromApp() ? '0' : '40px' }"
    class="select-bar"
  >
    <div>
      {{ t("selectedItems", { count: shareList.length }) }}
    </div>
    <div class="select-bar-right" >
      <span style="margin-right: 16px" @click="handleAllSelect">
        {{ checkBoxClass === "is-all" ? t("unselectAll") : t("selectAll") }}
      </span>
<!--      <CustomCheckBox :class="checkBoxClass" />-->
      <div @click="cancelSelect">{{ t('done') }}</div>
    </div>
  </div>
  <van-list
    v-model:loading="loading"
    :finished="!hasMore"
    :immediate-check="false"
    @load="handleLoadMore"
  >
    <template v-if="loading && listData.length === 0">
      <FileListSkeleton :count="15" />
    </template>
    <template v-else-if="listData.length > 0">
      <div :class="viewClass">
        <template
          v-for="{
            title,
            list,
            showCondition,
            type,
            class: sectionClass,
          } in sections"
          :key="title"
        >
          <p v-if="showCondition" :class="sectionClass" class="file-type">
            {{ title }}
          </p>
          <div v-if="list.length > 0" :class="listClass">
            <div
              v-for="item in list"
              :key="getContentId(item)"
              @click.stop="handleOpen(item)"
            >
              <component
                :is="currentViewMode === 'list' ? SwipeCellItem : GridCell"
                v-long-press="handleLongPress"
                :checked="isInShareList(item)"
                :isDisabled="
                  !hasPermission(getPermissionType(item) ?? 0, Permission.View)
                "
                :isLongPress="isLongPress"
                :isRecycle="isRecycle"
                :isSharePage="isSharePage"
                :item="item"
                :type="type"
                @menu="handleMenu"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
    <template v-else>
      <div class="empty-state">
        <div class="empty-image">
          <img :alt="t('noData')" :src="emptyPng" />
        </div>
        <div class="empty-text">{{ t("noData") }}</div>
      </div>
    </template>
  </van-list>
  <div v-if="isLongPress" class="long-press-content"></div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { ContentType } from "@/types/type";
import SwipeCellItem from "@/views/h5/Components/ListItem/index.vue";
import GridCell from "@/views/h5/Components/GridCell.vue";
import { useShareFileStore, useViewMode } from "@/stores";
import { useRoute } from "vue-router";
import FileListSkeleton from "@/views/h5/Components/FileListSkeleton.vue";
import { storeToRefs } from "pinia";
import { getFromApp } from "@/utils/auth";
import { getAssetUrl, hasPermission, t } from "@/utils";
import { Permission } from "@/enum/permission";
import { getPermissionType, getIsFolder, getContentId } from "@/utils/typeUtils";

interface Props {
  listData: ContentType[];
  loading: boolean;
  hasMore: boolean;
  viewMode?: string;
  isRecycle?: boolean;
  isSharePage?: boolean;
}
const { isLongPress, shareList } = storeToRefs(useShareFileStore());
const {
  setLongPress,
  isInShareList,
  isAllSelected,
  addShareFile,
  removeShareFile,
  handleToggleAll,
} = useShareFileStore();

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:loading", value: boolean): void;
  (e: "loadMore"): void;
  (e: "refresh"): void;
  (e: "menu", item: ContentType): void;
  (e: "open", item: ContentType): void;
}>();

const route = useRoute();

const emptyPng = getAssetUrl("empty_rectcle@3x.png");

const currentViewMode = computed(() => {
  return (
    useViewMode().viewMode.find((item) => item.currentPage === route.path)
      ?.viewMode || "list"
  );
});

const viewClass = computed(() => {
  return props.viewMode === "list" ? "view-list" : "view-grid";
});

const listClass = computed(() => {
  return currentViewMode.value === "grid" ? "grid-list" : "list";
});

const sections = computed(() => [
  {
    title: t("folder"),
    list: folderList.value,
    showCondition:
      folderList.value.length > 0 && !route.path.includes("/share-space"),
    class: "mt-[11px]",
    type: "folder",
  },
  {
    title: t("file"),
    list: fileList.value,
    showCondition:
      fileList.value.length > 0 &&
      !route.path.includes("/recent-view") &&
      !props.isSharePage,
    class: "mt-[11px]",
    type: "file",
  },
]);

// 使用计算属性实现双向绑定
const loading = computed({
  get: () => props.loading,
  set: (value) => emit("update:loading", value),
});

const folderList = computed(() =>
  props.listData.filter((item) => getIsFolder(item)),
);

const fileList = computed(() =>
  props.listData.filter((item) => !getIsFolder(item)),
);

const handleLoadMore = () => {
  emit("loadMore");
};

const handleMenu = (item: ContentType) => {
  emit("menu", item);
};

const checkBoxClass = computed(() => {
  return isAllSelected(props.listData);
});

const handleAllSelect = () => {
  const permissionList = props.listData.filter((item) =>
    hasPermission(getPermissionType(item) ?? 0, Permission.View),
  );
  if (permissionList.length === 0) return;
  handleToggleAll(permissionList);
};

const handleOpen = (item: ContentType) => {
  if (props.isSharePage && !isLongPress.value) {
    emit("open", item);
    return;
  }
  if (getIsFolder(item) && !isLongPress.value) {
    emit("open", item);
  } else if (isLongPress.value) {
    if (!hasPermission(getPermissionType(item) ?? 0, Permission.View)) return;
    if (isInShareList(item)) {
      removeShareFile(item);
    } else {
      addShareFile(item);
    }
  }
};

const handleLongPress = () => {
  if (route.fullPath.includes("recycle")) return;
  setLongPress(true);
};

const cancelSelect = () => {
  setLongPress(false);
  shareList.value = [];
}
</script>
<style lang="scss" scoped>
:deep(.van-list__loading) {
  display: none;
}

.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  grid-gap: 10px;
  padding: 16px 16px 0;
  justify-content: space-between;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}
.empty-image {
  width: 250px;
  height: 250px;
  margin-bottom: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.empty-text {
  font-size: 14px;
}

.select-bar {
  position: sticky;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #f2f4f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  user-select: none;

  &-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: #327EDC;
  }
}

.file-type {
  font-weight: 400;
  font-size: 16px;
  color: #979797;
  line-height: 20px;
  padding: 7px 16px;
}

.load-more-trigger {
  padding: 16px;
  text-align: center;
  color: #979797;
}

.long-press-content {
  height: 80px;
}
</style>
