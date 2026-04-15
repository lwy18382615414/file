export type CommonHeaderActionKey =
  | "create"
  | "upload"
  | "download"
  | "share"
  | "move"
  | "copyLink"
  | "delete"
  | "openSharedSpaceSetting";

export type SpecialHeaderActionKey =
  | "restore"
  | "deletePermanently"
  | "cancelShare";

export type AuthHeaderActionKey =
  | "download"
  | "share"
  | "move"
  | "copyLink"
  | "delete";

export type HeaderActionKey = CommonHeaderActionKey | SpecialHeaderActionKey;
