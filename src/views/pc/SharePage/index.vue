<template>
  <div
    v-if="loading"
    v-loading="loading"
    :element-loading-text="t('loading')"
    class="loading-wrapper"
  />
  <div class="share-page-container">
    <header v-if="!useByPc">
      <div class="app-pic">
        <img alt="app-logo" :src="appLogo" />
      </div>
      <el-button v-if="showDownload" size="small" type="primary" @click="appDownload">
        {{ t("clientDownload") }}
      </el-button>
    </header>
    <p v-if="!useByPc" class="share-desc">
      {{ t("steadyWorkPromotion", { appName }) }}
    </p>
    <div class="share-content">
      <div v-if="!isSaveSuccess" :style="shareStyle" class="share">
        <div class="share-title flex items-center justify-between">
          <span v-if="!isSelectFolder">{{ t("cloudDriveSharing") }}</span>
          <span
            v-else
            class="flex items-center"
            @click="isSelectFolder = false"
          >
            <SvgIcon name="ic_arr_back" size="20" />
            {{ t("saveToFolder") }}
          </span>
        </div>
        <template v-if="isExpired">
          <div class="share-expired">
            <img
              alt="share-expired"
              src="@/assets/images/invalid-sharing.png"
            />
            <div class="text">{{ errorMessage }}</div>
          </div>
        </template>
        <template v-else>
          <div
            v-if="needPassword"
            :class="useByPc ? 'is-full' : 'not-full'"
            class="share-content-box"
          >
            <div class="person-avatar">
              <el-image class="avatar" :src="avatarUrl + avatarId" alt="">
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
            </div>
            <div class="person-name">
              <span class="name">{{ sharePersonName }}</span>
              <span>{{ t("sharedWithYou", { name: "" }) }}</span>
            </div>
            <div class="psw-box">
              <el-input
                v-model.trim="sharePassword"
                :placeholder="t('inputPasswordCaseInsensitive')"
              />
            </div>
            <el-button
              :disabled="!sharePassword"
              type="primary"
              @click="handleShareContent"
              >{{ t("extractFile") }}
            </el-button>
            <p class="expire-time-text">{{ expireTimeText }}</p>
          </div>
          <div v-else-if="!needPassword && !isSelectFolder" class="share-info">
            <div v-if="isTopFolder" class="file-wrapper">
              <SvgIcon
                :name="
                  contents[0].isFolder
                    ? 'icon_folder'
                    : getFileIcon(contents[0].name)
                "
                style="flex-shrink: 0"
                size="48"
              />
              <div class="info">
                <div class="file-name" :style="{ maxWidth: useByPc ? '' : '650px' }">
                  <span>
                    {{ t("fileName", { name: contents[0].name }) }}
                  </span>
                  <span v-if="contents.length > 1">
                    {{ t("andItem", { count: contents.length }) }}
                  </span>
                </div>
                <div class="share-meta">
                  <span class="share-person">
                    <SvgIcon name="ic_share-person" size="18" />
                    <span>{{ sharePersonName }}</span>
                  </span>
                  <div class="divider"></div>
                  <span class="share-time">
                    {{ dayjs(shareTime).format(t("timeFormat")) }}</span
                  >
                  <div class="divider"></div>
                  <span class="expire-time"> {{ expireTimeText }}</span>
                </div>
              </div>
              <a v-if="!useByPc" :href="schemeUrl" class="app-btn">
                {{ t("viewInClient") }}
              </a>
            </div>
            <div v-else class="breadcrumb">
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
            <div class="file-list">
              <CommonTable
                ref="commonTableRef"
                :height="useByPc ? isTopFolder ? 'calc(100vh - 233px)' : 'calc(100vh - 199px)' : 264"
                :table-columns="TABLE_COLUMNS"
                :table-data="contents"
                @selection-change="handleSelectionChange"
                @row-dblclick="handleTableRowDblclick"
              >
                <template #headerText="{ column }">
                  <span v-if="!showChooseCount">{{ t(column.label) }}</span>
                  <div v-else class="cursor-pointer">
                    <template v-if="column.label === 'columnOpt.docName'">
                      <span @click="handleChooseAll">{{
                        selectedRows.length === contents.length
                          ? t("unselectAll")
                          : t("selectAll")
                      }}</span>
                      <span class="ml-2">{{
                        t("selectedDocuments", { count: selectedRows.length })
                      }}</span>
                    </template>
                    <span v-else>{{ t(column.label) }}</span>
                  </div>
                </template>
                <template #name="{ row }">
                  <div class="file-name">
                    <div class="flex-shrink-0">
                      <SvgIcon
                        :name="
                          row.isFolder ? 'icon_folder' : getFileIcon(row.name)
                        "
                        size="30"
                      />
                    </div>

                    <div class="name">{{ row.name }}</div>
                  </div>
                </template>
                <template #size="{ row }">
                  <div class="text-[#747683]">
                    <span>{{
                      row.isFolder ? "-" : formatFileSize(row.size)
                    }}</span>
                  </div>
                </template>
                <template #updateAt="{ row }">
                  <div class="text-[#747683]">
                    <span>{{
                      dayjs(row.updateAt).format(t("timeFormat"))
                    }}</span>
                  </div>
                </template>
              </CommonTable>
            </div>
            <div class="line-divider"></div>
            <div
              :style="{
                justifyContent: useByPc ? 'space-between' : 'flex-end',
              }"
              class="operate"
            >
              <div
                v-if="useByPc"
                class="folder-select"
                @click="isSelectFolder = true"
              >
                <div class="flex">
                  <div class="whitespace-nowrap">{{ t("saveToFolder") }}:</div>
                  <span class="folder-name"> {{ folderName }} </span>
                </div>
                <span class="folder-icon">
                  <SvgIcon name="select-folder" />
                </span>
              </div>
              <div>
                <el-button
                  :disabled="disabledBtn"
                  type="default"
                  @click="download"
                >
                  {{ t("download") }}
                </el-button>
                <el-button
                  v-if="useByPc && isHaveFileApp"
                  :disabled="selectedRows.length === 0"
                  type="primary"
                  @click="handleSaveToCloud"
                >
                  {{ t("saveToCloudDrive") }}
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="folder-select-wrapper">
            <FolderSelect
              ref="folderRef"
              :isSaveBtnDisabled="isSaveBtnDisabled"
              @select-folder="selectFolder"
              @cancelSelect="isSelectFolder = false"
              @saveSelect="handleSaveFolder"
            />
          </div>
        </template>
      </div>
      <template v-else>
        <ShareSuccess :targetFolder="targetFolder" />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  getShareFolderContentApi,
  getShareLinkContentApi,
  getShareLinkContentWithLoginApi,
  saveToCloudDriveApi,
} from "@/api/share";
import type { TypeContent } from "./type";
import {
  downloadFileOut,
  formatFileSize,
  getFileIcon,
  getTimeDifference,
  t,
  checkIsHaveFile,
  AppNameMap
} from "@/utils";
import { CommonTable } from "@/components";
import { TABLE_COLUMNS } from "./constance";
import { getFromPc, getToken } from "@/utils/auth";
import config from "@/hooks/config";
import dayjs from "dayjs";
import FolderSelect from "./folderSelect.vue";
import { ArrowRight } from "@element-plus/icons-vue";
import configS from "@/config";
import ShareSuccess from "@/views/pc/SharePage/shareSuccess.vue";
import { useDialog } from "@/hooks/useDialog";
import { useHandleSaveFolder } from "@/hooks/composable/useHandleSaveFolder";
import { usePermissionGuard } from "@/hooks/composable/usePermissionGuard";
import defaultLogo from "@/assets/images/app-pic.png";
import superOffice from "@/assets/images/app-logo-so.png";
import workIm from "@/assets/images/app-logo-workIm.png";

