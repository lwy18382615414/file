export type viewModeType = {
  viewMode: string;
  currentPage: string;
};

export type SortModeType = {
  sortOrder: string; // 'asc' | 'desc'
  sortMethod: number; // 0 - 时间 | 1 - 文档大小 | 2 - 文件名
  currentPage: string;
};
