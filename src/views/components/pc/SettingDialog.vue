<template>
  <div class="setting-dialog-container">
    <el-dialog
      :model-value="visible"
      :show-close="false"
      :before-close="handleClose"
      :modal="false"
      class="setting-dialog"
      destroy-on-close
      @click.stop="contextMenuVisible = false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="title-group">
            <div class="title">{{ permissionName || t("folderSettings") }}</div>
            <div class="sub-title">{{ t("permissionSettings") }}</div>
          </div>
          <button class="close-button" type="button" @click="handleClose">
            <SvgIcon name="ic_close" />
          </button>
        </div>
      </template>

      <div class="dialog-content">
        <div class="setting-nav">
          <div
            v-for="(item, index) in settingOptions"
            :key="item"
            class="nav-item"
            :class="{ active: index === activeOption }"
            @click="handleChoose(index)"
          >
            <span>{{ t(item) }}</span>
            <span v-if="item === 'spaceMembers'" class="nav-count">{{
              permissionCount
            }}</span>
            <span v-else-if="item === 'notifyUsers'" class="nav-count">{{
              notifyPermissionList.length
            }}</span>
          </div>
        </div>

        <div class="setting-panel">
          <div class="operate-bar">
            <div v-if="isSearching" class="search-wrapper">
              <el-input
                ref="searchInputRef"
                v-model="searchValue"
                clearable
                :placeholder="t('search')"
                @input="debounceSearch"
                @blur="handleSearchBlur"
              >
                <template #prefix>
                  <span class="search-prefix-icon">
                    <SvgIcon name="ic_staff_search" size="18" />
                  </span>
                </template>
              </el-input>
            </div>

            <template v-if="!isSearching">
              <button
                class="action-button"
                :class="{
                  disabled: !hasPermission(permissionType, Permission.Admin),
                }"
                type="button"
                @click="
                  option === 'notifyUsers' ? addNotifyUser() : addMember()
                "
              >
                <SvgIcon
                  v-if="hasPermission(permissionType, Permission.Admin)"
                  name="ic_staff_add"
                  size="20"
                />
                <SvgIcon v-else name="ic_add_staff_disable" size="20" />
              </button>
              <button class="action-button" type="button" @click="showSearch">
                <SvgIcon name="ic_staff_search" size="20" />
              </button>
            </template>
          </div>

          <div v-if="filteredPermissionList.length" class="staff-list">
            <div
              v-for="item in filteredPermissionList"
              :key="item.userId || item.orgId || item.tagId || item.id"
            >
              <div class="staff-item">
                <div class="staff-info">
                  <div class="avatar" @click="showStaff(item)">
                    <AvatarBox v-if="item.avatar" :avatar="item.avatar" />
                    <svg-icon v-else name="ic_department" size="26" />
                  </div>
                  <div class="label">{{ item.label }}</div>
                </div>

                <div
                  class="permission-trigger"
                  :class="{ 'is-readonly': isReadOnly(item) }"
                  @click.stop="
                    option === 'notifyUsers'
                      ? handleRemoveNotifyUser(item)
                      : handleMenu(item, false, $event)
                  "
                >
                  <template v-if="option === 'notifyUsers'">
                    <span class="permission">{{ t("remove") }}</span>
                  </template>
                  <template v-else>
                    <span
                      v-if="item.permissionType === Permission.SuperAdmin"
                      class="permission"
                    >
                      {{ getHighestPermission(item.permissionType).name }}
                    </span>
                    <el-tooltip
                      v-else
                      effect="dark"
                      :content="setContent(item)"
                      placement="top"
                    >
                      <span class="permission">
                        {{ getHighestPermission(item.permissionType).name }}
                      </span>
                    </el-tooltip>
                    <span v-if="!isReadOnly(item)" class="arrow-icon">
                      <SvgIcon name="ic_arr_down_more" />
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            {{ searchValue ? t("search") + " 0" : t("noData") }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>

  <PopMenu
    v-model="contextMenuVisible"
    :width="250"
    :position="menuPosition"
    :options="filterOptions"
    @select="handleMenuSelect"
  />

  <CustomSelectPerson
    v-if="orgVisible && option !== 'notifyUsers'"
    :visible="orgVisible"
    :contact-list="contactList"
    :has-select-item="selectedItems"
    :my-permission-type="permissionType"
    @update:visible="closeChoose"
    @submit="handleConfirm"
  />

  <AddNotifyUserDialog
    v-if="notifyDialogVisible"
    :visible="notifyDialogVisible"
    :users="notifyCandidateList"
    :selected-users="notifySelectedItems"
    @update:visible="notifyDialogVisible = $event"
    @confirm="handleNotifyConfirm"
  />
</template>

<script setup lang="ts">
import { useFileBelong } from "@/hooks/useFileBelong";
import { useShareSpace } from "@/hooks/useShareSpace";
import type { OrgTreeCallbackParams } from "@/api/type";
import { computed, ref, watch, watchEffect, nextTick } from "vue";
import { debounce } from "lodash-es";
import {
  addFolderNotifyUsersApi,
  addFolderPermissionApi,
  editFolderPermissionApi,
  getFolderPermissionApi,
  getUserTreeApi,
  removeFolderNotifyUsersApi,
  removeMemberApi,
  setMemberPermissionApi,
  transferSuperAdminApi,
} from "@/api/common";
import { Permission, getHighestPermission } from "@/enum/permission";
import { PopMenu, CustomSelectPerson, SvgIcon } from "@/components";
import AddNotifyUserDialog from "./AddNotifyUserDialog.vue";
import { ElMessage } from "element-plus";
import { useDialog } from "@/hooks/useDialog";
import { getQueryVariable, hasPermission, t } from "@/utils";
import AvatarBox from "@/components/customSelectPerson/AvatarBox.vue";
import type { PermissionItem } from "@/types/type";
import { useAdjustPosition } from "@/hooks/useAdjustPosition";
import PinyinMatch from "pinyin-match";

interface MenuOption {
  label: string;
  desc: string;
  key: string;
}

const props = defineProps<{
  show: boolean;
  contentId: number;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const { isSharedDirChanged } = useShareSpace();
const { permissionCount } = useFileBelong();

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const settingOptions = ["spaceMembers", "notifyUsers"];
const activeOption = ref(0);
const option = ref("");
const permissionList = ref<PermissionItem[]>([]);
const notifyPermissionList = ref<(PermissionItem & { isNotify?: boolean })[]>(
  [],
);
const contextMenuVisible = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const menuOptions = ref<MenuOption[]>([
  {
    label: "menuOpt.admin",
    desc: "menuOpt.securityPermission",
    key: "admin",
  },
  {
    label: "menuOpt.editable",
    desc: "menuOpt.fullFilePermission",
    key: "edit",
  },
  {
    label: "menuOpt.uploadPermission",
    desc: "menuOpt.uploadDownloadShare",
    key: "upload",
  },
  {
    label: "menuOpt.sharable",
    desc: "menuOpt.viewDownloadShareOnly",
    key: "share",
  },
  { label: "menuOpt.view", desc: "menuOpt.viewDownloadOnly", key: "view" },
  { label: "menuOpt.removeMember", desc: "", key: "remove" },
  { label: "menuOpt.transferSuperAdminAction", desc: "", key: "transfer" },
]);
const filterOptions = ref<MenuOption[]>([]);
const selectedPerson = ref<PermissionItem>({} as PermissionItem);
const orgVisible = ref(false);
const notifyDialogVisible = ref(false);
const selectedItems = ref<PermissionItem[]>([]);
const notifySelectedItems = ref<PermissionItem[]>([]);
const isSearching = ref(false);
const searchValue = ref("");
const searchInputRef = ref();
const permissionType = ref(0);
const permissionName = ref("");
const isChild = ref(false);
const contactList = ref<OrgTreeCallbackParams[]>([]);

const notifyCandidateList = computed<PermissionItem[]>(() => {
  return permissionList.value.filter((item) => !!item.userId);
});

const currentList = computed<PermissionItem[]>(() => {
  return option.value === "notifyUsers"
    ? notifyPermissionList.value
    : permissionList.value;
});

const filteredPermissionList = computed<PermissionItem[]>(() => {
  let list = currentList.value;
  const searchTerm = searchValue.value?.trim();

  if (searchTerm) {
    const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);
    const hasPinyin = /[a-zA-Z]/.test(searchTerm);

    if (hasChinese && hasPinyin) {
      return [];
    }

    list = list.reduce<PermissionItem[]>((acc, item) => {
      const matchesLabel = !!PinyinMatch.match(item.label, searchTerm);
      const matchedChildren =
        item.children?.filter(
          (child) => !!PinyinMatch.match(child.label, searchTerm),
        ) || [];

      if (matchesLabel || matchedChildren.length > 0) {
        acc.push({
          ...item,
          children:
            matchesLabel && matchedChildren.length === 0
              ? item.children
              : matchedChildren,
        });
      }

      return acc;
    }, []);
  }

  return [...list].sort((a, b) => {
    if (b.permissionType !== a.permissionType) {
      return b.permissionType - a.permissionType;
    }
    return 0;
  });
});

const showSearch = () => {
  isSearching.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const debounceSearch = debounce((value: string) => {
  searchValue.value = value;
}, 300);

const handleSearchBlur = () => {
  if (!searchValue.value) {
    isSearching.value = false;
  }
};

watchEffect(() => {
  if (!settingOptions.includes(option.value)) {
    option.value = settingOptions[0];
    activeOption.value = 0;
  }
  if (searchInputRef.value && isSearching.value) {
    searchInputRef.value.focus();
  }
});

const isReadOnly = (item: PermissionItem & { isNotify?: boolean }) => {
  if (option.value === "notifyUsers") {
    return !hasPermission(permissionType.value, Permission.Admin);
  }

  return (
    item.permissionType === Permission.SuperAdmin ||
    item.permissionType === permissionType.value ||
    !hasPermission(permissionType.value, Permission.Admin)
  );
};

const resetState = () => {
  searchValue.value = "";
  isSearching.value = false;
  contextMenuVisible.value = false;
  orgVisible.value = false;
  notifyDialogVisible.value = false;
  selectedPerson.value = {} as PermissionItem;
  isChild.value = false;
};

const handleChoose = (index: number) => {
  activeOption.value = index;
  option.value = settingOptions[index];
};

const handleClose = () => {
  resetState();
  visible.value = false;
};

const closeChoose = (val: boolean) => {
  orgVisible.value = val;
  if (!val) {
    contextMenuVisible.value = false;
  }
};

const handleMenu = (
  selected: PermissionItem,
  isChildPermission: boolean,
  event: MouseEvent,
) => {
  if (isReadOnly(selected)) return;

  selectedPerson.value = selected;
  isChild.value = isChildPermission;

  filterOptions.value = menuOptions.value;
  if (permissionType.value !== Permission.SuperAdmin) {
    filterOptions.value = menuOptions.value.filter(
      (item) => item.key !== "transfer",
    );
  }
  if (permissionType.value === Permission.Admin) {
    filterOptions.value = filterOptions.value.filter(
      (item) => item.key !== "admin",
    );
  }

  const popoverHeight = filterOptions.value.length * 40;
  contextMenuVisible.value = true;
  const { adjustPosition } = useAdjustPosition({
    popoverHeight,
  });
  menuPosition.value = adjustPosition(event);
};

const handleMenuSelect = (key: string) => {
  switch (key) {
    case "admin":
      editPermission(Permission.Admin);
      break;
    case "edit":
      editPermission(Permission.Edit);
      break;
    case "upload":
      editPermission(Permission.Upload);
      break;
    case "share":
      editPermission(Permission.Share);
      break;
    case "view":
      editPermission(Permission.View);
      break;
    case "remove":
      removePerson();
      break;
    case "transfer":
      transferSuperAdmin();
      break;
    default:
      break;
  }
};

const transferSuperAdmin = async () => {
  if (!selectedPerson.value.userId) {
    ElMessage.error(t("nonUserTransferError"));
    return;
  }

  useDialog({
    title: t("transferSuperAdmin"),
    content: t("confirmTransferSuperAdmin", {
      name: selectedPerson.value.label,
    }),
    extraContentType: "text",
    extraContent: t("confirmTransferSuperAdminExtra"),
    confirmText: t("Ok"),
    cancelText: t("cancel"),
  })
    .then(async () => {
      const res = await transferSuperAdminApi(
        selectedPerson.value.userId as number,
        props.contentId,
      );
      if (res.code === 1) {
        ElMessage.success(t("transferSuccess"));
        await getFolderPermission(props.contentId);
        contextMenuVisible.value = false;
        isSharedDirChanged.value = !isSharedDirChanged.value;
      }
    })
    .catch(() => {});
};

const editPermission = async (nextPermissionType: number) => {
  if (nextPermissionType === Permission.Admin) {
    useDialog({
      title: t("addAdmin"),
      content: t("confirmSetAdmin", { name: selectedPerson.value.label }),
      extraContentType: "text",
      extraContent: t("confirmSetAdminExtra"),
      width: 305,
    })
      .then(async () => {
        if (isChild.value) {
          const res = await setMemberPermissionApi(
            props.contentId,
            selectedPerson.value.userId!,
            selectedPerson.value.orgId as number,
            nextPermissionType,
          );
          if (res.code === 1) {
            ElMessage.success(t("modifySuccess"));
            await getFolderPermission(props.contentId);
          }
        } else {
          const res = await editFolderPermissionApi(
            selectedPerson.value.id,
            nextPermissionType,
          );
          if (res.code === 1) {
            ElMessage.success(t("modifySuccess"));
            await getFolderPermission(props.contentId);
          }
        }
      })
      .catch(() => {});
    return;
  }

  if (isChild.value) {
    const res = await setMemberPermissionApi(
      props.contentId,
      selectedPerson.value.userId!,
      selectedPerson.value.orgId as number,
      nextPermissionType,
    );
    if (res.code === 1) {
      ElMessage.success(t("modifySuccess"));
      await getFolderPermission(props.contentId);
    }
    return;
  }

  const res = await editFolderPermissionApi(
    selectedPerson.value.id,
    nextPermissionType,
  );
  if (res.code === 1) {
    ElMessage.success(t("modifySuccess"));
    await getFolderPermission(props.contentId);
  }
};

const handleRemoveNotifyUser = (selected: PermissionItem) => {
  if (isReadOnly(selected)) return;

  useDialog({
    title: t("remove"),
    content: t("confirmRemoveNotifyUser"),
    confirmText: t("Ok"),
    cancelText: t("cancel"),
  })
    .then(async () => {
      if (!selected.userId) return;
      const res = await removeFolderNotifyUsersApi(props.contentId, [
        selected.userId,
      ]);
      if (res.code === 1) {
        ElMessage.success(t("removeSuccess"));
        await getFolderPermission(props.contentId);
      }
    })
    .catch(() => {});
};

const removePerson = async () => {
  const res = await removeMemberApi(selectedPerson.value.id, props.contentId);
  if (res.code === 1) {
    ElMessage.success(t("removeSuccess"));
    await getFolderPermission(props.contentId);
  }
};

const getFolderPermission = async (contentId: number) => {
  if (!contentId) return;

  const res = await getFolderPermissionApi(contentId);
  if (res.code === 1) {
    permissionList.value = res.data.permissions || [];
    notifyPermissionList.value = permissionList.value.filter(
      (item) => item.isNotify,
    );
    permissionType.value = res.data.permissionType;
    permissionName.value = res.data.name;
    permissionCount.value = res.data.personCount;
    selectedItems.value = permissionList.value.map((item) => ({
      ...item,
      value: (item.userId || item.orgId || item.tagId)?.toString(),
    }));
    notifySelectedItems.value = notifyPermissionList.value.map((item) => ({
      ...item,
      value: (item.userId || item.orgId || item.tagId)?.toString(),
    }));
  }
};

const handleConfirm = async (selected: PermissionItem[]) => {
  const ranges = selected
    .map((range) => {
      const payload: Record<string, number> = {};

      if (range.userId) payload.userId = range.userId;
      if (range.orgId != null) payload.orgId = Number(range.orgId);
      if (range.tagId != null) payload.tagId = Number(range.tagId);

      return payload;
    })
    .filter((range) => Object.keys(range).length > 0);
  const res = await addFolderPermissionApi(
    props.contentId,
    ranges,
    Permission.View,
  );

  if (res.code === 1) {
    ElMessage.success(t("operationSuccess"));
    await getFolderPermission(props.contentId);
    orgVisible.value = false;
    isSharedDirChanged.value = !isSharedDirChanged.value;
  }
};

const addMember = () => {
  if (!hasPermission(permissionType.value, Permission.Admin)) return;
  orgVisible.value = true;
};

const addNotifyUser = () => {
  if (!hasPermission(permissionType.value, Permission.Admin)) return;
  notifyDialogVisible.value = true;
};

const handleNotifyConfirm = async (userIds: number[]) => {
  if (!userIds.length) {
    notifyDialogVisible.value = false;
    return;
  }

  const res = await addFolderNotifyUsersApi(props.contentId, userIds);
  if (res.code === 1) {
    ElMessage.success(t("operationSuccess"));
    await getFolderPermission(props.contentId);
    notifyDialogVisible.value = false;
    isSharedDirChanged.value = !isSharedDirChanged.value;
  }
};

const getUserData = async () => {
  const res = await getUserTreeApi();
  if (res.code === 1) {
    contactList.value = res.data;
  }
};

const showStaff = (staff: PermissionItem) => {
  const tenantId =
    getQueryVariable("chatTenantId") ||
    sessionStorage.getItem("tenantId") ||
    "";
  const data = { type: "8", userId: staff.userId, tenantId: Number(tenantId) };
  console.log(JSON.stringify(data));
};

const setContent = (item: PermissionItem) => {
  switch (item.permissionType) {
    case Permission.View:
      return t("menuOpt.viewDownloadOnly");
    case Permission.Share:
      return t("menuOpt.viewDownloadShareOnly");
    case Permission.Upload:
      return t("menuOpt.uploadDownloadShare");
    case Permission.Edit:
      return t("menuOpt.fullFilePermission");
    case Permission.Admin:
      return t("menuOpt.securityPermission");
    default:
      return "";
  }
};

watch(
  () => props.contentId,
  (newVal) => {
    if (visible.value && newVal) {
      getFolderPermission(newVal);
    }
  },
);

watch(
  () => visible.value,
  (show) => {
    if (show && props.contentId) {
      getUserData();
      getFolderPermission(props.contentId);
      return;
    }

    if (!show) {
      resetState();
    }
  },
);
</script>

<style scoped lang="scss">
:deep(.setting-dialog) {
  width: 640px;
  padding: 0;
  overflow: hidden;
  border-radius: 8px;

  .el-dialog__header {
    padding: 0;
    border-bottom: none;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px 16px 16px;
  border-bottom: 1px solid #edf1f5;
}

.title-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.title {
  max-width: 320px;
  overflow: hidden;
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sub-title {
  color: #64748b;
  font-size: 13px;
  line-height: 20px;
}

.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #334155;
  }
}

.dialog-content {
  display: flex;
  height: min(calc(545px - 69px), 545px);
}

.setting-nav {
  width: 220px;
  padding: 18px 12px;
  border-right: 1px solid #edf1f5;
  background: #f8fafc;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  color: #334155;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #eef2ff;
    color: #5665bb;
  }

  &.active {
    background: #e8efff;
    color: #5665bb;
    font-weight: 600;
  }
}

.nav-count {
  color: #94a3b8;
  font-size: 12px;
}

.setting-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 18px 16px 16px;
}

