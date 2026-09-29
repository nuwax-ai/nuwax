import { createMicroAppLifecycleQueue } from '@/layouts/MicroAppHost/lifecycle';
import { describe, expect, it, vi } from 'vitest';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('微应用异步生命周期', () => {
  it('刷新期间等待旧应用挂载和卸载，再挂同名新应用', async () => {
    const queue = createMicroAppLifecycleQueue();
    const mounting = deferred();
    const unmounting = deferred();
    const order: string[] = [];
    const first = queue.acquire('repo', async () => ({
      mountPromise: mounting.promise,
      unmount: async () => {
        order.push('unmount');
        await unmounting.promise;
      },
    }));
    await Promise.resolve();
    first.dispose();
    const second = queue.acquire('repo', async () => {
      order.push('load-next');
      return {
        mountPromise: Promise.resolve(),
        unmount: async () => undefined,
      };
    });
    mounting.resolve();
    await first.ready;
    await Promise.resolve();
    expect(order).not.toContain('load-next');
    unmounting.resolve();
    await second.ready;
    expect(order).toEqual(['unmount', 'load-next']);
    second.dispose();
  });

  it('StrictMode 清理尚未启动的 lease 时不执行加载', async () => {
    const queue = createMicroAppLifecycleQueue();
    const load = vi.fn();
    const lease = queue.acquire('repo', load);
    lease.dispose();
    expect(await lease.ready).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('清理会等正在执行的 update，卸载后不再更新', async () => {
    const queue = createMicroAppLifecycleQueue();
    const updating = deferred();
    const unmount = vi.fn(async () => undefined);
    const update = vi.fn(async () => updating.promise);
    const lease = queue.acquire('repo', async () => ({
      mountPromise: Promise.resolve(),
      update,
      unmount,
    }));
    await lease.ready;
    const result = lease.update({ path: '/repo/doc/a' });
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    lease.dispose();
    expect(unmount).not.toHaveBeenCalled();
    updating.resolve();
    await result;
    await lease.update({ path: '/repo/doc/b' });
    expect(update).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(unmount).toHaveBeenCalledTimes(1));
  });

  it('挂载拒绝后仍清理已创建实例，后续重试可正常挂载', async () => {
    const queue = createMicroAppLifecycleQueue();
    const unmount = vi.fn(async () => undefined);
    const first = queue.acquire('repo', async () => ({
      mountPromise: Promise.reject(new Error('failed')),
      unmount,
    }));
    await expect(first.ready).rejects.toThrow('failed');
    first.dispose();
    const retry = queue.acquire('repo', async () => ({
      mountPromise: Promise.resolve(),
      unmount: async () => undefined,
    }));
    expect(await retry.ready).not.toBeNull();
    expect(unmount).toHaveBeenCalledTimes(1);
    retry.dispose();
  });
});
