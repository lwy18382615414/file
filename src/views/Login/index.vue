<template>
  <div class="login container-pc">
    <div class="left-view">
      <img src="@/assets/images/logo.png" alt="" class="logo" />
      <div class="happywork">
        <img src="@/assets/images/happywork.png" alt="" />
      </div>
    </div>
    <div class="right-view">
      <div class="qr-code-login">
        <div class="work">扫码进入云盘</div>
        <div class="qr-img">
          <vue-qr
            :text="qrCodeData.text"
            :size="205"
            :margin="0"
            :backgroundColor="qrCodeData.backgroundColor"
            :width="qrCodeData.width"
            :height="qrCodeData.height"
          ></vue-qr>
        </div>
        <div class="qr-code-text">
          <img src="@/assets/images/scan.png" alt="" />
          <span>扫一扫登录</span>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-login">
    <div class="container-mobile">
      <img class="login-logo" src="@/assets/images/login-logo.png" alt="" />
      <template v-if="currentStep === 1">
        <!-- 登录框 -->
        <div class="login-box">
          <div class="login-box-form">
            <div class="title">手机号登录</div>
            <div class="sms-code-box"></div>
            <div class="login-form">
              <div class="code-select-box">
                <div
                  class="code-label"
                  @click.stop="isSelectCode = !isSelectCode"
                >
                  {{ codeLabel }}
                  <img src="@/assets/images/select-icon.png" alt="" />
                </div>
                <ul class="code-list" v-show="isSelectCode">
                  <li
                    v-for="item in codeOptions"
                    :key="item.value"
                    @click.stop="selectCode(item)"
                  >
                    {{ item.label }}
                  </li>
                </ul>
              </div>
              <van-field
                v-model="loginForm.phoneNo"
                label=""
                placeholder=""
                clearable
                autocomplete="off"
                type="digit"
              />
            </div>
          </div>
          <div
            class="next-btn"
            :class="{ 'disabled-btn': !loginForm.phoneNo }"
            @click="goNext1"
          >
            下一步
          </div>
        </div>
        <!-- 同意协议 -->
        <div class="check-item">
          <van-checkbox v-model="checked" shape="square">
            请阅读并同意
            <span @click="openUrl('termsofservice')">《服务协议》</span>
            和
            <span @click="openUrl('privacypolicy')">《隐私政策》</span>
          </van-checkbox>
        </div>
        <van-dialog
          v-model:show="show"
          title="温馨提示"
          show-cancel-button
          width="280px"
          @confirm="confirm"
        >
          <template #default>
            <div class="tip-box">
              请阅读并同意
              <br />
              <span @click="openUrl('termsofservice')">《服务协议》</span>
              和
              <span @click="openUrl('privacypolicy')">《隐私政策》</span>
            </div>
          </template>
        </van-dialog>
      </template>
      <template v-if="currentStep === 2">
        <div class="login-box">
          <div class="login-box-form">
            <div class="title">手机号登录</div>
            <div class="sms-code-box">
              验证码已发送至+{{ loginForm.areaCode }} {{ loginForm.phoneNo }}
            </div>
            <div class="sms-form">
              <van-field
                v-model="loginForm.code"
                center
                clearable
                label=""
                maxlength="6"
                placeholder="验证码"
                type="digit"
              >
                <template #button>
                  <van-button
                    class="send-btn"
                    size="small"
                    type="primary"
                    v-if="hideTimeNumber"
                    @click="resetSend"
                  >
                    重新发送
                  </van-button>
                  <van-button
                    class="time-btn"
                    size="small"
                    type="primary"
                    v-else
                    >{{ timeNumber }}s后重发</van-button
                  >
                </template>
              </van-field>
            </div>
          </div>
          <div
            class="next-btn"
            :class="{ 'disabled-btn': !loginForm.code }"
            @click="goNext2"
          >
            下一步
          </div>
        </div>
        <div class="check-item"></div>
      </template>
      <template v-if="currentStep === 3">
        <div class="login-box tenant">
          <div class="title">选择身份进入</div>
          <div class="tenant-list">
            <div
              v-for="(item, index) in tenants"
              :key="index"
              class="tenant-item"
              @click="selectTenant(item)"
            >
              <div>{{ item.name }}</div>
              <img
                class="arrow"
                src="@/assets/images/tenant-right.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts" defer>
