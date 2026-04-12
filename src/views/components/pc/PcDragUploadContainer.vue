<template>
  <div
    class="drag-upload-container"
    @dragenter="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop="handleDrop"
  >
    <slot />
    <div v-if="canDrop && isDraggingOver" class="dropzone"></div>
    <RepeatFileDialog
      :is-transfer="true"
      :repeat-visible="showRepeatFileDialog"
      :content-id="props.contentId"
      @saveSuccess="handleRepeatFileSaveSuccess"
      @update:repeatVisible="handleRepeatVisibleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { getFileFromEntry } from "@/utils";
import { createFolderApi } from "@/api/fileService";
import config from "@/hooks/config";
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";
import RepeatFileDialog from "./Dialog/RepeatFileDialog.vue";
import type { CollectedFileItem } from "@/types/type";

type UploadingFolderEventPayload = {
  tempRowId: string;
  contentId: number;
  folderName: string;
};

type PendingFolderUpload = UploadingFolderEventPayload & {
  finished: boolean;
};

const props = defineProps<{
  canDrop: boolean;
  contentId: number;
  isPersonal: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "uploading-folder-start", payload: UploadingFolderEventPayload): void;
  (e: "uploading-folder-finish", payload: UploadingFolderEventPayload): void;
  (e: "uploading-folder-fail", payload: UploadingFolderEventPayload): void;
}>();

const { t } = useI18n();
const { fileMaxSize } = config();
const { runUpload } = useUploadFlow();

const showRepeatFileDialog = ref(false);
const isDraggingOver = ref(false);
const activeDroppedFolders = ref<PendingFolderUpload[]>([]);
let dragLeaveTimeout: number | undefined;

