<template>
  <van-action-sheet v-model:show="showLinkDialog" @click-overlay="clearState">
    <template #default>
      <div class="action-sheet-header">
        <div class="close-text" @click="onCancel">
          {{ settings ? t("return") : t("cancel") }}
        </div>
        <div class="title">
          {{ title }}
        </div>
        <div class="copy-link" @click="onConfirm">
          {{ settings ? t("Ok") : t("copyLink") }}
        </div>
      </div>
      <div class="action-sheet-content">
        <template v-if="!settings">
          <van-cell
            :value="validTime"
            is-link
            :title="t('expiration')"
            @click="setValidTime"
          />
          <van-cell
            :title="pswCellTitle"
            :value="extracode"
            is-link
            @click="setPassword"
          />
        </template>
        <template v-else-if="settings === 'validTime'">
          <van-cell-group>
            <van-cell
              v-for="item in validTimeList"
              :key="item.value"
              :title="item.label"
              @click="changeValidTime(item.value)"
            >
              <template v-if="item.value === validKey" #right-icon>
                <SvgIcon name="ic_check" size="16" />
              </template>
            </van-cell>
          </van-cell-group>
        </template>
        <template v-else-if="settings === 'password'">
          <van-cell-group class="password-cell-group">
            <van-cell
              v-for="item in passwordList"
              :key="item.value"
              :title="item.label"
              @click="changePassword(item.value)"
            >
              <template v-if="item.value === passwordKey" #right-icon>
                <SvgIcon name="ic_check" size="16" />
              </template>
            </van-cell>
          </van-cell-group>
          <div v-if="passwordKey === 2">
            <van-field
              v-model="extracode"
              clearable
              maxlength="4"
              :placeholder="t('passwordHint')"
            />
            <div
              v-if="
                (extracode.length > 0 && isRightPassword) || showPasswordTips
              "
              class="password-tips"
            >
              {{ t("passwordFormatError") }}
            </div>
          </div>
        </template>
      </div>
    </template>
  </van-action-sheet>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useShareFileStore } from "@/stores";
import { randomPassword, generateShareText, t, copyToClipboard } from "@/utils";
import { generateShareLinkApi } from "@/api/share";
import { getContentId, getName } from "@/utils/typeUtils";

const { showLinkDialog, shareList } = storeToRefs(useShareFileStore());
const { setShowLinkDialog, setLongPress, setShareList } = useShareFileStore();

const validTimeList = [
  { label: t("1day"), value: 1 },
  { label: t("7days"), value: 2 },
  { label: t("30days"), value: 3 },
  { label: t("365days"), value: 4 },
  { label: t("permanent"), value: 5 },
];

const passwordList = [
  { label: t("noNeed"), value: 0 },
  { label: t("randomPassword"), value: 1 },
  { label: t("manualPassword"), value: 2 },
];

const title = ref(t("shareFile"));
const pswCellTitle = ref(t("randomPassword"));
const settings = ref("");
const validKey = ref(3);
const passwordKey = ref(1);
const extracode = ref("");
const showPasswordTips = ref(false);
const prefix = location.origin + location.pathname;

const firstFile = computed(() => shareList.value[0]);
const validTime = computed(() => {
  return validTimeList.find((item) => item.value === validKey.value)?.label;
});
const isRightPassword = computed(() => {
  const reg = /^[a-zA-Z0-9]{4}$/;
  if (!extracode.value) return true;
  return !reg.test(extracode.value);
});

watch(
  () => showLinkDialog.value,
  (val) => {
    if (!val) {
      setTimeout(() => {
        clearState();
      }, 300);
    }
  },
);

const setValidTime = () => {
  title.value = t("expirationSettings");
  settings.value = "validTime";
};

const setPassword = () => {
  title.value = t("passwordSettings");
  settings.value = "password";
};

const onCancel = () => {
  if (settings.value) {
    // 在密码设置页面且选择了手动设置密码时，检查密码是否有效
    if (settings.value === "password" && passwordKey.value === 2) {
      const reg = /^[a-zA-Z0-9]{4}$/;
      if (!reg.test(extracode.value)) {
        // 显示password-tips而不是toast
        showPasswordTips.value = true;
        return;
      }
    }

    settings.value = "";
    title.value = t("shareFile");
    showPasswordTips.value = false;
  } else {
    clearState();
  }
};

const clearState = () => {
  setShowLinkDialog(false);
  validKey.value = 3;
  passwordKey.value = 1;
  extracode.value = "";
  settings.value = "";
  title.value = t("shareFile");
  showPasswordTips.value = false;
};

const changeValidTime = (key: number) => {
  validKey.value = key;
  settings.value = "";
  title.value = t("shareFile");
};

const changePassword = (key: number) => {
  passwordKey.value = key;
  showPasswordTips.value = false; // 重置提示
  if (key === 2) {
    pswCellTitle.value = t("manualPassword");
    extracode.value = "";
  } else if (key === 1) {
    pswCellTitle.value = t("randomPassword");
    extracode.value = randomPassword();
    settings.value = "";
    title.value = t("shareFile");
  } else {
    pswCellTitle.value = t("noNeed");
    extracode.value = "";
    settings.value = "";
    title.value = t("shareFile");
  }
};