const route = useRoute();

const { folderName, targetFolderContentId, isSelectFolder, saveFolder } =
  useHandleSaveFolder();
const { runPermissionGuard } = usePermissionGuard();
const shareKey = computed(() => route.query.shareKey);
const psw = computed(() => route.query.psw as string);

const isAnonymous = computed(() => !!getToken());

const { avatarUrl, ensureConfigReady } = config();

const isExpired = ref(false);
const errorMessage = ref("");
const sharePersonName = ref("");
const avatarId = ref("");
const sharePassword = ref("");
const needPassword = ref(true);
const contents = ref<Array<TypeContent>>([]);
const shareTime = ref("");
const expireTime = ref("");
const showChooseCount = ref(false);
const commonTableRef = ref();
const selectedRows = ref<Array<TypeContent>>([]);
const shareId = ref(0);
const folderRef = ref<InstanceType<typeof FolderSelect>>();
const expiredType = ref(0);

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
const isSaveSuccess = ref(false);
const isSaveBtnDisabled = ref(false);
const loading = ref(true);

const currentContentId = ref(0);

const isHaveFileApp = ref(false);

const pcStatus = ref(getFromPc());

const useByPc = computed(() => {
  return pcStatus.value;
});

const tableRef = computed(() => commonTableRef.value?.getTableRef());
const expireTimeText = computed(() => {
  if (expiredType.value === 5) return t("permanent");
  const { days, hours } = getTimeDifference(expireTime.value);
  if (days === 0) {
    return t("hoursToExpire", { count: hours });
  }
  return t("dayHoursToExpire", { count: days, hours: hours });
});

