<template>
  <div class="share-page">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      :element-loading-text="t('loading')"
      :element-loading-background="'#fff'"
      class="share-loading"
    />
    <div v-else class="share-page-content">
      <template v-if="!isExpired">
        <div class="person-avatar">
          <van-image :src="avatarUrl + avatarId">
            <template #error>
              <img src="@/assets/images/avatar.png" alt="" />
            </template>
          </van-image>
        </div>
        <div class="person-name">
          <span> {{ t("sharedBy", { name: sharePersonName }) }}</span>
        </div>
        <div v-if="isInputPsw" class="share-time">
          {{ dayjs(shareTime).format(t("timeFormat")) }}
        </div>
        <div class="expired-time">
          <span v-if="isInputPsw">
            {{
              t(originShareCount <= 1 ? "totalItems" : "totalItems_plural", {
                count: originShareCount,
              })
            }}
          </span>
          {{ expireTimeText }}
        </div>
        <template v-if="!isInputPsw">
          <van-field
            v-model="psw"
            :placeholder="t('inputPasswordCaseInsensitive')"
          />
          <van-button block type="primary" @click="handleShareContent"
            >{{ t("extractFile") }}
          </van-button>
        </template>
        <div v-else class="share-file-list">
          <div class="divider"></div>
          <div class="checkbox-wrapper">
            <div>
              {{ t("selectedItems", { count: selectedFiles.length }) }}
            </div>
            <div class="selector-btn" @click="selectAll">
              <span style="margin-right: 4px">
                {{
                  selectedFiles.length === fileList.length
                    ? t("unselectAll")
                    : t("selectAll")
                }}
              </span>
              <CustomCheckBox :check-box-class="checkAllClass" />
            </div>
          </div>
          <div v-if="!isTopFolder" class="breadcrumb">
            <el-breadcrumb :separator-icon="ArrowRight">
              <el-breadcrumb-item
                v-for="item in breadcrumbList"
                :key="item.name"
                @click="handleBreadcrumbClick(item)"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div
            v-if="fileList.length > 0"
            class="list"
            :class="{ 'is-top-folder': !isTopFolder }"
          >
            <div
              v-for="(item, index) in fileList"
              :key="index"
              class="item"
              @click="handleItemClick(item)"
            >
              <div class="item-left">
                <div class="item-icon">
                  <SvgIcon
                    :name="
                      item.isFolder ? 'icon_folder' : getFileIcon(item.name)
                    "
                    size="30"
                  />
                </div>
                <div class="item-info">
                  <div class="item-name">
                    {{ item.name }}
                  </div>
                  <div class="item-time-size">
                    <span style="margin-right: 4px">{{
                      dayjs(item.updateAt).format(t("timeFormat"))
                    }}</span>
                    <span>{{
                      item.size ? formatFileSize(item.size) : "-"
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="item-right" @click.stop>
                <CustomCheckBox
                  :check-box-class="itemCheckClass(item) ? 'is-all' : ''"
                  @click="chooseFile(item)"
                />
              </div>
            </div>
          </div>
          <div v-else class="empty-wrapper">
            <SvgIcon name="empty-folder" size="106" />
            <div class="item-select__title">{{ t("noFiles") }}</div>
          </div>

          <div class="operate-group">
            <span class="download-btn" @click="onDownload">
              <SvgIcon name="ic_share-download" size="26" color="#327EDC" />
            </span>
            <template v-if="isHaveFileApp">
              <van-button v-if="isAnonymous" @click="saveToCloudDriver">{{
                t("saveToCloud")
              }}</van-button>
              <a
                v-else
                :href="schemeUrl"
                class="van-button van-button--primary"
              >
                {{ t("viewInApp") }}
              </a>
            </template>
          </div>
        </div>
      </template>
      <div v-else class="share-not-found">
        <img alt="invalid-sharing" src="@/assets/images/invalid-sharing.png" />
        <p>
          {{ t(`${errorMsg}`) }}
        </p>
      </div>
    </div>

    <FolderSelect
      :visible="showFolderSelect"
      @update:visible="showFolderSelect = $event"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, provide, watch } from "vue";
import { getToken } from "@/utils/auth";
import {
  getShareLinkContentApi,
  getShareLinkContentWithLoginApi,
  downloadFileOutApi,
  getShareFolderContentApi,
} from "@/api/share";
import config from "@/hooks/config";
import schemeConfig from "@/config";
import { useRoute } from "vue-router";
import {
  downloadFileOut,
  downloadShareFileInApp,
  formatFileSize,
  getFileIcon,
  getTimeDifference,
  t,
} from "@/utils";
import type { TypeContent } from "@/views/pc/SharePage/type";
import { CustomCheckBox } from "@/components";
import SvgIcon from "@/components/SvgIcon.vue";
import { getStatusMessage } from "@/utils/httpCode";
import dayjs from "dayjs";
import FolderSelect from "./pop/folderSelect.vue";
import { ArrowRight } from "@element-plus/icons-vue";

import { checkIsHaveFile } from "@/utils";

const route = useRoute();
const { avatarUrl, ensureConfigReady, cloudDriveUploadUrl } = config();

const isLoading = ref(true);

const shareKey = computed(() => route.query.shareKey as string);
const passwordKey = computed(() => route.query.psw as string);
const isAnonymous = computed(() => !!getToken());
const isExpired = ref(false); // 是否过期
const errorMsg = ref(""); // 错误信息
const avatarId = ref("");
const sharePersonName = ref("");
const shareTime = ref("");
const expireTime = ref("");
const psw = ref("");
const expiredType = ref(0); // 过期类型

// 是否输入密码
const isInputPsw = ref(false);
const fileList = ref<Array<TypeContent>>([]);

const selectedFiles = ref<TypeContent[]>([]);
const shareId = ref(0);

const showFolderSelect = ref(false);
const originShareCount = ref(0);
const isTopFolder = ref(true);
const breadcrumbList = ref<Array<TypeContent>>([
  {
    contentId: NaN,
    name: t("share"),
    isFolder: true,
    size: 0,
    updateAt: "",
    parentId: undefined,
  },
]);
const isHaveFileApp = ref(false);

provide("selectedFiles", selectedFiles);
provide("shareId", shareId);

const expireTimeText = computed(() => {
  if (expiredType.value === 5) return t("permanent");
  const { days, hours } = getTimeDifference(expireTime.value);
  if (days === 0) {
    return t("hoursToExpire", { count: hours });
  }
  return t("dayHoursToExpire", { count: days, hours: hours });
});

const checkAllClass = computed(() => {
  if (selectedFiles.value.length === fileList.value.length) return "is-all";
  if (selectedFiles.value.length === 0) return "";
  return "is-partial";
});

const schemeUrl = computed(() => {
  const baseUrl = `${location.origin}${location.pathname}`;
  let hash = `#/share-page?shareKey=${shareKey.value}`;
  if (psw.value) {
    hash += `&psw=${psw.value}`;
  }
  const fullUrl = `${baseUrl}${hash}`;
  const encodedFullUrl = encodeURIComponent(fullUrl);
  return `${schemeConfig.cloudCallAppKey}://cloudShare?url=${encodedFullUrl}`;
});

watch(
  () => isInputPsw.value,
  (val) => {
    if (val) {
      selectAll();
    }
  },
);

const getShareContent = async (shareKey: string, psw?: string) => {
  try {
    let res;
    if (isAnonymous.value) {
      res = await getShareLinkContentWithLoginApi(shareKey, psw);
    } else {
      res = await getShareLinkContentApi(shareKey, psw);
    }
    const { code, data } = res;
    if (code === 1) {
      return data;
    } else {
      isExpired.value = true;
      errorMsg.value = getStatusMessage(code);
    }
  } catch (error) {
    console.error("请求失败:", error);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }
};

const handleShareContent = async () => {
  const content = await getShareContent(shareKey.value, psw.value);
  if (content) {
    if (content.needPassword) {
      showToast({ type: "fail", message: t("wrongPassword") });
    } else {
      sessionStorage.setItem(`share_pwd_${shareKey.value}`, psw.value);
      isInputPsw.value = true;
      fileList.value = content.contents;
      shareTime.value = content.shareTime;
      shareId.value = content.shareId;
      originShareCount.value = content.contents.length;
      expiredType.value = content.expiredType;
    }
  }
};

const selectAll = () => {
  if (selectedFiles.value.length === fileList.value.length) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = fileList.value;
  }
};

