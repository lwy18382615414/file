<template>
  <div class="contacts-list">
    <div class="input-box">
      <el-input
        class="contact-input"
        v-model="searchKey"
        :placeholder="t('search')"
        @input="handleSearch"
      >
        <template #prefix>
          <SvgIcon name="ic_search" size="20px" />
        </template>
      </el-input>
    </div>
    <div class="search-popup" v-show="searchKey">
      <div
        class="anchor-item"
        v-for="item in searchList"
        :key="item.userId"
        @click="searchChooseContact(item)"
      >
        <div class="choose" :key="item.check">
          <div class="no-choose" v-show="!item.check"></div>
          <div class="already-choose" v-show="item.check">
            <div class="white-point"></div>
          </div>
        </div>
        <div class="img">
          <AvatarBox class="avatar" :avatar="item.avatar"></AvatarBox>
        </div>
        <div class="info-box">
          <div class="name">{{ item.nickName }}</div>
          <div v-if="item.orgName" class="org-info-box">
            {{ getOrgLabel(item) }}
          </div>
        </div>
      </div>
    </div>
    <div class="contacts-box" v-show="!searchKey">
      <div v-if="showAddressBook" class="contacts-container">
        <div @click="goChoose(contactList[0].id)" class="go-choose-box">
          <img
            class="address-icon"
            src="@/assets/images/address-book.png"
            alt=""
          />
          <div class="name">企业通讯录</div>
        </div>
      </div>
      <div v-else class="contacts-container" :key="id">
        <template v-if="hasChildOrUser(contactsData)">
          <div
            class="anchor-item"
            v-show="item.isShow"
            v-for="item in contactsData?.user"
            :key="item.userId"
            @click="chooseContactByChat(item)"
          >
            <div class="choose">
              <ChooseStatusBox :is-choose="userIsChoose(item)" />
            </div>
            <AvatarBox :avatar="item.avatar" :key="item.avatar"></AvatarBox>
            <div class="name">{{ item.nickName }}</div>
          </div>
          <div
            class="anchor-item"
            v-show="item.isShow"
            v-for="item in contactsData?.children"
            :key="item.id"
            @click.stop="chooseDepart(item)"
          >
            <div class="choose-depart-box">
              <div @click.stop="chooseDepartAllUser(item)" class="choose">
                <ChooseStatusBox :is-choose="departIsChoose(item)" />
              </div>
              <div class="img">
                <img src="@/assets/images/department-icon.svg" alt="" />
              </div>
              <div class="name">{{ item.orgName }}</div>
              <SvgIcon name="ic_right_bold" />
            </div>
          </div>
        </template>
        <template v-else>
          <div
            class="empty-box w-full h-full flex flex-col justify-center items-center"
          >
            <img src="@/assets/images/empty_rectcle.png" />
            <p class="mt-1.5 text-gray-400 text-sm">暂无数据</p>
          </div>
        </template>
      </div>
    </div>
    <ContactsBottom
      :optionUserList="optionUserList"
      :need-show-confirm="needShowConfirm"
      @deleteData="handleDelete"
      @emitData="handleConfirm"
    ></ContactsBottom>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { t } from "@/utils";
import AvatarBox from "@/views/components/h5/spaceInfo/AvatarBox.vue";
import ChooseStatusBox from "@/views/components/h5/spaceInfo/ChooseStatusBox.vue";
import ContactsBottom from "@/views/components/h5/spaceInfo/ContactsBottom.vue";
import {
  addFolderPermissionApi,
  getFolderPermissionApi,
  getUserTreeApi,
} from "@/api/common";
import { Permission } from "@/enum/permission";
import { usePageUtils } from "@/stores";
import {
  hideAppButton,
  isJsonStr,
  setAppTitle,
  showNavLeftCloseBtn,
} from "@/utils";
import { getMyUserInfo } from "@/utils/auth";

const route = useRoute();
const router = useRouter();
const searchKey = ref("");
const showAddressBook = ref(true);
const contactList = ref<Array<Record<string, any>>>([]);
const optionUserList = ref<Array<Record<string, any>>>([]);
const id = ref("");
const historyLevelIds = ref<Array<{ id: string }>>([]);
const contactsData = ref<Record<string, any> | undefined>({});
const needShowConfirm = ref(true);
const myUserInfo = getMyUserInfo();
const contentId = computed(() => {
  return route.query.contentId || "";
});

const hasChildOrUser = (item: Record<string, any>) => {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const hasUser = Array.isArray(item.user) && item.user.length > 0;

  return !(!hasChildren && !hasUser);
};

const superAdmin = ref<Record<string, any>>({});

const searchList = ref<Record<string, any>[]>([]);

const goChoose = (selectedId: string) => {
  if (selectedId) {
    historyLevelIds.value.push({ id: selectedId });
    id.value = selectedId;
  }
  contactsData.value = findItemById(id.value, contactList.value);
  showAddressBook.value = false;
};

const getUserData = async () => {
  const res = await getUserTreeApi();
  if (res.code === 1) {
    contactList.value = res.data;
  }
};

