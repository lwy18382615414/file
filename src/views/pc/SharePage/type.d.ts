export type TypeContent = {
  contentId: number;
  name: string;
  isFolder: boolean;
  size: number;
  updateAt: string;
  parentId?: number;
  isDelete?: boolean;
};
