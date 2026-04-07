<template>
  <div class="header-container">
    <div class="content">
      <template v-if="isCommonHeader">
        <div class="header-wrapper flex items-center justify-between">
          <div :class="{ 'is-common': isCommonHeader }" class="header-title">
            {{ title }}
          </div>
          <div v-if="isShareSpace" class="flex items-center">
            <div
              class="flex items-center mr-[4px] rounded-[2px] hover:bg-[#e5e6e8]"
              @click="updateSettingVisible(true)"
            >
              <SvgIcon name="ic_group" size="22" />
              <span class="middle-dot"></span>
              <span class="pr-[4px] text-[#2d2d2d]">
                {{ permissionCount }}
              </span>
            </div>
          </div>
        </div>
        <div class="operations">
          <div class="operation-left flex overflow-hidden">
            <div class="route-icon flex-shrink-0">
              <div class="hover:bg-[#e5e6e8]" @click="back">
                <SvgIcon
                  :name="canGoBack ? 'ic_right_bold' : 'ic_left'"
                  :style="{
                    transform: `rotate(${canGoBack ? 180 : 0}deg)`,
                  }"
                />
              </div>
              <div class="hover:bg-[#e5e6e8]" @click="forward">
                <SvgIcon
                  :name="canGoForward ? 'ic_right_bold' : 'ic_right'"
                />
              </div>
            </div>
            <div class="divider flex-shrink-0"></div>
            <div class="route-name flex-1 min-w-0 truncate"><Breadcrumb /></div>
          </div>
          <div class="operation-right flex items-center">
            <!-- 新建  -->
            <div
              v-if="!isSearchResultPage"
              :class="{ disabled: !allowUpload }"
              class="btn create-btn"
              @click="createFolder"
            >
              {{ t("new") }}
              <span>
                <SvgIcon
                  :color="allowUpload ? '#2d2d2d' : '#c4c4c4'"
                  name="ic_add"
                  size="24"
                />
              </span>
            </div>
            <!-- 上传 -->
            <div
              v-if="!isSearchResultPage"
              :class="{ disabled: !allowUpload }"
              class="btn upload-btn"
              @click="uploadFile"
            >
              {{ t("upload") }}
              <span>
                <SvgIcon
                  :color="allowUpload ? '#327edc' : '#c4c4c4'"
                  name="ic_upload"
                  size="24"
                />
              </span>
            </div>
            <!-- 下载 -->
            <div
              class="btn share-btn"
              :class="{ disabled: shareList.length === 0 }"
              @click="multiDownload"
            >
              {{ t("download") }}
              <span class="ml-[6px]">
                <SvgIcon
                  name="ic_download"
                  size="24"
                  :color="shareList.length === 0 ? '#c4c4c4' : '#2d2d2d'"
                />
              </span>
            </div>
            <!-- 分享  -->
            <div
              class="btn share-btn"
              :class="{ disabled: shareList.length === 0 }"
            >
              {{ t("share") }}
              <span class="ml-[6px]">
                <SvgIcon
                  name="ic_share"
                  size="24"
                  :color="shareList.length === 0 ? '#c4c4c4' : '#2d2d2d'"
                />
              </span>
              <div v-if="shareList.length > 0" class="share-btn-tooltip">
                <div @click="shareFile">{{ t("shareToFriend") }}</div>
                <div @click="copyLink">{{ t("copyLink") }}</div>
              </div>
            </div>
            <!-- 删除  -->
            <div
              v-if="isSearchResultPage"
              class="btn share-btn"
              :class="{ disabled: shareList.length === 0 }"
              @click="multiDelete"
            >
              {{ t("delete") }}
              <span class="ml-[6px]">
                <SvgIcon
                  name="ic_delete"
                  size="24"
                  :color="shareList.length === 0 ? '#c4c4c4' : '#EE3F3F'"
                />
              </span>
            </div>
            <div class="view-mode">
              <div
                v-for="(item, index) in VIEW_MODE_LIST"
                :key="index"
                class="view-mode-item"
                :class="{ active: item.type === currentViewMode }"
                @click="handleChangeViewMode(item.type)"
              >
                <SvgIcon :name="item.icon" size="20" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div :class="{ 'is-custom': !isCommonHeader }" class="header-title">
          {{ t(route.meta.title as string) }}
        </div>
        <template v-if="route.path === '/my-share'">
          <div class="header-actions">
            <div class="action-left">
              <div class="share-date">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="-"
                  :start-placeholder="t('startTime')"
                  :end-placeholder="t('endTime')"
                  :editable="false"
                />
              </div>

              <div class="search-box">
                <el-input
                  :model-value="state.ShareFile"
                  @update:model-value="updateQueryText"
                  :placeholder="t('inputDocName')"
                  class="search-input"
                  clearable
                  style="width: 180px"
                >
                  <template #prefix>
                    <SvgIcon name="ic_search" size="24" />
                  </template>
                </el-input>
              </div>

              <el-button type="primary" @click="onSearch">{{
                t("search")
              }}</el-button>
            </div>
            <div class="action-right">
              <el-button
                :disabled="shareList.length === 0"
                type="default"
                @click="cancelShare"
              >
                {{ t("cancelShare") }}
                <SvgIcon
                  :name="
                    shareList.length === 0
                      ? 'ic_cancel-share-dis'
                      : 'ic_cancel-share'
                  "
                  size="24"
                />
              </el-button>
            </div>
          </div>
        </template>
        <template v-else-if="route.path === '/recycle-bin'">
          <div class="header-actions">
            <div class="search-box">
              <el-input
                :model-value="state.name"
                @update:model-value="updateName"
                :placeholder="t('inputDocName')"
                class="search-input"
                clearable
              >
                <template #prefix>
                  <SvgIcon name="ic_search" size="24" />
                </template>
              </el-input>
            </div>
            <div class="action-buttons">
              <el-button
                :disabled="shareList.length === 0"
                type="success"
                color="#327edc"
                class="action-btn"
                @click="handleRecoveryOrDelete('recovery')"
              >
                {{ t("restore") }}
              </el-button>
              <el-button
                :disabled="shareList.length === 0"
                type="danger"
                class="action-btn"
                @click="handleRecoveryOrDelete('delete')"
              >
                {{ t("deletePermanently") }}
              </el-button>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { useRoute, useRouter } from "vue-router";
