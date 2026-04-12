<template>
  <div class="person-list">
    <van-search
      v-model="queryText"
      :placeholder="t('search')"
      @update:model-value="handleSearch"
    >
      <template #left-icon>
        <SvgIcon name="ic_search" size="22" />
      </template>
    </van-search>

    <van-cell v-for="(item, index) in filteredPermissionList" :key="index">
      <template #title>
        <div class="avatar-name">
          <div class="avatar">
            <AvatarBox
              v-if="item.avatar"
              class="avatar"
              :userId="item.userId"
              :avatar="item.avatar"
              :size="40"
            />
            <SvgIcon v-else name="ic_department" size="40" />
          </div>

          <div class="name">{{ item.label }}</div>
        </div>
      </template>
      <template #right-icon>
        <div class="permission" @click="showPermission(item)">
          <span>{{ getHighestPermission(item.permissionType).name }}</span>
          <span v-if="!isReadOnly(item)">
            <SvgIcon name="ic_arr_select" color="#999" />
          </span>
        </div>
      </template>
    </van-cell>
  </div>

  <van-action-sheet
    v-model:show="show"
    :title="t('permissionManagement')"
    :cancel-text="t('cancel')"
  >
    <div>
      <van-cell-group>
        <template v-for="item in permissionTypeList" :key="item.value">
          <van-cell v-if="!item.disabled" @click="setPermission(item)">
            <template #title>
              <span>{{ item.label }}</span>
              <span class="tips">{{ item.desc }}</span>
            </template>
            <template #right-icon>
              <span class="flex items-center">
                <SvgIcon
                  v-if="activePermissionType === item.value"
                  name="ic_check"
                />
              </span>
            </template>
          </van-cell>
        </template>

        <div v-if="hasPermission(userPermission, Permission.SuperAdmin)">
          <div class="van-action-sheet__gap"></div>
          <van-cell :title="t('transferSuperAdmin')" @click="setSuperAdmin" />
        </div>

        <div v-if="hasPermission(userPermission, Permission.Admin)">
          <div class="van-action-sheet__gap"></div>
          <van-cell @click="removePerson">
            <template #title>
              <span class="text-[#f5222d]">{{ t("remove") }}</span>
            </template>
          </van-cell>
        </div>
      </van-cell-group>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import {
  editFolderPermissionApi,
  getFolderPermissionApi,
  removeMemberApi,
  transferSuperAdminApi,
} from "@/api/common.ts";
import { getHighestPermission, Permission } from "@/enum/permission.ts";
import SvgIcon from "../../components/SvgIcon.vue";
import { hasPermission } from "@/utils";
import { t, setAppTitle } from "@/utils";
import AvatarBox from "@/views/components/h5/AvatarBox.vue";
import type { PermissionItem } from "@/types/type";
import PinyinMatch from "pinyin-match";

const route = useRoute();

const personList = ref<PermissionItem[]>([]);
const show = ref(false);
const permissionTypeList = ref([
  {
    label: t("menuOpt.admin"),
    key: Permission.Admin,
    value: Permission.Admin,
    desc: t("menuOpt.securityPermission"),
    disabled: false,
  },
  {
    label: t("menuOpt.editable"),
    key: Permission.Edit,
    value: Permission.Edit,
    desc: t("menuOpt.fullFilePermission"),
    disabled: false,
  },
  {
    label: t("menuOpt.uploadPermission"),
    key: Permission.Upload,
    value: Permission.Upload,
    desc: t("menuOpt.uploadDownloadShare"),
    disabled: false,
  },
  {
    label: t("menuOpt.sharable"),
    key: Permission.Share,
    value: Permission.Share,
    desc: t("menuOpt.viewDownloadShareOnly"),
    disabled: false,
  },
  {
    label: t("menuOpt.view"),
    key: Permission.View,
    value: Permission.View,
    desc: t("menuOpt.viewDownloadOnly"),
    disabled: false,
  },
]);
const originalPersonList = ref<PermissionItem[]>([]);
const activePermissionType = ref(0);
const selectedPerson = ref();
const queryText = ref("");
const userPermission = ref(0);

const contentId = computed(() => {
  return Number(route.query.contentId || 0);
});

const filteredPermissionList = computed(() => {
  let list = personList.value;

  return list.slice().sort((a, b) => {
    if (b.permissionType !== a.permissionType) {
      return b.permissionType - a.permissionType;
    }
    return 0;
  });
});

