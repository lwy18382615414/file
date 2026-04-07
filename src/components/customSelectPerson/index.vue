<template>
  <div class="custom-select-person">
    <el-dialog
      v-model="dialogVisible"
      :modal="false"
      :show-close="false"
      style="padding: 0"
      @close="handleClose"
    >
      <div class="contacts-list">
        <div class="close-button" @click="handleClose">
          <SvgIcon name="ic_close" />
        </div>
        <div class="content-box">
          <div class="select-box">
            <div class="search-box">
              <el-input
                ref="searchInput"
                v-model="searchKey"
                :placeholder="t('search')"
              >
                <template #prefix>
                  <SvgIcon name="ic_search" size="24" />
                </template>
              </el-input>
            </div>
            <div v-if="searchKey" class="search-content">
              <div
                v-for="item in searchList"
                :key="item.userId"
                class="search-content-item"
              >
                <el-checkbox
                  :model-value="item.check"
                  :disabled="disableChoose(item)"
                  @change="chooseUserBySearch(item)"
                />
                <AvatarBox :avatar="item.avatar" />
                <div class="info-box">
                  <div class="node-name">{{ item.nickName }}</div>
                  <div
                    v-if="item.orgName"
                    :id="item.userId"
                    class="org-info-box"
                  >
                    {{ getOrgLabel(item) }}
                  </div>
                </div>
                <!--              -->
              </div>
            </div>
            <el-tree
              v-show="!searchKey"
              ref="contactsTree"
              :data="getContactsList"
              :props="defaultProps"
              :render-after-expand="false"
              node-key="nodeId"
              show-checkbox
              @check-change="userCheck"
            >
              <template v-slot="{ node, data }">
                <div
                  v-show="data.isShow"
                  :class="[data.isUser ? 'node-user' : 'node-depart']"
                  class="node-data-box"
                >
                  <i v-if="!data.children" class=""></i>
                  <span
                    v-else
                    :class="{ expanded: node.expanded }"
                    class="el-icon-caret-right el-tree-node__expand-icon"
                    style="margin-right: 6px"
                  >
                    <img src="@/assets/images/expand.png" />
                  </span>
                  <div v-if="data.isUser" class="avatar-box-main">
                    <AvatarBox :avatar="data.avatar" />
                  </div>
                  <template v-else>
                    <img
                      v-if="data.parentOrgId === 0"
                      alt=""
                      class="depart-icon"
                      src="@/assets/icons/enter-icon.png"
                    />
                    <img
                      v-else
                      alt=""
                      class="depart-icon"
                      src="@/assets/icons/department-pc-icon.svg"
                    />
                  </template>
                  <div class="node-name">
                    {{ data.orgName || data.nickName }}
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
          <div class="already-choose-box">
            <div class="choose-box-title">
              {{ t("selectedContacts", { count: alreadyChooseList.length }) }}
            </div>
            <div class="choose-content">
              <div
                v-for="item in alreadyChooseList"
                :key="item.userId"
                class="choose-item"
              >
                <AvatarBox :avatar="item.avatar" />
                <div class="item-name">{{ item.nickName }}</div>
                <template v-if="item.permissionType !== Permission.SuperAdmin">
                  {{ item.canEdit }}
                  <span
                    v-if="
                      myUserInfo.userId !== item.userId &&
                      myPermissionType !== item.permissionType &&
                      item.canEdit !== false
                    "
                    class="ml-auto"
                    @click="removeChooseItem(item)"
                  >
                    <SvgIcon name="ic_close" />
                  </span>
                </template>
              </div>
            </div>
            <div class="button-box">
              <el-button class="cancel" @click="handleClose">{{
                t("cancel")
              }}</el-button>
              <el-button
                :disabled="alreadyChooseList.length === 0"
                :style="{
                  background: alreadyChooseList.length === 0 ? '' : '#327edc',
                }"
                class="submit"
                type="primary"
                @click="handleSubmit"
              >
                {{ t("Ok") }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, type PropType, ref } from "vue";
import { getUUID, isJsonStr } from "@/utils";
import { cloneDeep } from "lodash-es";
import AvatarBox from "./AvatarBox.vue";
import { Permission } from "@/enum/permission";
import { getMyUserInfo } from "@/utils/auth";
import { t } from "@/utils";
import PinyinMatch from "pinyin-match";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  contactList: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => [],
  },
  hasSelectItem: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => [],
  },
  myPermissionType: {
    type: Number,
    default: 0,
  },
});

