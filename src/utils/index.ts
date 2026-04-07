import { Permission } from "@/enum/permission";
import { iconMap } from "@/utils/contance";
import type { DownloadAppOptions, DownloadOptions } from "@/types/type";
import { downloadFileApi, getDownloadFileIdApi } from "@/api/fileService";
import { decryptFile } from "./upload/encrypt";
import config from "@/hooks/config";
import { DeviceType } from "@/enum/baseEnum";
import { downloadFileOutApi, checkSharePermissionApi } from "@/api/share";
import i18n from "@/lang";
import { getFromApp } from "./auth";
import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
import { checkFileIsSharedApi } from "@/api/fileService";
import dayjs from "dayjs";
import { getUserAppsApi } from "@/api/common";

const { cloudDriveUploadUrl, fileMaxSize } = config();

export const AppNameMap: Record<string, string> = {
  so: "Supper Office",
  wi: "WorkIM",
};

export const t = i18n.global.t;

export default class LocalStorageUtil {
  static set<T>(key: string, value: T): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (e) {
      console.error(`[LocalStorageUtil] set error: ${e}`);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (e) {
      console.error(`[LocalStorageUtil] get error: ${e}`);
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

export class SessionStorageUtil {
  static set<T>(key: string, value: T): void {
    try {
      const data = JSON.stringify(value);
      sessionStorage.setItem(key, data);
    } catch (e) {
      console.error(`[SessionStorageUtil] set error: ${e}`);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const data = sessionStorage.getItem(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (e) {
      console.error(`[SessionStorageUtil] get error: ${e}`);
      return null;
    }
  }

  static remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    sessionStorage.clear();
  }
}

export const getQueryVariable = (name: string) => {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  const r =
    window.location.search.substring(1).match(reg) ||
    window.location.hash
      .substring(window.location.hash.search(/\?/) + 1)
      .match(reg);
  if (r !== null) {
    return decodeURIComponent(r[2]);
  }
};

export const initFontScale = () => {
  const fontScale =
    getQueryVariable("fontScale") ||
    SessionStorageUtil.get<string>("fontScale");
  if (!fontScale) return false;

  document.documentElement.style.setProperty("--scale-factor", `${fontScale}`);
  SessionStorageUtil.set("fontScale", `${fontScale}`);
  return true;
};

export function getDeviceType(): DeviceType {
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent)
    ? DeviceType?.H5
    : DeviceType?.PC;
}

export function isTokenCleared() {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.onLocalStorageCleared();
  } else if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "onLocalStorageCleared",
    ]);
  }
}

export const checkAndroidOrIos = () => {
  const u = window.navigator.userAgent;
  const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1;
  const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  return {
    isAndroid,
    isiOS,
  };
};

export const handleFileSave = (isSuccess: boolean, warnText: string) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.fileSaveResult(isSuccess, warnText);
  } else if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "fileSaveResult",
      isSuccess,
      warnText,
    ]);
  }
};

export const isRootFolder = (path: string) => {
  const isRoot = rootPath.includes(path);

  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.isRootDir(isRoot);
  } else if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "isRootDir",
      isRoot,
    ]);
  }
};

export const copyToClipboard = async (text: string) => {
  console.log("copyToClipboard", text);
  const { isAndroid, isiOS } = checkAndroidOrIos();

  if (getFromApp() && isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "copyToClipboard",
      text,
    ]);
  } else {
    await toClipboard(text);
  }
};

export const getLanguageFormatCode = (lanCode: string) => {
  let lanLabel = "en";
  if (lanCode === "zh") {
    lanLabel = "zh-Hans";
  } else if (lanCode === "za") {
    lanLabel = "zh-Hant";
  } else {
    lanLabel = "en";
  }

  return lanLabel;
};

// 唤醒app分享
export const h5CallAppShare = (shareFile: string, isDirectSend = 0) => {
  console.log("h5CallAppShare", shareFile, isDirectSend);
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    if (!isDirectSend) {
      window.android?.setShowShareDialog(shareFile);
    } else {
      window.android?.setShowShareDialog(shareFile, isDirectSend);
    }
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "setShowShareDialog",
      shareFile,
      isDirectSend,
    ]);
  }
};

export const appGoBack = () => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.goBack();
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage(["goBack"]);
  }
};

export const setAppTitle = (title: string) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();

  if (isAndroid) {
    window.android?.setTitle(title);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "setTitle",
      title,
    ]);
  }
};

