import request from "@/utils/service";
import type { IResponse } from "@/type";
import type {
  OrgTreeCallbackParams,
  WeeklyReportBack,
  WeeklyReportParams,
} from "@/api/type";

// 获取当前用户信息
export function getUserInfoApi(): Promise<IResponse<Record<string, any>>> {
  return request.get("/rest/api/user/me");
}

export const getUserInfoAuth = (
  auth: string,
  tenantId: number,
): Promise<IResponse<Record<string, any>>> => {
  return request.get("/rest/api/user/mebyanonymous", {
    params: {
      auth,
      tenantId,
    },
  });
};

// 获取个人云盘使用情况
export function getMySpaceUsageApi(): Promise<
  IResponse<{
    personalCapacityCount: number;
    totalCapacity: number;
    userCapacityCount: number;
  }>
> {
  return request.get("/rest/api/clouddrivespace/getclouddrivepersonalcapacity");
}

// 获取成员组织树
export function getUserTreeApi(): Promise<IResponse<OrgTreeCallbackParams[]>> {
  return request.get("/rest/api/orguser/getorgtree?hasFile=false");
}

// 获取当前文件夹权限信息
export function getFolderPermissionApi(
  contentId: number,
): Promise<IResponse<any>> {
  return request.get("/rest/api/clouddrivecontent/permission", {
    params: { contentId },
  });
}

// 批量获取文件/文件夹权限信息
export function getBatchPermissionApi(
  contentIds: number[],
): Promise<IResponse<Record<number, number>>> {
  return request.post("/rest/api/clouddrivecontent/permissionsforcontents", {
    contentIds,
  });
}

// 编辑权限
export function editFolderPermissionApi(
  userId: number,
  permissionType: number,
  contentId: number,
): Promise<IResponse<Record<string, any>>> {
  return request.put("/rest/api/clouddrivecontent/permission", {
    userId,
    permissionType,
    contentId,
  });
}

// 给组织下的成员设置权限
export function setMemberPermissionApi(
  contentId: number,
  userId: number,
  orgId: number,
  permissionType: number,
): Promise<IResponse<Record<string, any>>> {
  return request.post("/rest/api/clouddrivecontent/permissions", {
    contentId,
    userId,
    orgId,
    permissionType,
  });
}

// 移除成员
export function removeMemberApi(
  permissionId: number,
  contentId: number,
): Promise<IResponse<Record<string, string>>> {
  return request.delete("/rest/api/clouddrivecontent/cancelpermission", {
    data: { permissionId, contentId },
  });
}

// 批量添加权限
export function addFolderPermissionApi(
  contentId: number,
  ranges: Record<string, number>[],
  permissionType: number,
): Promise<IResponse<Record<string, any>>> {
  return request.post("/rest/api/clouddrivecontent/permissions", {
    contentId,
    ranges,
    permissionType,
  });
}

// 转让超级管理员
export function transferSuperAdminApi(
  userId: number,
  contentId: number,
): Promise<IResponse<Record<string, any>>> {
  return request.put("/rest/api/clouddrivecontent/transferadmin", {
    userId,
    contentId,
  });
}

export function addFolderNotifyUsersApi(
  contentId: number,
  userIds: number[],
): Promise<IResponse<Record<string, any>>> {
  return request.put("/rest/api/clouddrivecontent/foldernotifyusers", {
    contentId,
    userIds,
  });
}

export function removeFolderNotifyUsersApi(
  contentId: number,
  userIds: number[],
): Promise<IResponse<Record<string, any>>> {
  return request.delete("/rest/api/clouddrivecontent/foldernotifyusers", {
    data: {
      contentId,
      userIds,
    },
  });
}

// 置顶空间
export function topSpaceApi(
  contentId: number,
): Promise<IResponse<Record<string, any>>> {
  return request.post("/rest/api/clouddrivecontent/settop", {
    contentId,
  });
}

// 取消置顶空间
export function cancelTopSpaceApi(
  contentId: number,
): Promise<IResponse<Record<string, any>>> {
  return request.put("/rest/api/clouddrivecontent/cancelsettop", {
    contentId,
  });
}

// 退出空间
export function exitSpaceApi(
  contentId: number,
): Promise<IResponse<Record<string, any>>> {
  return request.delete("/rest/api/clouddrivecontent/exitshare", {
    params: { contentId },
  });
}

// 判断是否有新建共享的权限
export function hasCreateSharePermissionApi(): Promise<IResponse<boolean>> {
  return request.get("/rest/api/clouddrivecontent/cancreateroot");
}

// 全局搜索
export function searchGlobalApi(data: {
  keyWord: string;
  pageIndex: number;
  pageSize: number;
}): Promise<IResponse<any>> {
  const { keyWord, pageIndex, pageSize } = data;
  return request.get("/rest/api/clouddrivecontent/searchall", {
    params: { keyWord, pageIndex, pageSize },
  });
}

// 获取父级文件夹contentId
export function getParentFolderContentIdApi(contentId: number): Promise<
  IResponse<{
    path: string;
    isShare: boolean;
    name: string;
    isFolder: boolean;
  }>
> {
  return request.get("/rest/api/clouddrivecontent/getparentcontentid", {
    params: { contentId },
  });
}

// 获取当前用户的app
export function getUserAppsApi(): Promise<IResponse<Record<string, any>[]>> {
  return request.get("/rest/api/user/getenterpriseapp");
}

// 获取云盘周统计数据
export function getWeeklyReportApi(
  params: WeeklyReportParams,
): Promise<IResponse<WeeklyReportBack>> {
  return request.get("/rest/api/clouddriveoperationlogs/stats/operationlog", {
    params,
  });
}
