import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

type MenuItemLike = {
  path: string;
  query?: Record<string, string>;
};

type RouteQuery = Record<string, string> | undefined;

type RouteLocationState = {
  path: string;
  query?: Record<string, string>;
};

const lastVisitedMap = ref<Record<string, RouteLocationState>>({});

const getSharedRootPath = (path: string) => {
  if (!path.startsWith("/shared/")) return "";

  const [, shared, rootId] = path.split("/");
  return rootId ? `/${shared}/${rootId}` : "";
};

const getSharedLocationKey = (path: string) => {
  const rootPath = getSharedRootPath(path);
  return rootPath ? `shared:${rootPath}` : "";
};

const getMyLocationKey = (path: string) => {
  if (path === "/my" || path.startsWith("/my/")) {
    return "my";
  }

  return "";
};

export function useSidebarLastVisited(fixedMenu: readonly { path: string }[]) {
  const route = useRoute();

  const getRouteQuery = (): RouteQuery => {
    return Object.keys(route.query).length
      ? (route.query as Record<string, string>)
      : undefined;
  };

  const isSameLocation = (path: string, query?: Record<string, string>) => {
    return path === route.path && query?.names === route.query.names;
  };

  const activePath = computed(() => {
    const currentPath = route.path;

    if (currentPath.startsWith("/shared/")) {
      return getSharedRootPath(currentPath) || currentPath;
    }

    const matchedMenu = fixedMenu.find(
      (item) =>
        currentPath === item.path || currentPath.startsWith(`${item.path}/`),
    );

    return matchedMenu?.path ?? currentPath;
  });

  const resolveMenuTarget = (item: MenuItemLike) => {
    if (item.path.startsWith("/shared/")) {
      const rootPath = getSharedRootPath(item.path);
      const locationKey = getSharedLocationKey(item.path);
      const lastVisited = locationKey
        ? lastVisitedMap.value[locationKey]
        : undefined;

      return {
        rootPath,
        path: lastVisited?.path ?? item.path,
        query: lastVisited?.query ?? item.query,
      };
    }

    const myKey = getMyLocationKey(item.path);
    if (myKey) {
      const lastVisited = lastVisitedMap.value[myKey];
      return {
        rootPath: "",
        path: lastVisited?.path ?? item.path,
        query: lastVisited?.query ?? item.query,
      };
    }

    return {
      rootPath: "",
      path: item.path,
      query: item.query,
    };
  };

  watch(
    () => route.fullPath,
    () => {
      const currentQuery = getRouteQuery();
      const myKey = getMyLocationKey(route.path);

      if (myKey) {
        lastVisitedMap.value[myKey] = {
          path: route.path,
          query: currentQuery,
        };
      }

      const sharedKey = getSharedLocationKey(route.path);
      if (!sharedKey) return;

      lastVisitedMap.value[sharedKey] = {
        path: route.path,
        query: currentQuery,
      };
    },
    { immediate: true },
  );

  return {
    activePath,
    getSharedRootPath,
    isSameLocation,
    resolveMenuTarget,
  };
}