const handleItemClick = (item: TypeContent) => {
  if (item.isFolder) {
    openFolder(item);
  } else {
    chooseFile(item);
  }
};

const handleBreadcrumbClick = async (item: TypeContent) => {
  if (isNaN(item.contentId)) {
    await handleShareContent();
    breadcrumbList.value = [
      {
        contentId: NaN,
        name: t("share"),
        isFolder: true,
        size: 0,
        updateAt: "",
        parentId: undefined,
      },
    ];
    isTopFolder.value = true;
    selectedFiles.value = [];
    selectAll();
    return;
  }
  await openFolder(item, true);
};

const openFolder = async (item: TypeContent, fromBreadcrumb = false) => {
  const res = await getShareFolderContentApi(item.contentId);
  if (res.code === 1) {
    isTopFolder.value = false;

    if (!fromBreadcrumb) {
      breadcrumbList.value.push(item);
    } else {
      const index = breadcrumbList.value.findIndex(
        (i) => i.contentId === item.contentId,
      );
      if (index !== -1) {
        breadcrumbList.value = breadcrumbList.value.slice(0, index + 1);
      }
    }

    if (res.data.length > 0) {
      fileList.value = res.data.map((item) => ({
        contentId: item.contentId,
        name: item.contentName,
        isFolder: item.isFolder,
        size: item.contentSize,
        updateAt: item.operateTime,
        parentId: item.parentId,
      }));
      setTimeout(() => {
        selectedFiles.value = [];
        if (!fromBreadcrumb) selectAll();
      }, 200);
    } else {
      fileList.value = [];
    }
  }
};