const shareStyle = computed(() => {
  if (useByPc.value) {
    return {
      width: "100%",
      height: "100vh",
    };
  } else {
    return {
      width: needPassword.value ? "600px" : "900px",
      minHeight: "388px",
    };
  }
});

const disabledBtn = computed(() => {
  const findFile = selectedRows.value.filter((item) => !item.isFolder);
  return findFile.length === 0;
});

const targetFolder = computed(() => {
  return sessionStorage.getItem("lastSelectedName") || t("myFiles");
});

const schemeUrl = computed(() => {
  let url = `${configS.cloudCallClientKey}://share-page?type=cloudDrive&shareKey=${shareKey.value}`;
  if (sharePassword.value) {
    url += `&psw=${sharePassword.value}`;
  }
  return url;
});

const appLogo = computed(() => {
  const mode = import.meta.env.MODE
  if (mode === 'so') {
    return superOffice
  } else if (mode === 'im') {
    return workIm
  } else {
    return defaultLogo
  }
})

const appName = computed(() => {
  const mode = import.meta.env.MODE
  return AppNameMap[mode] || 'Steady@Work'
})

const showDownload = computed(() => {
  return import.meta.env.MODE !== 'im'
});

watch(
  () => isSelectFolder.value,
  (val) => {
    if (!val) {
      nextTick(() => {
        selectedRows.value.forEach((item) => {
          tableRef.value?.toggleRowSelection(item);
        });
      });
    }
  },
);

const updatePcStatus = () => {
  pcStatus.value = getFromPc();
};

const selectFolder = (contentId: number, folderName: string) => {
  isSaveBtnDisabled.value = contentId === 1 && folderName === t("shared");
};

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
    }
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 1000);
  }
};

const handleShareContent = async () => {
  const content = await getShareContent(
    shareKey.value as string,
    sharePassword.value,
  );
  if (content) {
    if (content.needPassword) {
      // 密码错误
      ElMessage.error(t("errPsd"));
    } else {
      sessionStorage.setItem(
        `share_pwd_${shareKey.value}`,
        sharePassword.value,
      );
      // 成功获取分享内容
      needPassword.value = content.needPassword;
      contents.value = content.contents;
      sharePersonName.value = content.userName;
      shareTime.value = content.shareTime;
      expireTime.value = content.expiredTime;
      expiredType.value = content.expiredType;
      shareId.value = content.shareId;

      setTimeout(() => {
        handleChooseAll();
      }, 200)
    }
  }
};

const handleSelectionChange = async (row: TypeContent[]) => {
  showChooseCount.value = row.length > 0;
  selectedRows.value = row;
};

const handleChooseAll = () => {
  if (selectedRows.value.length === contents.value.length) {
    tableRef.value?.clearSelection();
    selectedRows.value = [];
  } else {
    tableRef.value.toggleAllSelection();
    selectedRows.value = contents.value;
  }
};

const download = async () => {
  const contentIds = selectedRows.value
    .filter((item) => !item.isFolder)
    .map((item) => item.contentId);
  if (!useByPc.value) {
    await downloadFileOut(shareId.value, contentIds);
  } else {
    isHaveFileApp.value = await checkIsHaveFile()
    if (!isHaveFileApp.value) {
      await downloadFileOut(shareId.value, contentIds);
    } else {
      console.log(JSON.stringify({ type: "12", data: { contentIds: contentIds, shareId: shareId.value } }));
    }
  }
};

const handleSaveFolder = async (
  targetFolderName: string,
  targetFolderId: number | null,
) => {
  await saveFolder({
    targetFolderName,
    targetFolderId,
  });
};

const appDownload = () => {
  const officeUrlMap: Record<string, string> = {
    so: "https://www.superoffice.app",
    im: "",
  }

  const downloadUrl = officeUrlMap[import.meta.env.MODE] || "https://www.gosteady.cn/index";
  window.open(downloadUrl, "_blank");
};

// 表格双击进入文件夹
const handleTableRowDblclick = async (row: TypeContent) => {
  await handleRowDblclick(row, false);
};

