import { useDialog } from "@/hooks/useDialog";
import type { ElInput } from "element-plus";

interface RenameOptions {
  inputRef: InstanceType<typeof ElInput> | null;
  isFolder: boolean;
  fileName: string;
}

/**
 * 获取文件后缀
 * @param name 文件名
 * @returns string 文件后缀（小写）
 */
const getExtension = (name: string): string => {
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex > 0 ? name.slice(lastDotIndex + 1).toLowerCase() : "";
};

/**
 * 自动选中文件名（不包括后缀）
 * @param options 重命名选项
 */
export const autoSelectFileName = (options: RenameOptions): void => {
  const { inputRef, isFolder, fileName } = options;

  setTimeout(() => {
    // 尝试获取 input 元素
    const inputEl = inputRef?.$el?.querySelector?.(
      "input",
    ) as HTMLInputElement | null;
    if (!inputEl) return;

    inputEl.focus(); // 必须先 focus

    if (!isFolder) {
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        inputEl.setSelectionRange(0, lastDotIndex);
      } else {
        inputEl.select();
      }
    } else {
      inputEl.select();
    }
  }, 100); // 适当延迟
};

/**
 * 检查文件后缀是否改变
 * @param oldName 原文件名
 * @param newName 新文件名
 * @returns boolean
 */
export const checkFileExtensionChanged = (
  oldName: string,
  newName: string,
): boolean => {
  if (!oldName || !newName) return false;
  console.log(getExtension(oldName), getExtension(newName));

  return getExtension(oldName) !== getExtension(newName);
};

/**
 * 检查文件后缀变更并提示
 * @param oldName 原文件名
 * @param newName 新文件名
 * @param isFolder 是否是文件夹
 * @returns Promise<boolean> 是否继续重命名
 */
export const checkAndConfirmExtensionChange = async (
  oldName: string,
  newName: string,
  isFolder: boolean,
): Promise<boolean> => {
  if (!isFolder && checkFileExtensionChanged(oldName, newName)) {
    try {
      await useDialog({
        title: "修改文件后缀",
        content: "修改文件后缀可能导致文件无法正常查看，是否继续？",
        confirmText: "继续",
        cancelText: t("cancel"),
      });
      return true;
    } catch {
      return false;
    }
  }
  return true;
};
