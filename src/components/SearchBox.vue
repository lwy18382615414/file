<template>
  <div class="search-box-container" ref="searchBoxRef">
    <el-input
      v-model.trim="searchState.keywords"
      :placeholder="t('search')"
      clearable
      @input="debounceSearch"
      :maxlength="20"
      @click.stop="handleInputClick"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
    >
      <template #prefix>
        <SvgIcon name="ic_search" size="24" />
      </template>
    </el-input>

    <transition name="fade-slide">
      <div v-show="searchPopoverVisible" class="search-popover">
        <div class="search-result">
          <div class="title">
            {{ t("file") }}
            <span v-if="searchResult && searchResult.length">
              ({{ searchState.total }})
            </span>
          </div>
          <div class="result-container" ref="scrollContainerRef">
            <!-- 初始加载状态 -->
            <div
              v-if="searchState.loading && searchState.pageIndex === 1"
              class="loading-container"
            >
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t("loading") }}...</div>
            </div>

            <!-- 搜索结果列表 -->
            <template v-else>
              <!-- 有结果时显示列表 -->
              <template v-if="searchResult.length !== 0">
                <div
                  v-for="item in searchResult"
                  :key="item.contentId"
                  class="search-item"
                  @click="handleSearchItemClick(item)"
                >
                  <div class="search-item-title">
                    <span class="mr-1.5">
                      <SvgIcon
                        :name="
                          getIsFolder(item)
                            ? 'file-folder'
                            : getFileIcon(getName(item))
                        "
                        size="22"
                      />
                    </span>
                    <el-text truncated>{{ getName(item) }}</el-text>
                  </div>
                </div>

                <div class="view-all-btn" @click="handleClickViewAll">
                  {{ t("viewAll") }}
                </div>
              </template>

              <!-- 无结果时显示提示 -->
              <div v-else-if="searchState.keywords.trim()" class="empty-result">
                {{ t("noResults") }}
              </div>

              <!-- 无搜索关键词时显示提示 -->
              <div v-else class="empty-result">
                {{ t("searchPlaceholder") }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { debounce } from "lodash-es";
import { getFileIcon } from "@/utils";
import { searchGlobalApi } from "@/api/common";
import { getParentFolderContentIdApi } from "@/api/common";
import { t } from "@/utils";
import type { CloudSearchResultItem } from "@/types/type";
import {
  getName,
  getIsFolder,
  getIsShare,
  getParentId,
  getContentId,
} from "@/utils/typeUtils";
import { buildFolderRoute, ExplorerPageType } from "@/views/fileExplorer";

const router = useRouter();

const searchBoxRef = ref<HTMLElement | null>(null);
const searchPopoverVisible = ref(false);

const searchState = reactive({
  keywords: "",
  pageIndex: 1,
  pageSize: 5,
  loading: false,
  total: 0,
});

const searchResult = ref<CloudSearchResultItem[]>([]);

const handleSearchInput = async (value: string) => {
  // 重置搜索状态
  searchState.pageIndex = 1;
  searchResult.value = [];

  if (!value.trim()) {
    searchResult.value = [];
    return;
  }

  await loadSearchResults();
};

const loadSearchResults = async () => {
  if (!searchState.keywords.trim() || searchState.loading) {
    return;
  }

  searchState.loading = true;
  try {
    const res = await searchGlobalApi({
      keyWord: searchState.keywords,
      pageIndex: searchState.pageIndex,
      pageSize: searchState.pageSize,
    });
    if (res.code === 1) {
      const newData = res.data.data || [];

      if (searchState.pageIndex === 1) {
        searchResult.value = newData;
      } else {
        searchResult.value = [...searchResult.value, ...newData];
      }

      searchState.total = res.data.count;
      searchState.pageIndex++;
    }
  } catch (error) {
    console.error("Load search results error:", error);
  } finally {
    searchState.loading = false;
  }
};

const handleInputClick = () => {
  searchPopoverVisible.value = true;
};

const handleInputFocus = () => {
  searchPopoverVisible.value = true;
};

const handleInputBlur = () => {
  setTimeout(() => {
    if (!searchBoxRef.value?.contains(document.activeElement)) {
      searchPopoverVisible.value = false;
    }
  }, 200);
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (searchBoxRef.value && !searchBoxRef.value.contains(target)) {
    searchPopoverVisible.value = false;
  }
};

const debounceSearch = debounce(handleSearchInput, 500);

const handleSearchItemClick = async (item: CloudSearchResultItem) => {
  searchPopoverVisible.value = false;

  const contentId = getContentId(item) ?? 0;
  const parentId = getParentId(item) ?? 0;
  const name = getName(item);
  const isShare = getIsShare(item) ?? false;
  const pageType = isShare ? ExplorerPageType.SHARED : ExplorerPageType.MY;
  const targetFolderId = getIsFolder(item) ? contentId : parentId;

  const res = await getParentFolderContentIdApi(targetFolderId);
  const pathIds = (res.data.path || "").split("/").filter(Boolean);
  const rawPathNames = (res.data.name || "").split("/").filter(Boolean);
  const pathNames = rawPathNames.slice(1);
  const targetName = pathNames[pathNames.length - 1] || name;
  const currentNames = pathNames.slice(0, -1);

  const target = buildFolderRoute(
    pageType,
    pathIds,
    { contentId: targetFolderId, contentName: targetName },
    currentNames,
  );

  await router.push(target);
};

const handleClickViewAll = () => {
  searchPopoverVisible.value = false;
  router.push({
    path: "/search-result",
    query: {
      key: searchState.keywords,
      total: searchState.total,
    },
  });
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.search-box-container {
  position: relative;
  width: 100%;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.search-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 282px;
  height: 265px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 3px 6px 0 rgba(95, 95, 95, 0.4);
  z-index: 999999;
  cursor: default;
}

.search-result {
  width: 100%;
  height: 265px;
  display: flex;
  flex-direction: column;

  .title {
    padding: 12px 16px 6px;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    color: #666;
    border-bottom: 1px solid #eee;
  }
}

.result-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.search-item-title {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  line-height: 1.5;
  cursor: pointer;

  &:hover {
    background-color: #f2f4f8;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  color: #666;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.no-more {
  text-align: center;
  padding: 12px 0;
  color: #999;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-input__wrapper) {
  background-color: #f1f5f9;
  box-shadow: none;

  &.is-focus {
    background-color: #fff;
    box-shadow: 0 0 0 1px #327edc inset;
  }

  .el-input__prefix-inner > :last-child {
    margin-right: 6px;
  }
}

.view-all-btn {
  text-align: center;
  padding: 10px 0;
  color: #327edc;
  font-size: calc(var(--base--font--size--12) * var(--scale-factor));
  border-top: 1px solid #eee;
  cursor: pointer;

  position: absolute;
  bottom: 0;
  width: 100%;
}
</style>