export const downloadInApp = (file: string) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.h5DownloadFile(file);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "h5DownloadFile",
      file,
    ]);
  }
};

// 下载分享文件
export const downloadShareFileInApp = (
  file: string,
  showToast: boolean = false,
) => {
  console.log("downloadShareFileInApp", file, showToast);
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.h5DownloadShareFiles(file, showToast);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "h5DownloadShareFiles",
      file,
      showToast,
    ]);
  }
};

export const goAppPage = (page: string, json: string) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  console.log(page, json);
  if (isAndroid) {
    window.android?.goPage(page, json);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "goPage",
      page,
      json,
    ]);
  }
};

export const showAppButton = (type: number, name: string) => {
  // type 1 文字按钮  2 图标按钮 3 下拉按钮
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.setNavRightBtn(type, name);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "setNavRightBtn",
      type,
      name,
    ]);
  }
};

export const showAppButton2 = (type: number, name: string) => {
  // type 1 文字按钮  2 图标按钮 3 下拉按钮
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.setNavRightBtn2(type, name);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "setNavRightBtn2",
      type,
      name,
    ]);
  }
};

export const hideAppButton = () => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.hideNavRightBtn();
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "hideNavRightBtn",
    ]);
  }
};

export const hideAppButton2 = () => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.hideNavRightBtn2();
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "hideNavRightBtn2",
    ]);
  }
};

export const showNavLeftCloseBtn = (status: boolean, type?: string) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.showNavLeftCloseBtn(status, type);
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "showNavLeftCloseBtn",
      status,
      type,
    ]);
  }
};

// 唤起app选人界面
export const h5CallAppSelectPerson = (
  isMultiple: boolean,
  choosePerson: Record<string, any>,
  mustPerson: Record<string, any>,
) => {
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.h5CallAppSelectPerson(
      JSON.stringify({
        isMultiple,
        choosePerson,
        mustPerson,
        myTenantId:
          getQueryVariable("chatTenantId") ||
          sessionStorage.getItem("tenantId"),
      }),
    );
  }
  if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "h5CallAppSelectPerson",
      JSON.stringify({
        isMultiple,
        choosePerson,
        mustPerson,
        myTenantId:
          getQueryVariable("chatTenantId") ||
          sessionStorage.getItem("tenantId"),
      }),
    ]);
  }
};

// 选人结果回调
export const h5SelectPersonResult = (
  isMultiple: boolean,
  choosePerson: Record<string, any>,
  mustPerson: Record<string, any>,
  setDataCallBack: any,
) => {
  return new Promise((resolve, reject) => {
    try {
      let useH5SelectPerson = true;
      window.setSelectPersonData = setDataCallBack;
      window.setCallAppSelectPersonStatus = () => {
        useH5SelectPerson = false;
      };
      h5CallAppSelectPerson(isMultiple, choosePerson, mustPerson);
      setTimeout(() => {
        resolve(useH5SelectPerson);
      }, 500);
    } catch (e) {
      reject(e);
    }
  });
};

// 时间格式化函数
// utils/formatTime.ts
export function formatTime(time: Date | string | number): string {
  const uploadDate = new Date(time);
  const currentDate = new Date();
  const diff = currentDate.getTime() - uploadDate.getTime();

  // 1分钟内显示「刚刚」
  if (diff < 60 * 1000) return t("justNow");

  // 30分钟内显示「x分钟前」
  if (diff <= 30 * 60 * 1000) {
    const count = Math.floor(diff / (60 * 1000));
    return `${t(count <= 1 ? "minutesAgo" : "minutesAgo_plural", { count })}`;
  }

  // 判断是否当天
  const isSameDay =
    uploadDate.getDate() === currentDate.getDate() &&
    uploadDate.getMonth() === currentDate.getMonth() &&
    uploadDate.getFullYear() === currentDate.getFullYear();

  // 当天24点前显示具体时间
  if (isSameDay) {
    return uploadDate
      .toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .slice(0, 5);
  }

  // 判断是否本周
  if (isSameWeek(uploadDate, currentDate)) {
    const weekDays = [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
    ];
    return `${weekDays[uploadDate.getDay()]} ${uploadDate
      .toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .slice(0, 5)}`;
  }

  return dayjs(uploadDate).format("YYYY/MM/DD HH:mm");
}