// 面包屑点击
const handleBreadcrumbClick = async (item: TypeContent) => {
  if (currentContentId.value === item.contentId) return;
  if (isNaN(item.contentId)) {
    backTopFolder();
    return;
  }
  await handleRowDblclick(item, true);
};

const backTopFolder = () => {
  handleShareContent();
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
  setTimeout(() => {
    isTopFolder.value = true;
  }, 100);
};

const handleRowDblclick = async (row: TypeContent, fromBreadcrumb = false) => {
  if (row.isFolder) {
    currentContentId.value = row.contentId;
    const res = await getShareFolderContentApi(row.contentId);
    if (res.code === 1) {
      isTopFolder.value = false;

      if (!fromBreadcrumb) {
        breadcrumbList.value.push(row);
      } else {
        const index = breadcrumbList.value.findIndex(
          (item) => item.contentId === row.contentId,
        );
        if (index !== -1) {
          breadcrumbList.value = breadcrumbList.value.slice(0, index + 1);
        }
      }

      if (res.data.length > 0) {
        contents.value = res.data.map((item) => ({
          contentId: item.contentId,
          name: item.contentName,
          isFolder: item.isFolder,
          size: item.contentSize,
          updateAt: item.operateTime,
          parentId: item.parentId,
        }));

        setTimeout(() => {
          handleChooseAll();
        }, 200)
      } else {
        contents.value = [];
      }
    }
  } else {
    // if (!useByPc.value) {
    //   await downloadFileOut(shareId.value, [row.contentId]);
    // } else {
    //   console.log(JSON.stringify({ type: "12", data: [row.contentId] }));
    // }
  }
};

const handleSaveToCloud = async () => {
  const contentIds = selectedRows.value.map((item) => item.contentId);
  console.log("分享内容shareId", shareId.value);
  await runPermissionGuard({
    contentIds,
    selectedRows: selectedRows.value,
    request: (ids) =>
      saveToCloudDriveApi({
        contentIds: ids,
        targetContentId: targetFolderContentId.value,
        shareId: shareId.value,
      }),
    showConfirm: (count) => {
      return useDialog({
        title: t("saveToCloudDrive"),
        content: t("savePermissionWarning", {
          count,
        }),
        confirmText: t("Ok"),
      });
    },
    notifySuccess: () => {
      ElMessage.success(t("fileSaveSuccess"));
      isSaveSuccess.value = true;
    },
    notifyError(type) {
      if (type === "all-denied") {
        ElMessage.error(t("noSavePermission"));
      } else if (type === "unknown") {
        ElMessage.error(t("operationFailedRetry"));
      }
    },
  });
};

onMounted(async () => {
  window.notifyPcStatusUpdated = updatePcStatus;
  await ensureConfigReady();
  if (useByPc.value) {
    isHaveFileApp.value = await checkIsHaveFile()
  }
  const storedPassword = sessionStorage.getItem(`share_pwd_${shareKey.value}`);

  const shareInfo = await getShareContent(
    shareKey.value as string,
    psw.value || storedPassword || "",
  );
  if (shareInfo) {
    shareId.value = shareInfo.shareId;
    needPassword.value = shareInfo.needPassword;
    sharePersonName.value = shareInfo.userName;
    avatarId.value = shareInfo.avatar;
    expireTime.value = shareInfo.expiredTime;
    expiredType.value = shareInfo.expiredType;

    if (!shareInfo.needPassword) {
      contents.value = shareInfo.contents;
      shareTime.value = shareInfo.shareTime;
      sharePassword.value = storedPassword || "";

      setTimeout(() => {
        handleChooseAll();
      }, 200)
    }
  } else {
    isExpired.value = true;
    errorMessage.value = t("shareInvalid");
  }
});
</script>

<style lang="scss" scoped>
.share-page-container {
  width: 100vw;
  height: 100vh;
  background: url("@/assets/images/share-page-bg.png") no-repeat center center;
  background-size: cover;
}

.loading-wrapper {
  width: 100%;
  height: 100%;
  background: #ffffff;
  position: absolute;
  inset: 0;
  z-index: 9999;
}

