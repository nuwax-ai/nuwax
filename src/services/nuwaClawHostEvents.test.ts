import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * nuwaClawHostEvents 依赖 nuwaClawBridge（纯 TS，读 window.NuwaClawBridge，无 umi 传递依赖），
 * 可在 vitest 直接 import 运行。本测试聚焦「宿主命令 → 业务能力」分发与生命周期。
 */
import { initNuwaClawHostEvents } from './nuwaClawHostEvents';

describe('nuwaClawHostEvents · 宿主命令响应（host→guest 通道消费端）', () => {
  const originalBridge = (window as any).NuwaClawBridge;
  /** 捕获经 nuwaClawHost.events.onHostCommand 注册的回调（模拟 webviewPerfBridge 注入） */
  let registeredHandler: ((payload: any) => void) | null = null;

  beforeEach(() => {
    registeredHandler = null;
    (window as any).NuwaClawBridge = {
      events: {
        onHostCommand: vi.fn((cb: ((p: any) => void) | null) => {
          registeredHandler = cb;
        }),
      },
    };
  });

  afterEach(() => {
    if (originalBridge === undefined) delete (window as any).NuwaClawBridge;
    else (window as any).NuwaClawBridge = originalBridge;
  });

  it('toggle-second-menu 命令 → 按.payload.collapsed 调用 setSecondMenuCollapsed', () => {
    const setSecondMenuCollapsed = vi.fn();
    initNuwaClawHostEvents({ setSecondMenuCollapsed });
    expect(registeredHandler).toBeTruthy();

    registeredHandler!({ type: 'toggle-second-menu', collapsed: true });
    expect(setSecondMenuCollapsed).toHaveBeenLastCalledWith(true);

    registeredHandler!({ type: 'toggle-second-menu', collapsed: false });
    expect(setSecondMenuCollapsed).toHaveBeenLastCalledWith(false);
  });

  it('未知命令类型 → 不调用 setSecondMenuCollapsed（仅 console.warn）', () => {
    const setSecondMenuCollapsed = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    initNuwaClawHostEvents({ setSecondMenuCollapsed });

    registeredHandler!({ type: 'unknown-cmd' } as any);
    expect(setSecondMenuCollapsed).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('非法 payload（null / 非对象）→ 静默忽略，不抛错', () => {
    const setSecondMenuCollapsed = vi.fn();
    initNuwaClawHostEvents({ setSecondMenuCollapsed });

    expect(() => registeredHandler!(null as any)).not.toThrow();
    expect(() => registeredHandler!(undefined as any)).not.toThrow();
    expect(setSecondMenuCollapsed).not.toHaveBeenCalled();
  });

  it('dispose → 注销回调（onHostCommand(null)）', () => {
    const onHostCommandMock = (window as any).NuwaClawBridge.events
      .onHostCommand;
    const dispose = initNuwaClawHostEvents({
      setSecondMenuCollapsed: vi.fn(),
    });

    dispose();
    expect(onHostCommandMock).toHaveBeenCalledWith(null);
  });

  it('浏览器无桥（onHostCommand 缺失）→ init 仍返回 dispose 且不抛错', () => {
    delete (window as any).NuwaClawBridge;
    expect(() =>
      initNuwaClawHostEvents({ setSecondMenuCollapsed: vi.fn() }),
    ).not.toThrow();
  });
});
