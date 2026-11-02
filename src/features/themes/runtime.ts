import type {
  HostThemePreference,
  HostThemeResult,
  HostThemesBridge,
  HostThemesState,
} from '../../types/interfaces/hostBridge';
import { getThemesBridge } from '../../utils/hostBridge';
import {
  officialThemePackage,
  resolveThemePackage,
  type ThemeFiles,
} from './core';
import {
  createBrowserThemeRepository,
  type BrowserThemeRepository,
} from './repository';

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function createThemeRuntime(
  options: {
    getBridge?: () => Promise<HostThemesBridge | null>;
    createRepository?: () => BrowserThemeRepository;
    recovery?: () => boolean;
  } = {},
) {
  const official = officialThemePackage;
  let state: HostThemesState = {
    revision: 0,
    selection: { themeId: official.manifest.id, mode: 'light' },
    snapshot: resolveThemePackage(official, 'light', false, 0),
    themes: [
      {
        id: official.manifest.id,
        name: official.manifest.name,
        version: official.manifest.version,
        source: 'builtin',
        modes: ['light', 'dark'],
      },
    ],
  };
  let bridge: HostThemesBridge | null = null,
    repository: BrowserThemeRepository | undefined;
  let pending: Promise<void> | undefined, unsubscribe: (() => void) | undefined;
  let acceptedRevision = -1,
    disposed = false;
  const listeners = new Set<() => void>();
  const emit = () => {
    if (!disposed)
      for (const listener of listeners) {
        try {
          listener();
        } catch {
          /* Isolate subscribers. */
        }
      }
  };
  const recovery =
    options.recovery ??
    (() =>
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).get('theme') === 'default');
  const accept = (next: HostThemesState) => {
    if (
      disposed ||
      !Number.isSafeInteger(next.revision) ||
      next.revision <= acceptedRevision ||
      next.snapshot.revision !== next.revision
    )
      return;
    acceptedRevision = next.revision;
    // Keep the public stream monotonic even if a host starts its persisted stream at zero.
    const revision = Math.max(state.revision + 1, next.revision);
    const normalized = {
      ...next,
      revision,
      snapshot: { ...next.snapshot, revision },
    };
    state = recovery()
      ? {
          ...normalized,
          recovery: true,
          snapshot: resolveThemePackage(
            official,
            next.snapshot.mode,
            next.snapshot.mode === 'dark',
            normalized.revision,
          ),
        }
      : normalized;
    emit();
  };
  const initialize = (): Promise<void> =>
    (pending ??= (async () => {
      try {
        bridge = await (options.getBridge ?? getThemesBridge)();
        if (disposed) return;
        if (bridge) {
          // Events can arrive while getState is pending; revision checks preserve the newest.
          unsubscribe = bridge.onChanged(accept);
          const initial = await bridge.getState();
          if (initial) accept(initial);
          else if (acceptedRevision < 0)
            throw new Error('Desktop theme state unavailable');
        } else {
          repository = (
            options.createRepository ?? createBrowserThemeRepository
          )();
          unsubscribe = repository.subscribe(() =>
            accept(repository!.getState()),
          );
          await repository.initialize();
          accept(repository.getState());
        }
      } catch (error) {
        state = { ...state, error: errorText(error) };
        emit();
      }
    })());
  const action = async (
    name: 'select' | 'install' | 'remove' | 'linkDirectory' | 'openDirectory',
    args: unknown[],
  ): Promise<HostThemeResult> => {
    await initialize();
    try {
      let result: HostThemeResult;
      if (bridge) {
        const method = bridge[name] as (
          ...parameters: unknown[]
        ) => Promise<HostThemeResult>;
        result = await method.apply(bridge, args);
      } else if (
        repository &&
        (name === 'select' || name === 'install' || name === 'remove')
      ) {
        const method = repository[name] as (
          ...parameters: unknown[]
        ) => Promise<HostThemeResult>;
        result = await method.apply(repository, args);
      } else
        return {
          ok: false,
          error: 'Theme directories require the desktop host',
        };
      if (result.state) accept(result.state);
      return result.state ? { ...result, state } : result;
    } catch (error) {
      return { ok: false, error: errorText(error) };
    }
  };
  return {
    initialize,
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    select: (id: string, mode: HostThemePreference, onlyIfUnselected = false) =>
      action('select', [id, mode, onlyIfUnselected]),
    install: (files: ThemeFiles, replace?: boolean) =>
      action('install', [files, replace]),
    remove: (id: string) => action('remove', [id]),
    linkDirectory: () => action('linkDirectory', []),
    openDirectory: (id: string) => action('openDirectory', [id]),
    async exportPackage(
      id: string,
    ): Promise<{ files?: ThemeFiles; error?: string }> {
      await initialize();
      try {
        return bridge
          ? await bridge.exportPackage(id)
          : repository
          ? await repository.exportPackage(id)
          : { error: 'Theme storage unavailable' };
      } catch (error) {
        return { error: errorText(error) };
      }
    },
    dispose() {
      disposed = true;
      unsubscribe?.();
      repository?.dispose();
      listeners.clear();
    },
  };
}
export const themeRuntime = createThemeRuntime();