header {
  width: 100vw;
  height: 70px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-around;

  .app-pic {
    width: 255px;
    height: 48px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .el-button {
    width: 180px;
    height: 44px;
  }

  :deep(.el-button) {
    span {
      font-family: Microsoft YaHei UI;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      color: #ffffff;
    }
  }
}

.share-desc {
  font-family: Microsoft YaHei UI;
  font-size: calc(var(--base--font--size--24) * var(--scale-factor));
  text-align: center;
  color: #2d2d2d;
  margin: 80px 0;
}

:deep(.share-title) {
  line-height: 150%;
  font-family: Microsoft YaHei;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  font-weight: bold;
  color: #2d2d2d;
  padding: 10px 16px;
}

.share {
  position: relative;
  margin: 0 auto;
  border-radius: 8px;
  opacity: 1;
  background: #ffffff;
  box-shadow: 0 3px 6px 0 rgba(95, 95, 95, 0.4);

  .share-expired {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #747683;
    font-size: calc(var(--base--font--size--18) * var(--scale-factor));

    img {
      width: 240px;
      height: 240px;
    }
  }
}

.share-content-box {
  width: 268px;

  &.is-full {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &.not-full {
    margin: 50px auto 0;
  }

  .person-avatar {
    margin: 0 auto;
    width: 52px;
    height: 52px;
    border-radius: 6px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .person-name {
    margin: 10px 0 40px;
    text-align: center;
    color: #747683;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));

    .name {
      font-family: Microsoft YaHei;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      font-weight: bold;
      color: #2d2d2d;
    }
  }

  .psw-box {
    .el-input {
      width: 100%;
      height: 48px;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      border-radius: 6px;

      :deep(.el-input__wrapper) {
        box-shadow: none;
        border: 2px solid var(--el-color-primary);
        border-radius: 6px;
      }
    }
  }

  .el-button {
    width: 100%;
    height: 48px;
    margin-top: 20px;
    font-size: calc(var(--base--font--size--16) * var(--scale-factor));
    text-align: center;
    color: #ffffff;
    border-radius: 6px;
  }

  .expire-time-text {
    text-align: center;
    color: #b7b7b7;
    font-size: calc(var(--base--font--size--14) * var(--scale-factor));
    margin-top: 20px;
  }
}

.share-info {
  padding: 3px 16px 0;

  .file-wrapper {
    position: relative;
    height: 80px;
    padding: 0 22px;
    background: #f2f4f8;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-bottom: 16px;

    .file-name {
      margin-left: 8px;
      font-weight: 400;
      font-size: calc(var(--base--font--size--16) * var(--scale-factor));
      color: #2d2d2d;
      max-width: calc(100vw - 124px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 24px;
    }

    .share-meta {
      margin-top: 4px;
      display: flex;
      align-items: center;
      margin-left: 16px;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: #747683;
      line-height: 18px;

      .share-person {
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: Microsoft YaHei;
        color: #747683;
      }

      .divider {
        width: 1px;
        height: 12px;
        background-color: #e0e4eb;
        margin: 0 12px;
      }
    }

    .app-btn {
      position: absolute;
      right: 22px;
      width: 100px;
      padding: 7px 0;
      border-radius: 4px;
      background: #ffffff;
      box-sizing: border-box;
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);
      font-family: PingFang;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      font-weight: bold;
      text-align: center;
      cursor: pointer;
    }
  }

  .breadcrumb {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 4px;
    background: #f2f4f8;

    :deep(.el-breadcrumb__item) {
      &:not(:last-child) {
        .el-breadcrumb__inner {
          cursor: pointer;
          color: #747683;
        }
      }

      &:last-child {
        .el-breadcrumb__inner {
          color: #2d2d2d;
        }
      }
    }
  }

  .file-list {
    margin-bottom: 20px;

    :deep(.el-table__header) {
      th {
        .cell {
          color: #747683;
          font-weight: normal;
        }
      }
    }

    :deep(.el-table) {
      --el-table-border-color: none;
      --el-table-border: none;
    }

    :deep(.el-table__body) {
      .el-table__cell {
        padding: 12.5px 0;
      }
    }

    .file-name {
      display: flex;
      align-items: center;
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      color: #2d2d2d;

      .name {
        margin-left: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .line-divider {
    position: absolute;
    left: 0;
    height: 1px;
    width: 100%;
    background: #e0e4eb;
  }

  .operate {
    display: flex;
    align-items: center;
    padding: 16px 0;

    .folder-select {
      width: 280px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #e3e6ec;
      border-radius: 4px;
      color: #747683;
      padding: 10px;

      .folder-name {
        margin-left: 8px;
        color: #2d2d2d;
        max-width: 188px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .el-button {
      font-family: PingFang;
      border: 1px solid var(--el-color-primary);
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      font-weight: bold;

      &.el-button--default {
        color: var(--el-color-primary);
      }

      &.is-disabled {
        background: #b7b7b7;
        color: #fff;
        font-weight: normal;
        border: 1px solid #b7b7b7;
      }
    }
  }
}
</style>