const chooseFile = (item: TypeContent) => {
  if (selectedFiles.value.some((file) => file.contentId === item.contentId)) {
    selectedFiles.value = selectedFiles.value.filter(
      (file) => file.contentId !== item.contentId,
    );
  } else {
    selectedFiles.value.push(item);
  }
};

const itemCheckClass = (item: TypeContent) => {
  return selectedFiles.value.some((file) => file.contentId === item.contentId);
};

const onDownload = async () => {
  if (!cloudDriveUploadUrl.value) {
    await ensureConfigReady();
  }

  if (selectedFiles.value.length === 0) {
    showToast({ type: "fail", message: t("selectFile") });
    return;
  }
  const contentIds = selectedFiles.value
    .filter((item) => !item.isFolder)
    .map((item) => item.contentId);
  if (contentIds.length === 0) {
    showToast({ type: "fail", message: t("noDownloadableFiles") });
    return;
  }

  // isHaveFileApp.value = await checkIsHaveFile();
  //
  // if (isAnonymous.value && isHaveFileApp.value) {

  if (isAnonymous.value) {
    try {
      const res = await downloadFileOutApi(shareId.value, contentIds);
      if (res.code !== 1) return;
      let files: any[] = [];
      res.data.forEach((item) => {
        files.push({
          fileName: item.fileName,
          filePath:
            cloudDriveUploadUrl.value +
            `/api/file/download/clouddrive?fileid=${item.fileId}`,
          fileSize: item.size,
          sn: item.aesKey,
        });
      });

      downloadShareFileInApp(JSON.stringify(files), true);
    } catch (error) {
      console.error("文件下载失败:", error);
      return;
    }
  } else {
    await downloadFileOut(shareId.value, contentIds);
  }
};

const saveToCloudDriver = () => {
  if (selectedFiles.value.length === 0) {
    showToast({ type: "fail", message: t("selectFile") });
    return;
  }
  showFolderSelect.value = true;
};

onMounted(async () => {
  await ensureConfigReady();
  isHaveFileApp.value = await checkIsHaveFile();
  const storedPassword = sessionStorage.getItem(`share_pwd_${shareKey.value}`);
  const shareInfo = await getShareContent(
    shareKey.value as string,
    passwordKey.value || storedPassword || "",
  );

  if (shareInfo) {
    avatarId.value = shareInfo.avatar;
    sharePersonName.value = shareInfo.userName;
    expireTime.value = shareInfo.expiredTime;
    shareId.value = shareInfo.shareId;
    expiredType.value = shareInfo.expiredType;

    if (!shareInfo.needPassword) {
      psw.value = storedPassword || "";
      isInputPsw.value = true;
      fileList.value = shareInfo.contents || [];
      originShareCount.value = shareInfo.contents.length;
      shareTime.value = shareInfo.shareTime;
    }
  } else {
    isExpired.value = true;
  }
});
</script>

<style lang="scss" scoped>
.share-loading {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.share-page {
  width: 100%;
  height: 100vh;
  font-family: PingFang SC;
  padding: 0 20px;

  .share-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;

    .app-logo {
      width: 90px;
      height: 54px;
      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .share-page-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;

    :deep(.van-field) {
      margin-top: 40px;
      background: #f2f4f7;
      border-radius: 4px;
      padding: 8px 16px;
    }

    :deep(.van-button) {
      background: #327edc;
      border-radius: 8px;
      margin-top: 30px;
    }

    .share-file-list {
      .divider {
        width: 100vw;
        height: 12px;
        background: #f9f9fa;
        margin-top: 40px;
      }

      .checkbox-wrapper {
        color: #747683;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 16px;

        .selector-btn {
          display: flex;
          align-items: center;
        }
      }

      .breadcrumb {
        padding: 16px;
      }

      .list {
        max-height: calc(100vh - 364px);
        overflow-y: auto;

        &.is-top-folder {
          max-height: calc(100vh - 364px - 48px);
        }
        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid #f2f4f7;

          .item-left {
            display: flex;
            align-items: center;
            gap: 10px;

            .item-info {
              padding: 13px 0;
              width: calc(100vw - 32px - 30px - 10px - 32px);

              .item-name {
                line-height: 1.4;
                font-size: 16px;
                color: #131314;
                margin-bottom: 7px;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
              }
              .item-time-size {
                font-size: 12px;
                color: #747683;
                display: flex;
                align-items: center;
                gap: 5px;
              }
            }
          }
        }
      }

      .empty-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 14px;
        color: #747683;
      }

      .operate-group {
        width: 100vw;
        position: fixed;
        bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 0 16px;

        .download-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          background: #ebeff6;
        }

        :deep(.van-button) {
          width: calc(100vw - 32px - 42px);
          background: #ebeff6;
          border-radius: 8px;
          margin-top: 0;
          border: none;

          &.van-button--default {
            color: #2d2d2d;
          }

          &.van-button--primary {
            line-height: 44px;
            color: #327edc;
          }
        }
      }
    }

    .share-not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 90%;
      img {
        width: 120px;
        height: 120px;
      }
      p {
        font-size: 13px;
        color: #747683;
        text-align: center;
      }
    }
  }
}
</style>
