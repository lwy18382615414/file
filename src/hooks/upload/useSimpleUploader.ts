import { uploadFileStep1Api } from "@/api/fileService";

export function useSimpleUploader() {
  const uploadSingleFile = async (
    file: File,
    opts?: {
      onProgress?: (fileName: string, percent: number) => void;
    },
  ) => {
    const { onProgress } = opts || {};

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadFileStep1Api(formData, {
      onUploadProgress: (e) => {
        const percent = Math.floor((e.loaded / e.total) * 100);
        if (onProgress) {
          onProgress(file.name, percent);
        }
      },
    });
    if (res.code !== 1) {
      throw new Error(`上传失败: ${res.message || "未知错误"}`);
    }

    return res.data; // 包含 name, fileId, size
  };

  return {
    uploadSingleFile,
  };
}
