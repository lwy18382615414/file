import {
  mergeFileApi,
  requestUploadFileApi,
  uploadFileChunkApi,
} from "@/api/fileService";
import SparkMD5 from "spark-md5";
import config from "@/hooks/config";
import type { AxiosProgressEvent } from "axios";
import { t } from "@/utils";

export function useChunkUploader() {
  const { fileChunkSize } = config();
  const CHUNK_SIZE = fileChunkSize.value || 5 * 1024 * 1024;

  const computeMD5 = (chunk: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const spark = new SparkMD5.ArrayBuffer();
          spark.append(e.target.result as ArrayBuffer);
          resolve(spark.end());
        } else {
          reject(new Error("读取 chunk 数据失败"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(chunk);
    });
  };

  const uploadInChunks = async (
    file: File,
    opts?: {
      onProgress?: (name: string, percent: number) => void;
    },
  ) => {
    const { onProgress } = opts || {};

    const fileName = file.name;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileLength = file.size;
    const concurrency = 5;

    const chunkProgress: Record<number, number> = {};
    let lastPercent = 0;

    const reqRes = await requestUploadFileApi({
      fileName,
      chunks: totalChunks,
      fileLength,
    });

    if (reqRes.code !== 1) throw new Error(t(`E${reqRes.code}`));

    const fileId = reqRes.data;
    const fullFileMd5 = await computeMD5(file);

    // 上传单个分片
    const uploadChunk = async (chunkId: number) => {
      const start = chunkId * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const chunkMd5 = await computeMD5(chunk);

      await uploadFileChunkApi({
        fileId,
        chunkId,
        Md5: chunkMd5,
        File: new File([chunk], fileName, { type: file.type }),
        onUploadProgress:(e: AxiosProgressEvent) => {
          if (!e.lengthComputable) return;
          chunkProgress[chunkId] = e.loaded;
          const uploadedBytes = Object.values(chunkProgress).reduce(
            (sum, v) => sum + v,
            0
          );
          const percent = Math.min(
            Math.floor((uploadedBytes / file.size) * 100),
            100
          );
          const safePercent = Math.max(lastPercent, percent);
          lastPercent = safePercent;
          onProgress?.(file.name, safePercent);
        }
      });
    }

    // 控制并发上传的执行队列
    const pool: Promise<void>[] = [];
    let nextChunkId = 0;

    const runNext = async () => {
      if (nextChunkId >= totalChunks) return;
      const currentId = nextChunkId++;
      await uploadChunk(currentId);
      await runNext(); // 递归取下一个任务
    };

    // 启动固定数量的并发任务
    for (let i = 0; i < Math.min(concurrency, totalChunks); i++) {
      pool.push(runNext());
    }

    // 等待所有上传完成
    await Promise.all(pool);

    const mergeRes = await mergeFileApi({
      fileId,
      fileName,
      md5: fullFileMd5,
      uploadResourceType: 6,
    });

    if (mergeRes.code !== 1) {
      throw new Error("文件合并失败");
    }

    return { ...mergeRes.data, name: file.name };
  };

  return {
    uploadInChunks,
  };
}
