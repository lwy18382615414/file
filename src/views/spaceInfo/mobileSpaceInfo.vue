<template>
  <div class="space-setting-page">
    <div class="person-info">
      <div ref="personListRef" class="space-person">
        <div
          v-for="item in [...personList].slice(0, staffCount)"
          :key="item.id"
          class="item-person"
        >
          <div class="avatar">
            <div v-if="item.avatar" class="avatar-img">
              <AvatarBox
                class="avatar"
                :userId="item.userId"
                :avatar="item.avatar"
                :size="48"
              />
            </div>
            <SvgIcon v-else name="ic_department" size="48" />
            <div class="name">{{ item.label }}</div>
          </div>
        </div>
        <template v-if="hasPermission(permissionType, Permission.Admin)">
          <component
            :is="getFromApp() ? 'div' : 'router-link'"
            class="item-person add-button"
            :to="!getFromApp() && { path: '/add-staff', query: { contentId } }"
            v-on="getFromApp() ? { click: toAppSelect } : {}"
          >
            <div class="avatar">
              <div
                class="avatar-img"
                :style="{ borderRadius: isSgMode ? '50%' : '0.5rem' }"
              ></div>
            </div>
          </component>
        </template>
      </div>
      <van-cell
        :title="t('viewAllMembers')"
        is-link
        class="person-cell"
        :value="personCount"
        @click="toStaffList(contentId, permissionType)"
      />
      <van-cell
        :title="t('notifyUsers')"
        is-link
        class="person-cell"
        :value="notifyCount"
        @click="toNotifyList(contentId, permissionType)"
      />
    </div>
    <div class="divider"></div>
    <div class="space-info">
      <van-cell
        :title="t('folderName')"
        :is-link="hasPermission(permissionType, Permission.SuperAdmin)"
        class="name-cell"
        :value="title"
        @click="renameSpace"
      >
        <template #value>
          <div class="custom-title">{{ title }}</div>
        </template>
      </van-cell>

      <van-cell :title="t('pinFolder')">
        <template #right-icon>
          <van-switch v-model="checked" size="20" @change="changeTop" />
        </template>
      </van-cell>
    </div>

    <div class="btn-group">
      <van-button class="exit-button" block @click="exitSpace">
        <template #default>
          <span>{{ t("exit") }}</span>
        </template>
      </van-button>
      <div class="line"></div>
      <van-button
        v-if="
          permissionType && hasPermission(permissionType, Permission.SuperAdmin)
        "
        class="delete-button"
        block
        @click="deleteSpace"
      >
        <template #default>
          <span>{{ t("delete") }}</span>
        </template>
      </van-button>
    </div>
  </div>
  <NameEditPopup
    :show="rename.show"
    :item="rename.entryInfo"
    mode="rename"
    @update:show="rename.show = $event"
    @confirm="confirmRename"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  addFolderPermissionApi,
  cancelTopSpaceApi,
  exitSpaceApi,
  getFolderPermissionApi,
  topSpaceApi,
} from "@/api/common";
import NameEditPopup from "@/views/components/h5/pop/NameEditPopup.vue";
import { deleteFileOrDirApi, renameFileApi } from "@/api/fileService";
import {
  h5SelectPersonResult,
  hasPermission,
  hideAppButton,
  hideAppButton2,
  setAppTitle,
  t,
} from "@/utils";
import { Permission } from "@/enum/permission";
import { usePageUtils } from "@/stores";
import { getFromApp, getMyUserInfo } from "@/utils/auth";
import { setRem } from "@/utils/rem";
import AvatarBox from "@/views/components/h5/AvatarBox.vue";

const { scaleRatio } = setRem();
const router = useRouter();
const route = useRoute();
const personList = ref<Record<string, any>[]>([]);
const checked = ref(false);
const personListRef = ref();
const staffCount = ref(0);
const rename = reactive({
  show: false,
  entryInfo: {} as any,
});
const title = ref("");
const permissionType = ref(0);
const personCount = ref(0);
const notifyCount = ref(0);

const contentId = computed<number>(() => {
  const queryId = route.query.contentId;
  return typeof queryId === "string" ? Number(queryId) : 0;
});

