/**
 * 单元测试：clientUpdateService —— 轮询/订阅/乐观切态。
 * 深引 '@/utils/hostBridge' 模块级 mock（绕过门面聚合对象，见既有测试惯例）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getStateMock = vi.fn();
const downloadMock = vi.fn();
const installMock = vi.fn();

vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    updater: {
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
  __resetForTest,
  download,
  getState,
  isAvailable,
  start,
  subscribe,
} from './clientUpdateService';

function makeState(overrides: Partial<ClientUpdateState> = {}): ClientUpdateState {
  return {
    status: 'available',
    hostVersion: '1.0.6',
    version: '1.0.7',
    ...overrides,
  };
}

describe('clientUpdateService', () => {
  beforeEach(() => {
    __resetForTest();
    getStateMock.mockReset();
    downloadMock.mockReset();
    installMock.mockReset();
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
      makeState({ status: 'downloading', progress: { percent: 12, bytesPerSecond: 1, transferred: 1, total: 10 } }),
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
});
