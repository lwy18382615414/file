import { ref } from "vue";
import { uploadFileStep2Api } from "@/api/fileService";
import { createUploadPoolWithRetry } from "@/utils/upload/concurrentUpload.ts";
import { useUploadInfo } from "@/stores";
import { useChunkUploader } from "./useChunkUploader";
import { useSimpleUploader } from "./useSimpleUploader";
import { shareContentByChatApi } from "@/api/share";

interface UploadOptions {
  files: File[];
  encryptKeys?: { name: string; aesKey: string }[];
  contentId: number;
  isByChat?: boolean;
  onProgress?: (fileName: string, progress: number) => void;
  onError?: (fileName: string, error: never) => void;
}

const { uploadInChunks } = useChunkUploader();
const { uploadSingleFile } = useSimpleUploader();

export function useUploader() {
  const fileList = ref<
    { name: string; fileId: string; size: number; aesKey?: string }[]
  >([]);

  const uploadFiles = async (options: UploadOptions) => {
    const {
      files,
      encryptKeys = [],
      contentId,
      onProgress,
      onError,
    } = options;

    const uploadTasks = files.map((file) => {
      return async () => {
        try {
          if (file.size > 30 * 1024 * 1024) {
            const uploadRes = await uploadInChunks(file, {
              onProgress: (fileName, percent) => {
                onProgress?.(fileName, percent);
              },
            });
            if (!uploadRes) throw new Error("分片上传失败");
            fileList.value.push({
              name: uploadRes.name,
              fileId: uploadRes.fileUrl,
              size: uploadRes.fileSize,
            });
            return fileList.value;
          } else {
            const uploadRes = await uploadSingleFile(file, {
              onProgress: (fileName, percent) => {
                onProgress?.(fileName, percent);
              },
            });
            if (!uploadRes) throw new Error("单文件上传失败");
            fileList.value.push(uploadRes);
            return uploadRes;
          }
        } catch (err) {
          console.error(`${file.name} 上传失败`, err);
          onError?.(file.name, err);
          throw err;
        }
      };
    });

    const result = await createUploadPoolWithRetry(uploadTasks, 3, 0);

    const successCount = result.filter(
      (r) => r && r.status === "fulfilled",
    ).length;

    if (!successCount) {
      return { fileList: [], serverRes: { code: 0, data: [] } };
    }

    fileList.value.forEach((file) => {
      const correspondingKey = encryptKeys.find(
        (key) => key.name === file.name,
      );
      if (correspondingKey) {
        file.aesKey = correspondingKey.aesKey;
      }
    });

    let res: any;

    if (options.isByChat) {
      res = await shareContentByChatApi({
        fileInfos: fileList.value,
        contentId,
      })
    } else {
      res = await uploadFileStep2Api({
        fileInfos: fileList.value,
        contentId,
        repeatFileOperateType: 0,
        viewRanges: [],
        editRanges: [],
      });
    }

    return { fileList: fileList.value, serverRes: res };
  };

  const resetUploader = () => {
    fileList.value = [];
    useUploadInfo().clearUploadingStatus();
  };

  return {
    uploadFiles,
    resetUploader,
    fileList,
  };
}