import { useI18n } from "vue-i18n";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getEnterpriseApi,
  getAreaCodeApi,
  loginAccount,
  loginByCode,
  switchEnterpriseApi,
  getSmsCodeApi,
} from "@/api/loginService.ts";
import { setToken } from "@/utils/auth";
import vueQr from "vue-qr/src/packages/vue-qr.vue";
import { Guid } from "js-guid";
import config from "@/hooks/config";
import { getLanguageFormatCode } from "@/utils";

const { policyUrl } = config();

const { t, locale } = useI18n();
const router = useRouter();
const cancelReason = "initiative cancel login";
const isNavigating = ref(false); //是否立即调用获取二维码方法
//二维码参数
const qrCodeData = ref({
  text: "",
  backgroundColor: "rgba(255,255,255,0.39)",
  width: "180",
  height: "180",
});
let qrCodeContent = "";
let userId = 0;
let clientId = Guid.newGuid().toString();
let cancelTokenSource: any;
//二维码登录
const loginCheck = async () => {
  if (isNavigating.value) return;
  return new Promise((resolve, reject) => {
    try {
      let loginInform = {
        clientId: clientId,
        qrCodeContent: qrCodeContent,
        userId: userId,
      };
      const { cancelToken, httpRequest } = loginAccount(loginInform);
      cancelTokenSource = cancelToken;
      httpRequest
        .then(async (res: any) => {
          console.log("扫码后的数据", res);
          if (res.code === 1) {
            if (res.data.token) {
              setToken(res.data.token);
              // Storage.setItem('imConfigInfo', res.data.imUserLoginInfo)
              sessionStorage.setItem("tenantId", res.data.tenantId);
              const myInfo = {
                nickName: res.data.nickName,
                userId: res.data.userId,
              };
              sessionStorage.setItem("myUserInfo", JSON.stringify(myInfo));
              userId = 0;
              qrCodeContent = "";
              // await goLogin()
              router.push("/");
              return;
            } else if (res.data.userId > 0) {
              // // 有用户信息
              // if (res.data.avatar && Storage.getItem('configData')) {
              //   // 有头像
              //   personImg.value = urlUtil().fullAvatarUrl(res.data.avatar)
              // } else {
              //   // 无头像
              //   personImg.value = defalutImgUrl
              // }
            } else if (res.data.qrCodeContent) {
              qrCodeData.value.text = res.data.qrCodeContent;
            }
            if (!res.data.token) {
              if (res.data.qrCodeContent) {
                qrCodeContent = res.data.qrCodeContent;
              }
              userId = res.data.userId;
              await loginCheck();
            }
          } else {
            // showReload.value = true
          }
          resolve(res);
        })
        .catch((error) => {
          // if (error && error.message === cancelReason) {
          //   return
          // }
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
};
loginCheck();
const loginForm = ref({
  phoneNo: "",
  areaCode: "",
  type: 1,
  code: "",
});
const codeLabel = ref("");
const isSelectCode = ref(false);
const codeOptions = ref<any>([]);
const selectCode = (item: any) => {
  isSelectCode.value = false;
  loginForm.value.areaCode = item.value;
  codeLabel.value = item.label;
};
const closeCode = () => {
  isSelectCode.value = false;
};
const checked = ref(false);
const show = ref(false);
const currentStep = ref(1);
let smsTimer: any;
const timeNumber = ref(60);
const hideTimeNumber = ref(true);
const resetTimer = () => {
  hideTimeNumber.value = true;
  timeNumber.value = 60;
  clearInterval(smsTimer);
};
const goNext1 = () => {
  if (!loginForm.value.phoneNo) {
    return;
  }
  if (!checked.value) {
    show.value = true;
    return;
  }
  getSmsCodeApi({
    type: loginForm.value.type,
    phoneNo: loginForm.value.phoneNo,
    areaCode: loginForm.value.areaCode,
  }).then((res: any) => {
    currentStep.value = 2;
    timeNumber.value = 60;
    hideTimeNumber.value = false;
    smsTimer = setInterval(() => {
      timeNumber.value--;
      if (timeNumber.value <= 0) {
        resetTimer();
      }
    }, 1000);
  });
};
const resetSend = () => {
  hideTimeNumber.value = false;
  getSmsCodeApi({
    type: loginForm.value.type,
    phoneNo: loginForm.value.phoneNo,
    areaCode: loginForm.value.areaCode,
  }).then((res: any) => {
    smsTimer = setInterval(() => {
      timeNumber.value--;
      if (timeNumber.value <= 0) {
        resetTimer();
      }
    }, 1000);
  });
};
const confirm = () => {
  checked.value = true;
  goNext1();
};
const tenants = ref<any>([]);
const goNext2 = () => {
  if (!loginForm.value.code) return;
  loginByCode({
    code: loginForm.value.code,
    phoneNo: loginForm.value.phoneNo,
    areaCode: loginForm.value.areaCode,
  }).then((res2: any) => {
    currentStep.value = 3;
    setToken(res2.data.token);
    getEnterpriseApi().then((res3: any) => {
      tenants.value = res3.data?.filter((item: any) => item.tenantId != 0);
    });
  });
};
const selectTenant = (item: any) => {
  switchEnterpriseApi(item.tenantId).then((res: any) => {
    sessionStorage.setItem("myUserInfo", JSON.stringify(res.data));
    sessionStorage.setItem("tenantId", item.tenantId);
    router.push("/");
  });
};
const openUrl = (str: string) => {
  window.open(
    policyUrl.value + str + "_" + getLanguageFormatCode(locale.value) + ".html"
  );
};
onMounted(() => {
  getAreaCodeApi().then((res: any) => {
    codeOptions.value = res.data.map((item: any) => ({
      ...item,
      label: "+" + item.areaCode,
      value: item.areaCode,
    }));
    if (codeOptions.value.find((item) => item.areaCode === "86")) {
      loginForm.value.areaCode = "86";
      codeLabel.value = "+86";
    } else {
      loginForm.value.areaCode = codeOptions.value[0].value;
      codeLabel.value = codeOptions.value[0].label;
    }
  });
  document.addEventListener("click", closeCode);
});
onUnmounted(() => {
  if (cancelTokenSource) {
    cancelTokenSource.cancel(cancelReason);
    cancelTokenSource = undefined;
  }
  isNavigating.value = true;
  document.removeEventListener("click", closeCode);
  clearInterval(smsTimer);
});
</script>

<style scoped lang="scss">
//@import "@/assets/common.scss";

.login {
  display: flex;
  height: 100vh;

  > div {
    width: 50%;
  }

  .left-view {
    background: #eef5ff;

    .logo {
      width: 200px;
      height: 60px;
      margin: 30px 0 0 71px;
    }

    .happywork {
      width: 100%;
      text-align: right;

      img {
        width: 75%;
      }
    }
  }

  .right-view {
    background: #f4fafd;
    display: flex;
    align-items: center;
  }
}

.qr-code-login {
  background: #eef5ff;
  width: 430px;
  height: 524px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 150px;
  margin-top: 60px;
  border-radius: 12px;
  gap: 30px;

  .work {
    font-size: calc(var(--base--font--size--22) * var(--scale-factor));
  }

  .qr-img {
    width: 230px;
    height: 230px;
    padding: 25px;
    background: #fff;
    border-radius: 8px;
  }

  .qr-code-text {
    display: flex;
    align-items: center;

    img {
      width: 26px;
      height: 26px;
    }

    > span {
      color: var(--text-secondary-color);
      font-weight: 16px;
    }
  }
}

.mobile-login {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container-mobile {
  display: none;
  //padding-bottom: 30px;
  //padding-top: 108px;

  .login-logo {
    width: 160px;
    height: 126px;
  }

  .login-box {
    width: 100%;
    margin-top: 80px;
    //height: calc(100% - 208px);
    display: flex;
    flex-direction: column;
    align-items: center;

    .title {
      font-size: calc(var(--base--font--size--22) * var(--scale-factor));
      font-weight: bold;
    }

    .tenant-list {
      margin-top: 45px;
      width: 100%;

      .arrow {
        width: 12px;
        height: 12px;
      }

      .tenant-item {
        padding: 14px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--input-bg-color);
      }
    }
  }

  .tenant {
    align-items: flex-start;
    padding: 0 16px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
    border-bottom: 1px solid var(--input-bg-color);
    padding: 0;
  }

  .login-box-form {
    width: 248px;
    text-align: left;
    margin-bottom: 38px;

    .title {
      font-size: calc(var(--base--font--size--22) * var(--scale-factor));
      font-weight: bold;
    }

    .sms-code-box {
      height: 48px;
      color: var(--text-secondary-color);
      font-size: calc(var(--base--font--size--14) * var(--scale-factor));
      margin-top: 4px;
    }

    .code-select-box {
      position: relative;
      height: 22px;
      line-height: 22px;

      .code-label {
        display: flex;
        align-items: center;
        font-weight: bold;

        img {
          width: 10px;
          height: 7px;
          margin-left: 6px;
        }
      }

      .code-list {
        position: absolute;
        left: -34px;
        top: 23px;
        width: 80px;
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
        border-radius: 4px;
        width: 95px;
        background: #fff;
        z-index: 1;
        max-height: 213px;
        overflow-y: auto;

        li {
          height: 32px;
          line-height: 32px;
          text-align: center;
          font-size: calc(var(--base--font--size--14) * var(--scale-factor));
        }
      }
    }

    .login-form {
      display: flex;
      align-items: center;

      .van-field {
        width: 180px;
        padding: 0;
        margin-left: 8px;
        border-bottom: 1px solid var(--input-bg-color);
      }
    }

    .sms-form {
      .van-field {
        padding: 0;
        border-bottom: 1px solid var(--input-bg-color);
      }

      :deep(.van-field__button) {
        padding-bottom: 3px;
      }

      .time-btn {
        height: 22px;
        line-height: 22px;
        border-color: var(--text-weak-color);
        background: #fff;
        color: var(--text-weak-color);
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));
        padding: 0 12px;
      }

      .send-btn {
        height: 22px;
        line-height: 22px;
        padding: 0 12px;
        font-size: calc(var(--base--font--size--12) * var(--scale-factor));
        border-color: transparent;
        color: var(--theme-color);
        background: #eaf0ff;
      }
    }
  }

  .next-btn {
    width: calc(100% - 40px);
    height: 42px;
    background: var(--btn-primary-color);
    color: #fff;
    text-align: center;
    line-height: 42px;
    border-radius: 8px;
  }

  .disabled-btn {
    background: #ccc;
  }

  .check-item {
    min-height: 20px;
    position: absolute;
    bottom: 25px;

    .van-checkbox {
      font-size: calc(var(--base--font--size--12) * var(--scale-factor));

      span {
        color: var(--theme-color);
      }

      :deep(.van-checkbox__icon) {
        font-size: calc(var(--base--font--size--10) * var(--scale-factor));
      }

      :deep(.van-checkbox__label) {
        color: var(--text-weak-color);
      }

      :deep(.van-checkbox__icon--checked .van-icon) {
        background-color: var(--btn-primary-color);
        border-color: var(--theme-color);
      }
    }
  }

  .tip-box {
    text-align: center;
    margin: 20px 0;

    span {
      color: var(--theme-color);
    }
  }
}

@media screen and (max-width: 500px) {
  .login {
    display: none;
  }
  .container-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    //position: absolute;
    //top: 50%;
    //left: 50%;
    //transform: translate(-50%, -50%);
  }
}
</style>
<style lang="scss">
.phone-number-select {
  .el-select-dropdown__item {
    padding: 0;
    text-align: center;
  }

  .el-popper__arrow {
    display: none;
  }
}
</style>