const isSgMode = import.meta.env.MODE === "SG";

const toStaffList = (contentId: number, permissionType: number) => {
  router.push({
    path: "/space-staff",
    query: { contentId, permissionType },
  });
};

const toNotifyList = (contentId: number, permissionType: number) => {
  router.push({
    path: "/space-notify",
    query: { contentId, permissionType },
  });
};

// 去app选择人员
const toAppSelect = () => {
  const createPersonData = (person: Record<string, any>) => ({
    englishName: person.englishName || "",
    nickName: person.label || "",
    jobnumber: person.jobnumber || "",
    pinyin: person.pinyin || "",
    userId: person.userId,
    avatar: person.avatar || "",
    orgJson: [{ orgId: person.orgId, orgName: person.orgName || "" }],
  });

  const selectedPerson = personList.value.map(createPersonData);
  const myUserInfo = getMyUserInfo();
  const mustPerson = personList.value
    .filter(
      (p) =>
        p.permissionType === Permission.SuperAdmin ||
        p.userId === myUserInfo.userId ||
        p.permissionType === permissionType.value,
    )
    .map(createPersonData);

  const pushRoute = () =>
    router.push({
      path: "/add-staff",
      query: { contentId: contentId.value },
    });

  h5SelectPersonResult(true, selectedPerson, mustPerson, setDataCallBack)
    .then((useH5) => useH5 && pushRoute())
    .catch(pushRoute);
};

const setDataCallBack = async (data: string) => {
  const selectedPerson = JSON.parse(data);

  const res = await addFolderPermissionApi(
    contentId.value,
    selectedPerson,
    Permission.View,
  );
  if (res.code === 1) {
    showToast({
      type: "success",
      message: t("operationSuccess"),
    });
    await getSpaceInfo();
  }
};
// 退出文件夹
const exitSpace = () => {
  if (permissionType.value === Permission.SuperAdmin) {
    showDialog({
      title: t("exitRootDir"),
      message: t("superAdminTransferWarning"),
      showCancelButton: true,
      confirmButtonColor: "#f5222d",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
      width: "80%",
    }).then(async () => {
      router.push({
        path: "/space-staff",
        query: {
          contentId: contentId.value,
          permissionType: permissionType.value,
        },
      });
    });
  } else {
    showDialog({
      title: t("exitRootDir"),
      message: t("exitFolderWarning"),
      showCancelButton: true,
      confirmButtonColor: "#f5222d",
      confirmButtonText: t("Ok"),
      cancelButtonText: t("cancel"),
      width: "80%",
    }).then(async () => {
      const res = await exitSpaceApi(contentId.value!);
      console.log(res);
      if (res.code === 1) {
        showToast({
          type: "success",
          message: t("exitSuccess"),
        });
        await router.replace("/share-space");
      } else {
        showToast({
          type: "fail",
          message: t("exitFailed"),
        });
      }
    });
  }
};

// 解散文件夹
const deleteSpace = () => {
  if (!permissionType.value) return;
  if (!hasPermission(permissionType.value, Permission.SuperAdmin)) return;
  showDialog({
    title: t("deleteRootDir"),
    message: t("deleteRootDirWarning"),
    showCancelButton: true,
    confirmButtonColor: "#f5222d",
    confirmButtonText: t("Ok"),
    cancelButtonText: t("cancel"),
    width: "80%",
  }).then(async () => {
    const res = await deleteFileOrDirApi([contentId.value]);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("deleteSuccess"),
      });
      await router.replace("/share-space");
    } else {
      showToast({
        type: "fail",
        message: "删除失败, 请先转让权限",
      });
    }
  });
};

// 置顶文件夹
const changeTop = async (value: boolean) => {
  if (value) {
    const res = await topSpaceApi(contentId.value);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("pinSuccess"),
      });
    }
  } else {
    const res = await cancelTopSpaceApi(contentId.value);
    if (res.code === 1) {
      showToast({
        type: "success",
        message: t("unpinSuccess"),
      });
    }
  }
};

// 重命名文件夹
const renameSpace = () => {
  if (hasPermission(permissionType.value, Permission.SuperAdmin)) {
    rename.show = true;
    rename.entryInfo = {
      isFolder: true,
      name: title.value,
      contentId: contentId.value,
    };
  } else {
    showToast({
      message: t("noPermission"),
      type: "fail",
    });
  }
};

