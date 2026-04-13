<template>
  <div class="notify-list-page">
    <van-search
      v-model="queryText"
      :placeholder="t('search')"
      @update:model-value="handleSearch"
    >
      <template #left-icon>
        <SvgIcon name="ic_search" size="22" />
      </template>
    </van-search>

    <van-cell
      v-if="hasPermission(userPermission, Permission.Admin)"
      :title="t('addNotifyUsers')"
      is-link
      @click="goAddNotifyUser"
    />

    <van-cell v-for="item in filteredNotifyList" :key="item.id">
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
        <div
          class="permission"
          :class="{
            disabled: !hasPermission(userPermission, Permission.Admin),
          }"
          @click="handleRemoveNotifyUser(item)"
        >
          <span v-if="hasPermission(userPermission, Permission.Admin)">{{
            hasPermission(userPermission, Permission.Admin)
              ? t("remove")
              : t("noPermission")
          }}</span>
        </div>
      </template>
    </van-cell>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getFolderPermissionApi,
  removeFolderNotifyUsersApi,
} from "@/api/common.ts";
import { Permission } from "@/enum/permission.ts";
import SvgIcon from "../../components/SvgIcon.vue";
import { hasPermission, setAppTitle, t } from "@/utils";
import AvatarBox from "@/views/components/h5/AvatarBox.vue";
import type { PermissionItem } from "@/types/type";
import PinyinMatch from "pinyin-match";

const route = useRoute();
const router = useRouter();

const notifyList = ref<PermissionItem[]>([]);
const originalNotifyList = ref<PermissionItem[]>([]);
const queryText = ref("");
const userPermission = ref(0);

const contentId = computed(() => Number(route.query.contentId || 0));

const filteredNotifyList = computed(() => {
  const list = notifyList.value;
  return [...list].sort((a, b) => {
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
    notifyList.value = [...originalNotifyList.value];
    return;
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);
  const hasPinyin = /[a-zA-Z]/.test(searchTerm);

  if (hasChinese && hasPinyin) {
    notifyList.value = [];
    return;
  }

  notifyList.value = originalNotifyList.value.filter((item) => {
    return !!PinyinMatch.match(item.label, searchTerm);
  });
};

const getNotifyList = async () => {
  const res = await getFolderPermissionApi(contentId.value);
  if (res.code === 1) {
    const list = (res.data.permissions || []).filter(
      (item: PermissionItem) => !!item.userId && item.isNotify,
    );
    notifyList.value = list;
    originalNotifyList.value = list;
    userPermission.value = res.data.permissionType;
  }
};

const goAddNotifyUser = () => {
  if (!hasPermission(userPermission.value, Permission.Admin)) return;
  router.push({
    path: "/add-notify-user",
    query: {
      contentId: contentId.value,
      permissionType: userPermission.value,
    },
  });
};

const handleRemoveNotifyUser = async (item: PermissionItem) => {
  if (!hasPermission(userPermission.value, Permission.Admin) || !item.userId)
    return;

  showDialog({
    title: t("remove"),
    message: t("confirmRemoveNotifyUser"),
    showCancelButton: true,
    confirmButtonText: t("Ok"),
    cancelButtonText: t("cancel"),
    width: "80%",
  })
    .then(async () => {
      const res = await removeFolderNotifyUsersApi(contentId.value, [
        item.userId!,
      ]);
      if (res.code === 1) {
        showToast({
          message: t("removeSuccess"),
          type: "success",
        });
        await getNotifyList();
      }
    })
    .catch(() => {
      return;
    });
};

watchEffect(() => {
  getNotifyList();
  setAppTitle(t("notifyUsers"));
});
</script>

<style scoped lang="scss">
.van-search {
  border-bottom: 1px solid var(--input-border-color);
}

:deep(.van-search__content) {
  background-color: var(--input-bg-color);
  border-radius: 4px;
}

:deep(.van-search__action) {
  color: var(--text-secondary-color);
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
}

:deep(.van-field__control) {
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  &::placeholder {
    color: var(--text-secondary-color);
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  }
}

:deep(.van-badge__wrapper) {
  line-height: 24px;
  padding-top: 1px;
}

.notify-list-page {
  height: 100vh;
  overflow-y: auto;
  background: var(--page-bg);
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
  color: var(--text-weak-color);
  display: flex;
  align-items: center;
  gap: 8px;

  &.disabled {
    color: var(--text-weak-color);
  }
}
</style>
