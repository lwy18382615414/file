import { ref, computed } from 'vue'
import type { ContentType } from '@/types/type'
import { getContentId, getId } from '@/utils/typeUtils'

// 全局共享多选状态（移动端 fileExplorer + topBar + multi-select-toolbar）
const selected = ref<ContentType[]>([])
const allItems = ref<ContentType[]>([])

export function useFileSelection() {
  const getItemKey = (item: ContentType) => getContentId(item) ?? getId(item)

  const isSelected = (item: ContentType): boolean => {
    return selected.value.some((s) => getItemKey(s) === getItemKey(item))
  }

  const getSelectedCount = (): number => selected.value.length

  const getSelectedItems = (): ContentType[] => [...selected.value]

  const canSelect = (item?: ContentType): boolean => {
    // 暂时全部可选，未来可加规则：例如 recycle、share 页面只读、不可选某些类型等
    if (!item) return true
    return true
  }

  const select = (item: ContentType): void => {
    if (isSelected(item) || !canSelect(item)) return
    selected.value.push(item)
  }

  const deselect = (item: ContentType): void => {
    const index = selected.value.findIndex((s) => getItemKey(s) === getItemKey(item))
    if (index > -1) {
      selected.value.splice(index, 1)
    }
  }

  const toggle = (item: ContentType): void => {
    if (isSelected(item)) {
      deselect(item)
    } else if (canSelect(item)) {
      select(item)
    }
  }

  const setItems = (items: ContentType[]): void => {
    allItems.value = items
    // 如果已经选中的不在当前列表（页面翻页/切文件夹），自动过滤
    selected.value = selected.value.filter((item) =>
      allItems.value.some((p) => getItemKey(p) === getItemKey(item)),
    )
  }

  const selectAll = (items?: ContentType[]): void => {
    if (items && items.length) {
      selected.value = [...items]
    } else {
      selected.value = [...allItems.value]
    }
  }

  const clear = (): void => {
    selected.value = []
  }

  const selectionState = computed(() => {
    const count = getSelectedCount()
    const total = allItems.value.length
    return {
      none: count === 0,
      all: total > 0 && count === total,
      partial: count > 0 && count < total,
      count,
      total,
    }
  })

  return {
    selected,

    isSelected,
    getSelectedCount,
    getSelectedItems,

    select,
    deselect,
    toggle,
    setItems,
    selectAll,
    clear,

    canSelect,
    selectionState,
  }
}