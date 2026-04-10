<template>
  <div v-if="isFolderSelectPage" class="share-title">
    <span>{{ titleText }}</span>
  </div>
  <div class="folder-select-content">
    <div v-for="item in folderList" :key="item.contentId" class="folder-list">
      <FolderItem
        :content-id="item.contentId"
        :folder-name="item.name"
        :is-personal="item.isPersonal"
        :new-folder-parent-id="newFolderParentId"
        :selected-id="selectedId"
        :show-input="item.contentId === newFolderParentId"
        :selected-path="selectedPath"
        @select="selectFolder"
        @create-finish="onCreateFinish"
      />
    </div>
    <div class="btn-box">
      <div class="btn-left">
        <el-button
          :disabled="isCreateDisabled"
          class="create-folder-btn"
          @click="startCreateFolder"
        >
          <SvgIcon
            name="share-add"
            :color="isCreateDisabled ? '#fff' : ''"
            style="margin-right: 8px"
          />
          {{ t("createFolder") }}
        </el-button>
      </div>
      <div class="btn-right">
        <el-button class="cancel-btn" @click="handleCancel">
          {{ t("cancel") }}
        </el-button>
        <el-upload
          ref="uploader"
          action="#"
          multiple
          :show-file-list="false"
          :before-upload="beforeUpload"
        />
        <el-button
          v-if="isFromInput === CloudDriveH5Enum.FromInput"
          :disabled="disabledSaveBtn"
          class="confirm-btn"
          type="primary"
          @click.prevent="handleSelectFiles"
        >
          {{ t("upload") }}
        </el-button>
        <el-button
          v-else
          :disabled="disabledSaveBtn"
          class="confirm-btn"
          type="primary"
          @click="handleSaveFolder"
        >
          {{ t("Ok") }}
        </el-button>
      </div>
    </div>
  </div>
  <RepeatFileDialog
    v-if="show"
    :isTransfer="isTransfer"
    :repeatVisible="show"
    :contentId="selectedId ?? 0"
    :duplicateList="duplicateList"
    :allFileList="allFileList"
    @update:repeatVisible="show = $event"
    @saveSuccess="saveFile(true)"
  />
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import FolderItem from "./folderItem.vue";
import { getParentFolderContentIdApi } from "@/api/common";
import { t, checkIsHaveFile, checkFileSize } from "@/utils";
import { useRoute } from "vue-router";
import { exportKey, generateKey } from "@/utils/upload/encrypt";
import { handleFileEncryption } from "@/utils/upload/encrypt";
import { getTransferFileInfoApi, uploadFileStep2Api } from "@/api/fileService";
import type { TransFileInfo } from "@/types/type";
import RepeatFileDialog from "@/views/pc/Layout/pop/RepeatFileDialog.vue";
import type { Task } from "@/stores";
import type { UploadRawFile } from "element-plus";
import { ElMessage, ElLoading } from "element-plus";
import { startUploadTask } from "@/utils/upload/uploadManager";
import { CloudDriveH5Enum } from "@/enum/baseEnum";
import { shareContentByChatApi } from "@/api/share";
import { debounce } from "lodash-es";

const props = defineProps({
  isSaveBtnDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "selectFolder", id: number, name: string): void;
  (e: "cancelSelect"): void;
  (e: "saveSelect", targetName: string, targetId: number | null): void;
}>();

const route = useRoute();

const selectedId = ref<number | null>(null);
const selectedPath = ref<number[]>([]);
const selectedFolderName = ref<string>("");
const newFolderParentId = ref<number | null>(null);

const folderList = ref([
  { contentId: 0, name: t("myFiles"), isPersonal: true },
  { contentId: -1, name: t("shared"), isPersonal: false },
]);
const show = ref(false);
const duplicateList = ref<Record<number, string>[] | undefined>([]);
const allFileList = ref<Array<Task> | undefined>([]);

let uploadTimer: any;
let isEncrypting = false;
const isFromInput = ref(Number(route.query.type));
const validFiles = ref<UploadRawFile[]>([]);
const isTransfer = ref(false);
const loading = ref();
const uploader = ref();

const isFolderSelectPage = computed(() => route.path === "/file-select");

