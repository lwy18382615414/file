<template>
  <el-dialog
    :model-value="settingVisible"
    :show-close="false"
    :before-close="handleClose"
    style="padding: 0; overflow: hidden; border-radius: 8px"
    :modal="false"
    width="610"
    @click.stop="contextMenuVisible = false"
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="flex items-center">
          <div class="title">{{ permissionName }}</div>
          <div class="sub-title">{{ t("permissionSettings") }}</div>
        </div>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>
    <!-- 内容 -->
    <div class="dialog-content">
      <div class="setting-item">
        <div
          v-for="(item, index) in settingOptions"
          :key="item"
          class="item"
          :class="{ active: index === activeOption }"
          @click="handleChoose(index)"
        >
          <span>{{ t(item) }}</span>
          <span v-if="index === 0" class="text-[#c0c6d2]">{{
            permissionCount
          }}</span>
        </div>
      </div>
      <div class="setting-content">
        <div class="operate-bar flex justify-end gap-[10px]">
          <transition name="fade">
            <div v-if="isSearching" class="search-wrapper">
              <el-input
                ref="searchInputRef"
                v-model="searchValue"
                :placeholder="t('search')"
                @input="debounceSearch"
                @blur="handleSearchBlur"
              >
                <template #prepend>
                  <SvgIcon name="ic_staff_search" size="20" />
                </template>
                <template v-if="searchValue" #append>
                  <SvgIcon name="ic_close" @click="handleClear" />
                </template>
              </el-input>
            </div>
          </transition>
          <template v-if="!isSearching">
            <div class="item" @click="addMember">
              <SvgIcon
                v-if="hasPermission(permissionType, Permission.Admin)"
                name="ic_staff_add"
                size="20"
              />
              <SvgIcon v-else name="ic_add_staff_disable" size="20" />
            </div>
            <div class="item" @click="showSearch">
              <SvgIcon name="ic_staff_search" size="20" />
            </div>
          </template>
        </div>
        <div class="staff-list">
          <div
            v-for="item in filteredPermissionList"
            :key="item.userId"
          >
            <div class="flex justify-between items-center staff-item">
              <div class="flex items-center">
                <div class="avatar" @click="showStaff(item)">
                  <AvatarBox v-if="item.avatar" :avatar="item.avatar" />
                  <svg-icon v-else name="ic_department" size="26" />
                </div>
                <div class="label">{{ item.label }}</div>
              </div>
              <div
                class="cursor-context-menu"
                :class="{ 'is-readonly': isReadOnly(item) }"
                @click.stop="handleMenu(item, false, $event)"
              >
                <span v-if="item.permissionType === Permission.SuperAdmin" class="permission">
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
                <span v-if="!isReadOnly(item)">
                  <SvgIcon name="ic_arr_down_more" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
  <PopMenu
    v-model="contextMenuVisible"
    :width="250"
    :position="menuPosition"
    :options="filterOptions"
    @select="handleMenuSelect"
  />

  <CustomSelectPerson
    v-if="orgVisible"
    :visible="orgVisible"
    :contact-list="contactList"
    :has-select-item="selectedItems"
    :my-permission-type="permissionType"
    @update:visible="closeChoose"
    @submit="handleConfirm"
  />
</template>
<script setup lang="ts">
import SvgIcon from "@/components/SvgIcon.vue";
import { useSetting } from "@/stores";
import { useFileBelong } from "@/hooks/useFileBelong";
import { useShareSpace } from "@/hooks/useShareSpace";
import { computed, ref, watch, watchEffect, onMounted, nextTick } from "vue";
import { debounce } from "lodash-es";
import {
  addFolderPermissionApi,
  editFolderPermissionApi,
  getFolderPermissionApi,
  getUserTreeApi,
  removeMemberApi,
  setMemberPermissionApi,
  transferSuperAdminApi,
} from "@/api/common";
import { Permission } from "@/enum/permission";
import { PopMenu, CustomSelectPerson } from "@/components";
import { ElMessage } from "element-plus";
import { getHighestPermission } from "@/enum/permission";
import { useDialog } from "@/hooks/useDialog";
import { getQueryVariable, hasPermission, t } from "@/utils";
import AvatarBox from "@/components/customSelectPerson/AvatarBox.vue";
import type { PermissionItem } from "@/types/type";
import { useAdjustPosition } from "@/hooks/useAdjustPosition";
import PinyinMatch from 'pinyin-match';

