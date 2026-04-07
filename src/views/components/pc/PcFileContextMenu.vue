<template>
  <Teleport to="body">
    <div v-if="show" class="pc-context-menu-layer" @contextmenu.prevent>
      <div class="pc-context-menu-mask" @mousedown="emit('close')"></div>
      <div
        class="pc-context-menu"
        :style="{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }"
        @mousedown.stop
        @click.stop
        @mouseleave="emit('close')"
      >
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="pc-context-menu__item"
          :class="{ 'is-danger': action.danger }"
          @click="emit('select', action.key)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type {
  PcFileContextAction,
  PcFileContextActionKey,
} from "../../hooks/usePcFileContextMenu";

defineProps<{
  show: boolean;
  position: {
    x: number;
    y: number;
  };
  actions: PcFileContextAction[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", key: PcFileContextActionKey): void;
}>();
</script>

<style scoped lang="scss">
.pc-context-menu-layer {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.pc-context-menu-mask {
  position: absolute;
  inset: 0;
}

.pc-context-menu {
  position: absolute;
  min-width: 168px;
  padding: 8px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(31, 35, 41, 0.14);
  overflow: hidden;
}

.pc-context-menu__item {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 14px;
  color: #303133;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }

  &.is-danger {
    color: #f56c6c;
  }
}
</style>
