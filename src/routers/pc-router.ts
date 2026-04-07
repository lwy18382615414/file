import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalizedLoaded,
} from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { getToken } from "@/utils/auth";
import useMyUserInfo from "@/hooks/useMyUserInfo";
import { getQueryVariable } from "@/utils";
import { SessionStorageUtil } from "@/utils";
import { setFileBelongByRoute } from "@/hooks/useFileBelong";
import { useRouteStackStore } from "@/stores";

const { getMyInfoByApi, getMyInfoByAuth } = useMyUserInfo();

declare module "vue-router" {
  interface RouterMeta {
    title: string | ((route: RouteLocationNormalizedLoaded) => string);
    isCommonHeader: boolean;
    isMenu?: boolean;
    breadcrumb?: boolean;
    key?: string;
    isChild?: boolean;
  }
}

let isScaleSet = false;

// 基础路由
const baseRoutes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login/index.vue"),
  },
  {
    path: "/jump-page",
    name: "JumpPage",
    component: () => import("@/views/pc/JumpPage/index.vue"),
  },
  {
    path: "/share-page",
    name: "SharePage",
    component: () => import("@/views/share/pages/ExternalSharePc.vue"),
  },
  {
    path: "/share-content",
    name: "ShareContent",
    component: () => import("@/views/pc/SharePage/shareContent.vue"),
  },
  {
    path: "/file-select",
    name: "FileSelect",
    component: () => import("@/views/pc/SharePage/folderSelect.vue"),
  },
  {
    path: '/weeklyFileReport',
    name: 'WeeklyFileReport',
    component: () => import("@/views/weeklyFileReport.vue")
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/pc/NotFound/index.vue"),
    hidden: true,
    meta: { title: "找不到此页面" },
  },
  {
    path: "/:pathMatch(.*)",
    name: "notFound",
    hidden: true,
    redirect: "/404",
    meta: { title: "找不到此页面" },
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("@/views/pc/Layout/index.vue"),
      redirect: "/recent-view",
      children: [
        {
          path: "/recent-view",
          name: "RecentView",
          meta: {
            title: "route.recentView",
            breadcrumb: true,
            isCommonHeader: true,
            columnKey: "recent",
            isSort: false,
            isMenu: true
          },
          component: () => import("@/views/pc/MainView/index.vue"),
        },
        {
          path: "/my-space",
          name: "MySpace",
          meta: {
            title: "route.myFiles",
            breadcrumb: true,
            isCommonHeader: true,
            columnKey: "my",
            isSort: true,
            isMenu: true
          },
          component: () => import("@/views/pc/MainView/index.vue"),
        },
        {
          path: "/my-share",
          name: "MyShare",
          meta: {
            title: "route.myShares",
            isCommonHeader: false,
            columnKey: "myShare",
            isSort: true,
            isMenu: true
          },
          component: () => import("@/views/pc/MainView/index.vue"),
        },
        {
          path: "/share-space/:contentId",
          name: "ShareSpace",
          meta: {
            title: "route.shared",
            isCommonHeader: true,
            columnKey: "shareSpace",
            isSort: true,
            customTitle: true,
            isMenu: true
          },
          component: () => import("@/views/pc/MainView/index.vue"),
        },
        {
          path: "/recycle-bin",
          name: "RecycleBin",
          meta: {
            title: "route.recycleBin",
            breadcrumb: true,
            isCommonHeader: false,
            columnKey: "recycleBin",
            isSort: false,
            isMenu: true
          },
          component: () => import("@/views/pc/MainView/index.vue"),
        },
        {
          path: "/folder/:contentId*",
          name: "Folder",
          component: () => import("@/views/pc/MainView/index.vue"),
          meta: {
            customTitle: true,
            isCommonHeader: true,
            columnKey: "folder",
            isSort: true,
          },
        },
        {
          path: "/search-result",
          name: "SearchResult",
          component: () => import("@/views/pc/MainView/index.vue"),
          meta: {
            title: "searchResult",
            isCommonHeader: true,
            columnKey: "searchResult",
            isSort: false,
          },
        }
      ],
    },
    ...baseRoutes,
  ] as RouteRecordRaw[],
});
router.beforeEach(async (to, from, next) => {
  // pc通信 云盘成功打开网站
  console.log(JSON.stringify({ type: "3", message: "云盘h5连接成功" }));
  const useByPc = Number(getQueryVariable("useByPc") || "0");
  if (useByPc === 1) SessionStorageUtil.set('useByPc', '1');
  const token = getToken();
  const tenantId = Number(getQueryVariable("chatTenantId") || SessionStorageUtil.get('tenantId') || "0");
  SessionStorageUtil.set('tenantId', tenantId);

  if (!isScaleSet) {
    setScale();
  }

  // 统一设置 fileBelong
  setFileBelongByRoute(to.path, from.path);

  if (!token) {
    // auth  pc端传递认证字符串 使用auth获取token
    const auth = getQueryVariable("Auth");
    if (auth) {
      await getMyInfoByAuth(auth, tenantId);
    }
  }

  if (token) {
    await getMyInfoByApi();
    // 已登录状态下，如果访问登录页，则重定向到主页
    if (to.path === "/login") {
      next("/");
      return;
    }

    // 如果访问的是404页面且是从重定向来的，则尝试返回到原先的页面
    if (
      to.path === "/404" &&
      to.redirectedFrom?.fullPath.includes("/share-space")
    ) {
      next({ path: to.redirectedFrom.fullPath, replace: true });
      return;
    }

    // 如果路由已存在，直接放行
    next();
  } else {
    // 未登录状态下，如果访问的不是登录页，则重定向到登录页
    if (
      to.path === "/share-page" ||
      to.path === "/share-content" ||
      to.path === "/file-select" ||
      to.path === "/weeklyFileReport"
    ) {
      next();
      return;
    }
    return to.path === "/login" ? next() : next("/login");
  }
});

const setScale = () => {
  const fontScale = getQueryVariable("fontScale");
  if (fontScale) {
    document.documentElement.style.setProperty(
      "--scale-factor",
      `${fontScale}`,
    );
    sessionStorage.setItem("fontScale", fontScale);
    isScaleSet = true;
  } else {
    const scaleFactor = sessionStorage.getItem("fontScale");
    if (scaleFactor) {
      document.documentElement.style.setProperty(
        "--scale-factor",
        `${scaleFactor}`,
      );
      isScaleSet = true;
    }
  }
};

router.afterEach((to) => {
  const store = useRouteStackStore();

  if (to.meta.isMenu) {
    if (to.name === 'ShareSpace') {
      store.initRoot({
        ...to,
        meta: {
          title: to.query.contentName
        }
      });
    } else {
      store.initRoot(to);
    }
    return;
  }

  if (to.name === 'Folder') {
    const targetId = to.params.contentId;
    const currentId = Array.isArray(targetId) ? targetId[targetId.length - 1] : targetId;

    const existingIndex = store.stack.findIndex(item => String(item.id) === String(currentId));

    if (existingIndex !== -1) {
      store.stack = store.stack.slice(0, existingIndex + 1);
    }
  }
});

export default router;
