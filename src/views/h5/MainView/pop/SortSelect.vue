<template>
  <van-popup v-model:show="show" position="top" round>
    <van-cell
      v-for="sort in sortList"
      :key="sort.name"
      class="sort-cell"
      style="align-items: center; padding: 16px"
      @click="handleSortBy(sort.name)"
    >
      <template v-if="sort.name === sortMethod" #icon>
        <SvgIcon
          :name="sortDirection === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
          size="20"
          style="position: absolute"
        />
      </template>
      <template #title>
        <span class="sort-text">{{ sort.title }}</span>
      </template>

      <template v-if="sort.name === sortMethod" #right-icon>
        <SvgIcon name="ic_check" />
      </template>
    </van-cell>
  </van-popup>
</template>

<script setup lang="ts">
import { type PropType, ref, watch } from "vue";
import type { SortOption } from "@/views/h5/MainView/type";
import { usePageUtils } from "@/stores";
import { storeToRefs } from "pinia";

const props = defineProps({
  showSort: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
  sortList: {
    type: Array as PropType<SortOption[]>,
    default: () => [],
  },
  sortMethod: {
    type: Number as PropType<number>,
    default: () => 0,
  },
});

const emits = defineEmits(["update:createVisible", "onSortBy"]);

const { sortDirection } = storeToRefs(usePageUtils());

const show = ref(props.showSort);

function handleSortBy(name: number) {
  emits("onSortBy", name);
}

watch(
  () => props.showSort,
  (val) => {
    show.value = val;
  },
);

watch(show, (val) => {
  emits("update:createVisible", val);
});
</script>

<style scoped lang="scss">
.sort-text {
  font-family: PingFang SC;
  margin-left: 24px;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  color: #2d2d2d;
  font-weight: 500;
}
</style>
