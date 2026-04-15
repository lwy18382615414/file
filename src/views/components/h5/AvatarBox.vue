<template>
  <el-image
    class="avatar"
    :src="avatarUrl(avatar)"
    alt=""
    :style="{ width: sizePx, height: sizePx }"
    @click="goApp"
  >
    <template #placeholder>
      <div class="image-slot">
        <img
          :src="defaultAvatar"
          alt=""
          :style="{ width: sizePx, height: sizePx }"
        />
      </div>
    </template>
    <template #error>
      <div class="image-slot">
        <img
          :src="defaultAvatar"
          alt=""
          :style="{ width: sizePx, height: sizePx }"
        />
      </div>
    </template>
  </el-image>
</template>

<script setup lang="ts">
import baseConfig from "@/config";
import { getFromApp } from "@/utils/auth.ts";
import { computed } from "vue";
import { getQueryVariable, goAppPage } from "@/utils";

const props = defineProps({
  userId: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    default: "",
  },
  size: {
    type: [Number, String],
    default: 34,
  },
});

const defaultAvatar = new URL("@/assets/images/avatar.png", import.meta.url)
  .href;

const sizePx = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size,
);

const avatarUrl = (fileName: string) => {
  if (fileName)
    return getFromApp()
      ? `localimage://avatar?fileId=${fileName}`
      : `${baseConfig.avatarUrl}?fileid=${fileName}`;
  return "";
};

const goApp = () => {
  const tenantId =
    getQueryVariable("chatTenantId") ||
    sessionStorage.getItem("tenantId") ||
    "";
  goAppPage(
    "userInfo",
    JSON.stringify({ userId: props.userId, tenantId: Number(tenantId) }),
  );
};
</script>

<style scoped lang="scss">
.avatar {
  margin-right: 9px;
  cursor: pointer;
  position: relative;
  border-radius: 4px;
  object-fit: cover;
}
.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
