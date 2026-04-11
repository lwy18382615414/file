<template>
  <div class="add-notify-page">
    <van-search
      v-model="queryText"
      :placeholder="t('search')"
      @update:model-value="handleSearch"
    >
      <template #left-icon>
        <SvgIcon name="ic_search" size="22" />
      </template>
    </van-search>

    <div class="list-wrap">
      <van-cell class="list-header" @click="toggleAllUsers">
        <template #title>
          <div class="list-header-content">
            <span class="list-header-title">
              {{ t("addableUsers", { count: filteredUserList.length }) }}
            </span>
          </div>
        </template>
        <template #right-icon>
          <van-checkbox
            :model-value="isAllVisibleSelected"
            @click.stop="toggleAllUsers"
          />
        </template>
      </van-cell>

      <van-cell
        v-for="item in filteredUserList"
        :key="item.id"
        class="user-item"
        @click="toggleUser(item)"
      >
        <template #title>
          <div class="user-row">
            <div class="user-main">
              <van-checkbox
                :model-value="selectedUserIds.includes(item.userId || 0)"
                @click.stop="toggleUser(item)"
              />
              <div class="avatar-wrap">
                <AvatarBox
                  :userId="item.userId"
                  :avatar="item.avatar"
                  :size="40"
                />
              </div>
              <div class="name">{{ item.label }}</div>
            </div>
            <div class="permission-name">
              {{ getHighestPermission(item.permissionType).name }}
            </div>
          </div>
        </template>
      </van-cell>
    </div>

    <div class="footer">
      <van-button block type="primary" @click="handleConfirm">
        {{ t("Ok")
        }}<template v-if="selectedUserIds.length"
          >({{ selectedUserIds.length }})</template
        >
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { addFolderNotifyUsersApi, getFolderPermissionApi } from "@/api/common";
import SvgIcon from "@/components/SvgIcon.vue";
import { getHighestPermission } from "@/enum/permission";
import { setAppTitle, t } from "@/utils";
import AvatarBox from "@/views/components/h5/spaceInfo/AvatarBox.vue";
import type { PermissionItem } from "@/types/type";
import PinyinMatch from "pinyin-match";

const route = useRoute();
const router = useRouter();

const queryText = ref("");
const userList = ref<PermissionItem[]>([]);
const originalUserList = ref<PermissionItem[]>([]);
const selectedUserIds = ref<number[]>([]);
const existingNotifyIds = ref<number[]>([]);

const contentId = computed(() => Number(route.query.contentId || 0));

const filteredUserList = computed(() => {
  return [...userList.value].sort((a, b) => {
    if (b.permissionType !== a.permissionType) {
      return b.permissionType - a.permissionType;
    }
    return 0;
  });
});

const visibleUserIds = computed(() => {
  return filteredUserList.value
    .map((item) => item.userId)
    .filter((userId): userId is number => !!userId);
});

const isAllVisibleSelected = computed(() => {
  return (
    !!visibleUserIds.value.length &&
    visibleUserIds.value.every((userId) =>
      selectedUserIds.value.includes(userId),
    )
  );
});

const handleSearch = (value: string) => {
  queryText.value = value;
  const searchTerm = value.trim();

  if (!searchTerm) {
    userList.value = [...originalUserList.value];
    return;
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);
  const hasPinyin = /[a-zA-Z]/.test(searchTerm);

  if (hasChinese && hasPinyin) {
    userList.value = [];
    return;
  }

  userList.value = originalUserList.value.filter((item) => {
    return !!PinyinMatch.match(item.label, searchTerm);
  });
};

const getUserList = async () => {
  const res = await getFolderPermissionApi(contentId.value);
  if (res.code === 1) {
    const permissions = res.data.permissions || [];
    const members = permissions.filter((item: PermissionItem) => !!item.userId);
    userList.value = members;
    originalUserList.value = members;
    existingNotifyIds.value = members
      .filter((item) => item.isNotify && item.userId)
      .map((item) => item.userId as number);
    selectedUserIds.value = [...existingNotifyIds.value];
  }
};

const toggleUser = (item: PermissionItem) => {
  if (!item.userId) return;
  if (selectedUserIds.value.includes(item.userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(
      (id) => id !== item.userId,
    );
    return;
  }
  selectedUserIds.value.push(item.userId);
};

const toggleAllUsers = () => {
  const visibleIds = visibleUserIds.value;
  if (!visibleIds.length) return;

  if (isAllVisibleSelected.value) {
    selectedUserIds.value = selectedUserIds.value.filter(
      (userId) => !visibleIds.includes(userId),
    );
    return;
  }

  selectedUserIds.value = Array.from(
    new Set([...selectedUserIds.value, ...visibleIds]),
  );
};

const handleConfirm = async () => {
  if (!selectedUserIds.value.length) {
    router.go(-1);
    return;
  }

  const res = await addFolderNotifyUsersApi(
    contentId.value,
    selectedUserIds.value,
  );
  if (res.code === 1) {
    showToast({
      message: t("operationSuccess"),
      type: "success",
    });
    router.go(-1);
  }
};

watchEffect(() => {
  getUserList();
  setAppTitle(t("addNotifyUsers"));
});
</script>

<style scoped lang="scss">
:deep(.van-search__content) {
  background-color: #f2f4f7;
  border-radius: 4px;
}

:deep(.van-checkbox__icon .van-icon) {
  border-color: #c8ccd4;
}

:deep(.list-header .van-cell__title),
:deep(.user-item .van-cell__title) {
  flex: 1;
}

:deep(.list-header .van-cell__value),
:deep(.user-item .van-cell__value) {
  display: none;
}

.add-notify-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 72px;
}

.list-wrap {
  background: #fff;
}

.list-header-content {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.list-header-title {
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  color: #222;
  font-weight: 500;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.user-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.avatar-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 12px;
  flex-shrink: 0;
}

.avatar-wrap :deep(.avatar) {
  display: block;
  width: 40px;
  height: 40px;
  margin-right: 0;
}

.name {
  min-width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  color: #222;
}

.permission-name {
  flex-shrink: 0;
  max-width: 96px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #999;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
</style>
