<template>
  <el-popover
    ref="popoverRef"
    :visible="modelValue"
    @update:visible="handleVisibleChange"
    placement="bottom-start"
    :width="width"
    :show-arrow="false"
    :popper-style="popperStyle"
  >
    <template #reference>
      <div ref="referenceRef"></div>
    </template>

    <div class="flex flex-col">
      <div
        v-for="(item, index) in options"
        :key="index"
        class="operate-btn"
        @click="handleSelect(item.key)"
      >
        <div class="text-[#2d2d2d]">{{ t(item.label) }}</div>
        <el-tooltip
          v-if="item.desc"
          effect="dark"
          :content="t(item.desc)"
          placement="top"
        >
          <div class="desc">{{ t(item.desc) }}</div>
        </el-tooltip>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import { t } from "@/utils";

const props = defineProps({
  // 控制菜单显示
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 菜单位置
  position: {
    type: Object,
    required: true,
  },
  // 菜单项配置
  options: {
    type: Array as PropType<Array<Record<string, any>>>,
    default: () => [],
  },
  // 菜单宽度
  width: {
    type: Number,
    default: 150,
  },
});

const emit = defineEmits(["update:modelValue", "select", "heightChange"]);

const popoverRef = ref();

// 计算popper样式
const popperStyle = computed(() => ({
  left: `${props.position.x - 2}px`,
  top: `${props.position.y - 2}px`,
  position: "absolute",
  padding: "4px",
  borderRadius: "8px",
  height: "fit-content",
  minWidth: "unset",
  whiteSpace: "nowrap",
}));

// 新增 visible 变化处理器
const handleVisibleChange = (visible: boolean) => {
  emit("update:modelValue", visible);
};

// 处理菜单项点击
const handleSelect = (key: string) => {
  emit("select", key);
  emit("update:modelValue", false);
};
</script>

<style scoped>
.operate-btn {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: context-menu;

  &:hover {
    background-color: #edeeef;
  }
}

.desc {
  font-size: calc(var(--base--font--size--12) * var(--scale-factor));
  color: #999;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