// 判断是否同一周
function isSameWeek(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // 重置时间到周一00:00
  const resetToMonday = (d: Date) => {
    const day = d.getDay() || 7; // 周日转换为7
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
  };

  resetToMonday(d1);
  resetToMonday(d2);

  return d1.getTime() === d2.getTime();
}

// 时间倒计时函数
export function countdown(time: Date | string | number): string {
  // 将输入时间转换为Date对象
  const inputDate = new Date(time);

  // 获取目标日期的本地0点
  const targetYear = inputDate.getFullYear();
  const targetMonth = inputDate.getMonth();
  const targetDay = inputDate.getDate();
  const targetDate = new Date(targetYear, targetMonth, targetDay);

  // 获取当前日期的本地0点
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const today = new Date(currentYear, currentMonth, currentDay);

  // 计算时间差（毫秒）
  const diff = targetDate.getTime() - today.getTime();

  // 处理过期或当天的情况
  if (diff <= 0) {
    return t("daysLeft", { count: 0 });
  }

  // 计算完整的天数
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  return t("daysLeft", { count: days });
}

// 计算一个时间的时间差，精确到dd天hh小时
export function getTimeDifference(startTime: Date | string | number) {
  const startDate = new Date();
  const endDate = new Date(startTime);
  const diff = endDate.getTime() - startDate.getTime(); // 时间差（毫秒）

  // 计算天数和小时数
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return { diff, days, hours };
}

// 格式化过期时间
export function getExpirationStatus(
  status: number,
  expireType: number,
  expireTime: string,
) {
  // 优先处理status
  if (status === 2) return t("shareExpired");
  if (status === 3) return t("shareExpired");

  // 处理expireType
  if (expireType === 5) return t("permanent");

  // 处理时间计算
  const now = new Date().getTime();
  const expireDate = new Date(expireTime).getTime();
  const diffMs = expireDate - now;

  // 时间已过期
  if (diffMs <= 0) return t("shareExpired");

  const totalHours = Math.round(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    // 不足24小时的情况
    if (totalHours < 1) {
      // 不足1小时显示1小时后
      return t("hoursToExpire", { count: 1 });
    } else {
      // 显示实际小时数
      return t("hoursToExpire", { count: totalHours });
    }
  } else {
    // 超过或等于24小时，计算天数和剩余小时数
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours === 0
      ? t("daysToExpire", { count: days })
      : t("dayHoursToExpire", { count: days, hours });
  }
}

// 分享链接中的文件名处理
export function truncateName(
  input: string,
  maxLength: number = 12,
  startLength: number = 5,
  endLength: number = 5,
): string {
  if (input.length <= maxLength) {
    return input;
  }

  const lastDotIndex = input.lastIndexOf(".");
  let namePart: string;
  let extensionPart: string = "";

  if (lastDotIndex !== -1) {
    namePart = input.substring(0, lastDotIndex);
    extensionPart = input.substring(lastDotIndex);
  } else {
    namePart = input;
  }

  if (namePart.length <= maxLength - extensionPart.length) {
    return input;
  }

  const start = namePart.substring(0, startLength);
  const end = namePart.substring(namePart.length - endLength);
  return `${start}...${end}${extensionPart}`;
}

// 生成分享链接文本
export function generateShareText({
  count,
  fileName,
  shareLink,
  password,
}: {
  count: number;
  fileName: string;
  shareLink: string;
  password: string;
}) {
  const truncatedName = truncateName(fileName);
  const mode = import.meta.env.MODE;
  const appName = AppNameMap[mode] || "Steady@Work";
  const itemDesc =
    count === 1
      ? t("sharePrompt", { count: count, fileName: truncatedName, appName })
      : t("sharePrompts", { count: count, fileName: truncatedName, appName });

  const passwordText = password ? `\n${t("password")}: ${password}` : "";

  return `${itemDesc}\n${t("link")}: ${shareLink}${passwordText}`;
}