const getAlReadyChooseList = async () => {
  const res = await getFolderPermissionApi(
    typeof contentId.value === "string" ? contentId.value : ""
  );
  if (res.code === 1) {
    optionUserList.value = res.data.permissions;
    superAdmin.value = res.data.permissions.find(
      (item: Record<string, any>) =>
        item.permissionType === Permission.SuperAdmin
    );
  }
};

const getUserBySearchKey = (searchKey: string, list = contactList.value) => {
  if (!searchKey) return [];
  let res: any[] = [];
  for (let i in list) {
    const users = list[i].user || [];
    users.forEach((item) => {
      if ((item.nickName || "").includes(searchKey) && item.isSearch) {
        if (!item.orgId) {
          item.orgId = list[i].id;
          item.orgName = list[i].orgName;
        }
        res.push(item);
      }
    });
    if (list[i].children) {
      const r = getUserBySearchKey(searchKey, list[i].children);
      res = res.concat(r);
    }
  }
  let l = [];
  return res.filter((item) => {
    if (l.includes(item.userId)) {
      return false;
    }
    l.push(item.userId);
    return true;
  });
};

const getOrgLabel = (item: Record<string, any>) => {
  let orgName = item.orgName;
  if (isJsonStr(item.orgJson)) {
    let orgs = JSON.parse(item.orgJson);
    if (orgs.length > 0) {
      orgName = orgs[0].orgName;
    }
  }
  if (item.postName) {
    return `${orgName}/${item.postName}`;
  }
  return orgName;
};

const handleSearch = (key: string) => {
  searchList.value = setCheckStatus(getUserBySearchKey(key));
};

function setCheckStatus(userList: Record<string, any>[]) {
  const _alreadyChooseList = optionUserList.value || [];
  return userList.map((item) => {
    return {
      ...item,
      check: _alreadyChooseList.find((i) => i.userId === item.userId),
    };
  });
}

