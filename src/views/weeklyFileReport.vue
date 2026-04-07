<template>
  <div v-if="currentSource === 'PC'" class="container-pc">
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
          ref="commonTableRef"
          height="calc(100vh - 200px)"
          :tableColumns="tableColumns"
          :tableData="tableData"
          @scroll="handleScroll"
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
                <SvgIcon :name="row.isFolder ? 'icon_folder' : getFileIcon(row.contentName)" size="28"/>
              </div>
              <div class="file-title">{{ row.contentName }}</div>
            </div>
          </template>
        </common-table>
      </div>
    </div>

    <div class="footer-tip">
      {{ $t("weeklyReport.footer") }}
    </div>
  </div>
  <div v-else-if="currentSource === 'APP'" class="container-mobile">
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
      <div
        v-for="(item, index) in tableData"
        :key="index"
        class="list-card"
      >
        <div class="card-icon">
          <SvgIcon :name="item.isFolder ? 'icon_folder' : getFileIcon(item.contentName)" :size="40"></SvgIcon>
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
import { computed, onMounted, ref } from "vue";
import { getFromApp, getFromPc } from "@/utils/auth";
import { CommonTable } from "@/components";
import { getAssetUrl, getFileIcon, parseQueryDate, setAppTitle, t } from "@/utils";
import { OperationTypeKeyMap } from "@/utils/contance";
import { useTableDimensions } from "@/hooks/useTableDimensions";
import { useRoute } from "vue-router";
import type { WeeklyReportType } from "@/api/type";
import { getWeeklyReportApi } from "@/api/common";
import dayjs from "dayjs";

const route = useRoute()

const startTime = parseQueryDate(route.query.startDate);
const endTime = parseQueryDate(route.query.endDate);
const createCount = route.query.createCount
const uploadCount = route.query.uploadCount
const deleteCount = route.query.deleteCount

const isError = ref(false);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const tableData = ref<WeeklyReportType[]>([]);
const commonTableRef = ref();
const noMore = ref(false);

const currentSource = computed(() => {
  if (getFromPc() === "1") return "PC";
  if (getFromApp() === "1") return "APP";
  return null;
});

const tableColumns = computed(() => [
  {
    label: t("weeklyReport.time"),
    prop: "operateTime",
    width: "180",
    slots: "operateTime"
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
    slots: "operationType"
  },
  {
    label: t("weeklyReport.fileName"),
    prop: "contentName",
    minWidth: "250",
    slots: "contentName",
    showOverflowTooltip: true,
  }
]);

const disabled = computed(() => loading.value || noMore.value || isError.value);

const fetchData = async (page: number) => {
  try {
    const res = await getWeeklyReportApi({
      PageIndex: page,
      PageSize: 100,
      StartTime: startTime,
      EndTime: endTime
    })

    if (res.code !== 1) {
      isError.value = true;
      return {
        list: [],
        total: 0
      }
    }

    return {
      list: res.data.data,
      total: res.data.count
    }
  } catch (e) {
    isError.value = true
    return {
      list: [],
      total: 0
    }
  }
};

const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
  const { tableHeight, tableWrapperHeight } = useTableDimensions(
    commonTableRef.value,
  );
  if (scrollTop + tableWrapperHeight.value === tableHeight.value) {
    if (!noMore.value) {
      currentPage.value += 1;
      loadMore()
    }
  }
}

const loadMore = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  isError.value = false;
  try {
    const res = await fetchData(currentPage.value);

    if (currentPage.value === 1) {
      tableData.value = res.list;
    } else {
      tableData.value.push(...res.list);
    }

    total.value = res.total;
    noMore.value = currentPage.value * 100 > total.value

    if (tableData.value.length < total.value) {
      currentPage.value++;
    }
  } catch (error) {
    console.error('加载失败', error);
    isError.value = true
  } finally {
    loading.value = false;
  }
};

const getOperationLabel = (type: number) => {
  const key = OperationTypeKeyMap[type];
  return key ? t(key) : "";
};

const formatTime = (time: string) => {
  return dayjs(time).format("YYYY-MM-DD hh:mm:ss")
}

const emptyPng = getAssetUrl("empty_rectcle@3x.png");

onMounted(() => {
  setAppTitle(t("weeklyReport.fileReportTitle"));

  if (currentSource.value === 'PC') {
    loadMore();
  }
});
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
    background-color: #F2F4F8;
    padding: 20px;
    border-radius: 4px;
    text-align: center;
    margin-bottom: 20px;
    color: #2D2D2D;

    .date-range {
      margin-bottom: 8px;
    }

    .stat-details {
      .highlight {
        font-weight: bold;
        margin: 0 2px;

        &.red {
          color: #F56C6C;
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
      background-color: #F2F4F8;
      color: #747683;
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
        color: #2D2D2D;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

  }

  .footer-tip {
    border-top: 1px solid #E3E6EC;
    height: 40px;
    line-height: 40px;
    text-align: center;
    color: #909399;
    margin-top: 10px;
  }
}


.container-mobile {
  background-color: #f9f9fa;
  height: 100vh;
  overflow: hidden;
}

.mobile-header-date {
  font-size: 14px;
  color: #2D2D2D;
  font-weight: 500;
  padding: 16px;
  background: #fff;
}

.stats-wrapper {
  background: #fff;
  padding: 0 16px 16px;
}

.stats-card {
  border-radius: 8px;
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #F2F4F7;

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
        color: #F56C6C;
      }
    }

    .label {
      text-align: center;
      font-size: 11px;
      color: #909399;
    }
  }

  .divider {
    width: 1px;
    height: 30px;
    background-color: #EBEEF5;
  }
}

.mobile-list {
  margin-top: 12px;
  padding: 0 16px 20px;
  height: calc(100vh - 150px);
  overflow-y: scroll;
}

.list-card {
  background: #fff;
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
    color: #fff;
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


.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;

  div {
    margin: 16px 0;
  }

  .loading {
    border: 2px solid hsla(213, 71%, 53%, 0.2);
    border-top-color: #327EDC;
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
</style>
