import { t } from "@/utils";

export enum Permission {
  CreatePublicShare = 0,
  View = 1,
  Share = 2 | View, // 3 (0b0011)
  Upload = 4 | Share, // 4 | 3 = 7 (0b0111)
  // Delete = 8 | Upload, // 8 | 7 = 15 (0b1111)
  Edit = 8 | Upload, // 8 | 7 = 15
  Admin = 127, // 所有前7位权限 (0b01111111)
  SuperAdmin = 255, // 所有8位权限 (0b11111111)
}

// 计算最高权限
export const getHighestPermission = (userPermission: number) => {
  // 权限从高到低排序
  const sortedPermissions = [
    { value: Permission.SuperAdmin, name: t("superAdmin") },
    { value: Permission.Admin, name: t("admin") },
    { value: Permission.Edit, name: t("editable") },
    // { value: Permission.Delete, name: t("deletable") },
    { value: Permission.Upload, name: t("uploadPermission") },
    { value: Permission.Share, name: t("sharable") },
    { value: Permission.View, name: t("view") },
  ];

  return (
    sortedPermissions.find((p) => (userPermission & p.value) === p.value) || {
      name: "",
      value: 0,
    }
  );
};
