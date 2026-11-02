import { describe, expect, it, vi } from 'vitest';
import type {
  HostThemesBridge,
  HostThemesState,
} from '../../types/interfaces/hostBridge';
import { officialThemePackage, resolveThemePackage } from './core';
import { createThemeRuntime } from './runtime';
vi.mock('../../utils/hostBridge', () => ({
  getThemesBridge: async () => null,
}));
const state = (revision: number): HostThemesState => ({
  revision,
  selection: { themeId: officialThemePackage.manifest.id, mode: 'light' },
  snapshot: resolveThemePackage(officialThemePackage, 'light', false, revision),
  themes: [],
});
describe('theme runtime', () => {
  it('allows restoring the default while a linked theme reports an error', async () => {
    const broken = { ...state(2), error: 'Invalid local CSS' };
    const bridge = {
      onChanged: () => () => undefined,
      getState: async () => broken,
      select: vi.fn(async () => ({ ok: true, state: state(3) })),
    } as unknown as HostThemesBridge;
    const runtime = createThemeRuntime({ getBridge: async () => bridge });
    await runtime.initialize();
    expect((await runtime.select('nuwax-default', 'light')).ok).toBe(true);
    expect(runtime.getState().error).toBeUndefined();
    runtime.dispose();
  });
  it('subscribes before loading and rejects stale snapshots', async () => {
    let callback: (value: HostThemesState) => void = () => undefined;
    const bridge = {
      onChanged: vi.fn((listener) => {
        callback = listener;
        return vi.fn();
      }),
      getState: vi.fn(async () => {
        callback(state(5));
        return state(2);
      }),
    } as unknown as HostThemesBridge;
    const runtime = createThemeRuntime({ getBridge: async () => bridge });
    expect(runtime.getState().snapshot.mode).toBe('light');
    await runtime.initialize();
    expect(runtime.getState().revision).toBe(5);
    callback(state(4));
    callback(state(5));
    expect(runtime.getState().revision).toBe(5);
    runtime.dispose();
  });
  it('accepts an event when the preload suppresses a stale initial read', async () => {
    const bridge = {
      onChanged: (listener: (state: HostThemesState) => void) => {
        listener(state(5));
        return () => undefined;
      },
      getState: async () => null,
    } as unknown as HostThemesBridge;
    const runtime = createThemeRuntime({ getBridge: async () => bridge });
    await runtime.initialize();
    expect(runtime.getState().revision).toBe(5);
    expect(runtime.getState().error).toBeUndefined();
    runtime.dispose();
  });
  it('reports desktop initialization failures without browser fallback or unhandled rejection', async () => {
    const createRepository = vi.fn();
    const runtime = createThemeRuntime({
      getBridge: async () => {
        throw new Error('desktop disk failure');
      },
      createRepository,
    });
    await expect(runtime.initialize()).resolves.toBeUndefined();
    expect(runtime.getState().error).toContain('disk failure');
    expect((await runtime.install({})).ok).toBe(false);
    expect(createRepository).not.toHaveBeenCalled();
    runtime.dispose();
  });
  it('recovery uses official snapshot while preserving selected source', async () => {
    const custom = state(2);
    custom.selection.themeId = 'custom';
    custom.snapshot = {
      ...custom.snapshot,
      themeId: 'custom',
      css: { web: 'custom css', shell: '', message: '', repo: '' },
    };
    const bridge = {
      onChanged: () => () => undefined,
      getState: async () => custom,
    } as unknown as HostThemesBridge;
    const runtime = createThemeRuntime({
      getBridge: async () => bridge,
      recovery: () => true,
    });
    await runtime.initialize();
    expect(runtime.getState().selection.themeId).toBe('custom');
    expect(runtime.getState().snapshot.themeId).toBe(
      officialThemePackage.manifest.id,
    );
    expect(runtime.getState().snapshot.css.web).not.toContain('custom css');
    runtime.dispose();
  });
});

it('advances the initial public revision when a host starts at zero', async () => {
  const runtime = createThemeRuntime({
    getBridge: async () =>
      ({
        onChanged: () => () => undefined,
        getState: async () => state(0),
      } as unknown as HostThemesBridge),
  });
  const initial = runtime.getState().revision;
  await runtime.initialize();
  expect(runtime.getState().revision).toBeGreaterThan(initial);
  expect(runtime.getState().snapshot.revision).toBe(
    runtime.getState().revision,
  );
  runtime.dispose();
});
