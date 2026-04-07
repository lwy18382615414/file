<template>
  <van-cell @click="selectNode(node)">
    <template #title>
      <div class="label">
        <span>
          <SvgIcon :name="renderIcon(node)" />
        </span>
        <span>{{ node.label }}</span>
      </div>
    </template>
    <template #right-icon>
      <span v-if="isNodeSelected(node)" class="flex items-center">
        <SvgIcon name="ic_check" />
      </span>
    </template>
  </van-cell>
  <template v-if="node.children">
    <div class="child-container">
      <cell-item
        v-for="child in node.children"
        :key="child.value"
        :node="child"
        :selected-node="selectedNode"
        @select="$emit('select', $event)"
      />
    </div>
  </template>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps<{
  node: any;
  selectedNode: any[];
}>();

const emit = defineEmits(["select"]);

const renderIcon = (data: any) => {
  if (data.orgType === 1 && data.userId === 0) {
    return "ic_company";
  } else if (data.orgType === 2 && data.userId === 0) {
    return "ic_department";
  } else if (data.orgType === 3 && data.userId === 0) {
    return "ic_departemnt_1";
  }
  if (data.userId !== 0) {
    return "ic_person";
  } else {
    return "";
  }
};

const isNodeSelected = (data: any) => {
  return props.selectedNode.some((item) => item.value === data.value);
};

const selectNode = (data: any) => {
  emit("select", data); // 触发事件通知父组件
};
</script>

<style lang="scss" scoped>
.label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.child-container {
  padding-left: 16px;
}
</style>
