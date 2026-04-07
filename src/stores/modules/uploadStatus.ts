import { defineStore } from "pinia";
import { ref } from "vue";

export const useUploadStatus = defineStore("upload-status", () => {
  const uploadStatus = ref(false);
  const addFolder = ref(false);

  const updateUploadStatus = (status: boolean) => {
    uploadStatus.value = status;
  };

  const updateAddFolder = (status: boolean) => {
    addFolder.value = status;
  };

  return {
    uploadStatus,
    addFolder,
    updateUploadStatus,
    updateAddFolder,
  };
});