import { t } from "@/utils";
import { storeToRefs } from "pinia";
import {
  useRouteStackStore,
  useSetting,
  useShareFileStore,
  useViewMode,
} from "@/stores";
import { VIEW_MODE_LIST } from "./constance";
import Breadcrumb from "@/views/pc/Layout/breadcrumb.vue";
import { useFileBelong } from "@/hooks/useFileBelong";
import { useShareSpace } from "@/hooks/useShareSpace";
import { debounce } from "lodash-es";

const props = defineProps({
  state: {
    type: Object,
    default: () => ({
      StartDate: "",
      EndDate: "",
      ShareFile: "",
      name: "",
    }),
  },
  allowUpload: {
    type: Boolean as PropType<boolean>,
    default: () => true,
  },
  currentViewMode: {
    type: String as PropType<string>,
    default: () => "",
  },
});

const emit = defineEmits([
  "update:state",
  "showUploadModal",
  "onCreateFolder",
  "onCancelShare",
  "onSearch",
  "recoveryOrDelete",
  "onMultiDownload",
  "onShareToFriend",
  "onMultiDelete"
]);

const route = useRoute();
const router = useRouter();
const { fileBelong, permissionCount } = useFileBelong();

const { canGoBack, canGoForward } = storeToRefs(useRouteStackStore());
const { back, forward } = useRouteStackStore();

const { setViewMode } = useViewMode();

const { shareList } = storeToRefs(useShareFileStore());
const {
  setShowLinkDialog,
  setShareList,
  setShowChooseCount,
} = useShareFileStore();

const { activeIndex, activeSubIndex } = useShareSpace();

const { updateSettingVisible } = useSetting();

const isCommonHeader = computed(() => {
  return !!(route.meta && route.meta.isCommonHeader);
});

const title = computed(() => {
  const contentName = route.query.contentName as string
  if (contentName) {
    if (contentName.startsWith('route')) return t(contentName)
    return contentName
  }
  return t(route.meta.title as string);
});

const isShareSpace = computed(
  () =>
    route.path.includes("/share-space") || fileBelong.value === "shareSpace",
);

const dateRange = computed({
  get() {
    if (props.state.StartDate && props.state.EndDate) {
      return [new Date(props.state.StartDate), new Date(props.state.EndDate)];
    }
    return null;
  },
  set(newValue) {
    if (newValue && newValue.length === 2) {
      const startDate = newValue[0];
      const endDate = newValue[1];

      emit("update:state", {
        ...props.state,
        StartDate: startDate,
        EndDate: endDate,
      });
    } else {
      emit("update:state", {
        ...props.state,
        StartDate: "",
        EndDate: "",
      });
    }
  },
});

