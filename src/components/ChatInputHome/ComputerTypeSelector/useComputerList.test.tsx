import {
  handleComputerServiceStatePayload,
  __resetForTest as resetServiceState,
} from '@/services/computerServiceState';
import {
  handleHostActivityPayload,
  __resetForTest as resetVisibility,
} from '@/services/hostVisibility';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useComputerList } from './useComputerList';

const { fetchList } = vi.hoisted(() => ({ fetchList: vi.fn() }));
vi.mock('@/services/systemManage', () => ({
  apiGetUserSelectableSandboxList: fetchList,
}));

const cloud = { sandboxId: '-1', name: '云端电脑', description: '' };
const local = { sandboxId: '366', name: '本机', description: '' };
const other = { sandboxId: '999', name: '其他电脑', description: '' };
const response = (sandboxes = [cloud], agentSelected = {}) => ({
  code: '0000',
  data: { sandboxes, agentSelected },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const settle = () =>
  act(async () => {
    await Promise.resolve();
  });
const advance = (milliseconds: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });

beforeEach(() => {
  vi.useFakeTimers();
  fetchList.mockReset().mockResolvedValue(response());
  resetServiceState();
  resetVisibility();
  delete window.NuwaClawBridge;
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetServiceState();
  resetVisibility();
  delete window.NuwaClawBridge;
});
function commercialHost() {
  window.NuwaClawBridge = { host: { getProduct: () => 'nuwax' } };
}

describe('useComputerList 请求生命周期', () => {
  it('浏览器首次加载一次，刷新途中保留列表，显式刷新获取新候选', async () => {
    const later = deferred<ReturnType<typeof response>>();
    fetchList
      .mockResolvedValueOnce(response())
      .mockReturnValueOnce(later.promise);
    const { result } = renderHook(() => useComputerList());
    await settle();
    expect(result.current.initialized).toBe(true);
    act(() => result.current.refresh());
    expect(result.current.rawComputerList.map((option) => option.id)).toEqual([
      '-1',
    ]);
    await act(async () => later.resolve(response([cloud, local])));
    expect(result.current.rawComputerList.map((option) => option.id)).toEqual([
      '-1',
      '366',
    ]);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(2);
  });

  it('商业首载云端后重试；匹配本机 ID 出现后停止，其他个人电脑不终止等待', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    fetchList
      .mockResolvedValueOnce(response([cloud, other]))
      .mockResolvedValue(response([cloud, other, local]));
    const { result } = renderHook(() => useComputerList());
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(1);
    await advance(2_000);
    expect(result.current.rawComputerList).toHaveLength(3);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(2);
  });

  it('未知本机 ID 时不把其他电脑当作本机；重复 ready 不延长 30 秒预算', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'ready' });
    fetchList.mockResolvedValue(response([cloud, other]));
    renderHook(() => useComputerList());
    await settle();
    await advance(20_000);
    act(() => handleComputerServiceStatePayload({ phase: 'ready' }));
    await advance(40_000);
    expect(fetchList).toHaveBeenCalledTimes(15);
  });

  it('ready 到达时立即补拉，并有限等待后端候选传播', async () => {
    commercialHost();
    renderHook(() => useComputerList());
    await settle();
    await advance(31_000);
    const previousCalls = fetchList.mock.calls.length;
    fetchList
      .mockResolvedValueOnce(response())
      .mockResolvedValue(response([cloud, local]));
    act(() =>
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' }),
    );
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(previousCalls + 1);
    await advance(2_000);
    await advance(30_000);
    expect(fetchList).toHaveBeenCalledTimes(previousCalls + 2);
  });

  it('重启 ready 不能被旧列表中的本机误判完成，补拉暂缺后继续等待', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    fetchList
      .mockResolvedValueOnce(response([cloud, local]))
      .mockResolvedValueOnce(response())
      .mockResolvedValue(response([cloud, local]));
    renderHook(() => useComputerList());
    await settle();
    act(() => {
      handleComputerServiceStatePayload({
        phase: 'starting',
        sandboxId: '366',
      });
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    });
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(2);
    await advance(2_000);
    await advance(30_000);
    expect(fetchList).toHaveBeenCalledTimes(3);
  });

  it('ready 后补拉失败时旧列表中的本机不能停止新的等待窗口', async () => {
    commercialHost();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    fetchList
      .mockResolvedValueOnce(response([cloud, local]))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response())
      .mockResolvedValue(response([cloud, local]));
    const { result } = renderHook(() => useComputerList());
    await settle();
    act(() => {
      handleComputerServiceStatePayload({
        phase: 'starting',
        sandboxId: '366',
      });
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    });
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(result.current.rawComputerList).toHaveLength(2);
    await advance(2_000);
    expect(fetchList).toHaveBeenCalledTimes(3);
    expect(result.current.rawComputerList).toHaveLength(1);
    await advance(2_000);
    await advance(30_000);
    expect(fetchList).toHaveBeenCalledTimes(4);
    expect(result.current.rawComputerList).toHaveLength(2);
  });

  it('ready 前在途响应包含本机也不能结束 ready 后的新等待窗口', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'starting', sandboxId: '366' });
    const beforeReady = deferred<ReturnType<typeof response>>();
    fetchList
      .mockReturnValueOnce(beforeReady.promise)
      .mockResolvedValueOnce(response())
      .mockResolvedValue(response([cloud, local]));
    const { result } = renderHook(() => useComputerList());
    act(() =>
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' }),
    );
    expect(fetchList).toHaveBeenCalledTimes(1);
    await act(async () => beforeReady.resolve(response([cloud, local])));
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(result.current.rawComputerList).toHaveLength(1);
    await advance(2_000);
    await advance(30_000);
    expect(fetchList).toHaveBeenCalledTimes(3);
    expect(result.current.rawComputerList).toHaveLength(2);
  });

  it('手动停止后立即刷新，后台延迟下线时继续等待，只移除本机而保留其他在线电脑', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    fetchList
      .mockResolvedValueOnce(response([cloud, local, other]))
      .mockResolvedValueOnce(response([cloud, local, other]))
      .mockResolvedValue(response([cloud, other]));
    const { result } = renderHook(() => useComputerList());
    await settle();
    act(() => {
      handleComputerServiceStatePayload({ phase: 'stopping' });
      handleComputerServiceStatePayload({ phase: 'stopped' });
    });
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(2);
    await advance(2_000);
    expect(result.current.rawComputerList.map((option) => option.id)).toEqual([
      '-1',
      '999',
    ]);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(3);
  });

  it('停止前在途响应缺少本机也不能结束停止后的后台下线等待', async () => {
    commercialHost();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    const beforeStop = deferred<ReturnType<typeof response>>();
    fetchList
      .mockResolvedValueOnce(response([cloud, local, other]))
      .mockReturnValueOnce(beforeStop.promise)
      .mockResolvedValueOnce(response([cloud, local, other]))
      .mockResolvedValue(response([cloud, other]));
    const { result } = renderHook(() => useComputerList());
    await settle();
    act(() => result.current.refresh());
    act(() => {
      handleComputerServiceStatePayload({ phase: 'stopping' });
      handleComputerServiceStatePayload({ phase: 'stopped' });
    });
    await act(async () => beforeStop.resolve(response([cloud, other])));
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(3);
    expect(result.current.rawComputerList).toHaveLength(3);
    await advance(2_000);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(4);
    expect(result.current.rawComputerList.map((option) => option.id)).toEqual([
      '-1',
      '999',
    ]);
  });

  it('停止通知取消上线重试，下线补拉失败仍有界重试，不请求启动服务', async () => {
    commercialHost();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    handleComputerServiceStatePayload({ phase: 'starting', sandboxId: '366' });
    fetchList
      .mockResolvedValueOnce(response())
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValue(response([cloud, other]));
    const { result } = renderHook(() => useComputerList());
    await settle();
    act(() => handleComputerServiceStatePayload({ phase: 'stopping' }));
    await advance(4_000);
    expect(fetchList).toHaveBeenCalledTimes(1);
    act(() => handleComputerServiceStatePayload({ phase: 'stopped' }));
    await settle();
    expect(fetchList).toHaveBeenCalledTimes(2);
    await advance(2_000);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(3);
    expect(result.current.rawComputerList).toHaveLength(2);
  });

  it('失败与空列表可继续重试；不无限重试失败', async () => {
    commercialHost();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchList
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response([]))
      .mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useComputerList());
    await settle();
    await advance(2_000);
    expect(result.current.initialized).toBe(true);
    expect(result.current.rawComputerList).toEqual([]);
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(15);
  });

  it('展开和 ready 与在途请求合并，只在完成后补一次；卸载后丢弃响应与排队', async () => {
    commercialHost();
    const first = deferred<ReturnType<typeof response>>();
    const second = deferred<ReturnType<typeof response>>();
    fetchList
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, unmount } = renderHook(() => useComputerList());
    act(() => {
      result.current.refresh();
      result.current.refresh();
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    });
    expect(fetchList).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve(response()));
    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(result.current.rawComputerList).toHaveLength(1);
    unmount();
    await act(async () => second.resolve(response([cloud, local])));
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(result.current.rawComputerList).toHaveLength(1);
  });

  it.each(['host', 'document'])(
    '后台 %s 暂停，恢复补拉且不重置原预算',
    async (source) => {
      commercialHost();
      renderHook(() => useComputerList());
      await settle();
      await advance(2_000);
      act(() => {
        if (source === 'host') handleHostActivityPayload({ visible: false });
        else {
          Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
          });
          document.dispatchEvent(new Event('visibilitychange'));
        }
      });
      await advance(40_000);
      expect(fetchList).toHaveBeenCalledTimes(2);
      act(() => {
        if (source === 'host') handleHostActivityPayload({ visible: true });
        else {
          Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
          });
          document.dispatchEvent(new Event('visibilitychange'));
        }
      });
      await settle();
      await advance(60_000);
      expect(fetchList).toHaveBeenCalledTimes(3);
    },
  );

  it('cloudOnly 消费者停用本机等待，宿主 ready 不另起轮询', async () => {
    commercialHost();
    renderHook(() => useComputerList(false));
    await settle();
    act(() =>
      handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' }),
    );
    await advance(60_000);
    expect(fetchList).toHaveBeenCalledTimes(1);
  });
});
