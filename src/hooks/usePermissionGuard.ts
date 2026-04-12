import type { IResponse } from "@/type";
interface PermissionGuardOptions<T> {
  contentIds: T[];
  selectedRows: { contentId: T }[];
  request: (contentIds: T[]) => Promise<IResponse<any>>;
  onSuccess?: (sucRes: any[]) => void;
  onFailure?: () => void;

  showConfirm: (
    noPermissionCount: number,
    noPermissionList: T[],
  ) => Promise<any>;

  notifySuccess?: () => void;
  notifyError?: (type: "all-denied" | "unknown") => void;
}

export function usePermissionGuard() {
  async function runPermissionGuard<T>({
    contentIds,
    selectedRows,
    request,
    onSuccess,
    onFailure,
    showConfirm,
    notifySuccess,
    notifyError,
  }: PermissionGuardOptions<T>) {
    const res = await request(contentIds);

    if (res.code === 1) {
      notifySuccess?.();
      onSuccess?.(res.data);
      return;
    }

    let noPermissionList: T[] = [];

    try {
      noPermissionList = JSON.parse(res.data as unknown as string);
    } catch (err) {
      console.log(err);
      notifyError?.("unknown");
      onFailure?.();
      return;
    }

    const noPermissionCount = noPermissionList.length;

    if (noPermissionCount === contentIds.length) {
      notifyError?.("all-denied");
      onFailure?.();
      return;
    }

    try {
      await showConfirm(noPermissionCount, noPermissionList);

      const filteredIds = selectedRows
        .filter((item) => !noPermissionList.includes(item.contentId))
        .map((item) => item.contentId);

      const retryRes = await request(filteredIds);

      if (retryRes.code === 1) {
        notifySuccess?.();
        onSuccess?.(retryRes.data);
      }
    } catch {
      onFailure?.();
    }
  }

  return {
    runPermissionGuard,
  };
}
