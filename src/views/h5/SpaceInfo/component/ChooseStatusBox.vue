<script setup>
// 0 未选择 1 半选 2全选
defineProps(["isChoose"]);
</script>

<template>
  <div class="already-choose" v-if="isChoose === '2'">
    <div class="white-point"></div>
  </div>
  <div class="half-choose" v-else-if="isChoose === '1'"></div>
  <div class="no-choose" v-else></div>
</template>

<style scoped lang="scss">
.no-choose {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #327edc;
}

.half-choose {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-image: url("/src/assets/images/half-choose.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  position: relative;
  z-index: 1;

  .white-point {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    background-color: #ffffff;
    transform: translate(-50%, -50%);
    z-index: 2;
    display: none;
  }
}

.already-choose {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: url("@/assets/images/select.svg");
  position: relative;
  z-index: 1;

  .white-point {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    background-color: #ffffff;
    transform: translate(-50%, -50%);
    z-index: 2;
    display: none;
  }
}
</style>
