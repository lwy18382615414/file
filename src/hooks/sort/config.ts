import { ExplorerPageType, type ExplorerQueryState } from "@/views/fileExplorer";

/** 排序选项结构，供排序弹框渲染使用。 */
export type ExplorerSortOption = {
  name: number;
  title: string;
  warn: string;
};

/**
 * 将接口层排序方式映射为列表查询参数中的 sortBy。
 */
export function mapSortMethodToSortBy(
  pageType: ExplorerPageType,
  sortMethod: number,
): ExplorerQueryState["sortBy"] {
  if (pageType === ExplorerPageType.MY_SHARES) {
    return sortMethod === 0 ? "name" : "time";
  }
  if (pageType === ExplorerPageType.RECYCLE) {
    return sortMethod === 0 ? "name" : "time";
  }
  if (sortMethod === 1) return "size";
  if (sortMethod === 2) return "name";
  return "time";
}

/**
 * 获取页面的默认排序方式。
 */
export function getDefaultSortMethod(pageType: ExplorerPageType) {
  return [ExplorerPageType.MY_SHARES, ExplorerPageType.RECYCLE].includes(pageType)
    ? 1
    : 0;
}

/**
 * 将路由 meta 中的类型值规范化为 explorer 页面类型。
 */
export function getExplorerPageType(routeMetaType: unknown) {
  return (routeMetaType || ExplorerPageType.RECENT) as ExplorerPageType;
}

/**
 * 判断当前页面是否支持排序入口。
 */
export function isExplorerSortSupported(pageType: ExplorerPageType) {
  return [
    ExplorerPageType.MY,
    ExplorerPageType.SHARED,
    ExplorerPageType.MY_SHARES,
    ExplorerPageType.RECYCLE,
  ].includes(pageType);
}

/**
 * 根据页面类型生成排序弹框中的选项列表。
 */
export function getExplorerSortOptions(
  pageType: ExplorerPageType,
  t: (key: string) => string,
): ExplorerSortOption[] {
  if (pageType === ExplorerPageType.MY_SHARES) {
    return [
      { name: 0, title: t("sortByName"), warn: t("docName") },
      { name: 1, title: t("sortByTime"), warn: t("time") },
    ];
  }

  if (pageType === ExplorerPageType.RECYCLE) {
    return [
      { name: 0, title: t("sortByName"), warn: t("docName") },
      { name: 1, title: t("deleteTime"), warn: t("deleteTime") },
    ];
  }

  return [
    { name: 2, title: t("sortByName"), warn: t("docName") },
    { name: 0, title: t("sortByTime"), warn: t("time") },
    { name: 1, title: t("sortBySize"), warn: t("size") },
  ];
}

/**
 * 根据排序方向生成 toast 中展示的文案。
 */
export function getExplorerSortToastText(
  sortOrder: string,
  t: (key: string) => string,
) {
  return sortOrder === "asc" ? t("ascending") : t("descending");
}
