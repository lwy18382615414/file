<template>
  <div class="share-detail">
    <div class="file-info">
      <SvgIcon
        :name="
          shareInfo.isDeleteAll
            ? 'icon_folder'
            : handleFileAndFolderName(shareInfo.shareFile) === t('folder')
              ? 'icon_folder'
              : getFileIcon(shareInfo.shareFile)
        "
        size="48"
      />
      <div v-if="!shareInfo.isDeleteAll" class="file-name">
        {{ shareInfo.shareFile }}
        <span v-if="shareInfo.shareCount > 1">{{
          t("andItem", { count: shareInfo.shareCount })
        }}</span>
      </div>
      <div v-else class="file-name">
        <span v-if="shareInfo.shareCount > 1">{{
          t("fileDeletedCount", { count: shareInfo.shareCount })
        }}</span>
        <span v-else>{{ t("fileDeleted") }}</span>
      </div>
      <div class="share-time">
        <span>
          {{
            t("sharedAt", {
              datetime: dayjs(shareInfo.shareTime).format(t("timeFormat")),
            })
          }}
        </span>
      </div>
    </div>
    <div class="count-wrap">
      <div class="count-item">
        <span class="count">{{ shareInfo.viewCount }}</span>
        <span class="label">{{ t("browse") }}</span>
      </div>
      <div class="count-item">
        <span class="count">{{ shareInfo.downloadCount }}</span>
        <span class="label">{{ t("download") }}</span>
      </div>
      <div class="count-item">
        <span class="count">{{ shareInfo.saveCount }}</span>
        <span class="label">{{ t("save") }}</span>
      </div>
    </div>
    <div class="share-meta">
      <div class="cell">
        <span class="label">{{ t("expiration") }}</span>
        <span v-if="!shareInfo.isDeleteAll" class="value">{{
          getExpirationStatus(
            shareInfo.status,
            shareInfo.expireType,
            shareInfo.expireTime,
          )
        }}</span>
        <span v-else>
          {{ t("shareExpired") }}
        </span>
      </div>
      <div class="cell">
        <span class="label">{{ t("password") }}</span>
        <span class="value" :class="{ 'is-disabled': shareInfo.isDeleteAll }">{{
          shareInfo.sharePassword
        }}</span>
      </div>
    </div>
    <div class="operate-group">
      <div class="operate-item cancel-share" @click="cancelShare">
        {{ t("cancelShare") }}
      </div>
      <div
        v-if="!shareInfo.isDeleteAll && shareInfo.canShare"
        class="operate-item copy-link"
        @click="copyLinkToClipboard"
      >
        {{ t("copyLink") }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { showToast } from "vant";
import { useRouter } from "vue-router";
import {
  getFileIcon,
  getExpirationStatus,
  generateShareText,
  t,
  copyToClipboard,
  handleFileAndFolderName,
} from "@/utils";
import dayjs from "dayjs";
import type { MyShareItem } from "@/types/type";
import { useFileActions } from "@/views/hooks/useFileActions";

const router = useRouter();
const shareInfo = JSON.parse(history.state.shareInfo) as MyShareItem;

const { cancelShareMany } = useFileActions({
  onRefresh: async () => {
    router.back();
  },
});

const cancelShare = async () => {
  await cancelShareMany([shareInfo]);
};

const copyLinkToClipboard = async () => {
  const prefix = location.origin + location.pathname;
  const shareLink = `${prefix}#/share-page?shareKey=${shareInfo.shareKey}`;

  const copyText = generateShareText({
    count: 1,
    fileName: shareInfo.shareFile,
    shareLink,
    password: shareInfo.sharePassword,
  });
  await copyToClipboard(copyText);
  showToast({ message: t("copySuccess"), type: "success" });
};
</script>

<style scoped lang="scss">
.share-detail {
  width: 100vw;
  height: 100vh;
  background-color: #f9f9fa;
  padding: 8px 16px;
  font-family: PingFang SC;

  .file-info {
    height: 140px;
    background-color: #fff;
    border: 1px solid #f2f4f7;
    padding: 22px 16px;

    .file-name {
      margin: 6px 0;
      font-size: 18px;
      color: #2d2d2d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 26px;
    }

    .share-time {
      color: #747683;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }
  }

  .count-wrap {
    margin: 16px 0;
    height: 80px;
    border-radius: 12px;
    background-color: #fff;
    display: flex;
    justify-content: space-evenly;
    align-items: center;

    .count-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .count {
        font-size: 18px;
        color: #2d2d2d;
      }

      .label {
        font-size: 12px;
        color: #9e9e9e;
      }
    }
  }

  .share-meta {
    background-color: #fff;
    border: 1px solid #f2f4f7;
    border-radius: 12px;

    .cell {
      padding: 20px 12px;
      position: relative;

      &:first-child::after {
        position: absolute;
        content: " ";
        width: 317px;
        box-sizing: border-box;
        bottom: 0;
        left: 12px;
        border-bottom: 1px solid #f2f4f7;
      }

      span {
        display: inline-block;
      }

      .label {
        width: 92px;
        color: #9e9e9e;
      }

      .value {
        color: #2d2d2d;

        &.is-disabled {
          text-decoration: line-through;
        }
      }
    }
  }
  .operate-group {
    width: calc(100% - 32px);
    position: absolute;
    bottom: 12px;
    display: flex;
    gap: 12px;
    justify-content: space-between;

    .operate-item {
      flex: 1;
      height: 48px;
      line-height: 48px;
      text-align: center;
      font-size: 16px;
      color: #2d2d2d;
      background-color: #ebeff6;
      border-radius: 8px;

      &.cancel-share {
        color: #2d2d2d;
      }

      &.copy-link {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