interface MenuOption {
  label: string;
  desc: string;
  key: string;
}

const props = defineProps<{
  contentId: number;
}>();

const { isSharedDirChanged } = useShareSpace();
const { permissionCount } = useFileBelong();

const settingOptions = ["spaceMembers"];
const activeOption = ref(0);
const option = ref("");
const permissionList = ref<PermissionItem[]>([]);
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
const selectedItems = ref<PermissionItem[]>([]);
const isSearching = ref(false);
const searchValue = ref("");
const searchInputRef = ref();
const permissionType = ref(0);
const permissionName = ref("");
const isChild = ref(false);
const contactList = ref<Record<string, any>[]>([]);

const filteredPermissionList = computed(() => {
  let list = permissionList.value;
  const searchTerm = searchValue.value?.trim();

  if (searchTerm) {
    const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);
    const hasPinyin = /[a-zA-Z]/.test(searchTerm);

    if (hasChinese && hasPinyin) {
      return [];
    }

    list = list.reduce((acc, item) => {
      const matchesLabel = !!PinyinMatch.match(item.label, searchTerm);

      const matchedChildren = item.children?.filter(child =>
        !!PinyinMatch.match(child.label, searchTerm)
      ) || [];

      if (matchesLabel || matchedChildren.length > 0) {
        acc.push({
          ...item,
          children: matchesLabel && matchedChildren.length === 0 ? item.children : matchedChildren
        });
      }
      return acc;
    }, []);
  }

  return [...list].sort((a, b) => {
    if (b.permissionType !== a.permissionType) {
      return b.permissionType - a.permissionType;
    }
    return (a.canEdit ? 1 : 0) - (b.canEdit ? 1 : 0);
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
  option.value = useSetting().settingOption || settingOptions[0];
  if (searchInputRef.value) {
    if (isSearching.value) searchInputRef.value.focus();
  }
});

const settingVisible = computed(() => useSetting().settingVisible);

const isReadOnly = (item: PermissionItem) => {
  if (!item.canEdit) return true
  return (
    item.permissionType === Permission.SuperAdmin ||
    item.permissionType === permissionType.value ||
    !hasPermission(permissionType.value, Permission.Admin)
  );
}

const handleClear = () => {
  searchValue.value = "";
  isSearching.value = false;
  getFolderPermission(props.contentId);
};

const handleChoose = (index: number) => {
  activeOption.value = index;
  option.value = settingOptions[index];
};

const handleClose = () => {
  searchValue.value = "";
  isSearching.value = false;
  contextMenuVisible.value = false;
  useSetting().updateSettingVisible(false);
};

const closeChoose = (val: boolean) => {
  orgVisible.value = val;
  handleClose();
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
  menuPosition.value = adjustPosition(event)
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
        <number>selectedPerson.value.userId,
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

const editPermission = async (permissionType: number) => {
  if (permissionType === Permission.Admin) {
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
            permissionType,
          );
          if (res.code === 1) {
            ElMessage.success(t("modifySuccess"));
            await getFolderPermission(props.contentId);
          }
        } else {
          const res = await editFolderPermissionApi(
            selectedPerson.value.id,
            permissionType,
          );
          if (res.code === 1) {
            ElMessage.success(t("modifySuccess"));
            await getFolderPermission(props.contentId);
          }
        }
      })
      .catch(() => {});
  } else {
    if (isChild.value) {
      const res = await setMemberPermissionApi(
        props.contentId,
        selectedPerson.value.userId!,
        selectedPerson.value.orgId as number,
        permissionType,
      );
      if (res.code === 1) {
        ElMessage.success(t("modifySuccess"));
        await getFolderPermission(props.contentId);
      }
    } else {
      const res = await editFolderPermissionApi(
        selectedPerson.value.id,
        permissionType,
      );
      if (res.code === 1) {
        ElMessage.success(t("modifySuccess"));
        await getFolderPermission(props.contentId);
      }
    }
  }
};

const removePerson = async () => {
  const res = await removeMemberApi(selectedPerson.value.id, props.contentId);
  if (res.code === 1) {
    ElMessage.success(t("removeSuccess"));
    await getFolderPermission(props.contentId);
  }
};

