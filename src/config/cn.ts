export default {
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD, //正式环境
  DEV: import.meta.env.DEV, //开发环境
  devSkipLogin: false, //开发跳过登录 (正式环境 必为 false)
  devUseMock: false, //开发是使用模拟接口 (正式环境 必为 false)
  httpMockUrl: "",
  needVConsole: false,
  //后续字段打包后时以 env配置文件为准
  baseApi: "/rest/api/", // '' 请求测试服务器接口  '/apis'  请求本地mock接口
  baseHost: "https://gsteady-api.gosteady.cn",
  configApi: "https://getconfig.gosteady.cn",
  avatarUrl: "https://getconfig.gosteady.cn/api/file/download/avatar",
  policyUrl: "https://h5.gosteady.cn/",
  countryCode: "CN",
  cloudCallClientKey: "steady-work-web",
  cloudCallAppKey: "swprdcn",
};