const fileInfo = computed<TransFileInfo[]>(() => {
  const fileInfoQuery = route.query.fileInfo;
  if (typeof fileInfoQuery === "string") {
    try {
      return JSON.parse(fileInfoQuery);
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  return [];
});

console.log("客户端传递的数据", fileInfo.value);

const disabledSaveBtn = computed(
  () => props.isSaveBtnDisabled || selectedId.value === -1,
);

const isCreateDisabled = computed(() => selectedId.value === -1);

const titleText = computed(() => {
  const chatTypeMap: Record<number, string> = {
    0: t("saveToCloud"),
    1: t("uploadToCloud"),
    2: t("transferToCloud"),
  };
  return chatTypeMap[Number(isFromInput.value)];
});

const closeDialog = () => {
  setTimeout(() => {
    console.log(JSON.stringify({ type: "6" }));
  }, 500);
};

const handleSelectFiles = async () => {
  const canSelect = await checkIsHaveFile();
  if (canSelect) {
    const inputEl = uploader.value?.$el.querySelector('input[type="file"]');
    if (inputEl) inputEl.click();
  } else {
    ElMessage.error(t("fileStopped"));
    closeDialog();
  }
};

const selectFolder = (contentId: number, folderName: string) => {
  selectedId.value = contentId;
  selectedFolderName.value = folderName;
  emit("selectFolder", contentId, folderName);
};

const onCreateFinish = () => {
  newFolderParentId.value = null;
};

const startCreateFolder = () => {
  if (selectedId.value !== null) {
    newFolderParentId.value = selectedId.value;
  }
};

const handleCancel = () => {
  if (isFolderSelectPage.value) {
    console.log(JSON.stringify({ type: "6" }));
  } else {
    emit("cancelSelect");
  }
};

const initSelectedFolder = async () => {
  const cachedId = sessionStorage.getItem("lastSelectedId");
  console.log("cachedId", cachedId);
  if (!cachedId) {
    selectedId.value = 0;
    selectedPath.value = [0];
    return;
  }

  try {
    const res = await getParentFolderContentIdApi(cachedId);
    if (res.code === 1) {
      const { path, isShare } = res.data;
      selectedId.value = Number(cachedId);
      selectedPath.value = path
        .split("/")
        .filter(Boolean)
        .map((item) => Number(item));
      selectedPath.value.unshift(isShare ? -1 : 0);
    } else {
      selectedId.value = 0;
      selectedPath.value = [0];
    }
  } catch (e) {
    console.error("Error parsing cachedId:", e);
  }
};

const handleSaveFolder = debounce(async () => {
  const canSelect = await checkIsHaveFile();
  if (!canSelect) {
    ElMessage.error(t("fileStopped"));
    closeDialog();
    return;
  }
  console.log("选择保存文件夹的名称", selectedFolderName.value);
  console.log("选择保存文件夹的ContentId", selectedId.value);
  let targetFolderName =
    selectedFolderName.value ||
    sessionStorage.getItem("lastSelectedName") ||
    t("myFiles");

  if (
    isFolderSelectPage.value &&
    isFromInput.value !== CloudDriveH5Enum.FromInput
  ) {
    loading.value = ElLoading.service({
      lock: false,
      background: "#fff",
    });
    await getTransferFiles(selectedId.value ?? 0);
  } else {
    emit("saveSelect", targetFolderName, selectedId.value);
  }
}, 500);

const getTransferFiles = async (targetContentId: number) => {
  try {
    const promises = fileInfo.value.map(async (item) => ({
      fileId: item.fileId,
      fileUrl: item.fileUrl,
      aesKey: await exportKey(await generateKey()),
    }));
    const transferStorageFiles = await Promise.all(promises);
    const res = await getTransferFileInfoApi({
      transferStorageFiles,
    });

    if (res.code === 1) {
      const fileInfos = fileInfo.value.map((item) => {
        const transferFile = res.data.find((tf) => tf.fileUrl === item.fileUrl);

        return {
          name: item.name,
          fileId: transferFile?.fileId,
          size: item.size,
          aesKey: transferFile?.aesKey,
        };
      });

      console.log(fileInfos);

      let uploadRes: any;

      if (isFromInput.value === CloudDriveH5Enum.TransferSource) {
        uploadRes = await shareContentByChatApi({
          fileInfos: fileInfos,
          contentId: targetContentId,
        });
      } else {
        uploadRes = await uploadFileStep2Api({
          fileInfos: fileInfos,
          contentId: targetContentId,
          repeatFileOperateType: 0,
          viewRanges: [],
          editRanges: [],
        });
      }
      if (uploadRes.code === 1) {
        if (isFromInput.value === CloudDriveH5Enum.TransferSource) {
          console.log(JSON.stringify({ type: "26", data: uploadRes.data }));
        } else {
          if (!uploadRes.data.length) {
            saveFile(true);
          } else {
            isTransfer.value = true;
            show.value = true;
            duplicateList.value = uploadRes.data as any;
            allFileList.value = fileInfos;
          }
        }
      } else if (uploadRes.code === 710) {
        saveFile(false, t("ConcurrentConflict"));
      } else {
        saveFile(false);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value.close();
  }
};

const saveFile = (isSuccess: boolean, msg = t("errorOccurred")) => {
  console.log(
    JSON.stringify({
      type: "15",
      data: {
        isSuccess,
        toastStr: isSuccess ? t("fileSaveSuccess") : msg,
      },
    }),
  );
};

const beforeUpload = async (rawFile: UploadRawFile) => {
  if (rawFile.isDirectory) return false;

  const isTooBig = checkFileSize(rawFile);
  if (isTooBig) {
    ElMessage.error(t("fileSizeLimit"));
    return false;
  }

  validFiles.value.push(rawFile);

  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => {
    triggerUpload();
  }, 500);

  return false;
};

const triggerUpload = async () => {
  if (isEncrypting || !validFiles.value.length) return;
  isEncrypting = true;

  const filesToEncrypt = [...validFiles.value];
  validFiles.value = [];

  try {
    loading.value = ElLoading.service({
      lock: false,
      text: t("uploading"),
      background: "#fff",
    });

    const encryptedFiles = await handleFileEncryption(filesToEncrypt);
    await uploadFile(encryptedFiles);
  } catch (err) {
    ElMessage.error(t("encryptionError"));
  } finally {
    isEncrypting = false;
  }
};

const uploadFile = async (
  files: { file: File; key: string; name: string }[],
) => {
  isTransfer.value = false;
  duplicateList.value = undefined;
  allFileList.value = undefined;
  startUploadTask({
    isByChat: true,
    files: files.map((item) => item.file),
    encryptKeys: files.map((item) => ({
      name: item.name,
      aesKey: item.key,
    })),
    contentId: selectedId.value || 0,
    completeAllTasks(data: any) {
      loading.value.close();
      console.log(JSON.stringify({ type: "25", data }));
    },
    findDuplicateFiles() {
      show.value = true;
    },
    uploadError() {
      ElMessage.error(t("errorOccurred"));
    },
  });
};

onMounted(() => {
  initSelectedFolder();
});
</script>

<style lang="scss" scoped>
.loading-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
  z-index: 9;
}
.share-title {
  line-height: 150%;
  font-family: "PingFang SC";
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  font-weight: bold;
  color: #2d2d2d;
  padding: 10px 16px;
}
.folder-select-content {
  max-height: calc(100vh - 41px - 63px);
  overflow: auto;

  .btn-box {
    background: #fff;
    border-top: 1px solid #e0e4eb;
    padding: 15px 20px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    position: absolute;
    bottom: 0;

    .btn-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .el-button + .el-button {
      margin-left: 0;
    }
  }

  .create-folder-btn,
  .cancel-btn {
    background: #f2f6fe;
    border: none;
    color: #327edc;

    &.is-disabled {
      background: #b7b7b7;
      color: #fff;
      border: 1px solid #b7b7b7;
    }
  }

  .confirm-btn {
    border: none;
    background: #327edc;
    color: #fff;
    font-weight: 700;

    &.is-disabled {
      background: #b7b7b7;
      color: #fff;
      border: 1px solid #b7b7b7;
    }
  }
}
</style>
