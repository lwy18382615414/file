<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    :before-close="handleClose"
    destroy-on-close
    style="
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
      background: #f2f4f8;
      box-shadow: 0 3px 6px 1px rgba(95, 95, 95, 0.4);
    "
    width="460"
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <span>{{ t('rename') }}</span>
        <SvgIcon name="ic_close" @click="handleClose" />
      </div>
    </template>
    <!-- 内容 -->
    <div class="dialog-content">
      <div v-if="!showErrorTip" class="folder-create">
        <div class="form-label">{{ isFolder ? "文件夹名" : "文件名" }}：</div>
        <el-input
          ref="inputRef"
          v-model="fileOrFolderName"
          :placeholder="placeholder"
          maxlength="100"
          clearable
          show-word-limit
          style="width: 300px"
        />
      </div>
      <div v-else class="error-tip">
        <SvgIcon name="ic_err_file" size="54" />
        <span class="text">{{ errorTip }}</span>
      </div>
    </div>

    <!-- 按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">{{
          t("cancel")
        }}</el-button>
        <el-button class="confirm-btn" @click="handleRename">{{
          t("Ok")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, type PropType, ref, watch, nextTick } from "vue";
import type { ElInput } from "element-plus";
import { renameFileApi } from "@/api/fileService.ts";
import { t } from "@/utils";
import { autoSelectFileName } from "@/utils/fileRename";

const props = defineProps({
  visible: Boolean,
  name: {
    type: String as PropType<string>,
    default: () => "",
  },
  currentContentId: Number,
  isFolder: {
    type: Boolean as PropType<boolean>,
    default: () => true,
  },
});

const emits = defineEmits(["close", "refresh"]);

const fileOrFolderName = ref("");
const inputRef = ref<InstanceType<typeof ElInput> | null>(null);
const showErrorTip = ref(false);
const errorTip = ref("");

const placeholder = computed(() =>
  props.isFolder ? t("inputNewFolderName") : t("inputNewFileName"),
);

const handleClose = () => {
  showErrorTip.value = false;
  errorTip.value = "";
  emits("close");
};

const handleRename = async () => {
  if (showErrorTip.value) {
    showErrorTip.value = false;
    errorTip.value = "";
    return;
  }
  if (fileOrFolderName.value.trim() === "") {
    showErrorTip.value = true;
    errorTip.value = t("folderNameRequired");
    return;
  }
  const res = await renameFileApi(
    props.currentContentId,
    fileOrFolderName.value,
  );
  if (res.code === 1) {
    ElMessage.success(t("renameSuccess"));
    handleClose();
    emits("refresh");
  } else if (res.code === 701) {
    showErrorTip.value = true;
    errorTip.value = t("duplicateFolderName");
  }
};

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      fileOrFolderName.value = props.name || "";
      await nextTick();
      console.log(inputRef.value);
      if (inputRef.value) {
        inputRef.value.focus();
        autoSelectFileName({
          inputRef: inputRef.value,
          fileName: fileOrFolderName.value,
          isFolder: props.isFolder ?? false,
        });
      }
    }
  },
);
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: #2d2d2d;
  font-size: calc(var(--base--font--size--16) * var(--scale-factor));
  border-bottom: 1px solid #e3e6ec80;
  font-weight: bold;
  overflow: hidden;
  font-family:
    Microsoft YaHei,
    Microsoft YaHei;
}

.dialog-content {
  padding: 8px 30px 24px;
  border-bottom: 1px solid #e3e6ec80;

  .folder-create {
    display: flex;
    align-items: center;
  }

  .file-encryption {
    display: flex;
    align-items: center;
    margin: 12px 0;
  }

  .error-tip {
    width: 400px;
    border-radius: 6px;
    display: flex;
    gap: 6px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.dialog-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    width: 80px;
    border-radius: 4px;
  }

  .cancel-btn {
    border: 1px solid #327edc;
    background: #f2f4f8;
    color: #327edc;
  }
  .confirm-btn {
    background: #327edc;
    color: #fff;
  }
}
</style>
