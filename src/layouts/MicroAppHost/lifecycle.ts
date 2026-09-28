export interface MicroAppHandle {
  mountPromise: Promise<unknown>;
  update?: (props: Record<string, unknown>) => Promise<unknown>;
  unmount: () => Promise<unknown>;
}

/** 同名应用先完整卸载再重挂，覆盖显式刷新和 React StrictMode 的异步竞态。 */
export function createMicroAppLifecycleQueue() {
  const queues = new Map<string, Promise<void>>();

  return {
    acquire(
      name: string,
      load: () => Promise<MicroAppHandle>,
      onCleanupError: (error: unknown) => void = console.error,
    ) {
      const previous = queues.get(name) || Promise.resolve();
      let disposed = false;
      let handle: MicroAppHandle | null = null;
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      const ready = previous.then(async () => {
        if (disposed) return null;
        handle = await load();
        await handle.mountPromise;
        return disposed ? null : handle;
      });
      let updateTail: Promise<unknown> = ready;
      const finished = released.then(async () => {
        // 加载拒绝也可能已经创建 qiankun 实例，仍需尝试释放。
        await ready.catch(() => undefined);
        await updateTail.catch(() => undefined);
        if (handle) {
          try {
            await handle.unmount();
          } catch (error) {
            onCleanupError(error);
          }
        }
      });
      queues.set(name, finished);
      void finished.then(() => {
        if (queues.get(name) === finished) queues.delete(name);
      });

      return {
        ready,
        isDisposed: () => disposed,
        update(props: Record<string, unknown>) {
          const update = updateTail
            .catch(() => undefined)
            .then(async () => {
              const mounted = await ready;
              if (!disposed && mounted?.update) return mounted.update(props);
            });
          updateTail = update;
          return update;
        },
        dispose() {
          if (disposed) return;
          disposed = true;
          release();
        },
      };
    },
  };
}

export const microAppLifecycleQueue = createMicroAppLifecycleQueue();
