/**
 * 单元测试：clientUpdateService —— 轮询/订阅/乐观切态。
 * 深引 '@/utils/hostBridge' 模块级 mock（绕过门面聚合对象，见既有测试惯例）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getStateMock = vi.fn();
const downloadMock = vi.fn();
const installMock = vi.fn();
const checkMock = vi.fn();
const onStateChangeMock = vi.fn();

vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    updater: {
      onStateChange: (...args: unknown[]) => onStateChangeMock(...args),
      check: (...args: unknown[]) => checkMock(...args),
      getState: (...args: unknown[]) => getStateMock(...args),
      download: (...args: unknown[]) => downloadMock(...args),
      install: (...args: unknown[]) => installMock(...args),
    },
  },
  isDesktopHost: () => true,
  default: {
    updater: {
      getState: (...args: unknown[]) => getStateMock(...args),
      download: (...args: unknown[]) => downloadMock(...args),
      install: (...args: unknown[]) => installMock(...args),
    },
  },
}));

import {
  handleHostActivityPayload,
  __resetForTest as resetHostVisibility,
} from '@/services/hostVisibility';
import {
  __resetForTest,
  checkLatest,
  download,
  getState,
  install,
  isAvailable,
  start,
  subscribe,
} from './clientUpdateService';

function makeState(
  overrides: Partial<ClientUpdateState> = {},
): ClientUpdateState {
  return {
    status: 'available',
    hostVersion: '1.0.6',
    version: '1.0.7',
    ...overrides,
  };
}

describe('clientUpdateService', () => {
  it('一键更新请求仍在进行时，每两秒拉取下载/安装状态', async () => {
    vi.useFakeTimers();
    try {
      getStateMock.mockResolvedValue(makeState({ installAfterDownload: true }));
      start();
      await vi.advanceTimersByTimeAsync(0);
      getStateMock.mockClear();
      let finish!: (value: { success: boolean }) => void;
      downloadMock.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const pending = download();
      getStateMock.mockResolvedValue(
        makeState({ status: 'installing', installAfterDownload: true }),
      );
      await vi.advanceTimersByTimeAsync(2000);
      expect(getState()?.status).toBe('installing');
      await vi.advanceTimersByTimeAsync(2000);
      expect(getStateMock).toHaveBeenCalledTimes(2);
      finish({ success: true });
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });

  it('桥在退出或网络中断时拒绝，不泄漏未处理的 Promise', async () => {
    getStateMock.mockResolvedValue(makeState({ installAfterDownload: true }));
    start();
    await vi.waitFor(() => expect(getState()?.status).toBe('available'));
    getStateMock.mockRejectedValue(new Error('bridge closed'));
    downloadMock.mockRejectedValue(new Error('download failed'));
    await expect(download()).resolves.toBe(false);
    expect(getState()).toMatchObject({
      status: 'error',
      error: 'download failed',
    });
  });

  beforeEach(() => {
    __resetForTest();
    getStateMock.mockReset();
    downloadMock.mockReset();
    installMock.mockReset();
    checkMock.mockReset().mockResolvedValue(undefined);
    onStateChangeMock.mockReset().mockReturnValue(() => {});
    resetHostVisibility();
    // 桌面宿主 + updater 桥在场（isAvailable 的 feature-detect 分支）
    (window as unknown as Record<string, unknown>).NuwaClawBridge = {
      updater: { getState: async () => null },
    };
  });

  afterEach(() => {
    __resetForTest();
    delete (window as unknown as Record<string, unknown>).NuwaClawBridge;
    vi.restoreAllMocks();
  });

  it('关于页返回主页面时，聚焦立即同步新版；自动补查按 5 分钟节流', async () => {
    vi.useFakeTimers();
    try {
      getStateMock.mockResolvedValue(makeState({ status: 'not-available' }));
      start();
      await vi.advanceTimersByTimeAsync(0);
      await checkLatest();
      expect(checkMock).toHaveBeenCalledTimes(1);
      getStateMock.mockResolvedValue(makeState({ version: '1.0.9' }));
      window.dispatchEvent(new Event('focus'));
      await vi.advanceTimersByTimeAsync(0);
      expect(getState()?.version).toBe('1.0.9');
      expect(checkMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(checkMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('关于页发现新版后立即消费宿主推送，空闲仍只按 30 秒轮询', async () => {
    vi.useFakeTimers();
    try {
      getStateMock.mockResolvedValue(makeState({ status: 'not-available' }));
      const unsubscribe = vi.fn();
      onStateChangeMock.mockReturnValue(unsubscribe);
      start();
      await vi.advanceTimersByTimeAsync(0);
      getStateMock.mockClear();
      const receive = onStateChangeMock.mock.calls[0][0] as (
        state: ClientUpdateState,
      ) => void;
      receive(makeState({ version: '1.0.9', releaseNotes: 'latest notes' }));
      expect(getState()).toMatchObject({
        version: '1.0.9',
        releaseNotes: 'latest notes',
      });
      await vi.advanceTimersByTimeAsync(29_999);
      expect(getStateMock).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(getStateMock).toHaveBeenCalledTimes(1);
      __resetForTest();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('宿主推送比未完成的旧状态读取更新时，旧响应不能覆盖新版本', async () => {
    getStateMock.mockResolvedValue(makeState());
    start();
    await checkLatest();
    let finish!: (state: ClientUpdateState) => void;
    getStateMock.mockImplementationOnce(
      () =>
        new Promise<ClientUpdateState>((resolve) => {
          finish = resolve;
        }),
    );
    window.dispatchEvent(new Event('focus'));
    const receive = onStateChangeMock.mock.calls[0][0] as (
      state: ClientUpdateState,
    ) => void;
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    receive(makeState({ version: '1.0.9' }));
    finish(makeState({ status: 'not-available' }));
    await vi.waitFor(() => expect(getStateMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(getState()?.version).toBe('1.0.9');
  });

  it('宿主恢复可见时立即同步，停止后取消前台事件监听', async () => {
    getStateMock.mockResolvedValue(makeState());
    start();
    await checkLatest();
    getStateMock.mockClear();
    handleHostActivityPayload({ visible: false });
    handleHostActivityPayload({ visible: true });
    await vi.waitFor(() => expect(getStateMock).toHaveBeenCalled());
    __resetForTest();
    getStateMock.mockClear();
    window.dispatchEvent(new Event('focus'));
    handleHostActivityPayload({ visible: false });
    handleHostActivityPayload({ visible: true });
    expect(getStateMock).not.toHaveBeenCalled();
  });

  it('网络恢复、聚焦和恢复可见共用冷却，不因多种事件重复查服务器', async () => {
    vi.useFakeTimers();
    try {
      getStateMock.mockResolvedValue(makeState());
      start();
      await vi.advanceTimersByTimeAsync(0);
      expect(checkMock).not.toHaveBeenCalled();
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('focus'));
      await vi.advanceTimersByTimeAsync(0);
      expect(checkMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(checkMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('打开日志强制刷新、并发入口复用检查，完成后立即同步最新说明', async () => {
    getStateMock.mockResolvedValue(makeState());
    start();
    await checkLatest();
    let finish!: () => void;
    checkMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const first = checkLatest();
    const second = checkLatest();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    getStateMock.mockResolvedValue(
      makeState({ version: '1.0.9', releaseNotes: 'latest notes' }),
    );
    finish();
    await Promise.all([first, second]);
    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(getState()).toMatchObject({
      version: '1.0.9',
      releaseNotes: 'latest notes',
    });
  });

  it.each(['downloading', 'downloaded', 'installing'] as const)(
    '%s 时打开日志不重新选定更新目标',
    async (status) => {
      getStateMock.mockResolvedValue(makeState({ status }));
      start();
      await checkLatest();
      checkMock.mockClear();
      await checkLatest();
      expect(checkMock).not.toHaveBeenCalled();
    },
  );

  it('isAvailable：宿主桥缺失 updater 命名空间时为 false', () => {
    delete (window as unknown as Record<string, unknown>).NuwaClawBridge;
    expect(isAvailable()).toBe(false);
  });

  it('start + subscribe：注册即回调当前值，拉取后通知真实状态', async () => {
    getStateMock.mockResolvedValue(makeState());
    const seen: Array<ClientUpdateState | null> = [];
    const unsub = subscribe((s) => seen.push(s));
    expect(seen).toEqual([null]); // 注册时立即回调一次（尚无状态）
    start();
    await vi.waitFor(() => {
      expect(getState()).toEqual(makeState());
    });
    expect(seen[seen.length - 1]).toEqual(makeState());
    unsub();
  });

  it('download：本地乐观切 downloading，宿主成功后回查真实状态', async () => {
    const available = makeState({ status: 'available' });
    getStateMock.mockResolvedValueOnce(available);
    start();
    await vi.waitFor(() => expect(getState()).toEqual(available));

    getStateMock.mockResolvedValueOnce(
      makeState({
        status: 'downloading',
        progress: { percent: 12, bytesPerSecond: 1, transferred: 1, total: 10 },
      }),
    );
    downloadMock.mockResolvedValue({ success: true });
    const events: Array<string | undefined> = [];
    subscribe((s) => events.push(s?.status));

    const ok = await download();
    expect(ok).toBe(true);
    expect(downloadMock).toHaveBeenCalledTimes(1);
    // 乐观态先于回查生效（事件序列含 downloading）
    expect(events).toContain('downloading');
    expect(getState()?.status).toBe('downloading');
  });

  it('download：宿主失败 → false 并回查（乐观态被真实状态覆盖）', async () => {
    getStateMock.mockResolvedValue(makeState({ status: 'available' }));
    start();
    await vi.waitFor(() => expect(getState()?.status).toBe('available'));

    downloadMock.mockResolvedValue({ success: false, error: 'x' });
    getStateMock.mockResolvedValueOnce(makeState({ status: 'available' }));
    const ok = await download();
    expect(ok).toBe(false);
    expect(getState()?.status).toBe('available');
  });

  it('install：透传宿主回包（success/error），不再吞结果', async () => {
    installMock.mockResolvedValue({ success: true });
    await expect(install()).resolves.toEqual({
      success: true,
      error: undefined,
    });

    installMock.mockResolvedValue({ success: false, error: 'dev build' });
    await expect(install()).resolves.toEqual({
      success: false,
      error: 'dev build',
    });

    installMock.mockResolvedValue(null);
    await expect(install()).resolves.toEqual({
      success: false,
      error: undefined,
    });
  });
});
