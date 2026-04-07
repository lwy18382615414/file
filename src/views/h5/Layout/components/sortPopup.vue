<template>
  <van-popup
    v-model:show="showSort"
    round
    position="top"
    @before-close="handleClose"
    @click-overlay="handleClose"
  >
    <van-cell
      v-for="sort in sortList"
      :key="sort.name"
      style="align-items: center; padding: 16px"
      class="sort-cell"
      @click="handleSortBy(sort.name)"
    >
      <template v-if="sort.name === sortState.sortMethod" #icon>
        <SvgIcon
          style="position: absolute"
          :name="sortState.SortOrder === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
          size="20"
        />
      </template>
      <template #title>
        <span class="sort-text">{{ sort.title }}</span>
      </template>

      <template v-if="sort.name === sortState.sortMethod" #right-icon>
        <SvgIcon name="ic_check" />
      </template>
    </van-cell>
  </van-popup>

  <van-toast v-model:show="show" style="padding: 10px">
    <template #message>
      <SvgIcon
        :name="sortState.SortOrder === 'asc' ? 'ic_arr_up' : 'ic_arr_down'"
        size="50"
        color="#fff"
        style="margin-left: 10px"
      />
      <p>按{{ sortByWarn }}{{ sortDirection }}</p>
    </template>
  </van-toast>
</template>

<script setup lang="ts">
import { usePageUtils } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import { reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  sortVisible: Boolean,
});

const emits = defineEmits(["visible:update"]);

const route = useRoute();
const showSort = ref(false);
const show = ref(false);
const sortByWarn = ref("");
const sortDirection = ref("");

const sortState = reactive({
  sortMethod: 2,
  SortOrder: "asc",
});

const sortList = [
  { name: 2, title: "按名称排序", warn: "名称" },
  { name: 1, title: "按时间排序", warn: "时间" },
  { name: 0, title: "按大小排序", warn: "大小" },
];

watch(
  () => props.sortVisible,
  (value) => {
    showSort.value = value;
    if (value) {
      // 保存当前页面的排序方式
      const savedSort = usePageUtils().sortMode.find(
        (item) => item.currentPage === route.path,
      );
      if (savedSort) {
        console.log(savedSort);
        sortState.sortMethod = savedSort.sortMethod;
        sortState.SortOrder = savedSort.sortOrder;
      } else {
        sortState.sortMethod = 2;
        sortState.SortOrder = "asc";
        usePageUtils().setSortMode({
          currentPage: route.path,
          sortMethod: 2,
          sortOrder: "asc",
        });
      }
    }
  },
);

const handleSortBy = (name: number) => {
  sortState.SortOrder = sortState.SortOrder === "asc" ? "desc" : "asc";
  sortState.sortMethod = name;

  usePageUtils().setSortMode({
    currentPage: route.path,
    sortMethod: name,
    sortOrder: sortState.SortOrder,
  });

  sortByWarn.value = sortList.find((item) => item.name === name)!.warn;
  sortDirection.value = sortState.SortOrder === "asc" ? "升序" : "降序";
  handleClose();
  show.value = true;
};

const handleClose = () => {
  emits("visible:update", false);
};
</script>

<style scoped lang="scss">
.sort-text {
  margin-left: 24px;
}
</style>
