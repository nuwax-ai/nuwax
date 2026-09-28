import { createMicroAppHostStore } from '@/layouts/MicroAppHost/store';
import { describe, expect, it } from 'vitest';

describe('微应用保活状态', () => {
  it('切走仅隐藏；返回裸入口恢复同一实例和文档深链', () => {
    const store = createMicroAppHostStore();
    const doc = store.activate({
      name: 'repo',
      path: '/repo/doc/abc?tab=edit#outline',
    });
    store.deactivate('repo');
    expect(store.getSnapshot().entries).toHaveLength(1);
    const resumed = store.activate({ name: 'repo', path: '/repo/' });
    expect(resumed.path).toBe(doc.path);
    expect(resumed.generation).toBe(doc.generation);
  });

  it('应用之间保持各自深链，迟到的旧控制页 cleanup 不隐藏新应用', () => {
    const store = createMicroAppHostStore();
    store.activate({ name: 'repo', path: '/repo/doc/a' });
    store.activate({ name: 'msg', path: '/msg/chat/b' });
    store.deactivate('repo');
    expect(store.getSnapshot().activeName).toBe('msg');
    expect(store.getSnapshot().entries.map((entry) => entry.path)).toEqual([
      '/repo/doc/a',
      '/msg/chat/b',
    ]);
  });

  it('显式刷新才重建；重复通知、去掉刷新标记及内部导航不重建', () => {
    const store = createMicroAppHostStore();
    const first = store.activate({ name: 'repo', path: '/repo/doc/a' });
    const reload = store.activate({
      name: 'repo',
      path: '/repo/doc/a?_refresh=1',
      refreshToken: '1',
    });
    expect(reload.generation).not.toBe(first.generation);
    expect(reload.path).toBe('/repo/doc/a');
    expect(
      store.activate({
        name: 'repo',
        path: '/repo/doc/a?_refresh=1',
        refreshToken: '1',
      }),
    ).toBe(reload);
    expect(
      store.activate({ name: 'repo', path: '/repo/doc/b' }).generation,
    ).toBe(reload.generation);
  });

  it('外部深链覆盖记忆；显式清理后重进生成新实例', () => {
    const store = createMicroAppHostStore();
    const first = store.activate({ name: 'repo', path: '/repo/doc/a' });
    store.deactivate('repo');
    expect(store.activate({ name: 'repo', path: '/repo/doc/b' }).path).toBe(
      '/repo/doc/b',
    );
    store.invalidateAll();
    expect(store.getSnapshot()).toEqual({ entries: [], activeName: null });
    expect(store.activate({ name: 'repo', path: '/repo' }).generation).not.toBe(
      first.generation,
    );
  });

  it('快照引用稳定，实际变化时通知订阅者', () => {
    const store = createMicroAppHostStore();
    let count = 0;
    const unsubscribe = store.subscribe(() => {
      count += 1;
    });
    const empty = store.getSnapshot();
    expect(store.getSnapshot()).toBe(empty);
    store.activate({ name: 'repo', path: '/repo' });
    store.activate({ name: 'repo', path: '/repo' });
    expect(count).toBe(1);
    unsubscribe();
    store.invalidateAll();
    expect(count).toBe(1);
  });
});