const getFolderPermission = async (contentId: number) => {
  const res = await getFolderPermissionApi(contentId);
  if (res.code === 1) {
    permissionList.value = res.data.permissions;
    permissionType.value = res.data.permissionType;
    permissionName.value = res.data.name;
    permissionCount.value = res.data.personCount;
    selectedItems.value = permissionList.value.map((item) => ({
      ...item,
      value: (item.userId || item.orgId || item.tagId)?.toString(),
    }));
  }
};

const handleConfirm = async (selected: any[]) => {
  const ranges = selected.filter(range => range.canEdit !== false)
  const res = await addFolderPermissionApi(
    props.contentId,
    ranges,
    Permission.View,
  );

  if (res.code === 1) {
    ElMessage.success(t("operationSuccess"));
    await getFolderPermission(props.contentId);
    orgVisible.value = false;
  }
};

const addMember = () => {
  // 只有管理员才能添加成员
  if (!hasPermission(permissionType.value, Permission.Admin)) return;
  orgVisible.value = true;
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
      return t('menuOpt.viewDownloadOnly')
    case Permission.Share:
      return t('menuOpt.viewDownloadShareOnly')
    case Permission.Upload:
      return t('menuOpt.uploadDownloadShare')
    case Permission.Edit:
      return t('menuOpt.fullFilePermission')
    case Permission.Admin:
      return t('menuOpt.securityPermission')
  }
}

watch(
  () => props.contentId,
  (newVal) => {
    getFolderPermission(newVal);
  },
);

onMounted(() => {
  getUserData();
  if (props.contentId) getFolderPermission(props.contentId);
});
</script>
<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 8px !important;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 0;
  overflow: hidden;

  .title {
    color: #2d2d2d;
    font-size: calc(var(--base--font--size--18) * var(--scale-factor));
    font-weight: bold;
    margin-right: 8px;
    max-width: 360px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .sub-title {
    color: #747683;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  }
}

.dialog-content {
  height: calc(100vh - 195px);
  max-height: 500px;
  display: flex;

  .setting-item {
    width: 250px;
    height: 100%;
    border-right: 1px solid #e3e6ea;
    padding: 26px 8px 0;

    .item {
      padding: 9px 16px;
      border-radius: 6px;
      color: #2d2d2d;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &.active {
        background-color: #3c6aff1a;
      }
    }
  }

  .cursor-context-menu {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .setting-content {
    padding: 26px 12px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .operate-bar {
      padding: 0 12px 10px;
      flex-shrink: 0;
      .item {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background-color: #e5e6e8;
          border-radius: 2px;
        }
      }
    }

    .staff-list {
      overflow-y: auto;
      height: calc(100% - 34px);
      padding-right: 12px;

      .staff-item {
        padding: 7px 12px;

        &:hover {
          background-color: #f5f5f5;
        }
      }
    }

    .avatar {
      width: 26px;
      height: 26px;
      border-radius: 4px;
      margin-right: 6px;
      overflow: hidden;
    }

    .label {
      max-width: 200px;
      color: #2d2d2d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .permission {
      font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    }
  }
}

/* 展开/收起过渡 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  height: 0 !important;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  height: auto;
}

/* 防止抖动 */
.child-list {
  transform-origin: top center;
}

/* 搜索框过渡动画 */
.fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.search-wrapper {
  position: relative;
  z-index: 1;
  width: 133px;
  overflow: hidden;
  :deep(.el-input) {
    width: 133px;
    height: 26px;

    .el-input__wrapper.is-focus {
      box-shadow: 0 0 0 1px #327edc inset;
    }

    .el-input__inner {
      height: 26px;
      line-height: 26px;
    }

    .el-input-group__prepend {
      padding: 0 4px;
      background-color: #fff;
      box-shadow:
        1px 0 0 0 #327edc inset,
        0 1px 0 0 #327edc inset,
        0 -1px 0 0 #327edc inset;
    }

    .el-input-group__append {
      padding: 0 4px;
      background-color: #fff;
      box-shadow:
        0 1px 0 0 #327edc inset,
        0 -1px 0 0 #327edc inset,
        -1px 0 0 0 #327edc inset;
    }

    .el-input__wrapper {
      box-shadow: 0 0 0 1px #327edc inset;
    }
  }
}
</style>
