import type {
  HostThemeInfo,
  HostThemeResult,
  HostThemesState,
} from '../../types/interfaces/hostBridge';
import {
  assertInstallableThemeId,
  deepSeekThemePackage,
  officialThemePackage,
  resolveThemePackage,
  validateThemePackage,
  type ThemeFiles,
  type ThemePackage,
  type ThemePreference,
} from './core';

export interface StoredThemes {
  revision: number;
  selection: { themeId: string; mode: ThemePreference };
  packages: Record<string, ThemeFiles>;
  userSelected?: boolean;
}
/** update must read and write atomically and resolve only after durable commit. */
export interface ThemePersistence {
  read(): Promise<StoredThemes | undefined>;
  update(
    change: (previous: StoredThemes | undefined) => StoredThemes,
  ): Promise<StoredThemes>;
  close?(): void;
}
const builtin = [officialThemePackage, deepSeekThemePackage];
const officialId = officialThemePackage.manifest.id;
const empty = (): StoredThemes => ({
  revision: 0,
  selection: { themeId: officialId, mode: 'light' },
  packages: {},
});
const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function createIndexedDBPersistence(): ThemePersistence {
  let pending: Promise<IDBDatabase> | undefined;
  const open = () =>
    (pending ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('nuwax-web-themes', 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('registry');
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () =>
        reject(request.error ?? new Error('Cannot open theme database'));
      request.onblocked = () =>
        reject(new Error('Theme database upgrade is blocked'));
    }));
  const run = async (
    change?: (previous: StoredThemes | undefined) => StoredThemes,
  ) => {
    const db = await open();
    return new Promise<StoredThemes | undefined>((resolve, reject) => {
      const transaction = db.transaction(
        'registry',
        change ? 'readwrite' : 'readonly',
      );
      const store = transaction.objectStore('registry');
      let value: StoredThemes | undefined, failure: unknown;
      const request = store.get('state');
      request.onsuccess = () => {
        try {
          value = change ? change(request.result) : request.result;
          if (change) store.put(value, 'state');
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = transaction.onerror = () =>
        reject(
          failure ?? transaction.error ?? new Error('Theme transaction failed'),
        );
    });
  };
  return {
    read: () => run(),
    update: async (change) => (await run(change))!,
    close: () => {
      void pending?.then(
        (db) => db.close(),
        () => undefined,
      );
    },
  };
}

function packagesOf(data: StoredThemes): ThemePackage[] {
  if (
    !Number.isSafeInteger(data.revision) ||
    data.revision < 0 ||
    !data.packages ||
    !data.selection ||
    !['light', 'dark', 'system'].includes(data.selection.mode)
  )
    throw new Error('Invalid persisted theme registry');
  const packages = [...builtin];
  for (const [id, files] of Object.entries(data.packages)) {
    const pkg = validateThemePackage(files);
    assertInstallableThemeId(pkg.manifest.id);
    if (id !== pkg.manifest.id || packages.some((p) => p.manifest.id === id))
      throw new Error('Invalid persisted theme identity');
    packages.push(pkg);
  }
  return packages;
}

class ThemeConflictError extends Error {}

export function createBrowserThemeRepository(
  options: {
    persistence?: ThemePersistence;
    media?: Pick<
      MediaQueryList,
      'matches' | 'addEventListener' | 'removeEventListener'
    >;
    channel?: Pick<
      BroadcastChannel,
      'postMessage' | 'addEventListener' | 'removeEventListener' | 'close'
    > | null;
  } = {},
) {
  const persistence = options.persistence ?? createIndexedDBPersistence();
  const media =
    options.media ??
    (typeof matchMedia === 'function'
      ? matchMedia('(prefers-color-scheme: dark)')
      : undefined);
  const channel =
    options.channel !== undefined
      ? options.channel
      : typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('nuwax-web-themes')
      : undefined;
  const listeners = new Set<() => void>();
  function stateOf(data: StoredThemes, revision: number): HostThemesState {
    const packages = packagesOf(data);
    const selected =
      packages.find((p) => p.manifest.id === data.selection.themeId) ??
      officialThemePackage;
    const selection = { ...data.selection, themeId: selected.manifest.id };
    const modes = Object.keys(selected.manifest.variants);
    if (modes.length === 1) selection.mode = modes[0] as ThemePreference;
    return {
      revision,
      selection,
      hasUserSelection: data.userSelected === true,
      snapshot: resolveThemePackage(
        selected,
        selection.mode,
        !!media?.matches,
        revision,
      ),
      themes: packages.map(
        (pkg): HostThemeInfo => ({
          id: pkg.manifest.id,
          name: pkg.manifest.name,
          version: pkg.manifest.version,
          description: pkg.manifest.description,
          modes: Object.keys(pkg.manifest.variants) as HostThemeInfo['modes'],
          source: builtin.some((p) => p.manifest.id === pkg.manifest.id)
            ? 'builtin'
            : 'installed',
        }),
      ),
    };
  }
  let currentData = empty();
  let state = stateOf(currentData, 0),
    initialized: Promise<void> | undefined,
    tail: Promise<unknown> = Promise.resolve(),
    disposed = false;
  const emit = () => {
    if (!disposed)
      for (const listener of listeners) {
        try {
          listener();
        } catch {
          /* Subscriber failures do not roll back commits. */
        }
      }
  };
  const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
    const result = tail.then(work);
    tail = result.catch(() => undefined);
    return result;
  };
  const publish = (data: StoredThemes) => {
    currentData = data;
    state = stateOf(data, Math.max(data.revision, state.revision + 1));
    emit();
  };
  const initialize = () =>
    (initialized ??= enqueue(async () => {
      const data = await persistence.read();
      publish(data ?? empty());
    }));
  const mutate = async (
    change: (data: StoredThemes) => void,
  ): Promise<HostThemeResult> => {
    try {
      await initialize();
      return await enqueue(async () => {
        if (disposed) throw new Error('Theme repository disposed');
        let nextState: HostThemesState | undefined;
        const data = await persistence.update((previous) => {
          const data = structuredClone(previous ?? empty());
          packagesOf(data);
          change(data);
          data.revision = Math.max(data.revision, state.revision) + 1;
          nextState = stateOf(data, data.revision);
          data.selection = nextState.selection;
          return data;
        });
        currentData = data;
        state = nextState!;
        emit();
        try {
          channel?.postMessage({ revision: data.revision });
        } catch {
          /* Committed data remains authoritative. */
        }
        return { ok: true, state };
      });
    } catch (error) {
      return {
        ok: false,
        error: message(error),
        conflict: error instanceof ThemeConflictError || undefined,
      };
    }
  };
  const invalidate = () => {
    void initialize()
      .then(() =>
        enqueue(async () => {
          const data = await persistence.read();
          if (data) publish(data);
        }),
      )
      .catch((error) => {
        const revision = state.revision + 1;
        state = {
          ...state,
          revision,
          snapshot: { ...state.snapshot, revision },
          error: message(error),
        };
        emit();
      });
  };
  const systemChanged = () => {
    // System appearance is transient. A full disk must not prevent dark mode,
    // and every tab receives its own media event without a persisted broadcast.
    void initialize()
      .then(() =>
        enqueue(async () => {
          if (disposed || state.selection.mode !== 'system') return;
          const error = state.error;
          publish(currentData);
          if (error) state = { ...state, error };
        }),
      )
      .catch(() => undefined);
  };
  channel?.addEventListener('message', invalidate);
  media?.addEventListener('change', systemChanged);
  return {
    initialize,
    getState: () => state,
    state: () => state,
    list: () => state.themes,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    install(files: ThemeFiles, replace = false) {
      // Validation occurs inside the serialized transaction and before committing.
      return mutate((data) => {
        const pkg = validateThemePackage(files);
        assertInstallableThemeId(pkg.manifest.id);
        if (
          Object.prototype.hasOwnProperty.call(
            data.packages,
            pkg.manifest.id,
          ) &&
          !replace
        )
          throw new ThemeConflictError('Theme already installed');
        Object.defineProperty(data.packages, pkg.manifest.id, {
          value: pkg.files,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      });
    },
    select(id: string, mode: ThemePreference, onlyIfUnselected = false) {
      return mutate((data) => {
        if (onlyIfUnselected && data.userSelected)
          throw new ThemeConflictError('Theme already selected');
        if (!['light', 'dark', 'system'].includes(mode))
          throw new Error('Invalid theme mode');
        if (!packagesOf(data).some((p) => p.manifest.id === id))
          throw new Error('Theme not found');
        data.selection = { themeId: id, mode };
        data.userSelected = true;
      });
    },
    remove(id: string) {
      return mutate((data) => {
        if (builtin.some((p) => p.manifest.id === id))
          throw new Error('Cannot remove builtin theme');
        if (!Object.prototype.hasOwnProperty.call(data.packages, id))
          throw new Error('Theme not found');
        delete data.packages[id];
        if (data.selection.themeId === id) data.selection.themeId = officialId;
      });
    },
    async exportPackage(
      id: string,
    ): Promise<{ files?: ThemeFiles; error?: string }> {
      try {
        await initialize();
        await tail;
        const packages = packagesOf((await persistence.read()) ?? empty());
        const pkg = packages.find((p) => p.manifest.id === id);
        if (!pkg) throw new Error('Theme not found');
        return {
          files: structuredClone(validateThemePackage(pkg.files).files),
        };
      } catch (error) {
        return { error: message(error) };
      }
    },
    dispose() {
      disposed = true;
      channel?.removeEventListener('message', invalidate);
      channel?.close();
      media?.removeEventListener('change', systemChanged);
      listeners.clear();
      persistence.close?.();
    },
  };
}
export type BrowserThemeRepository = ReturnType<
  typeof createBrowserThemeRepository
>;
