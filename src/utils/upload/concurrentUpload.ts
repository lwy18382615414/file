type UploadResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: any };

export function createUploadPoolWithRetry<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 3,
  maxRetries: number = 2,
): Promise<UploadResult<T>[]> {
  return new Promise((resolve) => {
    const results: UploadResult<T>[] = [];
    let currentIndex = 0;
    let activeCount = 0;

    const retryTask = async (
      task: () => Promise<T>,
      retriesLeft: number,
    ): Promise<T> => {
      return task().catch((err) => {
        if (retriesLeft > 0) {
          console.warn("任务失败，重试中...", err);
          return retryTask(task, retriesLeft - 1);
        }
        throw err;
      });
    };

    const next = () => {
      if (currentIndex >= tasks.length && activeCount === 0) {
        resolve(results);
        return;
      }

      while (activeCount < limit && currentIndex < tasks.length) {
        const taskIndex = currentIndex++;
        const task = tasks[taskIndex];

        activeCount++;
        retryTask(task, maxRetries)
          .then((res) => {
            results[taskIndex] = { status: "fulfilled", value: res };
          })
          .catch((err) => {
            results[taskIndex] = { status: "rejected", reason: err };
            console.error(`任务 ${taskIndex} 最终失败：`, err);
          })
          .finally(() => {
            activeCount--;
            next();
          });
      }
    };

    next();
  });
}
