<template>
  <div v-if="isPcClient" class="container-pc">
    <div class="pc-content">
      <div class="header">{{ $t("weeklyReport.fileReportTitle") }}</div>
      <div class="summary-box">
        <div class="date-range">{{ startTime }} - {{ endTime }}</div>
        <div class="stat-details">
          <i18n-t keypath="weeklyReport.summary" tag="span">
            <template #create>
              <span class="highlight">{{ createCount }}</span>
            </template>
            <template #upload>
              <span class="highlight">{{ uploadCount }}</span>
            </template>
            <template #delete>
              <span class="highlight red">{{ deleteCount }}</span>
            </template>
          </i18n-t>
        </div>
      </div>

      <div class="table-area">
        <common-table
          height="calc(100vh - 200px)"
          :tableColumns="tableColumns"
          :tableData="tableData"
        >
          <template #operateTime="{ row }">
            <span>{{ formatTime(row.operateTime) }}</span>
          </template>
          <template #operationType="{ row }">
            <span>{{ getOperationLabel(row.operationType) }}</span>
          </template>
          <template #contentName="{ row }">
            <div class="file-wrapper">
              <div class="file-icon">
                <SvgIcon
                  :name="
                    row.isFolder ? 'file-folder' : getFileIcon(row.contentName)
                  "
                  size="28"
                />
              </div>
              <div class="file-title">{{ row.contentName }}</div>
            </div>
          </template>
          <template #append>
            <div ref="sentinelRef" class="scroll-sentinel">
              <span v-if="loading">正在加载中...</span>
              <span
                v-else-if="!noMore"
                class="scroll-sentinel__placeholder"
              ></span>
              <span v-else class="no-more">没有更多文件了</span>
            </div>
          </template>
        </common-table>
      </div>
    </div>

    <div class="footer-tip">
      {{ $t("weeklyReport.footer") }}
    </div>
  </div>
  <div v-else-if="isMobileApp" class="container-mobile">
    <div class="mobile-header-date">{{ startTime }} - {{ endTime }}</div>

    <div class="stats-wrapper">
      <div class="stats-card">
        <div class="stat-item">
          <div class="num">{{ createCount }}</div>
          <div class="label">{{ $t("weeklyReport.createRecord") }}</div>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <div class="num">{{ uploadCount }}</div>
          <div class="label">{{ $t("weeklyReport.uploadRecord") }}</div>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <div class="num red">{{ deleteCount }}</div>
          <div class="label">{{ $t("weeklyReport.deleteRecord") }}</div>
        </div>
      </div>
    </div>

    <div
      class="mobile-list"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="disabled"
      :infinite-scroll-distance="20"
    >
      <div v-for="(item, index) in tableData" :key="index" class="list-card">
        <div class="card-icon">
          <SvgIcon
            :name="
              item.isFolder ? 'file-folder' : getFileIcon(item.contentName)
            "
            :size="40"
          ></SvgIcon>
        </div>

        <div class="card-content">
          <div v-truncate-middle class="card-title">
            {{ getOperationLabel(item.operationType) }} - {{ item.contentName }}
          </div>
          <div class="card-meta">
            <span class="user">{{ item.userName }}</span>
            <span class="time">{{ formatTime(item.operateTime) }}</span>
          </div>
        </div>
      </div>
      <div v-if="!tableData.length && !loading" class="empty-state">
        <div class="empty-image">
          <img :alt="t('noData')" :src="emptyPng" />
        </div>
        <div class="empty-text">{{ t("noData") }}</div>
      </div>
      <div class="loading-state">
        <div v-if="loading" class="loading"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { CommonTable } from "@/components";
import {
  getAssetUrl,
  getFileIcon,
  parseQueryDate,
  setAppTitle,
  t,
} from "@/utils";
import { OperationTypeKeyMap } from "@/utils/contance";
import { useRoute } from "vue-router";
import type { WeeklyReportType } from "@/api/type";
import { getWeeklyReportApi } from "@/api/common";
import dayjs from "dayjs";
import { useClientEnv } from "@/hooks/useClientEnv";

const route = useRoute();

const startTime = parseQueryDate(route.query.startDate);
const endTime = parseQueryDate(route.query.endDate);
const createCount = route.query.createCount;
const uploadCount = route.query.uploadCount;
const deleteCount = route.query.deleteCount;

const isError = ref(false);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const tableData = ref<WeeklyReportType[]>([]);
const sentinelRef = ref<HTMLElement | null>(null);
const noMore = ref(false);
let observer: IntersectionObserver | null = null;

const { isMobileApp, isPcClient } = useClientEnv();

const tableColumns = computed(() => [
  {
    label: t("weeklyReport.time"),
    prop: "operateTime",
    width: "180",
    slots: "operateTime",
  },
  {
    label: t("weeklyReport.operator"),
    prop: "userName",
    width: "120",
  },
  {
    label: t("weeklyReport.type"),
    prop: "operationType",
    width: "120",
    slots: "operationType",
  },
  {
    label: t("weeklyReport.fileName"),
    prop: "contentName",
    minWidth: "250",
    slots: "contentName",
    showOverflowTooltip: true,
  },
]);

