import { useChunkUploader } from "@/hooks/upload/useChunkUploader";
import { useSimpleUploader } from "@/hooks/upload/useSimpleUploader";
import { useUploadInfo } from "@/stores";
import { uploadFileStep2Api } from "@/api/fileService";

type uploadItem = {
  file: File;
  fileName: string;
  aesKey: string;
  parentId: number | undefined;
};

export type SmartUploadOptions = {
  uploadTasks: uploadItem[];
  /** 取消控制 */
  signal?: AbortSignal;
  onRefreshData?: () => void;
  findDuplicateFiles?: () => void;
};

export function useSmartUploader() {
  const { uploadSingleFile } = useSimpleUploader();
  const { uploadInChunks } = useChunkUploader();
  const {
    updateUploadingFileProgress,
    markTaskSuccess,
    markTaskError,
    markTaskDuplicate,
    addAllTasks,
    addDuplicateTask
  } = useUploadInfo();

  const DEFAULT_THRESHOLD = 10 * 1024 * 1024; // 10MB

  async function uploadFilesSmart(
    opts: SmartUploadOptions = { uploadTasks: [] },
  ) {
    const { uploadTasks, signal, onRefreshData, findDuplicateFiles } = opts;

    const fileList: {
      name: string;
      fileId: string;
      size: number;
      aesKey?: string;
    }[] = [];

    const fileParentMap = new Map<string, number>();
    uploadTasks.forEach((item) => {
      fileParentMap.set(item.fileName, item.parentId!);
    });

    try {
      await Promise.all(
        uploadTasks.map(async (t) => {
          const { fileName, file } = t;
          try {
            // 取消判定
            if (signal?.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }

            if (file.size <= DEFAULT_THRESHOLD) {
              const res = await uploadSingleFile(file, {
                onProgress: (_name, p) =>
                  updateUploadingFileProgress(fileName, p),
              });
              fileList.push(res);
            } else {
              const res = await uploadInChunks(file, {
                onProgress: (_name, p) =>
                  updateUploadingFileProgress(fileName, p),
              });
              fileList.push({
                name: res.name,
                fileId: res.fileUrl,
                size: res.fileSize,
              });
            }

            // 补充加密 Key 信息
            fileList.forEach((f) => {
              f.aesKey = t.aesKey;
            });
          } catch (err: any) {
            console.error(err);
            console.log(err)
            markTaskError(fileName, "上传出错", "");
          }
        })
      );

      const filesGroupMap = new Map<number, typeof fileList>();

      fileList.forEach(file => {
        const cId = fileParentMap.get(file.name) ?? 0;

        if (!filesGroupMap.has(cId)) {
          filesGroupMap.set(cId, []);
        }
        filesGroupMap.get(cId)!.push(file);
      });

      const processUploadGroup = async (cId: number, files: typeof fileList) => {
        try {
          const res = await uploadFileStep2Api({
            fileInfos: files,
            contentId: cId,
            repeatFileOperateType: 0,
            viewRanges: [],
            editRanges: [],
          });

          if (res.code === 1) {
            const duplicateIds = res.data || [];
            const duplicateFiles = files.filter((f) => duplicateIds.includes(f.fileId));

            if (duplicateFiles.length > 0) {
              addDuplicateTask(duplicateFiles);
              addAllTasks(files);
              duplicateFiles.forEach((f) => markTaskDuplicate(f.name));
              findDuplicateFiles?.();
            } else {
              files.forEach(f => markTaskSuccess(f.name));
            }
          } else {
            files.forEach(f => markTaskError(f.name, res.message || "保存失败", ""));
          }
        } catch (error) {
          files.forEach(f => markTaskError(f.name, "请求异常", ""));
        }
      };

      const uploadPromises = Array.from(filesGroupMap.entries()).map(([cId, files]) => {
        return processUploadGroup(cId, files);
      });

      await Promise.all(uploadPromises);
      onRefreshData?.();

    } catch (err: any) {
      // 捕获 AbortError，如果是取消导致的退出，通常不需要刷新列表
      if (err.name === "AbortError" || err.message === "Aborted") {
        console.log("上传已取消，不刷新列表");
      } else {
        onRefreshData?.();
      }
    }
  }

  return {
    uploadFilesSmart,
  };
}