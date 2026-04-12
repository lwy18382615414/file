<template>
  <van-popup
    :show="show"
    round
    position="top"
    @update:show="handleShowChange"
    @click-overlay="handleClose"
  >
    <van-cell
      v-for="sort in sortList"
      :key="sort.name"
      class="sort-cell"
      style="align-items: center; padding: 16px"
      @click="handleSelect(sort.name, sort.warn)"
    >
      <template v-if="sort.name === currentSortMethod" #icon>
        <svg-icon
          style="position: absolute"
          :name="currentSortOrder === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
          size="20"
        />
      </template>
      <template #title>
        <span class="sort-text">{{ sort.title }}</span>
      </template>
      <template v-if="sort.name === currentSortMethod" #right-icon>
        <svg-icon name="ic_check" />
      </template>
    </van-cell>
  </van-popup>

  <van-toast
    :show="showWarn"
    style="padding: 10px"
    @update:show="handleWarnChange"
  >
    <template #message>
      <div class="warn-content">
        <svg-icon
          :name="currentSortOrder === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
          color="#fff"
          size="50"
        />
        <p>{{ sortByWarn }}{{ sortDirectionText }}</p>
      </div>
    </template>
  </van-toast>
</template>

<script setup lang="ts">
import SvgIcon from "../../../../components/SvgIcon.vue";
import type { ExplorerSortOption } from "@/hooks/sort/config.ts";

defineProps<{
  show: boolean;
  showWarn: boolean;
  sortList: ExplorerSortOption[];
  currentSortMethod: number;
  currentSortOrder: string;
  sortByWarn: string;
  sortDirectionText: string;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:showWarn": [value: boolean];
  select: [sortMethod: number, warn: string];
}>();

const handleShowChange = (value: boolean) => {
  emit("update:show", value);
};

const handleWarnChange = (value: boolean) => {
  emit("update:showWarn", value);
};

const handleClose = () => {
  emit("update:show", false);
};

const handleSelect = (sortMethod: number, warn: string) => {
  emit("select", sortMethod, warn);
};
</script>

<style scoped lang="scss">
.sort-text {
  margin-left: 24px;
}

.warn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