// 文件大小格式化函数
export function formatFileSize(size: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 是否有权限
export const hasPermission = (
  userPermission: number | undefined | null,
  requiredPermission: Permission,
) => {
  if (!userPermission) {
    return true;
  }
  return (userPermission & requiredPermission) === requiredPermission;
};

// 条件渲染文件图标
export const getFileIcon = (filename: string) => {
  if (!filename) return "file-known";
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";

  return ext ? iconMap[ext] || "file-known" : "file-known";
};

export const isJsonStr = (str: string) => {
  try {
    const obj = JSON.parse(str);
    return typeof obj == "object" && obj;
  } catch (e) {
    return false;
  }
};

// 下载文件
export const downloadFile = async (options: DownloadOptions) => {
  const { apiFunction, contentId, fileName, blobOptions } = options;

  const res = await getDownloadFileIdApi(contentId);
  if (res.code !== 1) {
    ElMessage.error(t("errorOccurred"));
    return;
  }
  const { fileId, aesKey } = res.data;
  try {
    let fileBlob: Blob[];
    // 调用API获取文件数据
    const response = await apiFunction(fileId);

    if (aesKey === "") {
      // 无需解密直接下载
      fileBlob = [response];
    } else {
      fileBlob = await decryptFile(response, aesKey);
    }

    // 创建Blob对象
    const blob = new Blob(fileBlob, blobOptions);

    // 创建临时链接
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // 设置下载属性
    link.download = fileName;
    link.href = url;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理资源
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error("文件下载失败:", error);
    throw error;
  }
};

// 客户端外部下载文件
export const downloadFileOut = async (shareId: number, contentId: number[]) => {
  const res = await downloadFileOutApi(shareId, contentId);
  if (res.code !== 1) {
    ElMessage.error(t("errorOccurred"));
    return;
  } else {
    for (const file of res.data) {
      const { fileId, aesKey, fileName } = file;
      try {
        let fileBlob: Blob[];
        // 调用API获取文件数据
        const response = await downloadFileApi(fileId);

        if (aesKey === "") {
          // 无需解密直接下载
          fileBlob = [response];
        } else {
          fileBlob = await decryptFile(response, aesKey);
        }

        // 创建Blob对象
        const blob = new Blob(fileBlob);

        // 创建临时链接
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        // 设置下载属性
        link.download = fileName;
        link.href = url;

        // 触发下载
        document.body.appendChild(link);
        link.click();

        // 清理资源
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (error) {
        console.error("文件下载失败:", error);
        throw error;
      }
    }
  }
};

// 在app中下载文件
export const downloadInAppFile = async (options: DownloadAppOptions) => {
  const { contentId, fileName, fileSize } = options;
  const res = await getDownloadFileIdApi(contentId);
  if (res.code !== 1) {
    showToast(t("errorOccurred"));
    return;
  }
  const { fileId, aesKey } = res.data;
  const file = {
    fileName: fileName,
    filePath:
      cloudDriveUploadUrl.value +
      `/api/file/download/clouddrive?fileid=${fileId}`,
    fileSize: fileSize,
    sn: aesKey,
  };

  const fileArr = [file];

  // downloadInApp(JSON.stringify(file));
  downloadShareFileInApp(JSON.stringify(fileArr), true);
};
export const generateBreadcrumb = (file: any, idPath: string) => {
  const pathSegements = file.path.split("/").filter((p: string) => p !== "");

  const folderNames = file.isFolder
    ? pathSegements.slice(1)
    : pathSegements.slice(1, -1);

  const idSegments = idPath.split("/").filter((p) => p !== "");

  if (file.isFolder) {
    idSegments.push(file.contentId);
  }

  let accumLatePath = "/folder";

  return idSegments.map((id, index) => {
    const currentId = parseInt(id);
    const item = {
      title: folderNames[index],
      path: `${accumLatePath}/${id}`,
      contentId: currentId,
      pid: index === 0 ? 0 : parseInt(idSegments[index - 1]),
    };
    accumLatePath = item.path;
    return item;
  });
};

export const generateShareBreadcrumb = (file: any, idPath: string) => {
  const pathSegements = file.path.split("/").filter((p: string) => p !== "");
  const idSegments = idPath
    .split("/")
    .filter((p) => p !== "")
    .map((id) => parseInt(id));

  const folderNames = file.isFolder
    ? pathSegements.slice(1)
    : pathSegements.slice(1, -1);

  const result = [];
  let accumulatedPath = "/folder";

  if (file.isFolder) {
    idSegments.push(file.contentId);
  }

  console.log(idSegments);

  const [shareId, ...restIds] = idSegments;
  const [shareName, ...restNames] = folderNames;

  // 添加共享空间特殊项
  result.push({
    path: `/share-space/${shareId}`,
    title: shareName,
    contentId: shareId,
  });

  // 重新初始化路径为普通文件夹
  accumulatedPath = "/folder";

  // 处理剩余项
  restIds.forEach((id, index) => {
    const item = {
      title: restNames[index],
      path: `${accumulatedPath}/${id}`,
      contentId: id,
      pid:
        index === 0
          ? shareId // 第二项的父级是共享空间ID
          : restIds[index - 1],
    };
    accumulatedPath = item.path;
    result.push(item);
  });

  return result;
};

// 校验文件名是否合法
export const checkNameValidity = (
  str: string,
): {
  isValid: boolean;
  invalidChars: string[];
  message: string;
} => {
  // 匹配所有非法字符
  const matches = str.match(/[\\/:*?"<>|]/g) || [];

  return {
    isValid: matches.length === 0,
    invalidChars: [...new Set(matches)], // 去重后返回
    message:
      matches.length > 0
        ? `${t("invalidCharacters")}：${[...new Set(matches)].join(" ")}`
        : "",
  };
};

// 处理文件名和文件夹名
export function handleFileAndFolderName(path: string): string {
  // 分割路径并过滤空部分
  const parts = path.split(/[\/\\]/).filter((p) => p !== "");
  if (parts.length === 0) return "";
  const lastPart = parts[parts.length - 1];

  // 查找最后一个点号的位置
  const dotIndex = lastPart.lastIndexOf(".");
  // 判断是否为文件（存在点号且不在末尾）
  if (dotIndex !== -1 && dotIndex < lastPart.length - 1) {
    const extension = lastPart.slice(dotIndex + 1);
    const formattedExt = extension.toUpperCase();
    // 首字母大写处理
    return formattedExt.charAt(0).toUpperCase() + formattedExt.slice(1);
  }

  // 否则视为文件夹
  return t("folder");
}

export const getUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 判断两个时间相差是否超过5s
export function isOver5Seconds(
  timeA: Date | string | number,
  timeB: Date | string | number = Date.now(),
): boolean {
  // 统一转换为时间戳
  const timestampA = new Date(timeA).getTime();
  const timestampB = new Date(timeB).getTime();

  // 计算时间差绝对值
  const diff = Math.abs(timestampA - timestampB);

  // 判断是否超过5秒（5000毫秒）
  return diff > 5000;
}

export const randomPassword = (length: number = 4) => {
  // 生成随机4位数字或字母密码
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// 检查是否可以分享
export const checkCanShare = async (contentIds: number[]) => {
  const res = await checkSharePermissionApi(contentIds);
  return res.data;
};

// 删除文件前判断是否被分享
export const checkIsShared = async (contentIds: number[]) => {
  const res = await checkFileIsSharedApi(contentIds);
  if (res.code === 1) {
    return res.data;
  }
};

// 根据环境变量获取资源文件地址
export function getAssetUrl(file: string, dir: "images" | "icons" = "images") {
  const mode = import.meta.env.MODE;
  const prefix = mode === "SG" ? "assets-sg" : "assets";
  return new URL(`../${prefix}/${dir}/${file}`, import.meta.url).href;
}

// 校验文件大小
export function checkFileSize(file: File): boolean {
  return file.size > fileMaxSize.value + 5 * 1024 * 1024;
}

// 校验是否有云盘应用
export const checkIsHaveFile = async (): Promise<boolean> => {
  try {
    const res = await getUserAppsApi();
    return (
      res.code === 1 && res.data.some((item) => item.applicationType === 15)
    );
  } catch {
    return false;
  }
};

// 客户端通信关闭文件选择底部弹窗
export const closeFileSelectBottomSheet = () => {
  console.log("关闭文件选择底部弹窗");
  const { isAndroid, isiOS } = checkAndroidOrIos();
  if (isAndroid) {
    window.android?.closeFileSelect();
  } else if (isiOS) {
    window.webkit?.messageHandlers?.SWParamsJs?.postMessage([
      "closeFileSelect",
    ]);
  }
};

// 辅助函数：将 fileEntry.file 转为 Promise
export const getFileFromEntry = (
  fileEntry: FileSystemFileEntry,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file) => resolve(file),
      (err) => reject(err),
    );
  });
};

export const parseQueryDate = (dateVal: any): string => {
  if (!dateVal) return "";

  let dateStr = String(dateVal);

  if (dateStr.includes("T") && dateStr.includes(" ")) {
    dateStr = dateStr.replace(" ", "+");
  }

  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};
