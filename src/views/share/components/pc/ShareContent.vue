<template>
  <div
    :class="{ 'share-content-container--wide': isInputPsw }"
    class="share-content-container"
  >
    <div
      v-if="isLoading"
      v-loading="isLoading"
      :element-loading-text="t('loading')"
      class="share-loading"
    />

    <template v-else>
      <div v-if="isExpired" class="share-status share-status--expired">
        <img alt="invalid-sharing" src="@/assets/images/invalid-sharing.png" />
        <div class="share-status__text">{{ errorMsg || t("linkExpired") }}</div>
      </div>

      <template v-else>
        <div class="share-title">
          <span>{{ t("cloudDriveSharing") }}</span>
        </div>

        <div v-if="!isInputPsw" class="share-password-card">
          <div class="share-password-card__avatar">
            <AvatarBox :avatar="shareBaseInfo.avatarId" :size="52" />
          </div>

          <div class="share-password-card__name">
            {{ shareBaseInfo.sharePersonName
            }}{{ t("sharedWithYou", { name: "" }) }}
          </div>

          <el-input
            v-model.trim="psw"
            type="password"
            show-password
            :placeholder="t('inputPasswordCaseInsensitive')"
            @keyup.enter="handleExtractFile"
          />

          <el-button
            :disabled="!psw.trim()"
            type="primary"
            @click="handleExtractFile"
          >
            {{ t("extractFile") }}
          </el-button>

          <div class="share-password-card__expire">
            {{ shareBaseInfo.expireTimeText }}
          </div>
        </div>

        <div v-else class="share-info">
          <div class="file-wrapper">
            <SvgIcon
              :name="
                shareList[0].isFolder
                  ? 'file-folder'
                  : getFileIcon(shareList[0].name)
              "
              style="flex-shrink: 0"
              size="48"
            />
            <div class="info">
              <div class="file-name">
                <span>
                  {{ t("fileName", { name: shareList[0].name }) }}
                </span>
                <span v-if="shareList.length > 1">
                  {{ t("andItem", { count: shareList.length }) }}
                </span>
              </div>
              <div class="share-meta">
                <span class="share-person">
                  <SvgIcon name="ic_share-person" size="18" />
                  <span>{{ shareBaseInfo.sharePersonName }}</span>
                </span>
                <div class="divider"></div>
                <span class="share-time">
                  {{
                    dayjs(shareBaseInfo.shareTime).format(t("timeFormat"))
                  }}</span
                >
                <div class="divider"></div>
                <span class="expire-time">
                  {{ shareBaseInfo.expireTimeText }}</span
                >
              </div>
            </div>
            <a v-if="isBrowser" :href="schemeUrl" class="app-btn">
              {{ t("viewInClient") }}
            </a>
          </div>

          <div class="share-file-list-wrapper">
            <div
              v-if="!isTopFolder"
              ref="breadcrumbWrapperRef"
              class="breadcrumb"
            >
              <el-breadcrumb :separator-icon="ArrowRight">
                <el-breadcrumb-item
                  v-for="(item, index) in breadcrumbList"
                  :key="`${item.contentId}-${item.name}`"
                  :class="[
                    'breadcrumb-item',
                    { 'is-current': index === breadcrumbList.length - 1 },
                  ]"
                  @click="handleBreadcrumbClick(item)"
                >
                  {{ item.name }}
                </el-breadcrumb-item>
              </el-breadcrumb>
            </div>

            <CommonTable
              ref="commonTableRef"
              :table-columns="tableColumns"
              :table-data="fileList"
              class="share-table"
              height="100%"
              @selection-change="handleSelectionChange"
              @row-dblclick="handleTableRowDblclick"
            >
              <template #headerText="{ column }">
                <template v-if="column.property === 'name'">
                  <div class="table-header-select" @click="toggleSelectAll">
                    <span class="selected-count">
                      {{ t("selectedItems", { count: selectedFiles.length }) }}
                    </span>
                  </div>
                </template>
                <span v-else>{{ t(column.label) }}</span>
              </template>

              <template #name="{ row }">
                <div class="file-name-cell" @click="handleNameCellClick(row)">
                  <SvgIcon
                    :name="row.isFolder ? 'file-folder' : getFileIcon(row.name)"
                    size="30"
                  />
                  <span class="file-name-text">{{ row.name }}</span>
                </div>
              </template>

              <template #size="{ row }">
                <span class="table-muted">{{
                  row.isFolder ? "-" : formatFileSize(row.size)
                }}</span>
              </template>

              <template #updateAt="{ row }">
                <span class="table-muted">{{
                  dayjs(row.updateAt).format(t("timeFormat"))
                }}</span>
              </template>
            </CommonTable>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ArrowRight } from "@element-plus/icons-vue";
