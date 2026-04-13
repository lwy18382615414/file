import { computed, ref, type Ref } from "vue";
import { showConfirmDialog, showToast } from "vant";
import type { ContentType } from "@/types/type";
import { generateShareText, t, copyToClipboard } from "@/utils";
import { generateShareLinkApi } from "@/api/share";
import { getContentId, getName } from "@/utils/typeUtils";
import { getPermissionDeniedIds } from "@/utils/permissionDenied";

export type ShareLinkParams = {
  contentIds: number[];
  expireType: number;
  passwordType: number;
  password: string;
};

export type ShareLinkResult = {
  shareKey: string;
  password: string;
};

export type ShareLinkPermissionResult =
  | { type: "success"; result: ShareLinkResult }
  | { type: "all-denied" }
  | { type: "partial-denied"; deniedIds: number[] };

export function getShareLinkPrefix() {
  return location.origin + location.pathname;
}

export function buildShareLink(shareKey: string, password = "") {
  const passwordQuery = password ? `&psw=${encodeURIComponent(password)}` : "";
  return `${getShareLinkPrefix()}#/share-page?shareKey=${shareKey}${passwordQuery}`;
}

export async function createShareLink(params: ShareLinkParams): Promise<ShareLinkResult> {
  const res = await generateShareLinkApi(params);
  return {
    shareKey: res.data.shareKey,
    password: res.data.password,
  };
}

export async function createShareLinkWithPermission(
  params: ShareLinkParams,
): Promise<ShareLinkPermissionResult> {
  try {
    const result = await createShareLink(params);
    return {
      type: "success",
      result,
    };
  } catch (error) {
    const deniedIds = getPermissionDeniedIds(error);
    if (!deniedIds) {
      throw error;
    }

    if (deniedIds.length === params.contentIds.length) {
      return { type: "all-denied" };
    }

    return {
      type: "partial-denied",
      deniedIds,
    };
  }
}

export function filterAllowedContentIds(items: ContentType[], deniedIds: number[]) {
  return items
    .filter((item) => !deniedIds.includes(getContentId(item) ?? 0))
    .map((item) => getContentId(item))
    .filter((contentId): contentId is number => !!contentId);
}

export function buildShareCopyText(options: {
  count: number;
  firstItem: ContentType;
  shareKey: string;
  password: string;
}) {
  return generateShareText({
    count: options.count,
    fileName: getName(options.firstItem),
    shareLink: buildShareLink(options.shareKey, options.password),
    password: options.password,
  });
}

export async function copyShareText(options: {
  count: number;
  firstItem: ContentType;
  shareKey: string;
  password: string;
}) {
  const copyText = buildShareCopyText(options);
  await copyToClipboard(copyText);
}

export async function confirmPartialSharePermission(count: number) {
  await showConfirmDialog({
    title: t("shareFile"),
    message: t("sharePermissionWarning", { count }),
    cancelButtonText: t("cancel"),
    confirmButtonText: t("Ok"),
  });
}

export function showNoSharePermissionToast() {
  showToast({
    message: t("noSharePermission"),
  });
}

export function showCopySuccessToast() {
  showToast({ message: t("copySuccess"), type: "success" });
}

export function showNoFileSelectedToast() {
  showToast({ message: t("noFileSelected"), type: "fail" });
}

export function showCopyFailedToast() {
  showToast({ message: t("copyFailed"), type: "fail" });
}

export function getShareContentIds(items: ContentType[]) {
  return items
    .map((item) => getContentId(item))
    .filter((contentId): contentId is number => !!contentId);
}

export function isManualPasswordInvalid(password: string) {
  return !/^[a-zA-Z0-9]{4}$/.test(password);
}

export function getValidityOptions() {
  return [
    { label: t("1day"), value: 1 },
    { label: t("7days"), value: 2 },
    { label: t("30days"), value: 3 },
    { label: t("365days"), value: 4 },
    { label: t("permanent"), value: 5 },
  ];
}

export function getPasswordOptions() {
  return [
    { label: t("noNeed"), value: 0 },
    { label: t("randomPassword"), value: 1 },
    { label: t("manualPassword"), value: 2 },
  ];
}

export function getShareErrorResponseData(error: unknown) {
  return getPermissionDeniedIds(error);
}

export async function handleSharePermissionResult(options: {
  items: ContentType[];
  params: ShareLinkParams;
}) {
  const permissionResult = await createShareLinkWithPermission(options.params);

  if (permissionResult.type === "success") {
    return {
      contentIds: options.params.contentIds,
      result: permissionResult.result,
    };
  }

  if (permissionResult.type === "all-denied") {
    return {
      contentIds: [],
      result: null,
      deniedAll: true,
    };
  }

  await confirmPartialSharePermission(permissionResult.deniedIds.length);
  const contentIds = filterAllowedContentIds(options.items, permissionResult.deniedIds);

  if (!contentIds.length) {
    return {
      contentIds: [],
      result: null,
      deniedAll: false,
    };
  }

  const result = await createShareLink({
    ...options.params,
    contentIds,
  });

  return {
    contentIds,
    result,
    deniedAll: false,
  };
}


