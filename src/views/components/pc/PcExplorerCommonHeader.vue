<template>
  <section class="pc-explorer-header common-header">
    <div class="title-block">
      <h2 class="title">{{ title }}</h2>
      <button
        v-if="showSharedSpaceSetting"
        class="shared-space-setting-button"
        type="button"
        @click="handleOpenSharedSpaceSetting"
      >
        <SvgIcon name="common-group" size="22" />
        <span>
          {{ currentFolderPermissionCount }}
        </span>
      </button>
    </div>

    <div class="breadcrumb-wrapper">
      <div class="compact-actions">
        <button
          class="nav-button"
          :class="{ disabled: !canGoBack }"
          :disabled="!canGoBack"
          type="button"
          @click="handleBack"
        >
          <SvgIcon name="action-pre_page" size="12" />
        </button>
        <button
          class="nav-button"
          :class="{ disabled: !canGoForward }"
          :disabled="!canGoForward"
          type="button"
          @click="handleForward"
        >
          <SvgIcon name="action-next_page" size="12" />
        </button>
      </div>

      <Breadcrumb />
    </div>
    <div class="actions-wrapper">
      <div class="file-actions">
        <button
          v-if="!isSearchPage"
          class="action-button primary"
          :class="{ disabled: !props.canCreate }"
          :disabled="!props.canCreate"
          type="button"
          @click="handleCreate"
        >
          <SvgIcon name="action-new" size="12" />
          <span>{{ t("new") }}</span>
        </button>
        <button
          v-if="!isSearchPage"
          class="action-button"
          :class="{ disabled: !props.canUpload }"
          :disabled="!props.canUpload"
          type="button"
          @click="handleUpload"
        >
          <SvgIcon name="action-upload" size="12" />
          <span>{{ t("upload") }}</span>
        </button>
        <button
          class="action-button"
          :class="{ disabled: !props.canDownload }"
          :disabled="!props.canDownload"
          type="button"
          @click="handleDownload"
        >
          <SvgIcon name="action-download" size="12" />
          <span>{{ t("download") }}</span>
        </button>
        <div class="share-action" :class="{ disabled: !props.canShare }">
          <button
            class="action-button"
            :class="{ disabled: !props.canShare }"
            :disabled="!props.canShare"
            type="button"
          >
            <SvgIcon name="action-share" size="12" />
            <span>{{ t("share") }}</span>
          </button>
          <div class="share-dropdown">
            <button
              class="share-dropdown-item"
              :disabled="!props.canShare"
              type="button"
              @click="handleShare"
            >
              {{ t("shareToFriend") }}
            </button>
            <button
              class="share-dropdown-item"
              :disabled="!props.canShare"
              type="button"
              @click="handleCopyLink"
            >
              {{ t("copyLink") }}
            </button>
          </div>
        </div>
        <button
          v-if="pageType !== ExplorerPageType.RECENT"
          class="action-button"
          :class="{ disabled: !props.canMove }"
          :disabled="!props.canMove"
          type="button"
          @click="handleMove"
        >
          <span>{{ t("move") }}</span>
        </button>
        <button
          class="action-button danger"
          :class="{ disabled: !props.canDelete }"
          :disabled="!props.canDelete"
          type="button"
          @click="handleDelete"
        >
          <SvgIcon name="action-delete" size="12" />
          <span>{{ t("delete") }}</span>
        </button>
      </div>
      <div class="mode-actions">
        <button
          class="mode-button"
          :class="{ active: currentViewMode === LayoutMode.LIST }"
          type="button"
          :aria-pressed="currentViewMode === LayoutMode.LIST"
          @click="handleToggleView(LayoutMode.LIST)"
        >
          <SvgIcon name="action-list" size="18" />
        </button>
        <button
          class="mode-button"
          :class="{ active: currentViewMode === LayoutMode.GRID }"
          type="button"
          :aria-pressed="currentViewMode === LayoutMode.GRID"
          @click="handleToggleView(LayoutMode.GRID)"
        >
          <SvgIcon name="action-grid" size="18" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { SvgIcon } from "@/components";
import Breadcrumb from "@/layout/Breadcrumb.vue";
import { LayoutMode } from "@/enum/baseEnum";
import {
  ExplorerPageType,
  getExplorerContext,
  type ExplorerContext,
  type ExplorerQueryState,
} from "@/views/fileExplorer";

const props = defineProps<{
  pageType: ExplorerPageType;
  context: ExplorerContext;
  query: ExplorerQueryState;
  total: number;
  currentViewMode: LayoutMode;
  supportSort: boolean;
  canCreate: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canShare: boolean;
  canMove: boolean;
  canDelete: boolean;
  hasSelection: boolean;
  currentFolderPermissionCount: number | null;
}>();

const isSearchPage = computed(() => props.pageType === ExplorerPageType.SEARCH);

const emit = defineEmits<{
  (e: "create"): void;
  (e: "upload"): void;
  (e: "download"): void;
  (e: "share"): void;
  (e: "move"): void;
  (e: "copyLink"): void;
  (e: "delete"): void;
  (e: "openSharedSpaceSetting"): void;
  (e: "sort"): void;
  (e: "toggleView"): void;
}>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const canGoBack = ref(false);
const canGoForward = ref(false);

