<template>
  <div class="add-notify-user-dialog-container">
    <el-dialog
      :model-value="visible"
      :modal="false"
      destroy-on-close
      :show-close="false"
      class="add-notify-user-dialog"
      @close="handleCancel"
    >
      <template #header>
        <div class="dialog-header">
          <span>{{ t("addNotifyUsers") }}</span>
          <SvgIcon name="ic_close" @click="handleCancel" />
        </div>
      </template>

      <div class="dialog-content">
        <div v-if="availableUsers.length" class="user-list-container">
          <div class="select-all-bar" @click="toggleSelectAll">
            <div class="select-all-main">
              <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" />
              <span class="select-all-text">{{ t(isAllSelected ? "unselectAll" : "selectAll") }}</span>
            </div>
            <span class="selected-count">{{ t("selectedPeople", { count: selectedUserIds.length }) }}</span>
          </div>

          <div class="user-list">
            <label
              v-for="item in availableUsers"
              :key="item.userId || item.id"
              class="user-item"
            >
              <div class="user-main">
                <el-checkbox
                  :model-value="selectedUserIds.includes(item.userId || 0)"
                  @change="toggleUser(item.userId || 0, $event)"
                />
                <div class="avatar">
                  <AvatarBox :avatar="item.avatar" :size="26" />
                </div>
                <div class="user-name">{{ item.label }}</div>
              </div>
              <div class="user-permission">
                {{ getHighestPermission(item.permissionType).name }}
              </div>
            </label>
          </div>
        </div>

        <div v-else class="empty-state">{{ t("noData") }}</div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-btn" @click="handleCancel">
            {{ t("cancel") }}
          </el-button>
          <el-button
            class="confirm-btn"
            type="primary"
            :disabled="selectedUserIds.length === 0"
            @click="handleConfirm"
          >
            {{ t("Ok") }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElCheckbox } from "element-plus";
import { SvgIcon } from "@/components";
import AvatarBox from "@/components/customSelectPerson/AvatarBox.vue";
import { getHighestPermission } from "@/enum/permission.ts";
import type { PermissionItem } from "@/types/type";
import { t } from "@/utils";

const props = defineProps<{
  visible: boolean;
  users: PermissionItem[];
  selectedUsers: PermissionItem[];
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm", value: number[]): void;
}>();

const selectedUserIds = ref<number[]>([]);

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const availableUsers = computed(() =>
  props.users.filter((item) => !!item.userId),
);

const isAllSelected = computed(
  () =>
    availableUsers.value.length > 0 &&
    selectedUserIds.value.length === availableUsers.value.length,
);

const isIndeterminate = computed(
  () =>
    selectedUserIds.value.length > 0 &&
    selectedUserIds.value.length < availableUsers.value.length,
);

watch(
  () => [props.visible, props.selectedUsers],
  () => {
    selectedUserIds.value = props.selectedUsers
      .map((item) => item.userId)
      .filter((userId): userId is number => !!userId);
  },
  { immediate: true },
);

const toggleUser = (userId: number, checked: boolean | string | number) => {
  if (!userId) return;

  if (checked) {
    if (!selectedUserIds.value.includes(userId)) {
      selectedUserIds.value.push(userId);
    }
    return;
  }

  selectedUserIds.value = selectedUserIds.value.filter((id) => id !== userId);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedUserIds.value = [];
    return;
  }

  selectedUserIds.value = availableUsers.value
    .map((item) => item.userId)
    .filter((userId): userId is number => !!userId);
};

const handleCancel = () => {
  visible.value = false;
};

const handleConfirm = () => {
  emit("confirm", selectedUserIds.value);
};
</script>

<style scoped lang="scss">
:deep(.add-notify-user-dialog) {
  width: 380px;
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);

  .el-dialog__header,
  .el-dialog__body,
  .el-dialog__footer {
    padding: 0;
    margin: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: var(--text-primary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid var(--dialog-divider-color);
  font-weight: bold;
}

.dialog-content {
  min-height: 320px;
  max-height: 420px;
}

.user-list-container {
  display: flex;
  flex-direction: column;
  max-height: 420px;
}

.select-all-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--dialog-divider-color);
  cursor: pointer;
}

.select-all-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-all-text,
.selected-count {
  color: var(--text-primary-color);
  font-size: 14px;
}

.selected-count {
  color: var(--text-secondary-color);
}

.user-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 80px;
  gap: 16px;
  align-items: center;
}

.user-list {
  flex: 1;
  max-height: 360px;
  overflow-y: auto;
}

.user-item {
  padding: 12px 20px;
  cursor: pointer;

  &:hover {
    background: #fff;
  }
}

.user-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 4px;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: 0 10px 0 8px;
  flex-shrink: 0;
}

.user-name,
.user-permission {
  color: var(--text-primary-color);
  font-size: 14px;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 240px;
  color: #99a1af;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--dialog-divider-color);
}

.cancel-btn,
.confirm-btn {
  width: 80px;
  border-radius: 4px;
}

.cancel-btn {
  border: 1px solid var(--theme-color);
  background: #f2f4f8;
  color: var(--theme-color);
}
</style>
