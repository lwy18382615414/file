<template>
  <div class="share-header">
    <div class="person-avatar">
      <van-image :src="avatarImageUrl">
        <template #error>
          <img src="@/assets/images/avatar.png" alt="" />
        </template>
      </van-image>
    </div>
    <div class="person-name">
      <span>{{ t("sharedBy", { name: sharePersonName }) }}</span>
    </div>
    <div v-if="isInputPsw" class="share-time">
      {{ dayjs(shareTime).format(t("timeFormat")) }}
    </div>
    <div class="expired-time">
      <span v-if="isInputPsw && originShareCount">
        {{
          t(originShareCount <= 1 ? "totalItems" : "totalItems_plural", {
            count: originShareCount,
          })
        }}
      </span>
      {{ expireTimeText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import config from "@/hooks/config";
import { useI18n } from "vue-i18n";

const { avatarUrl } = config();
const { t } = useI18n();

const props = defineProps<{
  avatarId: string;
  sharePersonName: string;
  shareTime: string;
  isInputPsw: boolean;
  originShareCount: number;
  expireTimeText: string;
}>();

const avatarImageUrl = computed(() => {
  return avatarUrl.value + props.avatarId;
});
</script>

<style lang="scss" scoped>
.share-header {
  display: flex;
  flex-direction: column;
  align-items: center;

  .person-avatar {
    margin-top: 45px;
    width: 52px;
    height: 52px;
    border-radius: 6px;
    overflow: hidden;

    :deep(.van-image) {
      width: 100%;
      height: 100%;
    }
  }

  .person-name {
    margin: 20px 0 10px;
    font-size: 20px;
    color: var(--text-primary-color);
  }

  .expired-time,
  .share-time {
    font-size: 12px;
    color: var(--text-secondary-color);
  }

  .share-time {
    margin-bottom: 4px;
  }
}
</style>