const createTempRowId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `uploading-folder-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const clearDragLeaveTimeout = () => {
  if (dragLeaveTimeout != null) {
    window.clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = undefined;
  }
};

const clearDroppedFolders = () => {
  activeDroppedFolders.value = [];
};

const markDroppedFoldersFinished = () => {
  activeDroppedFolders.value = activeDroppedFolders.value.map((item) => {
    if (item.finished) return item;
    emit("uploading-folder-finish", item);
    return {
      ...item,
      finished: true,
    };
  });
};

const failDroppedFolders = () => {
  activeDroppedFolders.value.forEach((item) => {
    emit("uploading-folder-fail", item);
  });
  clearDroppedFolders();
};

const handleRepeatVisibleChange = (value: boolean) => {
  showRepeatFileDialog.value = value;
  if (!value) {
    failDroppedFolders();
  }
};

const handleRepeatFileSaveSuccess = () => {
  markDroppedFoldersFinished();
  ElMessage.success(t("uploadSuccess"));
  emit("refresh");
  showRepeatFileDialog.value = false;
  clearDroppedFolders();
};

function readDirectory(
  entry: FileSystemDirectoryEntry,
  contentId: number,
  collector: CollectedFileItem[],
): Promise<void> {
  return new Promise((resolve) => {
    const reader = entry.createReader();
    const subDirectories: Array<{
      entry: FileSystemDirectoryEntry;
      contentId: number;
    }> = [];

    const readEntries = () => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
          for (const sub of subDirectories) {
            await readDirectory(sub.entry, sub.contentId, collector);
          }
          resolve();
          return;
        }

        const fileEntries = entries.filter(
          (ent) => ent.isFile,
        ) as FileSystemFileEntry[];
        const files = await Promise.all(fileEntries.map(getFileFromEntry));
        files.forEach((file) => {
          collector.push({
            file,
            parentId: contentId,
          });
        });

        const dirEntries = entries.filter(
          (ent) => ent.isDirectory,
        ) as FileSystemDirectoryEntry[];
        for (const dirEntry of dirEntries) {
          let res = await createFolderFn(dirEntry.name, contentId);
          if (res.code !== 1) {
            res = await createFolderFn(
              `${dirEntry.name}_${Date.now()}`,
              contentId,
            );
          }
          const childId: number = res.data;
          subDirectories.push({ entry: dirEntry, contentId: childId });
        }
        readEntries();
      });
    };

    readEntries();
  });
}

const handleDragEnter = () => {
  if (!props.canDrop) return;
  clearDragLeaveTimeout();
  isDraggingOver.value = true;
};

const handleDragOver = (event: DragEvent) => {
  if (!props.canDrop) return;
  event.preventDefault();
  clearDragLeaveTimeout();
};

const handleDragLeave = () => {
  if (!props.canDrop) return;
  clearDragLeaveTimeout();
  dragLeaveTimeout = window.setTimeout(() => {
    isDraggingOver.value = false;
  }, 100);
};

const createFolderFn = async (
  folderName: string,
  currentContentId: number = props.contentId,
) => {
  return await createFolderApi({
    currentContentId,
    folderName,
    viewRanges: [],
    editRanges: [],
    isPersonal: props.isPersonal,
  });
};

const handleDrop = async (event: DragEvent) => {
  if (!props.canDrop) return;
  event.preventDefault();
  clearDragLeaveTimeout();
  isDraggingOver.value = false;
  clearDroppedFolders();

  const items = Array.from(event.dataTransfer?.items || []);
  if (!items.length) return;

  let allCollectedFiles: CollectedFileItem[] = [];

  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => !!entry);

  for (const entry of entries) {
    if (entry.isFile) {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      allCollectedFiles.push({
        file,
        parentId: props.contentId,
      });
      continue;
    }

    if (!entry.isDirectory) continue;

    const tempRowId = createTempRowId();
    let entryName = entry.name;
    let res = await createFolderFn(entry.name, props.contentId);
    if (res.code !== 1) {
      entryName = `${entry.name}_${Date.now()}`;
      res = await createFolderFn(entryName, props.contentId);
    }
    if (res.code !== 1) {
      continue;
    }

    const folderPayload: PendingFolderUpload = {
      tempRowId,
      contentId: res.data,
      folderName: entryName,
      finished: false,
    };
    activeDroppedFolders.value.unshift(folderPayload);
    emit("uploading-folder-start", folderPayload);

    await readDirectory(
      entry as FileSystemDirectoryEntry,
      folderPayload.contentId,
      allCollectedFiles,
    );
  }

  if (allCollectedFiles.length === 0) {
    if (activeDroppedFolders.value.length > 0) {
      markDroppedFoldersFinished();
      emit("refresh");
      clearDroppedFolders();
    }
    return;
  }

  if (allCollectedFiles.some((item) => item.file.size > fileMaxSize.value)) {
    const invalidCount = allCollectedFiles.filter(
      (item) => item.file.size > fileMaxSize.value,
    ).length;
    ElMessage.warning(t("fileSizeExceededFiltered", { count: invalidCount }));
    allCollectedFiles = allCollectedFiles.filter(
      (item) => item.file.size <= fileMaxSize.value - 5 * 1024 * 1024,
    );
  }

  if (allCollectedFiles.length === 0) {
    markDroppedFoldersFinished();
    emit("refresh");
    clearDroppedFolders();
    return;
  }

  await runUpload({
    uploadItems: allCollectedFiles.map((item) => ({
      file: item.file,
      contentId: item.parentId,
    })),
    contentId: props.contentId,
    completeAllTasks() {
      markDroppedFoldersFinished();
      ElMessage.success(t("uploadSuccess"));
      emit("refresh");
      clearDroppedFolders();
    },
    findDuplicateFiles() {
      showRepeatFileDialog.value = true;
    },
    uploadError() {
      failDroppedFolders();
      ElMessage.error(t("errorOccurred"));
    },
  });
};
</script>

<style scoped lang="scss">
.drag-upload-container {
  position: relative;
}

.dropzone {
  position: absolute;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 126, 220, 0.08);
  border: 2px dashed var(--theme-color);
  border-radius: 12px;
  box-sizing: border-box;
  pointer-events: none;
}
</style>
