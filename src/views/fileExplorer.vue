<template>
  <div class="main-container">
    <FileListMobile
      v-if="isMobileApp"
      :page-type="context.pageType"
      :query="query"
      :loading="loading"
      :list="list"
      :has-more="hasMore"
      :columns="pageConfig.columns"
      :should-load-mobile-folders-first="shouldLoadMobileFoldersFirst"
      @load-more="loadMore"
      @refresh="refreshList"
    />
    <FileListPc
      v-else
      :page-type="context.pageType"
      :query="query"
      :loading="loading"
      :list="list"
      :total="total"
      :has-more="hasMore"
      :columns="pageConfig.columns"
      :allow-upload="allowUpload"
      :current-folder-permission-type="currentFolderPermissionType"
      :current-folder-permission-count="currentFolderPermissionCount"
      @load-more="loadMore"
      @refresh="refreshList"
      @search="searchList"
    />
  </div>
</template>

<script lang="ts" setup>
import FileListMobile from "./components/h5/FileListMobile.vue";
import FileListPc from "./components/pc/FileListPc.vue";
import { useFileData } from "./useFileData";

const {
  isMobileApp,
  query,
  context,
  pageConfig,
  loading,
  list,
  total,
  hasMore,
  shouldLoadMobileFoldersFirst,
  currentFolderPermissionType,
  currentFolderPermissionCount,
  allowUpload,
  loadMore,
  refreshList,
  searchList,
} = useFileData();
</script>

<style lang="scss" scoped>
.main-container {
  height: 100%;
  box-sizing: border-box;
}
</style>
