import { expect, it, vi } from 'vitest';
import { shouldSeedWorkbenchHistoryBase } from './fullscreenWorkbenchPaths';

vi.mock('@/services/unifiedThemeService', () => ({
  unifiedThemeService: {
    getCurrentData: () => ({ navigationStyle: 'style3' }),
  },
}));
vi.mock('@/utils/hostBridge', () => ({ isDesktopHost: () => true }));

it('启动期垫栈后路由初始化不再触发 layout 二次垫栈，并支持返回与前进', async () => {
  const pathname = '/space/752/app-dev/9352423779995648';
  const workbenchUrl = `${pathname}?preview=1#editor`;
  window.history.replaceState(null, '', workbenchUrl);
  const initialLength = window.history.length;
  const lengthSpy = vi
    .spyOn(window.history, 'length', 'get')
    .mockReturnValueOnce(1);
  try {
    const { seedWorkbenchHistoryBaseAtBoot } = await import(
      './workbenchHistoryBase'
    );
    expect(window.history.length).toBe(initialLength + 1);
    expect(
      window.location.pathname + window.location.search + window.location.hash,
    ).toBe(workbenchUrl);

    // history@5 初始化时会把没有 idx 的当前条目标成 0。
    if (window.history.state?.idx == null) {
      window.history.replaceState({ ...window.history.state, idx: 0 }, '');
    }
    expect(
      shouldSeedWorkbenchHistoryBase(
        pathname,
        window.history.length,
        window.history.state,
      ),
    ).toBe(false);
    seedWorkbenchHistoryBaseAtBoot();
    expect(window.history.length).toBe(initialLength + 1);

    const back = new Promise<void>((resolve) =>
      window.addEventListener('popstate', () => resolve(), { once: true }),
    );
    window.history.back();
    await back;
    expect(window.location.pathname).toBe('/home');
    expect(window.history.state?.idx).toBe(0);

    const forward = new Promise<void>((resolve) =>
      window.addEventListener('popstate', () => resolve(), { once: true }),
    );
    window.history.forward();
    await forward;
    expect(
      window.location.pathname + window.location.search + window.location.hash,
    ).toBe(workbenchUrl);
    expect(window.history.state?.idx).toBe(1);
  } finally {
    lengthSpy.mockRestore();
  }
});
