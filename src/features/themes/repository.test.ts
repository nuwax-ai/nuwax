import { describe, expect, it } from 'vitest';
import { encodeThemeText, officialThemePackage, type ThemeFiles } from './core';
import {
  createBrowserThemeRepository,
  type StoredThemes,
  type ThemePersistence,
} from './repository';

export function externalFiles(): ThemeFiles {
  const files = { ...officialThemePackage.files };
  const manifest = JSON.parse(atob(files['theme.json']));
  manifest.id = 'test-custom';
  manifest.name = 'Test';
  delete manifest.variants.dark;
  files['theme.json'] = encodeThemeText(JSON.stringify(manifest));
  return files;
}
function fixture() {
  let data: StoredThemes | undefined,
    fail = false;
  const persistence: ThemePersistence = {
    read: async () => structuredClone(data),
    update: async (change) => {
      const next = change(structuredClone(data));
      if (fail) throw new Error('commit failed');
      data = structuredClone(next);
      return next;
    },
  };
  let dark = false;
  const changes = new Set<() => void>();
  const repo = createBrowserThemeRepository({
    persistence,
    channel: null,
    media: {
      get matches() {
        return dark;
      },
      addEventListener: (
        _: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        changes.add(listener as () => void);
      },
      removeEventListener: (
        _: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        changes.delete(listener as () => void);
      },
    },
  });
  return {
    repo,
    fail: () => {
      fail = true;
    },
    dark: () => {
      dark = true;
      for (const cb of changes) cb();
    },
    persistence,
  };
}
describe('browser registry commit semantics', () => {
  it('keeps prior visible and durable state after a failed commit', async () => {
    const f = fixture();
    await f.repo.initialize();
    const previous = f.repo.getState();
    f.fail();
    const result = await f.repo.install(externalFiles());
    expect(result.ok).toBe(false);
    expect(result.error).toBe('commit failed');
    expect(f.repo.getState()).toBe(previous);
    expect(await f.persistence.read()).toBeUndefined();
    f.repo.dispose();
  });
  it('serializes duplicates, refuses builtin removal and falls back when removing active', async () => {
    const { repo } = fixture();
    const results = await Promise.all([
      repo.install(externalFiles()),
      repo.install(externalFiles()),
    ]);
    expect(results.map((r) => r.ok)).toEqual([true, false]);
    expect(results[1].conflict).toBe(true);
    expect((await repo.select('test-custom', 'system')).ok).toBe(true);
    expect(repo.getState().snapshot.mode).toBe('light');
    const revision = repo.getState().revision;
    expect((await repo.remove('test-custom')).ok).toBe(true);
    expect(repo.getState().selection.themeId).toBe(
      officialThemePackage.manifest.id,
    );
    expect(repo.getState().revision).toBeGreaterThan(revision);
    expect((await repo.remove(officialThemePackage.manifest.id)).ok).toBe(
      false,
    );
    repo.dispose();
  });
  it('resolves system preference to a supported single mode and cleans listeners', async () => {
    const f = fixture();
    await f.repo.install(externalFiles());
    await f.repo.select('test-custom', 'system');
    const revision = f.repo.getState().revision;
    f.dark();
    // A subsequent queued operation waits for the system mutation.
    await f.repo.select('test-custom', 'system');
    expect(f.repo.getState().snapshot.mode).toBe('light');
    expect(f.repo.getState().revision).toBeGreaterThan(revision);
    f.repo.dispose();
  });
  it('follows system changes after storage becomes unwritable', async () => {
    const f = fixture();
    await f.repo.select('deepseek-inspired', 'system');
    f.fail();
    f.dark();
    // Let the already queued appearance update complete.
    await f.repo.exportPackage('deepseek-inspired');
    expect(f.repo.getState().snapshot.mode).toBe('dark');
    expect(f.repo.getState().selection.mode).toBe('system');
    expect(f.repo.getState().error).toBeUndefined();
    f.repo.dispose();
  });
  it('revalidates persisted packages on initialization', async () => {
    const { persistence } = fixture();
    await persistence.update(() => ({
      revision: 1,
      selection: { themeId: 'bad', mode: 'light' },
      packages: { bad: { 'theme.json': 'invalid' } },
    }));
    const repo = createBrowserThemeRepository({ persistence, channel: null });
    await expect(repo.initialize()).rejects.toThrow();
    expect(repo.getState().snapshot.themeId).toBe(
      officialThemePackage.manifest.id,
    );
    repo.dispose();
  });
});
