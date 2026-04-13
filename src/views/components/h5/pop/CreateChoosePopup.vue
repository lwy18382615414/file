<template>
  <van-action-sheet v-model:show="addShow" close-on-click-action>
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
    <div
      class="cancel-btn-wrapper"
      @click="emits('update:createVisible', false)"
    >
      <div class="text">{{ t("cancel") }}</div>
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
  {
    name: t("createFolder"),
    icon: "action-create_folder",
    action: "createFolder",
  },
  { name: t("uploadFile"), icon: "action-upload_file", action: "createFile" },
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
      padding: 11px;
      border-radius: 12px;
      background: var(--btn-primary-color);
      margin-bottom: 8px;
    }

    .name {
      color: var(--text-primary-color);
    }
  }
}

.cancel-btn-wrapper {
  width: 100%;
  padding: 16px;

  .text {
    padding: 12px 16px;
    text-align: center;
    border-radius: 12px;
    border: 1px solid #d1d5db;
  }
}
</style>
