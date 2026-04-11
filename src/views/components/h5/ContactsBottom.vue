<template>
  <div v-if="showBottomBox" class="bottom-button">
    <div v-show="alreadyChooseList.length > 0" class="alreadyList">
      <div
        v-for="(item, index) in alreadyChooseList"
        :key="index"
        class="img"
        @click="deleteUser(item)"
      >
        <AvatarBox :avatar="item.avatar" class="avatar"></AvatarBox>
      </div>
    </div>
    <div :style="getConfirmStyle" class="confirmBtn" @click="submit">
      {{ t("Ok") }}
      <template v-if="alreadyChooseList.length > 0"
        >({{ alreadyChooseList.length }})</template
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { t } from "@/utils";
import AvatarBox from "@/views/components/h5/AvatarBox.vue";
import { computed, ref, watchEffect } from "vue";
import { Permission } from "@/enum/permission.ts";
import { getMyUserInfo } from "@/utils/auth.ts";

const props = defineProps({
  needJumpPage: {
    type: Boolean,
    default: false,
  },
  needShowConfirm: {
    type: Boolean,
    default: false,
  },
  optionUserList: {
    type: Array<Record<string, any>>,
    default: () => [],
  },
});

const emits = defineEmits(["emitData", "close", "deleteData"]);

const alreadyChooseList = ref<Record<string, any>[]>([]);
const myUserInfo = getMyUserInfo();

const showBottomBox = computed(() => {
  if (props.needJumpPage) return true;
  return alreadyChooseList.value.length > 0;
});

const getConfirmStyle = computed(() => {
  if (props.needShowConfirm)
    return {
      opacity: 1,
      marginLeft: alreadyChooseList.value.length > 0 ? "12px" : "auto",
    };
  return {
    opacity: alreadyChooseList.value.length > 0 ? 1 : 0.5,
  };
});

const deleteUser = (item: Record<string, any>) => {
  if (item.permissionType === Permission.SuperAdmin) return;
  if (item.userId === myUserInfo.userId) return;
  let index = alreadyChooseList.value.findIndex(
    (i) => i.userId === item.userId
  );
  if (index !== -1) {
    alreadyChooseList.value[index].check = false;
    alreadyChooseList.value.splice(index, 1);
    emits("deleteData", alreadyChooseList.value);
  }
};

const submit = () => {
  close();
  emitData();
  setData();
};

const close = () => {
  emits("close");
};

const emitData = () => {
  emits("emitData", alreadyChooseList.value);
};

const setData = () => {};

watchEffect(() => {
  if (props.optionUserList.length > 0) {
    alreadyChooseList.value = props.optionUserList.map((item) => ({
      ...item,
      check: true,
    }));
  }
});
</script>

<style lang="scss" scoped>
.bottom-button {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f2f4f7;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  .cancel-button {
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    margin-right: 12px;
  }

  .confirmBtn {
    background: #327edc;
    color: #fff;
    height: 30px;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    text-align: right;
    font-weight: normal;
    margin-left: 12px;
    line-height: 30px;
    padding: 0 8px;
    border-radius: 8px;
  }

  .alreadyList {
    // padding: 0 16px;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    margin: 12px 0;
    height: 34px;
    // max-width: 260px;
    flex: 1;

    .img {
      width: 34px;
      height: 34px;
      margin-right: 9px;

      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 4px;
      }

      img {
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }
    }
  }
}
</style>