const emits = defineEmits(["update:visible", "submit"]);

const searchKey = ref("");
const alreadyChooseList = ref<Record<string, any>[]>([]);
const nodeIdList = ref<Record<string, any>>([]);
const contactsTree = ref();
const superAdmin = ref<Record<string, any>>({});
const myUserInfo = getMyUserInfo();

const localTreeData = ref<Record<string, any>[]>([]);

const dialogVisible = computed(() => props.visible);
const getContactsList = computed(() => {
  return filterTree(cloneDeep(localTreeData.value));
});

const getEnterName = computed(() => {
  if (props.contactList.length > 0) {
    return props.contactList[0].orgName;
  }
  return "";
});

const departDisabled = (data: Record<string, any>) => {
  if (data.userId === superAdmin.value.userId) return true;
  if (data.userId === myUserInfo.userId) return true;
  const findUser = props.hasSelectItem.find(
    (item) => item.userId === data.userId,
  );

  if (findUser && findUser.canEdit === false) {
    return true;
  }

  if (findUser && findUser.permissionType === props.myPermissionType) {
    return true;
  }
  return false;
};

const defaultProps = ref({
  children: "children",
  label: "orgName",
  disabled: departDisabled,
});

function getUserBySearchKey(
  searchKey: string,
  list = getContactsList.value,
  result: Record<string, any>[] = [],
  seen: Set<string> = new Set(),
): Record<string, any>[] {
  for (const item of list) {
    const currentOrg = { id: item.id, orgName: item.orgName };

    const users = item.user || [];
    for (const user of users) {
      const nickName = user.nickName || "";

      const isMatched =
        searchKey === "" ? true : !!PinyinMatch.match(nickName, searchKey);

      if (isMatched && user.isSearch && !seen.has(user.userId)) {
        seen.add(user.userId);

        result.push({
          ...user,
          orgId: user.orgId ?? currentOrg.id,
          orgName: user.orgName ?? currentOrg.orgName,
        });
      }
    }

    const children = item.children || [];
    if (children.length > 0) {
      getUserBySearchKey(searchKey, children, result, seen);
    }
  }

  return result;
}

function setCheckStatus(userList: Record<string, any>[]) {
  const _alreadyChooseList = alreadyChooseList.value || [];
  return userList.map((item) => ({
    ...item,
    check: _alreadyChooseList.some((i) => i.userId === item.userId),
  }));
}

const searchList: any = computed(() => {
  const term = (searchKey.value || "").trim();

  if (term) {
    const hasChinese = /[\u4e00-\u9fa5]/.test(term);
    const hasPinyin = /[a-zA-Z]/.test(term);

    if (hasChinese && hasPinyin) {
      return [];
    }
  }

  return setCheckStatus(getUserBySearchKey(term));
});

const disableChoose = (item: Record<string, any>) => {
  if (item.userId === superAdmin.value.userId) return true;
  if (item.userId === myUserInfo.userId) return true;
  const findUser = props.hasSelectItem.find((i) => i.userId === item.userId);

  if (findUser && findUser.canEdit === false) {
    return true;
  }

  if (findUser && findUser.permissionType === props.myPermissionType) {
    return true;
  }
};

const handleClose = () => {
  emits("update:visible", false);
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
    return `${getEnterName.value}${getEnterName.value ? "/" : ""}${orgName}/${item.postName}`;
  }
  return `${getEnterName.value}${getEnterName.value ? "/" : ""}${orgName}`;
};

const getUserData = async () => {
  const clonedData = cloneDeep(props.contactList);
  resolveDepartAndUser(clonedData);
  localTreeData.value = clonedData;
};
const setOneCheck = (nodeId: Record<string, any>, status = true) => {
  contactsTree.value.setChecked(nodeId, status);
};

const filterTree = (tree = props.contactList) => {
  return tree.filter((item) => {
    if (item.isShow && item.children) {
      item.children = filterTree(item.children);
    }
    return item.isShow;
  });
};

