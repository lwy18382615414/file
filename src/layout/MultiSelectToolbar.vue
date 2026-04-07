<template>
  <section class="multi-select-toolbar">
    <div class="selected-text">
      {{ t("selectedItems", { count: selectionState.count }) }}
    </div>
    <div class="multi-select-actions">
      <span class="action-text" @click="toggleAll">
        {{ selectionState.all ? t("unselectAll") : t("selectAll") }}
      </span>
      <span class="action-text" @click="cancelSelection">
        {{ t("done") }}
      </span>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useLongPress } from "@/hooks/useLongPress";
import { useI18n } from "vue-i18n";
import { useFileSelection } from "@/hooks/useFileSelection";

const { t } = useI18n();
const { clearLongPressState } = useLongPress();
const { selectionState, selectAll, clear } = useFileSelection();

const toggleAll = () => {
  if (selectionState.value.all) {
    clear();
  } else {
    selectAll();
  }
};

const cancelSelection = () => {
  clearLongPressState();
  clear();
};
</script>

<style lang="scss" scoped>
.multi-select-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.selected-text {
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: #252525;
}

.multi-select-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  column-gap: 24px;
}

.action-text {
  font-size: 14px;
  color: #5665bb;
  white-space: nowrap;
}
</style>
