import { describe, expect, it, vi } from 'vitest';
import { createLicenseController } from '../../src/services/licenseController';
import type { LicenseProvider } from '../../src/types/interfaces/license';
import {
  canExecuteLicenseFeature,
  LicenseRequestError,
} from '../../src/utils/license';

function snapshot(subject = '示例企业', enabled = true, canImport = true) {
  return {
    state: 'VALID',
    subject,
    maskedId: 'mock-****-0930',
    canImport,
    features: [{ code: 'example_feature', name: '示例功能', enabled }],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function file() {
  return new File(['opaque-content'], 'license.lic', {
    type: 'application/octet-stream',
  });
}

describe('License controller 读取与生命周期', () => {
  it('未接入明确 unavailable，不调用 reader、不伪装为未安装', async () => {
    const read = vi.fn();
    const controller = createLicenseController({ available: false, read });
    expect(controller.getState()).toMatchObject({
      status: 'unavailable',
      snapshot: null,
      error: { kind: 'unavailable' },
      providerAvailable: false,
    });
    expect(await controller.reload()).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it('首次读取成功前不能执行，成功只应用只读投影', async () => {
    const request = deferred<unknown>();
    const controller = createLicenseController({
      available: true,
      read: () => request.promise,
    });
    expect(controller.getState().status).toBe('idle');
    const reload = controller.reload();
    expect(controller.getState()).toMatchObject({
      status: 'loading',
      operation: 'read',
      snapshot: null,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    request.resolve(snapshot());
    expect(await reload).toBe(true);
    expect(controller.getState()).toMatchObject({
      status: 'ready',
      operation: null,
      error: null,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(true);
  });

  it.each([
    'network',
    'unauthenticated',
    'forbidden',
    'invalid-response',
  ] as const)('首次 %s 错误与未安装区分，不能产生执行授权', async (kind) => {
    const controller = createLicenseController({
      available: true,
      read: async () => {
        throw new LicenseRequestError(kind);
      },
    });
    expect(await controller.reload()).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: kind,
      snapshot: null,
      error: { kind },
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
  });

  it('刷新开始/失败都撤销执行权，保留上次展示快照；恢复成功才恢复授权', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce(snapshot())
      .mockRejectedValueOnce(new Error('secret'))
      .mockResolvedValueOnce(snapshot('刷新后企业'));
    const controller = createLicenseController({ available: true, read });
    await controller.reload();
    const oldSnapshot = controller.getState().snapshot;
    const failedReload = controller.reload();
    expect(controller.getState().snapshot).toBe(oldSnapshot);
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    expect(await failedReload).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: 'network',
      snapshot: oldSnapshot,
      error: { kind: 'network' },
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    expect(await controller.reload()).toBe(true);
    expect(controller.getState().snapshot?.subject).toBe('刷新后企业');
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(true);
  });

  it('畸形成功回包不能替代旧展示信息或继续授权', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce({ ...snapshot(), state: 'UNKNOWN' });
    const controller = createLicenseController({ available: true, read });
    await controller.reload();
    const previous = controller.getState().snapshot;
    expect(await controller.reload()).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: 'invalid-response',
      snapshot: previous,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
  });

  it('后发读取胜出，即使旧 provider 忽略 AbortSignal，迟到成功也不能覆盖', async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    const signals: AbortSignal[] = [];
    const read = vi
      .fn()
      .mockImplementationOnce((signal: AbortSignal) => {
        signals.push(signal);
        return first.promise;
      })
      .mockImplementationOnce((signal: AbortSignal) => {
        signals.push(signal);
        return second.promise;
      });
    const controller = createLicenseController({ available: true, read });
    const oldReload = controller.reload();
    const newReload = controller.reload();
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    second.resolve(snapshot('后发企业'));
    expect(await newReload).toBe(true);
    first.resolve(snapshot('旧企业'));
    expect(await oldReload).toBe(false);
    expect(controller.getState().snapshot?.subject).toBe('后发企业');
  });

  it('旧读取失败不会覆盖后发成功或撤销其授权', async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    const read = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const controller = createLicenseController({ available: true, read });
    const oldReload = controller.reload();
    const newReload = controller.reload();
    second.resolve(snapshot('当前企业'));
    await newReload;
    first.reject(new LicenseRequestError('forbidden'));
    expect(await oldReload).toBe(false);
    expect(controller.getState().status).toBe('ready');
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(true);
  });

  it('账号变化 reset 清旧值并使旧响应失效，保留订阅以支持再次读取', async () => {
    const pending = deferred<unknown>();
    const read = vi
      .fn()
      .mockResolvedValueOnce(snapshot('旧账号'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(snapshot('新账号'));
    const controller = createLicenseController({ available: true, read });
    const listener = vi.fn();
    controller.subscribe(listener);
    await controller.reload();
    const oldReload = controller.reload();
    controller.reset();
    expect(controller.getState()).toMatchObject({
      status: 'idle',
      snapshot: null,
      error: null,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    pending.resolve(snapshot('迟到旧账号'));
    expect(await oldReload).toBe(false);
    expect(controller.getState().snapshot).toBe(null);
    expect(await controller.reload()).toBe(true);
    expect(controller.getState().snapshot?.subject).toBe('新账号');
    expect(listener).toHaveBeenCalledTimes(6);
  });

  it('订阅不立即回调，注销后不通知；dispose 撤权且在途响应不再通知/应用', async () => {
    const request = deferred<unknown>();
    const read = vi.fn().mockReturnValue(request.promise);
    const controller = createLicenseController({ available: true, read });
    const removed = vi.fn();
    const remove = controller.subscribe(removed);
    const remaining = vi.fn();
    controller.subscribe(remaining);
    expect(remaining).not.toHaveBeenCalled();
    remove();
    const reload = controller.reload();
    expect(removed).not.toHaveBeenCalled();
    expect(remaining).toHaveBeenCalledTimes(1);
    const signal = read.mock.calls[0][0] as AbortSignal;
    controller.dispose();
    expect(signal.aborted).toBe(true);
    request.resolve(snapshot());
    expect(await reload).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: 'unavailable',
      snapshot: null,
      providerAvailable: false,
    });
    expect(remaining).toHaveBeenCalledTimes(1);
    expect(await controller.reload()).toBe(false);
    controller.reset();
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('provider 在响应期间变不可用也不应用 VALID', async () => {
    const request = deferred<unknown>();
    const provider = { available: true, read: () => request.promise };
    const controller = createLicenseController(provider);
    const reload = controller.reload();
    provider.available = false;
    request.resolve(snapshot());
    expect(await reload).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: 'unavailable',
      snapshot: null,
      providerAvailable: false,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
  });
});

describe('License controller 导入边界', () => {
  it('读取快照 canImport=false 或 provider 不支持导入时不执行动作', async () => {
    const importLicense = vi.fn().mockResolvedValue(snapshot());
    const controller = createLicenseController({
      available: true,
      read: async () => snapshot('只读用户', true, false),
      importLicense,
    });
    expect(await controller.importLicense(file())).toBe(false);
    await controller.reload();
    expect(await controller.importLicense(file())).toBe(false);
    expect(importLicense).not.toHaveBeenCalled();
    const readerOnly = createLicenseController({
      available: true,
      read: async () => snapshot(),
    });
    await readerOnly.reload();
    expect(readerOnly.getState().importAvailable).toBe(false);
    expect(await readerOnly.importLicense(file())).toBe(false);
  });

  it('只传原始 File 给 provider，导入中撤销 gate，成功只采用回包状态', async () => {
    const request = deferred<unknown>();
    const importLicense = vi.fn().mockReturnValue(request.promise);
    const controller = createLicenseController({
      available: true,
      read: async () => snapshot(),
      importLicense,
    });
    await controller.reload();
    const originalFile = file();
    const importing = controller.importLicense(originalFile);
    expect(importLicense.mock.calls[0][0]).toBe(originalFile);
    expect(controller.getState()).toMatchObject({
      status: 'loading',
      operation: 'import',
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    request.resolve({ ...snapshot(), state: 'INVALID' });
    expect(await importing).toBe(true);
    expect(controller.getState().snapshot?.state).toBe('INVALID');
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
  });

  it('导入失败保留展示快照，不能保留执行权；可用原输入重试成功', async () => {
    const importLicense = vi
      .fn()
      .mockRejectedValueOnce(new LicenseRequestError('network'))
      .mockResolvedValueOnce(snapshot('更新企业'));
    const controller = createLicenseController({
      available: true,
      read: async () => snapshot(),
      importLicense,
    });
    await controller.reload();
    const previous = controller.getState().snapshot;
    const originalFile = file();
    expect(await controller.importLicense(originalFile)).toBe(false);
    expect(controller.getState()).toMatchObject({
      status: 'network',
      snapshot: previous,
    });
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
    expect(await controller.importLicense(originalFile)).toBe(true);
    expect(importLicense.mock.calls[1][0]).toBe(originalFile);
    expect(controller.getState().snapshot?.subject).toBe('更新企业');
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(true);
  });

  it('导入进行中阻止第二次导入及新读取，不重复提交、不覆盖结果', async () => {
    const request = deferred<unknown>();
    const read = vi.fn().mockResolvedValue(snapshot());
    const importLicense = vi.fn().mockReturnValue(request.promise);
    const controller = createLicenseController({
      available: true,
      read,
      importLicense,
    });
    await controller.reload();
    const importing = controller.importLicense(file());
    expect(await controller.importLicense(file())).toBe(false);
    expect(await controller.reload()).toBe(false);
    expect(importLicense).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
    request.resolve(snapshot('导入后企业'));
    expect(await importing).toBe(true);
    expect(controller.getState().snapshot?.subject).toBe('导入后企业');
  });

  it('导入使早先刷新失效，旧刷新迟到不会恢复已禁用的能力', async () => {
    const refreshing = deferred<unknown>();
    const importing = deferred<unknown>();
    const read = vi
      .fn()
      .mockResolvedValueOnce(snapshot())
      .mockReturnValueOnce(refreshing.promise);
    const provider: LicenseProvider = {
      available: true,
      read,
      importLicense: () => importing.promise,
    };
    const controller = createLicenseController(provider);
    await controller.reload();
    const reload = controller.reload();
    const imported = controller.importLicense(file());
    importing.resolve(snapshot('更新后企业', false));
    expect(await imported).toBe(true);
    refreshing.resolve(snapshot('迟到旧授权', true));
    expect(await reload).toBe(false);
    expect(controller.getState().snapshot?.subject).toBe('更新后企业');
    expect(
      canExecuteLicenseFeature(controller.getState(), 'example_feature'),
    ).toBe(false);
  });

  it.each(['reset', 'dispose'] as const)(
    '%s 使在途导入结果失效，不为下个账号或已卸载视图授权',
    async (action) => {
      const importing = deferred<unknown>();
      const controller = createLicenseController({
        available: true,
        read: async () => snapshot(),
        importLicense: () => importing.promise,
      });
      await controller.reload();
      const imported = controller.importLicense(file());
      controller[action]();
      importing.resolve(snapshot('迟到更新'));
      expect(await imported).toBe(false);
      expect(controller.getState().snapshot).toBe(null);
      expect(
        canExecuteLicenseFeature(controller.getState(), 'example_feature'),
      ).toBe(false);
    },
  );
});