const titleMap: Record<ExplorerPageType, string> = {
  [ExplorerPageType.RECENT]: t("recentView"),
  [ExplorerPageType.MY]: t("myFiles"),
  [ExplorerPageType.SHARED]: t("shared"),
  [ExplorerPageType.MY_SHARES]: t("myShares"),
  [ExplorerPageType.RECYCLE]: t("recycleBin"),
  [ExplorerPageType.SEARCH]: t("searchResult"),
};

const title = computed(() => {
  const ctx = getExplorerContext(route);
  const folderNames = ctx.folderNames || [];
  if (folderNames.length > 0) {
    return folderNames[folderNames.length - 1];
  }
  return titleMap[props.pageType] || "";
});
const showSharedSpaceSetting = computed(
  () => props.pageType === ExplorerPageType.SHARED && !props.context.isRoot,
);

const syncHistoryState = () => {
  const ctx = getExplorerContext(route);
  const folderNames = ctx.folderNames || [];

  const state = window.history.state as {
    back?: string | null;
    forward?: string | null;
  } | null;
  canGoBack.value =
    ctx.pageType === ExplorerPageType.SHARED
      ? folderNames.length > 1
      : folderNames.length > 0;
  canGoForward.value = !!state?.forward;
};

const handleBack = () => {
  if (!canGoBack.value) return;
  router.back();
};

const handleForward = () => {
  if (!canGoForward.value) return;
  router.forward();
};

const handleCreate = () => {
  if (!props.canCreate) return;
  emit("create");
};

const handleUpload = () => {
  if (!props.canUpload) return;
  emit("upload");
};

const handleDownload = () => {
  if (!props.canDownload) return;
  emit("download");
};

const handleShare = () => {
  if (!props.canShare) return;
  emit("share");
};

const handleCopyLink = () => {
  if (!props.canShare) return;
  emit("copyLink");
};

const handleMove = () => {
  if (!props.canMove) return;
  emit("move");
};

const handleDelete = () => {
  if (!props.canDelete) return;
  emit("delete");
};

const handleOpenSharedSpaceSetting = () => {
  emit("openSharedSpaceSetting");
};

const handleToggleView = (mode: LayoutMode) => {
  if (props.currentViewMode === mode) return;
  emit("toggleView");
};

onMounted(syncHistoryState);
watch(() => route.fullPath, syncHistoryState, { immediate: true });
</script>

<style scoped lang="scss">
.pc-explorer-header {
  display: flex;
  flex-direction: column;
  padding: 24px 12px 16px;
  gap: 12px;
}

.title-block {
  min-width: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  .shared-space-setting-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 0;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background: #e2e8f0;
      color: var(--theme-color);
    }
  }
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 32px;
}

.breadcrumb-wrapper {
  display: flex;
  align-items: center;

  .compact-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
  }

  .nav-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #707681;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      background: #e5e7eb;
      color: #1f2937;
    }

    &.disabled {
      color: #cbd5e1;
      cursor: not-allowed;

      &:hover {
        background: transparent;
        color: #cbd5e1;
      }
    }
  }

  :deep(.breadcrumb) {
    height: 28px;
    margin-left: 0;
    padding-left: 0;
    color: #707681;
  }
}

.actions-wrapper {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .file-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 12px;
      height: 32px;
      gap: 4px;
      border: 0;
      border-radius: 6px;
      background: var(--content-bg-color);
      color: var(--theme-color);
      font-size: 14px;
      cursor: pointer;
      border: 1px solid #e2e8f0;

      &.primary {
        background: var(--btn-primary-color);
        color: var(--btn-primary-text-color);
        border: none;
      }

      &.danger {
        color: #dd262f;
        background: var(--btn-default-bg);
        border: 1px solid #dd262f;
      }
    }

    .share-action {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 8px;
      }

      &:hover .share-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, 0);
        pointer-events: auto;
      }
    }

    .share-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      opacity: 0;
      visibility: hidden;
      transform: translate(-50%, -4px);
      pointer-events: none;
      transition:
        opacity 0.18s ease,
        transform 0.18s ease,
        visibility 0.18s ease;
    }

    .share-action:hover .share-dropdown,
    .share-dropdown:hover {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0);
      pointer-events: auto;
    }

    .share-dropdown-item {
      padding: 6px 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #1f2937;
      font-size: 14px;
      white-space: nowrap;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: var(--content-bg-color);
      }

      &:disabled {
        color: #cbd5e1;
        cursor: not-allowed;
      }
    }

    .action-button.disabled,
    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .share-action.disabled {
      pointer-events: none;

      .action-button {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .mode-actions {
    display: inline-flex;
    align-items: center;
    padding: 3px;
    border-radius: 8px;
    background: var(--content-bg-color);
    border: 1px solid #e5e7eb;
    gap: 4px;

    .mode-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #707681;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        color: var(--theme-color);
      }

      &.active {
        background: var(--btn-default-bg);
        color: var(--theme-color);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }
    }
  }
}
</style>