.operate-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 36px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #3156d3;
  }

  &.disabled {
    cursor: not-allowed;
    color: #94a3b8;

    &:hover {
      background: #fff;
      color: #94a3b8;
    }
  }
}

.staff-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.staff-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
}

.staff-info {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.avatar {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  overflow: hidden;
  border-radius: 6px;
  flex-shrink: 0;
}

.label {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.permission-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 180px;
  padding: 6px 8px;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  &.is-readonly {
    cursor: default;
    color: #94a3b8;

    &:hover {
      background: transparent;
      color: #94a3b8;
    }
  }
}

.permission {
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.arrow-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #94a3b8;
  font-size: 14px;
}

.search-wrapper {
  width: 220px;
  overflow: hidden;

  :deep(.el-input) {
    width: 100%;
    height: 32px;
  }

  :deep(.el-input__wrapper) {
    padding: 0 10px;
    border-radius: 4px;
    background: #fff;
    box-shadow: inset 0 0 0 1px #dbe4f0;
    transition:
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: inset 0 0 0 1px #cbd5e1;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    display: inline-flex;
    align-items: center;
  }

  :deep(.el-input__prefix) {
    margin-right: 8px;
    color: #94a3b8;
  }

  :deep(.el-input__suffix) {
    margin-left: 8px;
  }

  :deep(.el-input__inner) {
    color: #1e293b;
    font-size: 14px;
  }

  :deep(.el-input__inner::placeholder) {
    color: #94a3b8;
  }
}

.search-prefix-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.search-clear-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: #cbd5e1;
    color: #334155;
    transform: scale(1.05);
  }
}
</style>