const confirmRename = async (spaceName: string) => {
  if (!spaceName) return;
  const res = await renameFileApi(contentId.value, spaceName);
  if (res.code === 1) {
    showToast({
      type: "success",
      message: t("renameSuccess"),
    });
    title.value = spaceName;
    rename.show = false;
  }
};

// 获取文件夹信息
const getSpaceInfo = async () => {
  const res = await getFolderPermissionApi(contentId.value);
  if (res.code === 1) {
    personList.value = res.data.permissions;
    title.value = res.data.name;
    checked.value = res.data.isSetTop;
    permissionType.value = res.data.permissionType;
    personCount.value = res.data.personCount;
    notifyCount.value = res.data.permissions.filter(
      (item: { isNotify?: boolean; userId?: number }) =>
        item.isNotify && item.userId,
    ).length;

    countStaffNum();
  } else {
    personList.value = [];
    title.value = "";
    checked.value = false;
    notifyCount.value = 0;
  }
};

// 计算人员列表宽度
const countStaffNum = () => {
  const width = personListRef.value.offsetWidth;
  const padding = 26 * scaleRatio;
  const itemWidth = 48 * scaleRatio;
  const gap = 16 * scaleRatio;

  staffCount.value =
    Math.floor((width - padding * 2 + gap) / (itemWidth + gap)) * 3;
  if (hasPermission(permissionType.value, Permission.Admin)) {
    staffCount.value -= 1;
  }
};

watch(
  () => usePageUtils().isAddMember,
  async (newVal: boolean) => {
    if (newVal) {
      await getSpaceInfo();
      usePageUtils().setAddMember(false);
    } else {
      return;
    }
  },
  { immediate: true },
);

onMounted(() => {
  getSpaceInfo();
  setAppTitle(t("folderSettings"));
  hideAppButton2();
  hideAppButton();
});
</script>

<style scoped lang="scss">
.space-setting-page {
  height: 100vh;
}

:deep(.van-cell__title) {
  white-space: nowrap;
}

.person-info {
  border-radius: 4px;
  overflow: hidden;
}

.space-person {
  padding: 26px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 48px);
  grid-auto-rows: 74px;
  gap: 16px;
  max-height: calc(74px * 3 + 16px + 26px * 2); /* = 296px */
  overflow: hidden;
  justify-content: space-around;
  position: relative;

  .item-person {
    &.add-button {
      .avatar-img {
        border: 1px dashed #999;
        position: relative;

        &::after {
          content: "+";
          font-size: calc(var(--base--font--size--24) * var(--scale-factor));
          color: #999;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }

    .avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .name {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        max-width: 48px;
        margin-top: 4px;
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));
        color: #747683;
        text-align: center;
      }
    }
  }

  &::after {
    position: absolute;
    box-sizing: border-box;
    content: " ";
    pointer-events: none;
    right: 0;
    bottom: 0;
    left: 0;
    border-bottom: 1px solid #ebedf0;
    transform: scaleY(0.5);
  }
}

.person-cell,
.name-cell {
  :deep(.van-badge__wrapper) {
    line-height: 24px;
    padding-top: 1px;
  }
}

.avatar-img {
  width: 48px;
  height: 48px;
  overflow: hidden;
}

.divider {
  width: 100%;
  height: 12px;
  background-color: #f9f9fa;
}
.space-info {
  border-radius: 4px;
  overflow: hidden;
}

.btn-group {
  width: 100%;
  margin-top: 20px;
  border-radius: 4px;
  overflow: hidden;
  padding: 0 16px;

  :deep(.van-button--default) {
    border: none;
    color: #2d2d2d;
    padding: 0 16px;
    border-radius: 8px;

    &.exit-button {
      background: #ef5e5e1a;
      margin-bottom: 16px;

      .van-button__text {
        font-size: calc(var(--base--font--size--16) * var(--scale-factor));
        color: #ef5e5e;
      }
    }

    &.delete-button {
      background: #7476831a;
    }
  }
}

.custom-title {
  max-width: 50vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
