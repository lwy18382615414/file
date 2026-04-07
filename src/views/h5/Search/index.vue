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
        @click="handleMenu(item)"
      >
        <SwipeCellItem :item="item" :is-search="true" />
      </div>

      <div v-if="files && files.length" class="view-all">
        <span>{{ t('totalItems', { count: total }) }}</span>
        <span style="color: #327EDC; margin-left: 8px" @click="handleClickViewAll">{{ t('viewAll') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { searchGlobalApi } from "@/api/common";
import SwipeCellItem from "@/views/h5/Components/ListItem/index.vue";
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
import { getContentId, getIsFolder, getIsShare, getName, getParentId } from "@/utils/typeUtils";
import { useFileBelong } from "@/hooks/useFileBelong";

const { fileBelong } = useFileBelong();
const searchRef = ref<SearchInstance>();
const router = useRouter();
const inputText = ref("");
const files = ref<ContentType[]>([]);
const loading = ref(false);
const total = ref(0);

const loadData = async () => {
  if (loading.value ) return

  loading.value = true;

  try {
    const res = await searchGlobalApi({
      keyWord: inputText.value,
      pageIndex: 1,
      pageSize: 5
    });
    if (res.code === 1) {
      files.value = res.data.data
      total.value = res.data.count
    } else {
      files.value = []
    }
  } catch (error) {
    console.log(error);
    files.value = []
  } finally {
    loading.value = false;
  }
};

const handleSearch = debounce(() => {
  loadData()
}, 500)

const onCancel = () => {
  router.back();
};

const handleMenu = async (item: ContentType) => {
  const contentId = getContentId(item) ?? 0
  const parentId = getParentId(item) ?? 0
  const name = getName(item)

  fileBelong.value = getIsShare(item) ? "shareSpace" : "mySpace"

  if (parentId === 0) {
    await router.push('/my-space')
    return
  }

  await router.push({
    name: 'Folder',
    params: {
      contentId: getIsFolder(item) ? contentId : parentId,
    },
    query: {
      contentName: name
    }
  });
};

const handleClickViewAll = () => {
  router.push({
    path: '/search-result',
    query: {
      key: inputText.value,
      total: total.value
    }
  })
}

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
  color: #747683;
  font-size: 16px;
}

:deep(.van-field__control) {
  &::placeholder {
    color: #747683;
    font-size: 15px;
  }
}

.search-container {
  height: 100vh;
  overflow: hidden;
}

.search-result {
  height: calc(59px * 5 + 44px);
  overflow-y: auto;
}

.view-all {
  text-align: center;
  margin-top: 21px;
  font-size: 12px;
  line-height: 18px;
}
</style>
