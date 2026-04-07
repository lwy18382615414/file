<!-- ActionSheet.vue -->
<template>
  <van-action-sheet
    v-model:show="visible"
    :actions="actions"
    :cancel-text="cancelText"
    :close-on-click-action="closeOnClickAction"
    @select="handleSelect"
    @cancel="handleCancel"
    @close="handleClose"
  />
</template>

<script setup>
import { ref, watch } from "vue";
import { t } from "@/utils";

const props = defineProps({
  show: Boolean,
  actions: Array,
  cancelText: {
    type: String,
    default: t("cancel"),
  },
  closeOnClickAction: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["select", "cancel", "close", "update:show"]);

const visible = ref(props.show);

watch(
  () => props.show,
  (val) => {
    visible.value = val;
  }
);

const handleSelect = (action) => {
  emit("select", action);
  close();
};

const handleCancel = () => {
  emit("cancel");
  close();
};

const handleClose = () => {
  emit("close");
  close();
};

const close = () => {
  visible.value = false;
  emit("update:show", false);
};
</script>
