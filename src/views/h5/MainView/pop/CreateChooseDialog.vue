<template>
  <van-action-sheet
    v-model:show="addShow"
    :cancel-text="t('cancel')"
    close-on-click-action
  >
    <div class="add-content">
      <div
        v-for="action in actions"
        :key="action.name"
        class="action"
        @click="handleAction(action.action)"
      >
        <span class="icon-wrapper">
          <SvgIcon :name="action.icon" size="30" />
        </span>
        <div class="name">{{ action.name }}</div>
      </div>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from "vue";
import { t } from "@/utils";

const props = defineProps({
  createVisible: {
    type: Boolean as PropType<boolean>,
    default: () => false,
  },
});

const emits = defineEmits(["update:createVisible", "onAction"]);

// 内部与外部绑定的变量
const addShow = ref(props.createVisible);

const actions = ref([
  { name: t("createFolder"), icon: "ic_create-folder", action: "createFolder" },
  { name: t("uploadFile"), icon: "ic_add-file", action: "createFile" },
]);

watch(
  () => props.createVisible,
  (val) => {
    addShow.value = val;
  },
);

watch(addShow, (val) => {
  emits("update:createVisible", val);
});

function handleAction(actionType: string) {
  emits("onAction", actionType);
  addShow.value = false;
}
</script>

<style scoped lang="scss">
.add-content {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  row-gap: 30px;
  column-gap: 32px;

  .action {
    display: flex;
    flex-direction: column;
    align-items: center;
    .icon-wrapper {
      display: inline-block;
      padding: 14px;
      background: #ebeff6ff;
      border-radius: 5px;
      margin-bottom: 10px;
    }

    .name {
      color: #2d2d2d;
    }
  }
}
</style>
