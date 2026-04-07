<template>
  <section class="pc-explorer-header special-header">
    <div class="header-main">
      <div class="title-block">
        <h2 class="title">{{ pageTitleMap[pageType] }}</h2>
      </div>
      <div class="actions compact-actions">
        <div v-if="pageType === ExplorerPageType.MY_SHARES" class="time-box">
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
            :model-value="query.keyword"
            :placeholder="t('inputDocName')"
            clearable
            @update:model-value="emit('updateKeyword', $event)"
            @keyup.enter="emit('search')"
          >
            <template #prefix>
              <SvgIcon name="common-search" size="18" />
            </template>
          </el-input>
        </div>
        <button class="action-button" type="button" @click="emit('search')">
          <SvgIcon name="common-search" size="22" color="#fff" />
          {{ t("search") }}
        </button>
        <div
          v-if="pageType === ExplorerPageType.RECYCLE"
          class="recycle-action"
        >
          <button
            class="action-button"
            type="button"
            :disabled="!props.hasSelection"
            @click="emit('restore')"
          >
            {{ t("restore") }}
          </button>
          <button
            class="action-button danger-button"
            type="button"
            :disabled="!props.hasSelection"
            @click="emit('deletePermanently')"
          >
            {{ t("deletePermanently") }}
          </button>
        </div>
        <div v-else class="recycle-action">
          <button
            class="action-button"
            type="button"
            :disabled="!props.hasSelection"
            @click="emit('cancelShare')"
          >
            {{ t("cancelShare") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { SvgIcon } from "@/components";
import {
  ExplorerPageType,
  type ExplorerQueryState,
} from "@/views/fileExplorer";

const props = defineProps<{
  query: ExplorerQueryState;
  pageType: string;
  hasSelection: boolean;
}>();

const emit = defineEmits<{
  (e: "updateKeyword", value: string): void;
  (e: "updateDateRange", value: [Date, Date] | null): void;
  (e: "search"): void;
  (e: "restore"): void;
  (e: "deletePermanently"): void;
  (e: "cancelShare"): void;
}>();

const { t } = useI18n();

const dateRange = computed({
  get() {
    if (props.query.startDate && props.query.endDate) {
      return [new Date(props.query.startDate), new Date(props.query.endDate)];
    }
    return null;
  },
  set(value) {
    if (value && value.length === 2) {
      emit("updateDateRange", value as [Date, Date]);
      return;
    }

    emit("updateDateRange", null);
  },
});

const pageTitleMap: Record<string, string> = {
  "my-shares": t("myShares"),
  recycle: t("recycleBin"),
};
</script>

<style scoped lang="scss">
.pc-explorer-header {
  padding: 24px 16px 16px;
  background: #fff;
}

.header-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  line-height: 32px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-actions {
  flex: 1;
}

.search-box {
  width: 280px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  padding: 0 12px;
  background: #5665bb;
  color: #fff;
  font-size: 14px;

  &:disabled {
    background: #cbd5e1;
    color: #fff;
    cursor: not-allowed;
    pointer-events: none;
    opacity: 0.7;
  }
}

.danger-button {
  background: #dc2626;

  &:disabled {
    background: #fecaca;
    color: #fff;
  }
}

.recycle-action {
  display: flex;
  gap: 8px;
  position: absolute;
  right: 16px;
}
</style>