const disabled = computed(() => loading.value || noMore.value || isError.value);

const fetchData = async (page: number) => {
  try {
    const res = await getWeeklyReportApi({
      PageIndex: page,
      PageSize: 100,
      StartTime: startTime,
      EndTime: endTime,
    });

    if (res.code !== 1) {
      isError.value = true;
      return {
        list: [],
        total: 0,
      };
    }

    return {
      list: res.data.data,
      total: res.data.count,
    };
  } catch (e) {
    isError.value = true;
    return {
      list: [],
      total: 0,
    };
  }
};

const loadMore = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  isError.value = false;

  try {
    const page = currentPage.value;
    const res = await fetchData(page);

    if (page === 1) {
      tableData.value = res.list;
    } else {
      tableData.value.push(...res.list);
    }

    total.value = res.total;
    noMore.value =
      tableData.value.length >= total.value || res.list.length < 100;

    if (!noMore.value) {
      currentPage.value = page + 1;
    }
  } catch (error) {
    console.error("加载失败", error);
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

const setupObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0];
      if (target?.isIntersecting && !loading.value && !noMore.value) {
        loadMore();
      }
    },
    {
      rootMargin: "0px 0px 50px 0px",
      threshold: 0.01,
    },
  );

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
};

const cleanupObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

onBeforeUnmount(() => {
  cleanupObserver();
});

onMounted(() => {
  if (isPcClient.value) {
    loadMore();
    setupObserver();
  } else if (isMobileApp.value) {
    setAppTitle(t("weeklyReport.fileReportTitle"));
  }
});

const getOperationLabel = (type: number) => {
  const key = OperationTypeKeyMap[type];
  return key ? t(key) : "";
};

const formatTime = (time: string) => {
  return dayjs(time).format("YYYY-MM-DD hh:mm:ss");
};

const emptyPng = getAssetUrl("empty_rectcle@3x.png");
</script>

<style lang="scss" scoped>
.container-pc {
  height: 100vh;
  width: 100%;
  overflow: hidden;

  .pc-content {
    height: calc(100% - 50px);
    padding: 0 16px;
  }

  .header {
    height: 40px;
    line-height: 40px;
    font-weight: 700;
    margin-bottom: 10px;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  }

  .summary-box {
    background-color: #f2f4f8;
    padding: 20px;
    border-radius: 4px;
    text-align: center;
    margin-bottom: 20px;
    color: var(--text-primary-color);

    .date-range {
      margin-bottom: 8px;
    }

    .stat-details {
      .highlight {
        font-weight: bold;
        margin: 0 2px;

        &.red {
          color: #f56c6c;
        }
      }
    }
  }

  .table-area {
    height: calc(100% - 150px);

    :deep(.el-table__inner-wrapper) {
      &::before {
        display: none;
      }
    }

    :deep(.el-table th.el-table__cell) {
      background-color: #f2f4f8;
      color: var(--text-secondary-color);
      font-weight: 500;
    }

    .file-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;

      .file-icon {
        flex-shrink: 0;
      }

      .file-title {
        color: var(--text-primary-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .footer-tip {
    border-top: 1px solid var(--card-border-color);
    height: 40px;
    line-height: 40px;
    text-align: center;
    color: var(--text-weak-color);
    margin-top: 10px;
  }
}

.container-mobile {
  background-color: var(--content-bg-color);
  height: 100vh;
  overflow: hidden;
}

.mobile-header-date {
  font-size: 14px;
  color: var(--text-primary-color);
  font-weight: 500;
  padding: 16px;
  background: var(--btn-default-bg);
}

.stats-wrapper {
  background: var(--btn-default-bg);
  padding: 0 16px 16px;
}

.stats-card {
  border-radius: 8px;
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--card-border-color);

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .num {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;

      &.red {
        color: #f56c6c;
      }
    }

    .label {
      text-align: center;
      font-size: 11px;
      color: var(--text-weak-color);
    }
  }

  .divider {
    width: 1px;
    height: 30px;
    background-color: #ebeef5;
  }
}

.mobile-list {
  margin-top: 12px;
  padding: 0 16px 20px;
  height: calc(100vh - 150px);
  overflow-y: scroll;
}

.list-card {
  background: var(--btn-default-bg);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--btn-primary-text-color);
    font-size: 20px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 40px;

    .card-title {
      font-size: 14px;
      color: #333;
      line-height: 1.4;
      margin-bottom: 8px;
      font-weight: 500;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666666;

      .user {
        /* 名字 */
      }

      .time {
        /* 时间 */
      }
    }
  }
}

.scroll-sentinel {
  visibility: hidden;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-weak-color);
  font-size: 13px;

  .scroll-sentinel__placeholder {
    display: block;
    width: 100%;
    height: 1px;
  }

  .no-more {
    color: var(--text-weak-color);
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;

  div {
    margin: 16px 0;
  }

  .loading {
    border: 2px solid hsla(213, 71%, 53%, 0.2);
    border-top-color: var(--theme-color);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-weak-color);
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
</style>
