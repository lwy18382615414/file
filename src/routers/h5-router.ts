import { createRouter, createWebHashHistory } from "vue-router";
import { getToken } from "@/utils/auth";
import { t } from "@/utils";
import { getQueryVariable } from "@/utils";
import { SessionStorageUtil } from "@/utils";
import { setFileBelongByRoute } from "@/hooks/useFileBelong";
import { useRouteStackStore } from "@/stores";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [
    {
      path: "/",
      name: "Layout",
      component: () => import("@/views/h5/Layout/index.vue"),
      redirect: "/recent-view",
      children: [
        {
          path: "/recent-view",
          name: "RecentView",
          meta: {
            title: t("recentView"),
            isTab: true,
          },
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/my-space",
          name: "MySpace",
          meta: {
            title: t("myFiles"),
            isTab: true,
          },
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/share-space",
          name: "ShareSpace",
          meta: {
            title: t("shared"),
            isTab: true,
          },
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/my-share",
          name: "MyShare",
          meta: {
            title: t("myShares"),
            isTab: true,
          },
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/recycle-bin",
          name: "RecycleBin",
          meta: {
            title: t("recycleBin"),
            isTab: true,
          },
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/folder/:contentId*", // 使用相对路径
          name: "Folder",
          component: () => import("@/views/h5/MainView/index.vue"),
        },
        {
          path: "/search-result",
          name: "SearchResult",
          component: () => import("@/views/h5/MainView/index.vue"),
          meta: {
            title: t("searchResult"),
          },
        },
      ],
    },
    {
      path: "/search",
      name: "Search",
      component: () => import("@/views/h5/Search/index.vue"),
    },
    {
      path: "/space-setting",
      name: "SpaceInfo",
      component: () => import("@/views/h5/SpaceInfo/index.vue"),
    },
    {
      path: "/space-staff",
      name: "SpaceStaff",
      component: () => import("@/views/h5/SpaceInfo/staff.vue"),
    },
    {
      path: "/add-staff",
      name: "AddStaff",
      component: () => import("@/views/h5/SpaceInfo/addStaff.vue"),
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/Login/index.vue"),
    },
    {
      path: "/jump-page",
      name: "JumpPage",
      component: () => import("@/views/h5/JumpPage/index.vue"),
    },
    {
      path: "/share-detail",
      name: "ShareDetail",
      component: () => import("@/views/shareDetail.vue"),
    },
    {
      path: "/share-page",
      name: "SharePage",
      component: () => import("@/views/share/pages/ExternalShareH5.vue"),
    },
    {
      path: "/share-content",
      name: "ShareContent",
      component: () => import("@/views/h5/SharePage/shareContent.vue"),
    },
    {
      path: "/file-select",
      name: "FileSelect",
      component: () => import("@/views/h5/SharePage/folderSelectPage.vue"),
    },
    {
      path: '/weeklyFileReport',
      name: 'WeeklyFileReport',
      component: () => import("@/views/weeklyFileReport.vue")
    },
  ],
});

router.beforeEach((to, from, next) => {
  const token = getToken();

  const tenantId = Number(getQueryVariable("chatTenantId") || SessionStorageUtil.get('tenantId') || "0");
  SessionStorageUtil.set('tenantId', tenantId);

  // 统一设置 fileBelong
  setFileBelongByRoute(to.path, from.path);

  if (token) {
    // 已登录状态下，如果访问登录页，则重定向到主页
    if (to.path === "/login") {
      next("/");
      return;
    }
    // 如果路由已存在，直接放行
    next();
  } else {
    // 未登录状态下，如果访问的不是登录页，则重定向到登录页
    if (to.path === "/share-page" || to.path === "/share-content") {
      next();
      return;
    }
    return to.path === "/login" ? next() : next("/login");
  }
});

router.afterEach((to) => {
  const store = useRouteStackStore();

  if (to.meta.isTab) {
    store.initRoot(to);
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
