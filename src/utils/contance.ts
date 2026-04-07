import type { FileIconType } from "@/types/type";
import { CloudDriveOperationTypeEnum } from "@/enum/baseEnum";

export const iconMap: Record<string, FileIconType> = {
  // 图片类型
  png: "file-pic",
  jpg: "file-pic",
  jpeg: "file-pic",
  gif: "file-pic",
  bmp: "file-pic",
  webp: "file-pic",
  psd: "file-pic",
  svg: "file-pic",
  dxf: "file-pic",
  xbm: "file-pic",
  art: "file-pic",

  // Excel类型
  xls: "file-excel",
  xlsx: "file-excel",
  xlsm: "file-excel",
  xlsb: "file-excel",
  xltx: "file-excel",
  xltm: "file-excel",
  xlt: "file-excel",

  // 音乐类型
  mp3: "file-music",
  wav: "file-music",
  wma: "file-music",
  m4a: "file-music",
  ape: "file-music",
  wv: "file-music",
  flac: "file-music",

  // PDF
  pdf: "file-pdf",

  // PPT类型
  pptx: "file-ppt",
  pptm: "file-ppt",
  ppt: "file-ppt",
  ppsx: "file-ppt",
  ppsm: "file-ppt",
  pps: "file-ppt",
  ppa: "file-ppt",
  pot: "file-ppt",
  potm: "file-ppt",

  // 文本类型
  txt: "file-txt",
  rtf: "file-txt",
  xml: "file-txt",
  xps: "file-txt",

  // 视频类型
  mp4: "file-video",
  avi: "file-video",
  wmv: "file-video",
  flv: "file-video",
  mov: "file-video",
  mpeg: "file-video",
  m4v: "file-video",
  asf: "file-video",
  f4v: "file-video",
  rmvb: "file-video",
  rm: "file-video",
  vob: "file-video",
  "3gp": "file-video",

  // Word类型
  doc: "file-word",
  docx: "file-word",
  docm: "file-word",
  dotx: "file-word",
  dotm: "file-word",
  dot: "file-word",

  // 压缩类型
  zip: "file-zip",
  rar: "file-zip",
  "7z": "file-zip",
  tar: "file-zip",
  gz: "file-zip",
};



export const OperationTypeKeyMap: Record<number, string> = {
  [CloudDriveOperationTypeEnum.All]: 'weeklyReport.all',
  [CloudDriveOperationTypeEnum.Upload]: 'weeklyReport.upload',
  [CloudDriveOperationTypeEnum.Download]: 'weeklyReport.download',
  [CloudDriveOperationTypeEnum.Update]: 'weeklyReport.update',
  [CloudDriveOperationTypeEnum.Rename]: 'weeklyReport.rename',
  [CloudDriveOperationTypeEnum.Delete]: 'weeklyReport.delete',
  [CloudDriveOperationTypeEnum.Restore]: 'weeklyReport.restore',
  [CloudDriveOperationTypeEnum.CompletelyDelete]: 'weeklyReport.completelyDelete',
  [CloudDriveOperationTypeEnum.ExpiredDeletion]: 'weeklyReport.expiredDeletion',
  [CloudDriveOperationTypeEnum.CreatePublicShare]: 'weeklyReport.createPublicShare',
  [CloudDriveOperationTypeEnum.CreateFolder]: 'weeklyReport.createFolder',
  [CloudDriveOperationTypeEnum.EditPermission]: 'weeklyReport.editPermission',
};
