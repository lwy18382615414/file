// 常量定义
const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB 分片大小

// 生成随机密钥
export async function generateKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

// 将密钥导出为base64字符串
export async function exportKey(key: CryptoKey) {
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
}

// 从base64字符串导入密钥
async function importKey(keyString: string) {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

// 获取随机IV
function getRandomIV() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

export async function handleFileEncryption(
  files: File[],
  signal?: AbortSignal,
) {
  const encryptedFiles = [];
  for (const file of files) {
    if (signal?.aborted) throw new Error("__ENCRYPT_ABORTED__");

    const key = await generateKey();
    const iv = getRandomIV();
    const encryptedBlobs = [];
    encryptedBlobs.push(new Blob([iv]));

    // 计算总分片数
    let processedChunks = 0;

    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
      if (signal?.aborted) throw new Error("__ENCRYPT_ABORTED__");
      // 加密处理
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const arrayBuffer = await chunk.arrayBuffer();
      const encryptedChunk = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          additionalData: new Uint8Array([processedChunks]),
          iv,
          tagLength: 128,
        },
        key,
        arrayBuffer,
      );
      encryptedBlobs.push(new Blob([encryptedChunk]));

      // 进度回调
      processedChunks++;
    }

    const encryptedFile = new File(encryptedBlobs, file.name, {
      type: file.type,
    });

    // 导出密钥
    const keyString = await exportKey(key);

    encryptedFiles.push({
      file: encryptedFile,
      key: keyString,
      name: file.name,
    });
  }
  return encryptedFiles;
}

export async function decryptFile(
  encryptedBlob: Blob,
  keyString: string,
): Promise<Blob[]> {
  // 从base64字符串导入密钥
  const key = await importKey(keyString);

  // 将整个加密的Blob转换为ArrayBuffer
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  // 提取前12字节作为IV
  const iv = new Uint8Array(encryptedBuffer.slice(0, 12));

  // 剩余部分是加密的分片数据
  const encryptedData = new Uint8Array(encryptedBuffer.slice(12));

  const decryptedBlobs: Blob[] = [];
  let offset = 0;
  let chunkIndex = 0;

  // 遍历所有加密分片
  while (offset < encryptedData.length) {
    // 计算当前分片长度（原始分片大小 + 16字节标签）
    const chunkSize = CHUNK_SIZE + 16;
    const end = Math.min(offset + chunkSize, encryptedData.length);

    // 提取加密分片数据
    const chunk = encryptedData.slice(offset, end);

    try {
      // 解密分片
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          additionalData: new Uint8Array([chunkIndex]),
          tagLength: 128,
        },
        key,
        chunk,
      );

      // 将解密后的ArrayBuffer转为Blob
      decryptedBlobs.push(new Blob([decrypted]));
    } catch (error) {
      throw new Error(`解密失败`);
    }

    offset = end;
    chunkIndex++;
  }

  return decryptedBlobs;
}
