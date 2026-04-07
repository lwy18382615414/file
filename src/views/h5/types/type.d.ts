export type FileItemType = {
  contentId: string;
  operateTime: string;
  name: string;
  contentSize: number;
  isFolder: boolean;
  userName: string;
  parentId?: number;
  permissionType?: number;
  isSetTop?: boolean;
  fileId?: string;
  isShare?: boolean;
};
