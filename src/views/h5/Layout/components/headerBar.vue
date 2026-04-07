<template>
  <van-nav-bar
    :title="currentName"
    fixed
    left-arrow
    placeholder
    right-disabled
    safe-area-inset-top
  >
    <template #left>
      <SvgIcon
        v-if="!isLongPress"
        name="ic_back"
        size="26"
        @click="router.go(-1)"
      />
      <span v-else class="text-[16px] text-white" @click="cancelLongPress"
        >取消</span
      >
    </template>
    <template #right>
      <template
        v-if="
          ['MySpace', 'ShareSpace', 'Folder'].includes(route.name as string) &&
          !isLongPress
        "
      >
        <span class="mr-2" @click="addFile">
          <span
            v-if="hasCreateSharePermission && route.name === 'ShareSpace'"
            class="text-[16px] text-white"
          >
            新建
          </span>
          <span
            v-if="
              hasPermission(permissionType, Permission.Upload) &&
              route.name === 'Folder'
            "
            class="text-[16px] text-white"
          >
            上传
          </span>
          <span v-if="route.name === 'MySpace'" class="text-[16px] text-white">
            上传
          </span>
        </span>
        <router-link
          v-if="
            route.path.includes('folder') &&
            fileBelong === 'shareSpace'
          "
          :to="{
            path: '/space-setting',
            query: {
              contentId: contentId,
              permissionType: permissionType,
            },
          }"
        >
          <SvgIcon name="ic_h5_coldots" size="26" />
        </router-link>
      </template>
      <template v-else>
        <span class="mr-2 text-[16px] text-white" @click="clearAllRecycle">
          {{ route.name === "RecycleBin" ? t("clear") : "" }}
        </span>
      </template>
    </template>
  </van-nav-bar>
</template>
<script lang="ts" setup>
import { hasPermission, t } from "@/utils";
import { Permission } from "@/enum/permission";
import { useFileBelong } from "@/hooks/useFileBelong";
import { useRoute, useRouter } from "vue-router";

defineProps({
  currentName: {
    type: String,
    default: "",
  },
  isLongPress: {
    type: Boolean,
    default: false,
  },
  hasCreateSharePermission: {
    type: Boolean,
    default: false,
  },
  permissionType: {
    type: [Number, null],
    default: null,
  },
  contentId: {
    type: Number,
    default: 0,
  },
});

const route = useRoute();
const router = useRouter();
const { fileBelong } = useFileBelong();

const emit = defineEmits(["longpress", "addFile", "clearAllRecycle"]);

const cancelLongPress = () => {
  emit("longpress");
};

const addFile = () => {
  emit("addFile");
};

const clearAllRecycle = () => {
  emit("clearAllRecycle");
};
</script>

<style lang="scss" scoped>
:deep(.van-nav-bar) {
  background-color: #327edc;
  .van-nav-bar__title {
    color: #fff;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    font-weight: normal;
  }
}

:deep(.van-nav-bar__right--disabled) {
  cursor: context-menu;
  opacity: 1;
}
</style>
