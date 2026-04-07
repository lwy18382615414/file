<template>
  <div :class="['checkbox', checkBoxClass]"></div>
</template>

<script lang="ts" setup>
interface Props {
  checkBoxClass?: string;
}
defineProps<Props>();
</script>

<style lang="scss" scoped>
.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #747683;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 42%;
    left: 50%;
    width: 3px;
    height: 7px;
    box-sizing: content-box;
    background: transparent;
    transform: translate(-50%, -50%) rotate(45deg) scaleY(1);
    transform-origin: center;
    display: none;
  }

  &.is-partial {
    background: #ffffff;

    &::before {
      display: block;
      border: 2px solid #5665bb;
      border-left: 0;
      border-top: 0;
    }
  }

  &.is-all {
    background: #5665bb;
    border-color: #5665bb;

    &::before {
      display: block;
      border: 2px solid #ffffff;
      border-left: 0;
      border-top: 0;
    }
  }

  &.is-disabled {
    background: #e7e7e7;
    border-color: #e7e7e7;

    &::before {
      display: block;
      border: 2px solid #fff;
      border-left: 0;
      border-top: 0;
    }
  }
}
</style>
