//操作系统枚举
export enum SWOSType {
  iOS = 1,
  android,
  desktop,
}
//登录来源枚举
export enum SWLoginSourceType {
  none = 0,
  app,
  windows,
  web,
  pc,
}

export enum DeviceType {
  H5 = "h5",
  PC = "pc",
}

// 文件归属枚举
export enum FileBelongTo {
  personal = "mySpace",
  shared = "shared", // 共享
}

export enum CloudDriveH5Enum {
  FromChat = 0, // 默认不传或者0，右键菜单消息点击上传至云盘
  FromInput = 1, // 从输入框点击打开上传至云盘
  TransferSource = 2, // 右键菜单消息转源云盘
}

export enum ShareExpireType {
  None = 0,
  OneDay = 1, // 1 天
  SevenDays = 2, // 7 天
  ThirtyDays = 3, // 30 天
  OneYear = 4, // 1 年
  Forever = 5, // 永久
}

export enum TableColumnKeyEnum {
  Recent = 0,
  My = 1,
  MyShare = 2,
  ShareSpace = 3,
  RecycleBin = 4,
  Folder = 5,
  SearchResult = 6,
}

export enum CloudDriveOperationTypeEnum {
  /// <summary>
  /// 全部
  /// </summary>
  All = 0,
  /// <summary>
  /// 上传
  /// </summary>
  Upload = 1,
  /// <summary>
  /// 下载
  /// </summary>
  Download = 2,
  /// <summary>
  /// 更新
  /// </summary>
  Update = 3,
  /// <summary>
  /// 重命名
  /// </summary>
  Rename = 4,
  /// <summary>
  /// 删除
  /// </summary>
  Delete = 5,
  /// <summary>
  /// 还原
  /// </summary>
  Restore = 6,
  /// <summary>
  /// 彻底删除
  /// </summary>
  CompletelyDelete = 7,
  /// <summary>
  /// 过期删除
  /// </summary>
  ExpiredDeletion = 8,
  /// <summary>
  /// 创建公共共享空间
  /// </summary>
  CreatePublicShare = 9,
  /// <summary>
  /// 创建文件夹
  /// </summary>
  CreateFolder = 10,
  /// <summary>
  /// 编辑权限
  /// </summary>
  EditPermission = 11,
}

export enum FileTypeEnum {
  Folder = 1,
  File = 2,
}

export enum LayoutMode {
  LIST = "list",
  GRID = "grid",
}

export enum ClientType {
  MobileApp = "mobileApp",
  PcClient = "pcClient",
  WebBrowser = "webBrowser",
}