const onConfirm = () => {
  if (settings.value === "validTime") {
    // 确认有效期设置
    settings.value = "";
    title.value = t("shareFile");
  } else if (settings.value === "password") {
    // 确认密码设置
    if (passwordKey.value === 2) {
      // 处理手动设置密码的情况
      const reg = /^[a-zA-Z0-9]{4}$/;
      if (!reg.test(extracode.value)) {
        // 如果密码不符合要求，不返回上一级
        showPasswordTips.value = true;
        return;
      }
    }
    settings.value = "";
    title.value = t("shareFile");
  } else {
    // 非设置模式下，复制链接逻辑
    copyLinkToClipboard();
  }
};

// 复制链接到剪贴板
const copyLinkToClipboard = async () => {
  try {
    // 获取分享文件列表中的第一个文件的contentId
    let contentIds: number[] = [];
    for (const item of shareList.value) {
      if (getContentId(item)) {
        contentIds.push(getContentId(item)!);
      }
    }

    if (contentIds.length === 0) {
      showToast({ message: t("noFileSelected"), type: "fail" });
      return;
    }

    // 调用API生成分享链接
    const res = await generateShareLinkApi({
      contentIds: contentIds,
      expireType: validKey.value,
      passwordType: passwordKey.value,
      password: extracode.value,
    });

    if (res.code === 1 && res.data) {
      const count = shareList.value.length;
      const shareLink = res.data.shareKey;

      const link = `${prefix}#/share-page?shareKey=${shareLink}${res.data.password ? `&psw=${encodeURIComponent(res.data.password)}` : ""}`;
      const copyText = generateShareText({
        count,
        fileName: getName(firstFile.value!),
        shareLink: link,
        password: res.data.password,
      });

      await copyToClipboard(copyText);
      showToast({ message: t("copySuccess"), type: "success" });
      resetState();
    } else {
      const noPermissionList = JSON.parse(res.data as unknown as string);
      const noPermissionCount = noPermissionList.length;

      if (noPermissionCount === contentIds.length) {
        showToast({
          message: t("noSharePermission"),
        });
        resetState();
        return;
      }

      if (noPermissionCount > 0) {
        showConfirmDialog({
          title: t("shareFile"),
          message: t("sharePermissionWarning", { count: noPermissionCount }),
          cancelButtonText: t("cancel"),
          confirmButtonText: t("Ok"),
        })
          .then(async () => {
            // on confirm
            const newShareList = shareList.value
              .filter((item) => !noPermissionList.includes(getContentId(item)))
              .map((item) => getContentId(item)!);

            const apiRes = await generateShareLinkApi({
              contentIds: newShareList,
              expireType: validKey.value,
              passwordType: passwordKey.value,
              password: extracode.value,
            });
            if (apiRes.code === 1) {
              const count = newShareList.length;
              const shareLink = apiRes.data.shareKey;
              const link = `${prefix}#/share-page?shareKey=${shareLink}${apiRes.data.password ? `&psw=${encodeURIComponent(apiRes.data.password)}` : ""}`;
              const copyText = generateShareText({
                count,
                fileName: getName(firstFile.value!),
                shareLink: link,
                password: apiRes.data.password,
              });

              await copyToClipboard(copyText);
              showToast({ message: t("copySuccess"), type: "success" });
              resetState();
            }
          })
          .catch(() => {
            resetState();
          });
      } else {
        resetState();
      }
    }
  } catch (error) {
    console.error(t("copyFailed"), error);
    showToast({ message: t("copyFailed"), type: "fail" });
  }
};

const resetState = () => {
  setShowLinkDialog(false);
  setLongPress(false);
  setShareList([]);
};
</script>

<style lang="scss" scoped>
.action-sheet-header {
  background-color: #ebeff6;
  display: flex;
  align-items: center;
  padding: 16px;
  font-family: PingFang SC;
  white-space: nowrap;

  .close-text {
    color: #747683;
  }

  .title {
    font-family: PingFang;
    color: #2d2d2d;
    margin: 0 auto;
  }

  .copy-link {
    color: var(--el-color-primary);
  }
}

:deep(.van-cell) {
  align-items: center;
  padding: 17px 16px 17px 25px;

  .van-cell__title {
    color: #2d2d2d;
    white-space: nowrap;
  }

  .van-cell__value {
    color: #747683;
  }
}

.action-sheet-content {
  :deep(.van-cell__right-icon) {
    color: #c0c6d2;
  }
}

.password-cell-group {
  &::after {
    border: none;
  }
}

:deep(.van-field) {
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 5px;

  .van-field__control {
    padding: 7px 10px;
    border-radius: 4px;
    border: 1px solid #c0c6d2;
  }
}

.password-tips {
  padding-left: 25px;
  margin-bottom: 12px;
  color: #ef5e5e;
  line-height: 20px;
  font-size: 14px;
}
</style>
