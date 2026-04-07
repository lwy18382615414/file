export default interface ConfigOption {
  [key: string]: string | boolean | undefined;

  BASE_URL: string;
  PROD: boolean; //正式环境
  DEV: boolean; //开发环境
  devSkipLogin: boolean; //开发跳过登录 (正式环境 必为 false)
  devUseMock: boolean; //开发是使用模拟接口 (正式环境 必为 false)
  baseHost: string;
  baseApi: string; // '' 请求测试服务器接口  '/apis'  请求本地mock接口
  needVConsole?: boolean;
  configApi: string;
  countryCode: string;
  cloudCallClientKey: string
}