const isSearchResultPage = computed(() => {
  return route.path === "/search-result"
});

// 更新查询文本
const updateQueryText = (value: string) => {
  emit("update:state", { ...props.state, ShareFile: value });
};

const updateName = (value: string) => {
  emit("update:state", { ...props.state, name: value });
};

const handleChangeViewMode = (type: string) => {
  setShareList([]);
  setShowChooseCount(false);
  setViewMode({
    viewMode: type,
    currentPage: route.path as string,
  });
};

const uploadFile = async () => {
  if (!props.allowUpload) return;
  const isRecentView = route.path === "/recent-view";
  if (isRecentView) {
    await router.push({ name: "MySpace" });
    activeIndex.value = 1;
    activeSubIndex.value = null;
  }
  emit("showUploadModal", true, "file");
};

const createFolder = debounce(async () => {
  if (!props.allowUpload) return;
  const isRecentView = route.path === "/recent-view";
  if (isRecentView) {
    sessionStorage.setItem("needCreateFolder", "true");
    await router.push({ name: "MySpace" });
    activeIndex.value = 1;
    activeSubIndex.value = null;
  } else {
    emit("onCreateFolder");
  }
}, 300);

const cancelShare = () => {
  emit("onCancelShare");
};

const onSearch = () => {
  emit("onSearch");
};

const handleRecoveryOrDelete = (actionType: string) => {
  emit("recoveryOrDelete", actionType);
};

const shareFile = () => {
  if (shareList.value.length === 0) return;
  emit('onShareToFriend')
};

const multiDownload = () => {
  emit('onMultiDownload');
}

const multiDelete = () => {
  emit('onMultiDelete')
}

const copyLink = () => {
  setShowLinkDialog(true);
};

defineExpose({
  title,
});
</script>

<style scoped lang="scss">
.header-container {
  width: 100%;
  background-color: #ffffff;
  padding: 16px 16px 0;

  .content {
    border-bottom: 1px solid #f2f4f7;
    padding-bottom: 8px;
  }

  .header-title {
    font-family:
      PingFangSC-Medium,
      PingFang SC;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-weight: bold;
    color: #2d2d2d;
    line-height: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-common {
      max-width: 70%;
    }
  }

  .operations {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .operation-left {
      max-width: calc(100vw - 480px);

      .route-icon {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .divider {
        width: 1px;
        height: 16px;
        background-color: #d2d3d6;
        margin: 0 10px;
      }
      .route-name {
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));
        color: #989a9e;
      }
    }

    .operation-right {
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      .btn {
        cursor: context-menu;
        padding: 4px 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        background-color: #f2f4f7;

        &.upload-btn {
          color: #327edc;
          margin-right: 10px;
        }

        &.create-btn {
          color: #333;
          margin-right: 10px;
        }

        &.share-btn {
          padding: 4px 8px;
          color: #2d2d2d;
          margin-right: 20px;
          position: relative;

          .share-btn-tooltip {
            position: absolute;
            top: 100%;
            right: 50%;
            transform: translateX(50%);
            z-index: 9999;
            display: none;
            padding: 4px;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            line-height: 1.5;
            color: #2d2d2d;

            div {
              padding: 4px 8px;
              border-radius: 4px;
              white-space: nowrap;
              cursor: pointer;

              &:hover {
                background-color: #edeeef;
              }
            }
          }

          &:hover {
            .share-btn-tooltip {
              display: block;
            }
          }
        }

        &.disabled {
          background-color: #f3f4f8;
          color: #c4c4c4;
        }
      }

      .view-mode {
        display: flex;
        align-items: center;
        border-radius: 4px;
        background-color: #f2f4f7;
        padding: 3px;

        .view-mode-item {
          padding: 3px 14px;
          border-radius: 2px;

          &.active {
            background-color: #fff;
          }
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .action-left {
      display: flex;
      align-items: center;

      .share-date,
      .search-box {
        display: flex;
        align-items: center;
        margin-right: 24px;
      }
    }

    .search-box {
      .search-input {
        width: 280px;

        :deep(.el-input__wrapper) {
          border-radius: 6px;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;

      .action-btn {
        border-radius: 6px;
        padding: 8px 16px;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      }
    }
  }
}
</style>