import { CommonTable } from "@/components";
import { useShareData } from "../../hooks/useShareData";
import AvatarBox from "@/components/customSelectPerson/AvatarBox.vue";
import dayjs from "dayjs";
import { formatFileSize, getFileIcon } from "@/utils";
import schemeConfig from "@/config";
import { useEnv } from "../../hooks/useEnv";
import type { ShareContentType } from "../../types";
import type { TableColumn } from "@/types/type";

const { t } = useI18n();
const { isBrowser } = useEnv();
const breadcrumbWrapperRef = ref<HTMLDivElement>();
const commonTableRef = ref();

const {
  shareKey,
  isLoading,
  isExpired,
  errorMsg,
  isInputPsw,
  psw,
  shareBaseInfo,
  shareList,
  fileList,
  selectedFiles,
  breadcrumbList,
  isTopFolder,
  selectAll,
  chooseFile,
  handleItemClick,
  handleBreadcrumbClick,
  handleExtractFile,
} = useShareData();

const tableColumns: TableColumn[] = [
  {
    type: "selection",
    width: 48,
  },
  {
    label: "columnOpt.docName",
    prop: "name",
    slots: "name",
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.size",
    prop: "size",
    width: 120,
    slots: "size",
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.modifiedTime",
    prop: "updateAt",
    width: 180,
    slots: "updateAt",
    headerSlot: "headerText",
  },
];

const getTableRef = () => commonTableRef.value?.getTableRef?.();

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
  () => breadcrumbList.value,
  () => {
    scrollToCurrentBreadcrumb();
  },
  { deep: true, flush: "post" },
);

watch(
  () => fileList.value,
  async (rows) => {
    await nextTick();
    const tableRef = getTableRef();
    if (!tableRef) return;
    tableRef.clearSelection();
    rows.forEach((row: ShareContentType) => {
      if (
        selectedFiles.value.some((file) => file.contentId === row.contentId)
      ) {
        tableRef.toggleRowSelection(row, true);
      }
    });
  },
  { deep: true, flush: "post" },
);

const handleSelectionChange = (rows: ShareContentType[]) => {
  selectedFiles.value = rows;
};

const toggleSelectAll = () => {
  selectAll();
};

const handleTableRowDblclick = async (row: ShareContentType) => {
  if (row.isFolder) {
    await handleNameCellClick(row);
  }
};

const handleNameCellClick = async (row: ShareContentType) => {
  if (row.isFolder) {
    const currentBreadcrumb =
      breadcrumbList.value[breadcrumbList.value.length - 1];
    if (currentBreadcrumb?.contentId === row.contentId) return;
    await handleItemClick(row);
    return;
  }

  chooseFile(row);
};

watch(
  () => isTopFolder.value,
  async (top) => {
    if (top) {
      await nextTick();
      scrollToCurrentBreadcrumb();
    }
  },
);

const schemeUrl = computed(() => {
  const baseUrl = `${location.origin}${location.pathname}`;
  let hash = `#/share-page?shareKey=${shareKey.value}`;
  if (psw.value) {
    hash += `&psw=${psw.value}`;
  }
  const fullUrl = `${baseUrl}${hash}`;
  const encodedFullUrl = encodeURIComponent(fullUrl);
  return `${schemeConfig.cloudCallAppKey}://cloudShare?url=${encodedFullUrl}`;
});
</script>

