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
      <van-cell
        v-for="item in filteredUserList"
        :key="item.id"
        @click="toggleUser(item)"
      >
        <template #title>
          <div class="avatar-name">
            <div class="avatar">
              <AvatarBox
                class="avatar"
                :userId="item.userId"
                :avatar="item.avatar"
                :size="40"
              />
            </div>
            <div class="name">{{ item.label }}</div>
          </div>
        </template>
        <template #right-icon>
          <van-checkbox
            :model-value="selectedUserIds.includes(item.userId || 0)"
            @click.stop="toggleUser(item)"
          />
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
import { setAppTitle, t } from "@/utils";
import { usePageUtils } from "@/stores";
import AvatarBox from "@/views/h5/SpaceInfo/component/AvatarBox.vue";
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

const handleConfirm = async () => {
  const existing = new Set(existingNotifyIds.value);
  const nextUserIds = selectedUserIds.value.filter(
    (userId) => !existing.has(userId),
  );

  if (!nextUserIds.length) {
    router.go(-1);
    return;
  }

  const res = await addFolderNotifyUsersApi(contentId.value, nextUserIds);
  if (res.code === 1) {
    showToast({
      message: t("operationSuccess"),
      type: "success",
    });
    usePageUtils().setAddMember(true);
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

.add-notify-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 72px;
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
    max-width: calc(100vw - 120px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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
