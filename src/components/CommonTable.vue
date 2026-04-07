<template>
  <div class="table-container">
    <el-table ref="tableRef" :data="tableData" v-bind="$attrs">
      <!-- 原有列渲染逻辑 -->
      <template v-for="col in tableColumns" :key="col.prop">
        <el-table-column
          v-bind="col"
          :type="col.type"
          :prop="col.prop"
          :label="col.label"
          :selectable="col.selectable"
        >
          <template v-if="col.headerSlot" #header="scope">
            <slot :name="col.headerSlot" :column="scope.column" />
          </template>
          <template v-if="col.slots" #default="scope">
            <slot :name="col.slots" v-bind="scope" />
          </template>
        </el-table-column>
      </template>
      <template #empty>
        <slot name="empty">
          <template v-if="loading && tableData.length === 0">
            <div v-loading="true" target="table-container"></div>
          </template>
          <EmptyState v-else>
            <slot name="empty-content" />
          </EmptyState>
        </slot>
      </template>
      <template #append>
        <slot name="append" />
      </template>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { type PropType, ref } from "vue";
import type { TableColumn } from "@/types/type";

defineProps({
  tableData: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  tableColumns: {
    type: Array as PropType<TableColumn[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const tableRef = ref();

defineExpose({
  getTableRef() {
    return tableRef.value;
  },
});
</script>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  height: 100%;
}
</style>
