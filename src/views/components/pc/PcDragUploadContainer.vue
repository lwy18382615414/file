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
      :repeat-visible="showRepeatFileDialog"
      :content-id="props.contentId"
      @update:repeatVisible="showRepeatFileDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getFileFromEntry } from "@/utils";
import { createFolderApi } from "@/api/fileService";
import type { CollectedFileItem } from "@/types/type";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import config from "@/hooks/config";
import { useUploadFlow } from "@/hooks/upload/useUploadFlow";
import RepeatFileDialog from "@/views/pc/Layout/pop/RepeatFileDialog.vue";

const showRepeatFileDialog = ref(false);

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const { runUpload } = useUploadFlow();

const props = defineProps<{
  canDrop: boolean;
  contentId: number;
  isPersonal: boolean;
}>();

const { t } = useI18n();
const { fileMaxSize } = config();

const isDraggingOver = ref(false);
let dragLeaveTimeout: number | undefined;

const clearDragLeaveTimeout = () => {
  if (dragLeaveTimeout != null) {
    window.clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = undefined;
  }
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

        // --- 处理当前层级的文件 ---
        const fileEntries = entries.filter(
          (ent) => ent.isFile,
        ) as FileSystemFileEntry[];
        const files = await Promise.all(fileEntries.map(getFileFromEntry));
        // 收集文件
        files.forEach((file) => {
          collector.push({
            file: file,
            parentId: contentId,
          });
        });

        // contentID，这里必须先在后端创建文件夹
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

  const items = Array.from(event.dataTransfer?.items || []);
  if (!items.length) return;

  let allCollectedFiles: CollectedFileItem[] = [];

  const entries = Array.from(event.dataTransfer?.items || [])
    .map((item) => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => !!entry);

  for (const entry of entries) {
    if (entry.isFile) {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      allCollectedFiles.push({
        file: file,
        parentId: props.contentId,
      });
    } else if (entry.isDirectory) {
      let entryName = entry.name;
      let res = await createFolderFn(entry.name, props.contentId);
      if (res.code !== 1) {
        entryName = `${entry.name}_${Date.now()}`;
        res = await createFolderFn(
          `${entry.name}_${Date.now()}`,
          props.contentId,
        );
      }
      console.log(`Created folder "${entryName}" for dropped directory.`);
      const topDirId = res.data;
      await readDirectory(
        entry as FileSystemDirectoryEntry,
        topDirId,
        allCollectedFiles,
      );
    }
  }

  if (allCollectedFiles.length === 0) {
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
    return;
  }

  await runUpload({
    uploadItems: allCollectedFiles.map((item) => ({
      file: item.file,
      contentId: item.parentId,
    })),
    contentId: props.contentId,
    completeAllTasks() {
      ElMessage.success(t("uploadSuccess"));
      emit("refresh");
    },
    findDuplicateFiles() {
      showRepeatFileDialog.value = true;
    },
    uploadError() {
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
  border: 2px dashed #5665bb;
  border-radius: 12px;
  box-sizing: border-box;
  pointer-events: none;
}
</style>