<style lang="scss" scoped>
.share-content-container {
  width: 100%;
  height: 100%;
  min-height: 388px;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.share-loading {
  position: absolute;
  inset: 0;
}

.share-title {
  line-height: 1.5;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  font-weight: bold;
  color: #2d2d2d;
  padding: 10px 16px;
}

.share-password-card {
  width: 360px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__avatar {
    margin-bottom: 16px;
  }

  &__name {
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 24px;
    color: #131314;
    text-align: center;
  }

  :deep(.el-input) {
    width: 100%;
    height: 48px;
    margin-bottom: 12px;
  }

  :deep(.el-button) {
    width: 100%;
    height: 40px;
  }

  &__expire {
    margin-top: 12px;
    font-size: 12px;
    line-height: 20px;
    color: #747683;
    text-align: center;
  }
}

.share-info {
  padding: 3px 16px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .file-wrapper {
    position: relative;
    height: 80px;
    min-height: 80px;
    padding: 0 22px;
    background: #f2f4f8;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-bottom: 16px;

    .info {
      min-width: 0;
      flex: 1;
    }

    .file-name {
      margin-left: 8px;
      font-weight: 400;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      color: #2d2d2d;
      max-width: calc(100% - 8px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 24px;
    }

    .share-meta {
      margin-top: 4px;
      display: flex;
      align-items: center;
      margin-left: 16px;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: #747683;
      line-height: 18px;

      .share-person {
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: Microsoft YaHei;
        color: #747683;
      }

      .divider {
        width: 1px;
        height: 12px;
        background-color: #e0e4eb;
        margin: 0 12px;
      }
    }

    .app-btn {
      position: absolute;
      right: 22px;
      width: 100px;
      padding: 7px 0;
      border-radius: 4px;
      background: #ffffff;
      box-sizing: border-box;
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);
      font-family: PingFang;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      font-weight: bold;
      text-align: center;
      cursor: pointer;
    }
  }
}

.share-file-list-wrapper {
  flex: 1;
  min-height: 0;
  max-height: 520px;
  border: 1px solid #f2f4f7;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.breadcrumb {
  padding: 16px 16px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;
  border-bottom: 1px solid #f2f4f7;
  background: #fff;

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
    cursor: pointer;
    color: #747683;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  }

  :deep(.el-breadcrumb__separator) {
    white-space: nowrap;
    color: #b7bdc8;
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

.share-table {
  height: 100%;

  :deep(.table-container),
  :deep(.el-table),
  :deep(.el-table__inner-wrapper) {
    height: 100%;
  }

  :deep(.el-table) {
    border: none !important;
    --el-table-border-color: transparent;
    --el-table-border: none;
    --el-table-row-hover-bg-color: #f7f9fc;

    &::before,
    &::after {
      display: none !important;
    }

    .el-table__inner-wrapper::before,
    .el-table__inner-wrapper::after,
    .el-table__fixed-right::before,
    .el-table__fixed::before,
    .el-table__border-left-patch,
    colgroup col[name="gutter"] {
      display: none !important;
    }

    .el-table__header-wrapper,
    .el-table__body-wrapper,
    .el-table__footer-wrapper,
    th.el-table__cell,
    td.el-table__cell,
    .el-table__cell {
      border: none !important;
    }

    .el-table__header,
    .el-table__body,
    .el-table__footer {
      border-collapse: separate;
      border-spacing: 0;
    }

    .el-table__fixed,
    .el-table__fixed-right {
      box-shadow: none !important;
    }

    .el-table__header-wrapper th.el-table__cell {
      height: 44px;
      padding: 0;
      background: #fff;

      .cell {
        color: #747683;
        font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        font-weight: 400;
      }
    }

    .el-table__body td.el-table__cell {
      height: 56px;
      padding: 0;
    }

    .el-checkbox {
      --el-checkbox-input-width: 16px;
      --el-checkbox-input-height: 16px;
    }

    .el-checkbox__inner {
      border-color: #747683;
      border-radius: 2px;
    }

    .el-checkbox__input.is-checked .el-checkbox__inner,
    .el-checkbox__input.is-indeterminate .el-checkbox__inner {
      background: #5665bb;
      border-color: #5665bb;
    }
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }
}

.table-header-select {
  display: inline-flex;
  align-items: center;
  color: #747683;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.selected-count {
  color: #747683;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #2d2d2d;
  cursor: pointer;
}

.file-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  line-height: 20px;
}

.table-muted {
  color: #747683;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

:deep(.share-table .el-table__empty-block) {
  min-height: 240px;
}

:deep(.share-table .el-table__empty-text) {
  line-height: normal;
}

.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #747683;
}

.item-select__title {
  margin-top: 8px;
}
</style>
