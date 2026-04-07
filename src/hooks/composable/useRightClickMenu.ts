import { computed, ref, isRef, type Ref, type ComputedRef } from "vue";
import { t } from "@/utils";
import { getHighestPermission, Permission } from "@/enum/permission";
import { useAdjustPosition } from "@/hooks/useAdjustPosition";
import type { ContentType } from "@/types/type";
import { getPermissionType, getIsFolder, getIsSetTop, getIsDeleteAll, getContentId } from "@/utils/typeUtils";

export interface MenuOption {
  label: string;
  key: string;
  permission?: Permission;
}

interface UseRightClickMenuOptions {
  includeKeys: string[] | Ref<string[]> | ComputedRef<string[]>;
  isEditRef?: { value: boolean }; // 是否处于编辑状态
  onSelectRow?: (row: ContentType, value?: any) => void;
  onShareRow?: (row: ContentType) => void;
  shareListRef?: Ref<ContentType[]>; // 已选中的文件列表
  getBatchPermission?: (contentIds: number[]) => Promise<Record<number, number>>; // 批量获取权限函数
  isShareSpaceRef?: Ref<boolean>; // 是否在共享空间
}

const allMenuOptions: MenuOption[] = [
  { label: "menuOpt.open", key: "open", permission: Permission.View },
  {
    label: "menuOpt.shareToFriend",
    key: "export",
    permission: Permission.Share,
  },
  { label: "menuOpt.copyLink", key: "copyLink", permission: Permission.Share },
  { label: "menuOpt.delete", key: "delete", permission: Permission.Edit },
  { label: "menuOpt.pin", key: "top", permission: Permission.View },
  { label: "menuOpt.rename", key: "rename", permission: Permission.Upload },
  { label: "menuOpt.download", key: "download", permission: Permission.View },
  {
    label: "menuOpt.cancelShare",
    key: "cancelShare",
    permission: Permission.View,
  },

  { label: "menuOpt.addMember", key: "add", permission: Permission.Admin },
  {
    label: "menuOpt.permissionManagement",
    key: "permission",
    permission: Permission.Admin,
  },
  {
    label: "menuOpt.rename",
    key: "rootRename",
    permission: Permission.SuperAdmin,
  },
  {
    label: "menuOpt.delete",
    key: "rootDelete",
    permission: Permission.SuperAdmin,
  },
  { label: "menuOpt.exitRootDir", key: "exit", permission: Permission.View },
];

// 计算权限最小值
function calculateMinPermission(
  permissionMap: Record<number, number>,
): number {
  const permissionValues = Object.values(permissionMap);
  if (permissionValues.length === 0) return 0;

  const highestPermissions = permissionValues.map((perm) =>
    getHighestPermission(perm).value,
  );

  return Math.min(...highestPermissions);
}

export function useRightClickMenu(opts: UseRightClickMenuOptions) {
  const includeKeys = isRef(opts.includeKeys)
    ? opts.includeKeys
    : ref(opts.includeKeys);

  const { isEditRef, onSelectRow, onShareRow, shareListRef, getBatchPermission, isShareSpaceRef } = opts;

  const menuOptions = computed(() =>
    allMenuOptions.filter((item) => {
      return includeKeys.value.includes(item.key);
    }),
  );

  const filterMenu = ref<MenuOption[]>([]);
  const selectedRow = ref<ContentType>({} as ContentType);
  const contextMenuVisible = ref(false);
  const menuPosition = ref({ x: 0, y: 0 });

  const handleRightClick = async (
    row: ContentType,
    column: any,
    event: MouseEvent,
  ) => {
    console.log("右键菜单触发", row);
    event.preventDefault();
    if (isEditRef?.value) return;
    if (!menuOptions.value.length) return;

    const hasMultipleSelection = shareListRef?.value && shareListRef.value.length > 1;
    const isShareSpace = isShareSpaceRef?.value === true;
    
    let permission: number | undefined = getPermissionType(row);
    let selectedRows: ContentType[] = [];

    if (hasMultipleSelection && isShareSpace && getBatchPermission) {
      try {
        const contentIds = shareListRef.value
          .map((item) => getContentId(item))
          .filter((id): id is number => id !== undefined && id !== null);
        
        if (contentIds.length > 0) {
          const permissionMap = await getBatchPermission(contentIds);
          
          if (Object.keys(permissionMap).length > 0) {
            const minPermission = calculateMinPermission(permissionMap);
            if (minPermission > 0) {
              permission = minPermission;
              selectedRows = shareListRef.value;
            } else {
              permission = getPermissionType(row);
              selectedRows = [row];
            }
          } else {
            permission = getPermissionType(row);
            selectedRows = [row];
          }
        } else {
          permission = getPermissionType(row);
          selectedRows = [row];
        }
      } catch (error) {
        console.error("批量获取权限失败，使用当前行权限:", error);
        permission = getPermissionType(row);
        selectedRows = [row];
      }
    } else if (hasMultipleSelection && !isShareSpace) {
      selectedRows = shareListRef.value;
    } else if (!hasMultipleSelection && isShareSpace && getBatchPermission) {
      const contentId = getContentId(row);
      if (contentId) {
        const permissionMap = await getBatchPermission([contentId]);
        permission = permissionMap[contentId]
        onSelectRow?.(row, column);
        onShareRow?.(row);
      }
    } else {
      permission = getPermissionType(row);
      selectedRows = [row];
      onSelectRow?.(row, column);
      onShareRow?.(row);
    }

    let options = menuOptions.value;

    if (hasMultipleSelection && selectedRows.length > 1) {
      const allFiles = selectedRows.every(item => !getIsFolder(item));

      const allowedKeys = ["export", "copyLink", "delete"];
      if (allFiles) {
        allowedKeys.push("download");
      }

      if (isShareSpace && permission) {
        const userPerm = getHighestPermission(permission).value;

        options = options.filter(
          opt =>
            opt.permission != null &&
            (userPerm & opt.permission) === opt.permission
        );
      }

      options = options.filter(opt => allowedKeys.includes(opt.key));
    } else {
      if (permission) {
        console.log("检查权限")
        const userPerm = getHighestPermission(permission).value;
        options = options.filter(
          (opt) => (userPerm & opt.permission!) === opt.permission,
        );
      }

      // 文件类型过滤
      if (getIsFolder(row)) {
        options = options.filter((opt) => opt.key !== "download");
      } else {
        options = options.filter((opt) => opt.key !== "open");
      }

      // 检查是否有删除项
      if (getIsDeleteAll(row)) {
        options = options.filter((opt) => opt.key !== "copyLink");
      }

      // 置顶变"取消置顶"
      options = options.map((item) => {
        if (item.key === "top" && getIsSetTop(row)) {
          return {
            label: t("unpin"),
            key: "cancelTop",
            permission: Permission.View,
          };
        }
        return item;
      });
    }

    if (!options.length) return

    filterMenu.value = options;
    selectedRow.value = row;
    
    const popoverHeight = filterMenu.value.length * 30;

    const { adjustPosition } = useAdjustPosition({
      popoverHeight,
    });
    menuPosition.value = adjustPosition(event);

    contextMenuVisible.value = true;
  };

  return {
    filterMenu,
    selectedRow,
    contextMenuVisible,
    menuPosition,
    handleRightClick,
  };
}
