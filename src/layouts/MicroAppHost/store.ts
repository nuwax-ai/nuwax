export interface MicroAppActivation {
  name: string;
  path: string;
  refreshToken?: string;
}

export interface MicroAppHostEntry {
  name: string;
  path: string;
  refreshToken: string;
  generation: number;
}

export interface MicroAppHostSnapshot {
  entries: readonly MicroAppHostEntry[];
  activeName: string | null;
}

/** _refresh 属于宿主重建语义，不进入子应用业务路由。 */
export function stripMicroAppRefresh(path: string): string {
  const url = new URL(path, 'http://micro-app.local');
  url.searchParams.delete('_refresh');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createMicroAppHostStore() {
  let nextGeneration = 0;
  let snapshot: MicroAppHostSnapshot = { entries: [], activeName: null };
  const listeners = new Set<() => void>();

  const publish = (next: MicroAppHostSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    activate: (input: MicroAppActivation): MicroAppHostEntry => {
      const old = snapshot.entries.find((entry) => entry.name === input.name);
      const requestedPath = stripMicroAppRefresh(input.path);
      // 从其它页面返回稳定入口时恢复最后的业务路径，保留文档/消息内部状态。
      const isBasePath = /^\/[^/?#]+\/?$/.test(requestedPath);
      const path =
        old && snapshot.activeName !== input.name && isBasePath
          ? old.path
          : requestedPath;
      const refreshToken = input.refreshToken || '';
      const shouldReload =
        !!old && old.refreshToken !== refreshToken && !!refreshToken;
      const entry: MicroAppHostEntry = {
        name: input.name,
        path,
        refreshToken,
        generation: old && !shouldReload ? old.generation : ++nextGeneration,
      };
      if (
        old &&
        snapshot.activeName === input.name &&
        old.path === entry.path &&
        old.refreshToken === entry.refreshToken &&
        old.generation === entry.generation
      ) {
        return old;
      }
      publish({
        entries: old
          ? snapshot.entries.map((item) => (item === old ? entry : item))
          : [...snapshot.entries, entry],
        activeName: input.name,
      });
      return entry;
    },
    deactivate: (name: string) => {
      if (snapshot.activeName === name) {
        publish({ ...snapshot, activeName: null });
      }
    },
    reload: (name: string) => {
      const old = snapshot.entries.find((entry) => entry.name === name);
      if (!old) return;
      publish({
        ...snapshot,
        entries: snapshot.entries.map((entry) =>
          entry === old ? { ...entry, generation: ++nextGeneration } : entry,
        ),
      });
    },
    invalidateAll: () => {
      if (!snapshot.entries.length && snapshot.activeName === null) return;
      publish({ entries: [], activeName: null });
    },
  };
}

export const microAppHostStore = createMicroAppHostStore();
