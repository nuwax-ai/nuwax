import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initImNotificationPreference } from './imNotificationPreference';

const originalBridge = window.NuwaClawBridge;
const setNotificationEnabled = vi.fn();
const getContext = vi.fn();
let dispose: (() => void) | undefined;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

async function settle() {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
}

beforeEach(() => {
  localStorage.clear();
  setNotificationEnabled.mockReset();
  setNotificationEnabled.mockResolvedValue(undefined);
  getContext.mockReset();
  getContext.mockResolvedValue(null);
  window.NuwaClawBridge = {
    auth: { getContext },
    im: { setNotificationEnabled },
  };
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.restoreAllMocks();
  window.NuwaClawBridge = originalBridge;
  localStorage.clear();
});

describe('无需打开 IM 的原生通知偏好恢复', () => {
  it('等文档握手后发送保存的关闭状态，其它值按原 IM 默认开启', async () => {
    const ready = deferred<null>();
    getContext.mockReturnValueOnce(ready.promise);
    localStorage.setItem('nuwax-im.notify', '0');
    dispose = initImNotificationPreference();
    expect(getContext).toHaveBeenCalledOnce();
    expect(setNotificationEnabled).not.toHaveBeenCalled();
    ready.resolve(null);
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledOnce();
    expect(setNotificationEnabled).toHaveBeenCalledWith(false);
    dispose();
    localStorage.setItem('nuwax-im.notify', 'unknown');
    dispose = initImNotificationPreference();
    await settle();
    expect(setNotificationEnabled).toHaveBeenLastCalledWith(true);
  });

  it('其它窗口修改开关或清空存储时同步，卸载后退订，不接其它键', async () => {
    dispose = initImNotificationPreference();
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledWith(true);
    localStorage.setItem('nuwax-im.notify', '0');
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    expect(setNotificationEnabled).toHaveBeenCalledOnce();
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'nuwax-im.notify' }),
    );
    await settle();
    expect(setNotificationEnabled).toHaveBeenLastCalledWith(false);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    await settle();
    expect(setNotificationEnabled).toHaveBeenLastCalledWith(true);
    const calls = setNotificationEnabled.mock.calls.length;
    dispose();
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'nuwax-im.notify' }),
    );
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledTimes(calls);
  });

  it('握手等待期间偏好多次变更，只发送最新值', async () => {
    const ready = deferred<null>();
    getContext.mockReturnValueOnce(ready.promise);
    dispose = initImNotificationPreference();
    localStorage.setItem('nuwax-im.notify', '1');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'nuwax-im.notify' }),
    );
    localStorage.setItem('nuwax-im.notify', '0');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'nuwax-im.notify' }),
    );
    expect(setNotificationEnabled).not.toHaveBeenCalled();
    ready.resolve(null);
    await settle();
    expect(getContext).toHaveBeenCalledOnce();
    expect(setNotificationEnabled).toHaveBeenCalledOnce();
    expect(setNotificationEnabled).toHaveBeenCalledWith(false);
  });

  it('旧挂载的文档握手晚到，不能覆盖新挂载的偏好', async () => {
    const oldReady = deferred<null>();
    getContext.mockReturnValueOnce(oldReady.promise);
    dispose = initImNotificationPreference();
    dispose();
    localStorage.setItem('nuwax-im.notify', '0');
    dispose = initImNotificationPreference();
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledOnce();
    expect(setNotificationEnabled).toHaveBeenCalledWith(false);
    oldReady.resolve(null);
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledOnce();
  });

  it('读取偏好失败默认开启，桥拒绝同步也不会产生页面异常', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    setNotificationEnabled.mockRejectedValueOnce(new Error('unavailable'));
    expect(() => {
      dispose = initImNotificationPreference();
    }).not.toThrow();
    await settle();
    expect(setNotificationEnabled).toHaveBeenCalledWith(true);
  });

  it('普通 Web 和没有 IM 能力的旧宿主不读存储、不增加监听', () => {
    delete window.NuwaClawBridge;
    const read = vi.spyOn(Storage.prototype, 'getItem');
    const listen = vi.spyOn(window, 'addEventListener');
    dispose = initImNotificationPreference();
    expect(read).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
    expect(setNotificationEnabled).not.toHaveBeenCalled();
    expect(getContext).not.toHaveBeenCalled();
  });
});
