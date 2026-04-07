import configProd from "./prod.ts";
import configLocal from "./local.ts";
import configSit from "./sit.ts";
import configAgentSta from "./agentSta.ts";
import configCN from "./cn.ts";
import configSG from "./sg.ts";
import configSo from "./so.ts";
import configIm from "./workIm";
import type ConfigOption from "@/config/ConfigOptions";

const env = { ...import.meta.env };
const envPrefix = "VITE_";

// 环境与配置文件的映射
const configMap: Record<string, ConfigOption> = {
  local: configLocal,
  sit: configSit,
  agentSta: configAgentSta,
  CN: configCN,
  SG: configSG,
  so: configSo,
  im: configIm,
  production: configProd,
};

const currentMode = env.MODE ?? "local";
const configUrl = configMap[currentMode] || configLocal;

Object.keys(env).forEach((key) => {
  const configKey = key.replace(envPrefix, "");
  if (configKey in configUrl) {
    configUrl[configKey] = env[key];
  }
});

console.log("当前配置：", currentMode, configUrl);

export default configUrl;