const resolveDepartAndUser = (data: Record<string, any>[]) => {
  data.forEach((item) => {
    // Vue 3 的响应式系统支持直接赋值
    item.nodeId = getUUID();

    if (item.user) {
      item.user.forEach((itemU: Record<string, any>) => {
        itemU.isUser = true;
        itemU.nodeId = getUUID();
      });

      // 合并 user 和 children（原逻辑）
      item.children = item.children
        ? [...item.user, ...item.children]
        : [...item.user];
    }

    // 递归处理子节点
    if (item.children) {
      resolveDepartAndUser(item.children);
    }
  });
};

const findNodeId = (userId: number, data = getContactsList.value) => {
  data.forEach((item) => {
    if (item.userId === userId) {
      nodeIdList.value.push(item.nodeId);
    }
    if (item.children) {
      findNodeId(userId, item.children);
    }
  });
};
const userCheck = (val: Record<string, any>, check: boolean) => {
  if (!val.nodeId) return;
  if (val.userId === superAdmin.value.userId) return;
  // 人员组件不对部门做操作
  if (!val.isUser) return;
  nodeIdList.value = [];
  findNodeId(val.userId);
  if (nodeIdList.value.length > 0) {
    nodeIdList.value.forEach((item: string) => {
      setOneCheck(item, check);
    });
  }
  nextTick(() => {
    if (check) {
      let index = alreadyChooseList.value.findIndex(
        (i) => i.userId === val.userId,
      );
      if (index === -1) {
        alreadyChooseList.value.push(val);
      }
    } else {
      let index = alreadyChooseList.value.findIndex(
        (i) => i.userId === val.userId,
      );
      if (index !== -1) {
        alreadyChooseList.value.splice(index, 1);
      }
    }
  });
};

const removeChooseItem = (item: Record<string, any>) => {
  let nodeIds = findCheckNodeId(item.userId);
  nodeIds?.forEach((nodeId: Record<string, any>) => {
    setOneCheck(nodeId, false);
  });
  let index = alreadyChooseList.value.findIndex(
    (i) => i.nodeId === item.nodeId,
  );
  if (index !== -1) {
    alreadyChooseList.value.splice(index, 1);
  }
};

const findCheckNodeId = (userId: number, data = getContactsList.value) => {
  let nodeIds = [];
  if (!userId) return;
  let nodeId = "";
  let children = [];
  for (const item of data) {
    if (item.user) {
      for (const itemU of item.user) {
        if (itemU.userId === userId) {
          nodeId = itemU.nodeId;
        }
      }
    }
    if (item.children) {
      children.push(...item.children);
    }
  }
  if (nodeId) {
    nodeIds.push(nodeId);
  }
  if (children.length > 0) {
    nodeIds.push(...findCheckNodeId(userId, children));
  }
  return nodeIds;
};

const setPropsKey = async () => {
  await getUserData();
  await nextTick(() => {
    alreadyChooseList.value = cloneDeep(
      props.hasSelectItem.map((item) => ({
        ...item,
        nickName: item.label,
        nodeId: getUUID(),
      })),
    );
    alreadyChooseList.value.forEach((item) => {
      let nodeIds = findCheckNodeId(item.userId);
      nodeIds?.forEach((nodeId: Record<string, string>) => {
        setOneCheck(nodeId, true);
      });
    });
    superAdmin.value =
      alreadyChooseList.value.find(
        (item) => item.permissionType === Permission.SuperAdmin,
      ) || {};
  });
};

const handleSubmit = async () => {
  emits("submit", alreadyChooseList.value);
};

const chooseUserBySearch = (item: Record<string, any>) => {
  setOneCheck(item.nodeId, !item.check);
  if (!item.isShow) {
    userCheck(item, item.check);
  }
};

onMounted(() => {
  setPropsKey();
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog) {
  width: 610px;
  height: 545px;
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    background: #fff;
    padding: 0;
  }

  .el-dialog__body {
    overflow: hidden;
    padding: 0;
    width: 100%;
    height: 545px;
  }
}

