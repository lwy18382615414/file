<template>
  <!-- 文件夹头部区域 -->
  <div
    ref="itemRef"
    :class="{ 'is-active': props.selectedId === props.contentId }"
    :style="{ paddingLeft: `${28 + props.depth * 20}px` }"
    class="folder-item"
    @click="toggleExpand"
  >
    <div class="flex items-center gap-2">
      <SvgIcon name="ic_root-folder" size="18" />
      <div>{{ folderName }}</div>
    </div>
    <SvgIcon
      :style="{
        transform: `rotate(${isExpanded ? '-180deg' : '0deg'})`,
        transition: 'transform 0.3s ease',
      }"
      name="ic_arr_down_more"
      size="18"
    />
  </div>

  <!-- 子节点区域（分页加载） -->
  <div
    v-if="isExpanded"
    ref="scrollContainer"
    class="children"
    @scroll.passive="onScroll"
  >
    <!-- 新建文件夹输入框 -->
    <div
      v-if="props.showInput"
      :style="{ paddingLeft: `${28 + (props.depth + 1) * 20}px` }"
      class="folder-item folder-input"
    >
      <div class="flex-1 flex items-center gap-2">
        <SvgIcon name="ic_root-folder" size="18" />
        <el-input
          ref="inputRef"
          v-model.trim="newFolderName"
          :show-word-limit="true"
          autofocus
          class="input"
          maxlength="100"
          style="width: 240px"
          :placeholder="t('inputFolderName')"
          @keydown.enter="confirmCreate"
          @blur="handleBlur"
        />
        <SvgIcon
          name="ic_ok"
          size="30"
          color="#327EDC"
          @mousedown="confirmCreate"
        />
        <SvgIcon
          name="ic_cancel"
          size="30"
          color="#327EDC"
          @mousedown="emit('create-finish')"
        />
      </div>
    </div>

    <FolderItem
      v-for="child in localChildren"
      :key="child.contentId"
      :content-id="child.contentId"
      :depth="props.depth + 1"
      :folder-name="child.name"
      :is-personal="child.isPersonal"
      :new-folder-parent-id="props.newFolderParentId"
      :selected-id="props.selectedId"
      :show-input="child.contentId === props.newFolderParentId"
      :selected-path="props.selectedPath"
      @select="handleSelect"
      @create-finish="emit('create-finish')"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue";
import { getMySpaceContentApi } from "@/api/mySpace";
import { getShareSpace } from "@/api/shareSpace";
import { checkNameValidity, hasPermission, t } from "@/utils";
import { Permission } from "@/enum/permission";
import { createFolderApi } from "@/api/fileService";

const emit = defineEmits<{
  (e: "select", id: number, name: string): void;
  (e: "create-finish"): void;
}>();

const props = withDefaults(
  defineProps<{
    folderName: string;
    contentId: number;
    isPersonal: boolean;
    depth?: number;
    selectedId?: number | null;
    showInput?: boolean;
    newFolderParentId?: number | null;
    selectedPath?: number[];
  }>(),
  {
    depth: 0,
    selectedId: null,
    showInput: false,
    newFolderParentId: null,
    selectedPath: () => [],
  },
);

const isExpanded = ref(false);
const localChildren = ref<any[]>([]);
const scrollContainer = ref<HTMLElement | null>(null);
const itemRef = ref<HTMLElement | null>(null);

const page = ref(1);
const pageSize = 10;
const total = ref(0);
const hasMore = ref(true);
const loading = ref(false);
const newFolderName = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.showInput,
  (val) => {
    if (val) {
      newFolderName.value = "";
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  },
);

const toggleExpand = async () => {
  emit("select", props.contentId, props.folderName); // 设置当前选中项

  isExpanded.value = !isExpanded.value;

  if (isExpanded.value && localChildren.value.length === 0) {
    await loadData();
  }
};

const loadData = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  const apiFunc = props.isPersonal ? getMySpaceContentApi : getShareSpace;

  try {
    const res = await apiFunc({
      ContentId:
        props.contentId === 0 || props.contentId === -1
          ? undefined
          : props.contentId,
      ContentType: 1,
      PageIndex: page.value,
      PageSize: pageSize,
    });
    const newData = res.data.data
      .map((item) => ({
        contentId: item.contentId,
        name: item.contentName,
        isPersonal: props.isPersonal,
        permissionType: item?.permissionType ?? 0,
      }))
      .filter((f) => hasPermission(f.permissionType, Permission.Upload));
    total.value = res.data.count;
    localChildren.value.push(...newData);
    page.value += 1;
    hasMore.value = localChildren.value.length < total.value;
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const onScroll = () => {
  const el = scrollContainer.value;
  if (!el || loading.value || !hasMore.value) return;

  const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
  if (isBottom) {
    loadData();
  }
};

const confirmCreate = async (event?: MouseEvent) => {
  event?.preventDefault();
  if (!newFolderName.value) {
    ElMessage.error(t("inputFolderName"));
    return;
  }
  const { isValid, message } = checkNameValidity(newFolderName.value);
  if (!isValid) {
    ElMessage.error(message);
    inputRef.value?.focus();
    return;
  }

  const res = await createFolderApi({
    currentContentId: props.contentId,
    viewRanges: [],
    editRanges: [],
    folderName: newFolderName.value,
    isPersonal: props.isPersonal,
  });

  emit("create-finish");

  if (res.code !== 1) {
    ElMessage.error(t("errorOccurred"));
    return;
  }
  isExpanded.value = true;
  localChildren.value = [];
  page.value = 1;
  hasMore.value = true;
  await loadData();
  const newFolder = localChildren.value.find(
    (f) => f.name === newFolderName.value,
  );
  if (newFolder) {
    emit("select", newFolder.contentId, newFolder.name);
  }
  newFolderName.value = "";
};

const handleSelect = (contentId: number, folderName: string) => {
  emit("select", contentId, folderName);
};

const handleBlur = () => {
  if (!newFolderName.value) {
    emit("create-finish");
  } else {
    confirmCreate();
  }
};

watch(
  () => props.selectedPath,
  (path) => {
    if (path?.includes(props.contentId)) {
      isExpanded.value = true;
      if (localChildren.value.length === 0) {
        loadData();
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.selectedId,
  async (id) => {
    if (id === props.contentId) {
      await nextTick(); // 等待 DOM 渲染
      itemRef.value?.scrollIntoView({
        behavior: "smooth",
        block: "nearest", // 避免整个容器被滚动
      });
    }
  },
  { immediate: true },
);

watch(
  () => props.newFolderParentId,
  async (val) => {
    if (val === props.contentId && !isExpanded.value) {
      isExpanded.value = true;
      await loadData(); // 自动加载子节点
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.folder-item {
  padding: 18px 28px;
  border-bottom: 1px solid #f2f4f7;
  font-size: calc(var(--base--font--size--14) * var(--scale-factor));
  color: #2d2d2d;
  display: flex;
  align-items: center;
  cursor: pointer;
  justify-content: space-between;
}

.folder-item.is-active {
  background: #f2f4f8;
}

.children {
  max-height: 275px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
