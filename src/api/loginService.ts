import type { IResponse } from "@/type";
import request from "@/utils/service";
import type {
  LoginByCodeParams,
  LoginCallbackParams,
  SmsCodeParams,
} from "@/api/type";
import axios from "axios";

import type { EnterPriseCallbackParams } from "@/api/type";
import { SWLoginSourceType, SWOSType } from "@/enum/baseEnum";

// 获取二维码
export function loginAccount(data: any) {
  const cancelToken = axios.CancelToken.source();
  const headers = {
    headers: {
      deviceName: encodeURIComponent(navigator.userAgent),
      osType: SWOSType.desktop,
      loginSource: SWLoginSourceType.web,
    },
    timeout: 30000,
    cancelToken: cancelToken.token,
  };
  const httpRequest = request.post("/rest/api/login/qrcode", data, headers);
  return { cancelToken, httpRequest };
}

// 获取当前用户的企业信息
export function getEnterpriseApi(): Promise<
  IResponse<EnterPriseCallbackParams[]>
> {
  return request.get("/rest/api/enterprise");
}

// 获取区号
export function getAreaCodeApi(): Promise<IResponse<string[]>> {
  return request.get("/rest/api/country");
}

export function loginByCode(
  data: LoginByCodeParams
): Promise<IResponse<LoginCallbackParams>> {
  return request.post("/rest/api/login/phonebycode", data);
}

// 切换企业
export function switchEnterpriseApi(tenantId: number): Promise<IResponse<any>> {
  return request.post("/rest/api/enterprise/selectenterprise/" + tenantId);
}

// 获取短信验证码
export function getSmsCodeApi(data: SmsCodeParams): Promise<IResponse<any>> {
  return request.post("/rest/api/verificationcode/sendsmscode", data);
}