export function useShareLink() {
  const shareLinkVisible = ref(false);
  const shareLinkItems = ref<ContentType[]>([]);

  const openShareLink = (items: ContentType[]) => {
    if (!items.length) return;
    shareLinkItems.value = items;
    shareLinkVisible.value = true;
  };

  const closeShareLink = () => {
    shareLinkVisible.value = false;
    shareLinkItems.value = [];
  };

  return {
    shareLinkVisible,
    shareLinkItems,
    openShareLink,
    closeShareLink,
  };
}

export function useShareLinkSettings(options: {
  visible: Ref<boolean>;
  items: Ref<ContentType[]>;
}) {
  const { visible, items } = options;

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

  const firstFile = computed(() => items.value[0]);
  const validTime = computed(() => {
    return validTimeList.find((item) => item.value === validKey.value)?.label;
  });
  const isRightPassword = computed(() => {
    const reg = /^[a-zA-Z0-9]{4}$/;
    if (!extracode.value) return true;
    return !reg.test(extracode.value);
  });

  const clearState = () => {
    visible.value = false;
    validKey.value = 3;
    passwordKey.value = 1;
    extracode.value = "";
    settings.value = "";
    title.value = t("shareFile");
    showPasswordTips.value = false;
  };

  const resetState = () => {
    visible.value = false;
  };

  const setValidTime = () => {
    title.value = t("expirationSettings");
    settings.value = "validTime";
  };

  const setPassword = () => {
    title.value = t("passwordSettings");
    settings.value = "password";
  };

  const changeValidTime = (key: number) => {
    validKey.value = key;
    settings.value = "";
    title.value = t("shareFile");
  };

  const changePassword = (key: number) => {
    passwordKey.value = key;
    showPasswordTips.value = false;
    if (key === 2) {
      pswCellTitle.value = t("manualPassword");
      extracode.value = "";
    } else if (key === 1) {
      pswCellTitle.value = t("randomPassword");
      extracode.value = "";
      settings.value = "";
      title.value = t("shareFile");
    } else {
      pswCellTitle.value = t("noNeed");
      extracode.value = "";
      settings.value = "";
      title.value = t("shareFile");
    }
  };

  const onCancel = () => {
    if (settings.value) {
      if (settings.value === "password" && passwordKey.value === 2) {
        const reg = /^[a-zA-Z0-9]{4}$/;
        if (!reg.test(extracode.value)) {
          showPasswordTips.value = true;
          return;
        }
      }

      settings.value = "";
      title.value = t("shareFile");
      showPasswordTips.value = false;
      return;
    }

    clearState();
  };

  const buildCopyText = async (ids: number[]) => {
    const res = await generateShareLinkApi({
      contentIds: ids,
      expireType: validKey.value,
      passwordType: passwordKey.value,
      password: extracode.value,
    });

    const count = ids.length;
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
  };

  const copyLinkToClipboard = async () => {
    try {
      const contentIds = items.value
        .map((item) => getContentId(item))
        .filter((contentId): contentId is number => !!contentId);

      if (!contentIds.length) {
        showToast({ message: t("noFileSelected"), type: "fail" });
        return;
      }

      try {
        await buildCopyText(contentIds);
      } catch (error) {
        const responseData = getErrorResponseData(error);
        if (!responseData) {
          throw error;
        }

        const noPermissionList = JSON.parse(responseData) as number[];
        const noPermissionCount = noPermissionList.length;

        if (noPermissionCount === contentIds.length) {
          showToast({
            message: t("noSharePermission"),
          });
          resetState();
          return;
        }

        if (noPermissionCount > 0) {
          try {
            await showConfirmDialog({
              title: t("shareFile"),
              message: t("sharePermissionWarning", { count: noPermissionCount }),
              cancelButtonText: t("cancel"),
              confirmButtonText: t("Ok"),
            });
          } catch {
            resetState();
            return;
          }

          const newShareList = items.value
            .filter((item) => !noPermissionList.includes(getContentId(item) ?? 0))
            .map((item) => getContentId(item))
            .filter((contentId): contentId is number => !!contentId);

          if (!newShareList.length) {
            resetState();
            return;
          }

          await buildCopyText(newShareList);
          return;
        }

        resetState();
      }
    } catch (error) {
      console.error(t("copyFailed"), error);
      showToast({ message: t("copyFailed"), type: "fail" });
    }
  };

  const onConfirm = () => {
    if (settings.value === "validTime") {
      settings.value = "";
      title.value = t("shareFile");
      return;
    }

    if (settings.value === "password") {
      if (passwordKey.value === 2) {
        const reg = /^[a-zA-Z0-9]{4}$/;
        if (!reg.test(extracode.value)) {
          showPasswordTips.value = true;
          return;
        }
      }
      settings.value = "";
      title.value = t("shareFile");
      return;
    }

    copyLinkToClipboard();
  };

  return {
    validTimeList,
    passwordList,
    title,
    pswCellTitle,
    settings,
    validKey,
    passwordKey,
    extracode,
    showPasswordTips,
    firstFile,
    validTime,
    isRightPassword,
    clearState,
    setValidTime,
    setPassword,
    changeValidTime,
    changePassword,
    onCancel,
    onConfirm,
    copyLinkToClipboard,
  };
}
