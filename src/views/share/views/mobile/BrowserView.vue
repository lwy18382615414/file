<template>
  <div class="mobile-share-browser-view">
    <ShareHeader
      :avatar-id="avatarId"
      :avatar-url="avatarUrl"
      :share-person-name="sharePersonName"
      :share-time="shareTime"
      :is-input-psw="isInputPsw"
      :origin-share-count="originShareCount"
      :expire-time-text="expireTimeText"
    />
  </div>
</template>

<script setup lang="ts">
import ShareHeader from "@/views/share/components/mobile/ShareHeader.vue";

const avatarUrl = "";
const avatarId = "";
const sharePersonName = "";
const shareTime = "";
const isInputPsw = false;
const originShareCount = 0;
const expireTimeText = "";
</script>

<style lang="scss" scoped>
.mobile-share-browser-view {
  width: 100%;
  min-height: 100vh;
}
</style>
