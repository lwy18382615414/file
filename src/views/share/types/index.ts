export type ShareBaseInfo = {
  avatarId: string;
  sharePersonName: string;
  shareTime: string;
  expireTimeText: string;
  originShareCount: number;
};

export type ShareContentType = {
  contentId: number;
  name: string;
  isFolder: boolean;
  size: number;
  updateAt: string;
  isDelete: boolean;
};
