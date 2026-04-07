import { ref, reactive, type Ref } from "vue";

export interface LoadMoreOptions<T> {
  pageSize?: number;
  fetchData: (
    page: number,
    type: number,
  ) => Promise<{ data: T[]; count: number }>;
}

export function useLoadMore<T>(opts: LoadMoreOptions<T>) {
  const files: Ref<T[]> = ref([]);

  const initState = {
    page: 1,
    pageSize: opts.pageSize || 20,
    loading: false,
    finished: false,
    folderFinished: false,
    error: false,
  };

  const state = reactive({ ...initState });

  const loadMore = async () => {
    if (state.loading || state.finished) return;
    state.loading = true;
    try {
      let data: T[];
      if (!state.folderFinished) {
        const res = await opts.fetchData(state.page, 1);
        data = res.data;
        files.value.push(...data);

        if (state.page * state.pageSize > res.count) {
          state.folderFinished = true;
          state.page = 1;
          await loadMore();
        } else {
          state.page++;
        }
      } else {
        const res = await opts.fetchData(state.page, 2);
        data = res.data;
        state.finished = state.page * state.pageSize > res.count;
        if (data.length > 0) {
          files.value.push(...data);
          state.page++;
        }
      }
    } catch (error) {
      console.error(error);
      state.error = true;
    } finally {
      state.loading = false;
    }
  };

  const reset = async () => {
    files.value = [];
    Object.assign(state, initState);
    await loadMore();
  };

  return {
    state,
    files,
    loadMore,
    reset,
  };
}
