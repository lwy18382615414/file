<template>
  <el-image
    class="avatar"
    :src="avatarUrl(avatar)"
    :style="{ width: size + 'px', height: size + 'px' }"
    alt=""
  >
    <template #placeholder>
      <div class="image-slot">
        <img src="@/assets/images/avatar.png" alt="" />
      </div>
    </template>
    <template #error>
      <div class="image-slot">
        <img src="@/assets/images/avatar.png" alt="" />
      </div>
    </template>
  </el-image>
</template>

<script setup lang="ts">
import baseConfig from "@/config";

defineProps({
  avatar: {
    type: String,
    default: "",
  },
  size: {
    type: Number,
    default: 26, // 默认头像尺寸
  },
});

const avatarUrl = (fileName: string) => {
  if (fileName) return `${baseConfig.avatarUrl}?fileid=${fileName}`;
  return "";
};
</script>

<style scoped lang="scss">
.avatar {
  cursor: pointer;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  object-fit: cover;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
