import axios from "axios";
import { DeviceType } from "@/enum/baseEnum";
import {
  getFromApp,
  getToken,
  removeAll,
  removeToken,
  getDeviceId,
  getFromPc,
} from "./auth";
import configUrl from "@/config";
import { getDeviceType, isTokenCleared } from "@/utils";
import httpCode, { httpMessage } from "@/utils/httpCode";
import i18n from "@/lang";
import { ElMessage } from "element-plus";
import { SessionStorageUtil } from "@/utils";

const { t } = i18n.global;
const env = import.meta.env;
const pendingRequest: any[] = [];
const isPc = getDeviceType() === DeviceType.PC;
const isPcEnv = !getFromPc() && !getFromApp() ? isPc : !!getFromPc();

const excludeCode = [httpCode.Success];
const unAuthorizedCode = [httpCode.Unauthorized, httpCode.LoginOnOtherDevice];

const baseHost = sessionStorage.getItem("webConfig")
  ? JSON.parse(sessionStorage.getItem("webConfig")!).apiUrl
  : configUrl.baseHost;

const countryCode = configUrl.countryCode || "CN";
const request = axios.create({
  baseURL: env.PROD ? `${baseHost}` : configUrl.baseHost,
  timeout: 1000 * 50,
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    CountryCode: countryCode,
    DeviceId: getDeviceId(),
  },
});

request.interceptors.request.use((config: any) => {
  const token = getToken();
  const timeStamp = new Date().getTime();
  const tenantId = SessionStorageUtil.get("tenantId") || 0;
  config.params = {
    ...config.params,
    timeStamp,
  };
  const requestMark = `${config.method} ${config.url}`;
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  config.cancelToken = source.token;
  pendingRequest.push({
    name: requestMark,
    cancel: source.cancel,
    routeChangeCancel: config.routeChangeCancel,
  });

  if (tenantId) {
    config.params = {
      ...config.params,
      tenantId,
    };
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.CountryCode = countryCode;
    config.headers.TenantId = tenantId;
  } else {
    isTokenCleared();
  }

  return config;
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (unAuthorizedCode.includes(res.code)) {
      removeAll();
      removeToken();
    }
    if (!excludeCode.includes(res.code)) {
      // if (isPcEnv) {
      //   ElMessage.warning(t(httpMessage[res.code] || `E${res.code}`));
      // } else {
      //   showToast({ message: t(httpMessage[res.code] || `E${res.code}`) });
      // }
    }
    return res;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  },
);

export default request;
