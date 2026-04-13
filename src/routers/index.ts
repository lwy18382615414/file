import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { getQueryVariable, initFontScale, SessionStorageUtil } from "@/utils";
import { getToken } from "@/utils/auth";
import useMyUserInfo from "@/hooks/useMyUserInfo";
import config from "@/hooks/config";

const { getMyInfoByAuth } = useMyUserInfo();
const { ensureConfigReady } = config();
const publicRoutes = new Set([
  "/login",
  "/jump-page",
  "/share-page",
  "/share-content",
  "/share-detail",
]);

const isPublicRoute = (path: string) => publicRoutes.has(path);

const buildLoginRedirect = (to: RouteLocationNormalized) => {
  const fullPath = to.fullPath || "/";
  return {
    path: "/login",
    query: {
      redirect: fullPath,
    },
  };
};

const handleAuthLogin = async (tenantId: number) => {
  const auth = getQueryVariable("Auth");
  if (!auth) {
    return false;
  }

  await getMyInfoByAuth(auth, tenantId);
  return true;
};

const shouldSkipLogin = (path: string) => isPublicRoute(path);

const isLoginRoute = (path: string) => path === "/login";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [
    {
      path: "/",
      component: () => import("@/layout/index.vue"),
      redirect: "/recent-view",
      children: [
        {
          path: "recent-view",
          name: "Recent",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "recent", title: "最近浏览" },
        },
        {
          // 匹配 /my 以及 /my/folderA/folderB
          path: "my/:path(.*)*",
          name: "MyFiles",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "my", title: "我的" },
        },
        {
          // 匹配 /shared (移动端点击Tab进入)
          // 以及 /shared/teamA/docs (PC端点击侧边栏，或移动端下钻进入)
          path: "shared/:path(.*)*",
          name: "Shared",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "shared", title: "共享" },
        },
        {
          path: "my-shares",
          name: "MyShares",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "my-shares", title: "我的分享" },
        },
        {
          path: "recycle-bin",
          name: "RecycleBin",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "recycle", title: "回收站" },
        },
        {
          path: "search-result",
          name: "SearchResult",
          component: () => import("@/views/fileExplorer.vue"),
          meta: { type: "search", title: "搜索结果" },
        },
      ],
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/Login/index.vue"),
    },
    {
      path: "/search",
      name: "Search",
      component: () => import("@/views/search.vue"),
    },
    {
      path: "/jump-page",
      name: "JumpPage",
      component: () => import("@/views/jumpPage.vue"),
    },
    {
      path: "/share-detail",
      name: "ShareDetail",
      component: () => import("@/views/share/shareDetail.vue"),
    },
    {
      path: "/share-page",
      name: "SharePage",
      component: () => import("@/views/share/index.vue"),
    },
    {
      path: "/file-select",
      name: "FileSelect",
      component: () => import("@/views/fileSelectPage.vue"),
    },
    {
      path: "/move-file",
      name: "MoveFile",
      component: () => import("@/views/moveFilePage.vue"),
    },
    {
      path: "/space-setting",
      name: "SpaceInfo",
      component: () => import("@/views/spaceInfo/mobileSpaceInfo.vue"),
    },
    {
      path: "/space-staff",
      name: "SpaceStaff",
      component: () => import("@/views/spaceInfo/staff.vue"),
    },
    {
      path: "/add-staff",
      name: "AddStaff",
      component: () => import("@/views/spaceInfo/addStaff.vue"),
    },
    {
      path: "/space-notify",
      name: "SpaceNotify",
      component: () => import("@/views/spaceInfo/notify.vue"),
    },
    {
      path: "/add-notify-user",
      name: "AddNotifyUser",
      component: () => import("@/views/spaceInfo/addNotifyUser.vue"),
    },
    {
      path: "/weeklyFileReport",
      name: "WeeklyFileReport",
      component: () => import("@/views/weeklyFileReport.vue"),
    },
  ],
});

const isSetFontScale = initFontScale();

router.beforeEach(async (to) => {
  console.log(JSON.stringify({ type: "3", message: "云盘h5连接成功" }));

  const urlTenantId = getQueryVariable("chatTenantId");
  const cachedTenantId = SessionStorageUtil.get<number>("tenantId");

  if (urlTenantId && Number(urlTenantId) !== cachedTenantId) {
    SessionStorageUtil.set("tenantId", Number(urlTenantId));
  }

  if (!isSetFontScale) initFontScale();

  await ensureConfigReady();

  const tenantId = Number(urlTenantId) || Number(cachedTenantId) || 0;
  const token = getToken();

  if (!token) {
    try {
      const authLoggedIn = await handleAuthLogin(tenantId);
      if (authLoggedIn) {
        if (isLoginRoute(to.path)) {
          const redirect =
            typeof to.query.redirect === "string" ? to.query.redirect : "/";
          return redirect;
        }
        return true;
      }
    } catch (error) {
      console.error("Auth 登录失败", error);
    }

    if (!shouldSkipLogin(to.path)) {
      return buildLoginRedirect(to);
    }
  }

  if (token && isLoginRoute(to.path)) {
    const redirect =
      typeof to.query.redirect === "string" ? to.query.redirect : "/";
    return redirect;
  }

  return true;
});

export default router;