const findItemById = (
  id: string,
  list: Array<Record<string, any>> = contactList.value
): Record<string, any> | undefined => {
  for (const item of list) {
    if (item.id === id) {
      return item;
    }
    if (item.children && Array.isArray(item.children)) {
      const result = findItemById(id, item.children);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

const backToLastLevel = () => {
  historyLevelIds.value.pop();
  if (historyLevelIds.value.length > 0) {
    id.value = historyLevelIds.value[historyLevelIds.value.length - 1].id;
    contactsData.value = findItemById(id.value, contactList.value);
  } else {
    showAddressBook.value = true;
    id.value = "";
    if (historyLevelIds.value.length === 0) {
      closeChoose();
    }
  }
};

window.userLeftBackClick = backToLastLevel;

const chooseContactByChat = (item: Record<string, string>) => {
  chooseContact(item);
};

const chooseContact = (item: Record<string, string>) => {
  if (superAdmin.value && superAdmin.value.userId === item.userId) return;
  if (myUserInfo && myUserInfo.userId === item.userId) return;
  let index = optionUserList.value.findIndex((i) => i.userId === item.userId);
  if (index !== -1) {
    optionUserList.value.splice(index, 1);
  } else {
    optionUserList.value.push(item);
  }
};

const chooseDepart = (item: Record<string, any>) => {
  goChoose(item.id);
};

const userIsChoose = (item: Record<string, any>) => {
  let index = optionUserList.value.findIndex((i) => i.userId === item.userId);
  return index !== -1 ? "2" : "0";
};

const departIsChoose = (item: Record<string, any>) => {
  let departAllUsers = findAllUsers(item);
  let hasArr = optionUserList.value.filter((itemA) => {
    let index = departAllUsers.findIndex((i) => i.userId === itemA.userId);
    return index !== -1;
  });
  if (departAllUsers.length === 0) {
    return "0";
  }
  if (hasArr.length === departAllUsers.length) {
    return "2";
  } else if (hasArr.length > 0) {
    return "1";
  } else {
    return "0";
  }
};

const chooseDepartAllUser = (
  item: Record<string, any>,
  chooseStatus?: string
) => {
  if (item.user) {
    if (!chooseStatus) {
      chooseStatus = departIsChoose(item);
    }
    setDepartUser(item, chooseStatus);
    if (item.childeren) {
      item.childeren.forEach((itemC) => {
        chooseDepartAllUser(itemC, chooseStatus);
      });
    }
  }
};

const setDepartUser = (item: Record<string, any>, chooseStatus: string) => {
  if (item.user) {
    if (chooseStatus === "0") {
      item.user.forEach((itemU) => {
        chooseUserByClickDepart(itemU);
      });
    } else if (chooseStatus === "1") {
      item.user.forEach((itemU) => {
        let index = optionUserList.value.findIndex(
          (i) => i.userId === itemU.userId
        );
        if (index === -1) {
          chooseUserByClickDepart(itemU);
        }
      });
    } else {
      item.user.forEach((itemU) => {
        let index = optionUserList.value.findIndex(
          (i) => i.userId === itemU.userId
        );
        if (index !== -1) {
          optionUserList.value.splice(index, 1);
        }
      });
    }
  }
};

const chooseUserByClickDepart = (userItem: Record<string, any>) => {
  let index = optionUserList.value.findIndex(
    (i) => i.userId === userItem.userId
  );
  if (index === -1 && userItem.isShow) {
    optionUserList.value.push(userItem);
  }
};

const searchChooseContact = (item: Record<string, any>) => {
  item.check = !item.check;
  chooseContact(item);
};

const findAllUsers = (item: Record<string, any>) => {
  let arr: Record<string, any>[] = [];
  let noRepeat: Record<string, any>[] = [];
  if (item.user) {
    arr = arr.concat(item.user);
  }
  if (item.children) {
    item.children.forEach((itemC: Record<string, any>) => {
      arr = arr.concat(findAllUsers(itemC));
    });
  }
  arr.forEach((item) => {
    let index = noRepeat.findIndex((i) => i.userId === item.userId);
    if (index === -1) {
      noRepeat.push(item);
    }
  });
  return noRepeat;
};

const handleDelete = (list: Array<Record<string, any>>) => {
  optionUserList.value = list;
};

const handleConfirm = async (selectedList: Array<Record<string, any>>) => {
  const res = await addFolderPermissionApi(
    parseInt(contentId.value.toString()),
    selectedList,
    Permission.View
  );
  if (res.code === 1) {
    showToast({ message: t("addSuccess"), type: "success" });
    usePageUtils().setAddMember(true);
    router.go(-1);
  }
};

const closeChoose = () => {
  showNavLeftCloseBtn(false);
  router.go(-1);
};

window.userLeftCloseClick = closeChoose;

onMounted(() => {
  getUserData();
  getAlReadyChooseList();
  showNavLeftCloseBtn(true, "user");
  setAppTitle("选择联系人");
});

onUnmounted(() => {
  hideAppButton();
});
</script>

<style scoped lang="scss">
.contacts-list {
  background-color: #ffffff;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  margin: 0;
}

.input-box {
  margin: 17px 16px;
  height: 38px;
  box-sizing: content-box;
  position: relative;

  .contact-input {
    :deep(.el-input__wrapper) {
      background-color: #f2f4f7;
      box-shadow: none;

      &.is-focus {
        box-shadow: none;
      }
    }
  }
}

.search-popup {
  width: 100%;
  background-color: #fff;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.el-input.el-input--prefix .el-input__inner) {
  text-align: left;
  background-color: #f2f4f7;
  height: 38px;
  color: #747683;
}

.contacts-box {
  height: calc(100vh - 40px - 32px - 50px);
  overflow-y: auto;
  margin-bottom: 50px;

  .contacts-container {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.go-choose-box {
  text-align: left;
  display: flex;
  align-items: center;
  width: calc(100% - 32px);
  height: 54px;
  margin: 0 16px;
  position: relative;

  .address-icon {
    width: 34px;
    height: 34px;
  }

  .name {
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    margin-left: 10px;
  }

  .el-icon-arrow-right {
    color: #c4c4c6;
    margin-left: auto;
  }
}

.go-choose-box:after {
  content: "";
  width: calc(100vw - 32px - 24px);
  height: 1px;
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #f2f4f7;
}

.address-title {
  width: 100%;
  height: 30px;
  text-align: left;
  padding: 0 16px;
  display: flex;
  align-items: center;
  line-height: 20px;

  .time-icon {
    width: 12px;
    height: 12px;
    margin-right: 6px;
  }

  .name {
    color: #747683;
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
  }
}

.anchor-item {
  width: 100%;
  padding: 0 16px;
  height: 54px;
  display: flex;
  position: relative;
  align-items: center;

  .choose {
    margin-right: 8px;

    .no-choose {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid #327edc;
    }

    .already-choose {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: url("@/assets/images/select.svg") no-repeat;
      position: relative;
      z-index: 1;

      .white-point {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        background-color: #ffffff;
        transform: translate(-50%, -50%);
        z-index: 2;
        display: none;
      }
    }
  }

  .img {
    width: 34px;
    height: 34px;
    line-height: 34px;
    margin-right: 9px;

    .avatar {
      border-radius: 4px;
    }

    img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
  }

  .info-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 8px;
  }

  .name {
    max-width: 280px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    height: 19px;
    line-height: 19px;
  }

  .org-info-box {
    height: 16px;
    line-height: 16px;
    font-size: calc(var(--base--font--size--12) * var(--scale-factor));
    color: #6d7176;
    text-align: left;
  }
}

.anchor-item:after {
  content: "";
  position: absolute;
  width: calc(100vw - 32px - 24px);
  height: 1px;
  background-color: #f2f4f7;
  bottom: 0;
  right: 16px;
}

.choose-depart-box {
  width: 100%;
  display: flex;
  align-items: center;

  .el-icon-arrow-right {
    color: #c4c4c6;
    margin-left: auto;
  }

  .name {
    height: 22px;
  }
}
</style>
