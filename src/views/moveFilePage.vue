<template>
  <div class="move-file-page">
    <div class="page-header">{{ t("moveTo") }}</div>
    <div class="page-content">
      <div class="summary">{{ summary }}</div>
      <div class="placeholder">{{ t("movePagePlaceholder") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { t, setAppTitle } from "@/utils";

const movePayload = computed<{ items?: Array<{ contentName?: string; name?: string }> }>(
  () => {
    try {
      return JSON.parse(history.state.movePayload || "{}") as {
        items?: Array<{ contentName?: string; name?: string }>;
      };
    } catch {
      return {};
    }
  },
);

const summary = computed(() => {
  const firstItem = movePayload.value.items?.[0];
  if (!firstItem) return t("selectFile");
  const firstName = firstItem.contentName || firstItem.name || "";
  if ((movePayload.value.items?.length || 0) <= 1) return firstName;
  return t("moveSelectedItems", {
    name: firstName,
    count: movePayload.value.items?.length || 0,
  });
});

onMounted(() => {
  setAppTitle(t("moveTo"));
});
</script>

<style scoped lang="scss">
.move-file-page {
  min-height: 100vh;
  background: #fff;
}

.page-header {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #2d2d2d;
  border-bottom: 1px solid #f2f4f7;
}

.page-content {
  padding: 16px;
}

.summary {
  margin-bottom: 12px;
  color: #747683;
  font-size: 14px;
}

.placeholder {
  min-height: 240px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f8fafc;
}
</style>