.contacts-list {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;

  .close-button {
    position: absolute;
    top: 10px;
    right: 16px;
    line-height: unset;
    width: 16px;
    height: 16px;
  }

  .content-box {
    width: 100%;
    height: 100%;
    display: flex;

    .select-box {
      width: 50%;
      height: 100%;
      background: #f2f4f8;
      padding: 30px 6px 10px 24px;

      .el-tree {
        height: calc(100% - 37px);
        overflow-y: auto;
        margin-top: 4px;

        :deep(.el-tree-node__expand-icon) {
          img {
            width: 10px;
            height: 10px;
          }
          &.expanded {
            transform: rotate(90deg);
          }
        }
        :deep(.el-tree-node__content) {
          height: 44px;
        }
        :deep(.el-tree-node__content > .el-tree-node__expand-icon) {
          position: absolute;
          opacity: 0;
        }

        :deep(.el-tree-node) {
          .is-checked .el-checkbox__inner {
            border-color: #3a8ef5;
            background: #3a8ef5;
          }
          .is-indeterminate .el-checkbox__inner {
            background: #fff;
            border-color: #dcdfe6;
            &::before {
              border: 1px solid #3a8ef5;
              border-left: 0;
              border-top: 0;
              box-sizing: content-box;
              content: "";
              height: 7px;
              left: 4px;
              position: absolute;
              top: 1px;
              background: transparent;
              transform: rotate(45deg) scaleY(1);
              transform-origin: center;
              width: 3px;
            }
          }
          .is-disabled .el-checkbox__inner {
            border-color: #dcdfe6;
            background: #f2f6fc;

            &::after {
              transform: translate(-45%, -60%) rotate(45deg) scaleY(1);
            }
          }
        }
      }

      .search-box {
        display: flex;
        justify-content: center;
        padding-right: 18px;
        // margin-bottom: 14px;

        .el-input {
          height: 32px;

          :deep(.el-input__wrapper) {
            &:hover {
              box-shadow: 0 0 0 1px
                var(--el-input-border-color, var(--el-border-color)) inset;
            }

            &.is-focus {
              box-shadow: 0 0 0 1px
                var(--el-input-border-color, var(--el-border-color)) inset;
            }
          }

          :deep(.el-input__inner) {
            background: #fff;
          }

          :deep(.el-input__prefix) {
            left: 10px;

            .el-input__icon {
              line-height: 30px;
            }
          }

          img {
            width: 24px;
            height: 24px;
          }
        }
      }

      .search-content {
        height: calc(100% - 42px);
        overflow-y: auto;

        .search-content-item {
          display: flex;
          align-items: center;
          height: 44px;
          cursor: pointer;
          line-height: 40px;

          :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
            background-color: #3a8ef5;
            border-color: #3a8ef5;
          }

          :deep(
            .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner
          ) {
            background-color: #f2f6fc;
            border-color: #dcdfe6;
          }

          .el-checkbox {
            margin-right: 8px;
          }

          .info-box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-left: 8px;
          }

          .node-name {
            max-width: 180px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            line-height: 19px;
            color: #2d2d2d;
            height: 19px;
            text-align: left;
          }

          .org-info-box {
            height: 16px;
            line-height: 16px;
            font-size: calc(var(--base--font--size--12) * var(--scale-factor));
            color: #6d7176;
            text-align: left;
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .el-tree {
        background: transparent;
      }

      .node-data-box {
        height: 44px;
        display: flex;
        align-items: center;

        .node-name {
          margin-left: 8px;
          color: #2d2d2d;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .depart-icon {
          width: 18px;
          height: 18px;
        }
      }
    }

    .already-choose-box {
      width: 50%;
      height: 100%;
      padding: 57px 0 0 58px;

      .choose-box-title {
        height: auto;
        line-height: initial;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));
        color: #2d2d2d;
        font-weight: bold;
        padding-right: 54px;
        margin-bottom: 15px;
      }

      .choose-content {
        overflow-y: auto;
        // height: 345px;
        height: calc(100% - 96px);
        padding-right: 58px;

        .choose-item {
          display: flex;
          align-items: center;
          font-size: calc(var(--base--font--size--14) * var(--scale-factor));
          color: #2d2d2d;
          height: 40px;
          line-height: 40px;

          .item-name {
            margin-left: 7px;
            max-width: 130px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .button-box {
        height: 50px;
        text-align: right;
        margin-right: 39px;
        padding-top: 10px;

        .cancel {
          border: 1px solid #327edc;
          color: #327edc;
        }

        .submit {
          //background: #327edc;
          border: none;
        }

        .el-button {
          width: 70px;
          height: 30px;
          padding: 0;
        }
      }
    }
  }
}
</style>
