enum httpCode {
  /// 未知错误
  UnKnow = 9999,
  /// 操作成功
  Success = 1,
  /// 操作失败
  OperationFailure = 2,
  /// 参数无效
  ParamsterInvalid = 3,
  /// 未授权
  Unauthorized = 4,
  /// 验证码错误
  CodeRequiredFailure = 20,
  /// 验证码发送失败
  CodeSendFailure = 21,
  /// 文件超出限制
  FileSizeLimit = 23,
  /// 发送验证码过于频繁，请稍后再试
  CodeSendTooMuch = 25,
  /// 账号在其他设备登录
  LoginOnOtherDevice = 28,
  /// 二维码不正确
  QRCodeIncorrect = 88,
  /// 二维码无效
  QRCodeInvalid = 89,
  /// 操作重复
  RepeatOperation = 90,
  /// 文件或文件夹名重复
  olderAlreadyExists = 701,
  /// 分享已过期
  shareExpired = 704,
  /// 分享已失效
  shareInvalid = 705,
  /// 分享不存在
  shareNotExist = 706,
  /// 提取码错误
  sharePswError = 707,
  /// 当前文件正在处理中
  ConcurrentConflict = 710,
  /// 没有编辑权限-上传文件或新建文件夹
  noEditPermission = 1109,
}

export const httpMessage: Record<number, string> = {
  1: "Success",
  2: "OperationFailure",
  3: "ParamsterInvalid",
  4: "Unauthorized",
  20: "CodeRequiredFailure",
  21: "CodeSendFailure",
  23: "FileSizeLimit",
  25: "CodeSendTooMuch",
  28: "LoginOnOtherDevice",
  88: "QRCodeIncorrect",
  89: "QRCodeInvalid",
  90: "RepeatOperation",
  9999: "UnKnow",
  701: "folderAlreadyExists",
  704: "shareExpired",
  705: "shareInvalid",
  706: "shareNotExist",
  707: "sharePswError",
  1109: "noEditPermission",
};

export function getStatusMessage(statusCode: number) {
  const statusMessages = new Map<number, string>([
    [704, "shareExpired"],
    [705, "shareInvalid"],
    [706, "shareInvalid"],
    [707, "shareInvalid"],
  ]);

  return statusMessages.get(statusCode) || httpMessage[statusCode] || "UnKnow";
}

export default httpCode;