const isReadOnly = (item: PermissionItem) => {
  return (
    item.permissionType === Permission.SuperAdmin ||
    item.permissionType === userPermission.value ||
    !hasPermission(userPermission.value, Permission.Admin)
  );
};

const handleSearch = (value: string) => {
  queryText.value = value;

  const searchTerm = value.trim();

  if (!searchTerm) {
    personList.value = [...originalPersonList.value];
    return;
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);
  const hasPinyin = /[a-zA-Z]/.test(searchTerm);

  if (hasChinese && hasPinyin) {
    personList.value = [];
    return;
  }

  personList.value = originalPersonList.value.filter((item) => {
    return !!PinyinMatch.match(item.label, searchTerm);
  });
};

const showPermission = (value: PermissionItem) => {
  if (isReadOnly(value)) return;
  show.value = true;
  activePermissionType.value = value.permissionType;
  selectedPerson.value = value;
};

const getSpaceInfo = async () => {
  const res = await getFolderPermissionApi(contentId.value);
  if (res.code === 1) {
    personList.value = res.data.permissions;
    originalPersonList.value = res.data.permissions;
  }
};

const setPermissionApi = async (
  id: number,
  permissionType: number,
): Promise<number> => {
  return (await editFolderPermissionApi(id, permissionType)).code;
};

const setPermission = async (permission: Record<string, any>) => {
  show.value = false;
  if (permission.value === Permission.Admin) {
    showDialog({
      title: t("addAdmin"),
      message:
        t("confirmSetAdmin", { name: selectedPerson.value.label }) +
        t("confirmSetAdminExtra"),
      showCancelButton: true,
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
      width: "80%",
    })
      .then(async () => {
        activePermissionType.value = permission.value;
        const code = await setPermissionApi(
          selectedPerson.value.id,
          permission.value,
        );
        if (code === 1) {
          showToast({
            message: t("setSuccess"),
            type: "success",
          });
          show.value = false;
          await getSpaceInfo();
        }
      })
      .catch(() => {
        return;
      });
  } else {
    const code = await setPermissionApi(
      selectedPerson.value.id,
      permission.value,
    );
    if (code === 1) {
      activePermissionType.value = permission.value;
      await getSpaceInfo();
    }
  }
};

const setSuperAdmin = async () => {
  show.value = false;
  showDialog({
    title: t("transferSuperAdmin"),
    message:
      t("confirmTransferSuperAdmin", {
        name: selectedPerson.value.label,
      }) + t("confirmTransferSuperAdminExtra"),
    showCancelButton: true,
    confirmButtonText: t("Ok"),
    cancelButtonText: t("cancel"),
    width: "80%",
  })
    .then(async () => {
      const res = await transferSuperAdminApi(
        selectedPerson.value.userId,
        contentId.value,
      );
      if (res.code === 1) {
        showToast({
          message: t("operationSuccess"),
          type: "success",
        });
        await getSpaceInfo();
      }
    })
    .catch(() => {
      return;
    });
};

const removePerson = async () => {
  show.value = false;
  showDialog({
    title: t("removeMember"),
    message: t("confirmRemoveMember", {
      name: selectedPerson.value.label,
    }),
    showCancelButton: true,
    confirmButtonText: t("Ok"),
    cancelButtonText: t("cancel"),
    width: "80%",
  })
    .then(async () => {
      const res = await removeMemberApi(
        selectedPerson.value.id,
        contentId.value,
      );
      if (res.code === 1) {
        showToast({
          message: t("operationSuccess"),
          type: "success",
        });
        await getSpaceInfo();
      }
    })
    .catch(() => {
      return;
    });
};

watchEffect(() => {
  userPermission.value = parseInt(route.query.permissionType as string);
  getSpaceInfo();
  setAppTitle(t("permissionSettings"));
});
</script>

<style scoped lang="scss">
:deep(.van-search__content) {
  background-color: #f2f4f7;
  border-radius: 4px;
}

:deep(.van-search__action) {
  color: #747683;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
}

:deep(.van-field__control) {
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  &::placeholder {
    color: #747683;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  }
}

.person-list {
  max-height: 100vh;
  overflow-y: auto;
}

.avatar-name {
  display: flex;
  align-items: center;

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    margin-right: 12px;
  }

  .name {
    max-width: calc(100vw - 160px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.permission {
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips {
  color: #999999;
  margin-left: 8px;
}
</style>
