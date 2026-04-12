<template>
  <div class="search-container">
    <van-search
      ref="searchRef"
      v-model="inputText"
      show-action
      :placeholder="t('search')"
      :action-text="t('cancel')"
      @update:model-value="handleSearch"
      @cancel="onCancel"
    >
      <template #left-icon>
        <SvgIcon name="ic_search" size="22" />
      </template>
    </van-search>

    <div v-loading="loading" class="search-result">
      <div
        v-for="item in files"
        :key="getContentId(item)"
        class="item"
        @click="handleItemClick(item)"
      >
        <FileExplorerItem
          :content="item"
          :type="getItemType(item)"
          :page-type="ExplorerPageType.SEARCH"
          :selected="false"
          @open="handleMenu"
          @menu="() => {}"
        />
      </div>

      <div v-if="files && files.length" class="view-all">
        <span>{{ t("totalItems", { count: total }) }}</span>
        <span
          style="color: var(--theme-color); margin-left: 8px"
          @click="handleClickViewAll"
          >{{ t("viewAll") }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getParentFolderContentIdApi, searchGlobalApi } from "@/api/common";
import FileExplorerItem from "@/views/components/h5/FileExplorerItem.vue";
import type { ContentType } from "@/types/type";
import {
  hideAppButton,
  hideAppButton2,
  setAppTitle,
  showNavLeftCloseBtn,
  t,
} from "@/utils";
import type { SearchInstance } from "vant";
import { debounce } from "lodash-es";
import {
  getContentId,
  getIsFolder,
  getIsShare,
  getName,
  getParentId,
} from "@/utils/typeUtils";
import { FileTypeEnum } from "@/enum/baseEnum";
import { buildFolderRoute, ExplorerPageType } from "@/views/fileExplorer";

const searchRef = ref<SearchInstance>();
const router = useRouter();
const inputText = ref("");
const files = ref<ContentType[]>([]);
const loading = ref(false);
const total = ref(0);

const loadData = async () => {
  if (loading.value) return;

  loading.value = true;

  try {
    const res = await searchGlobalApi({
      keyWord: inputText.value,
      pageIndex: 1,
      pageSize: 5,
    });
    if (res.code === 1) {
      files.value = res.data.data;
      total.value = res.data.count;
    } else {
      files.value = [];
    }
  } catch (error) {
    console.log(error);
    files.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = debounce(() => {
  console.log("search for", inputText.value);
  if (!inputText.value) {
    files.value = [];
    total.value = 0;
    return;
  }
  loadData();
}, 500);

const onCancel = () => {
  router.back();
};

const getItemType = (item: ContentType) => {
  return getIsFolder(item) ? FileTypeEnum.Folder : FileTypeEnum.File;
};

const handleItemClick = async (item: ContentType) => {
  if (getIsFolder(item)) return;
  await handleMenu(item);
};

const handleMenu = async (item: ContentType) => {
  const contentId = getContentId(item) ?? 0;
  const parentId = getParentId(item) ?? 0;
  const isShare = getIsShare(item) ?? false;
  const pageType = isShare ? ExplorerPageType.SHARED : ExplorerPageType.MY;
  const targetFolderId = getIsFolder(item) ? contentId : parentId;

  if (targetFolderId === 0) {
    await router.push(`/${pageType}`);
    return;
  }

  const res = await getParentFolderContentIdApi(targetFolderId);
  const pathIds = (res.data.path || "").split("/").filter(Boolean);
  const rawPathNames = (res.data.name || "").split("/").filter(Boolean);
  const pathNames = rawPathNames.slice(1);
  const targetName = pathNames[pathNames.length - 1] || getName(item);
  const currentNames = pathNames.slice(0, -1);

  const target = buildFolderRoute(
    pageType,
    pathIds,
    { contentId: targetFolderId, contentName: targetName },
    currentNames,
  );

  console.log("navigate to folder", {
    target,
    contentId,
    targetFolderId,
    pageType,
  });

  await router.push(target);
};

const handleClickViewAll = () => {
  router.push({
    path: "/search-result",
    query: {
      key: inputText.value,
      total: total.value,
    },
  });
};

onMounted(() => {
  hideAppButton();
  hideAppButton2();
  setAppTitle(t("search"));
  showNavLeftCloseBtn(false, "cloud");
  nextTick(() => {
    searchRef.value?.focus();
  });
});
</script>

<style scoped lang="scss">
:deep(.van-search__action) {
  color: var(--text-secondary-color);
  font-size: 16px;
}

:deep(.van-field__control) {
  &::placeholder {
    color: var(--text-secondary-color);
    font-size: 15px;
  }
}

.search-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-result {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.item {
  background: #fff;
}

.view-all {
  text-align: center;
  margin-top: 21px;
  font-size: 12px;
  line-height: 18px;
}
</style>
