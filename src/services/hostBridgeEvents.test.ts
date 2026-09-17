import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * hostBridgeEvents 依赖 hostBridge（纯 TS，读 window.NuwaClawBridge，无 umi 传递依赖），
 * 可在 vitest 直接 import 运行。本测试聚焦「宿主命令 → 业务能力」分发与生命周期。
 */
import { initHostBridgeEvents } from './hostBridgeEvents';
import { __resetForTest, getHostVisibility } from './hostVisibility';

describe('hostBridgeEvents · 宿主命令响应（host→guest 通道消费端）', () => {
  const originalBridge = (window as any).NuwaClawBridge;
  /** 捕获经 hostBridge.events.onHostCommand 注册的回调（模拟 webviewPerfBridge 注入） */
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
    initHostBridgeEvents({ setSecondMenuCollapsed, createNewTask: vi.fn() });
    expect(registeredHandler).toBeTruthy();

    registeredHandler!({ type: 'toggle-second-menu', collapsed: true });
    expect(setSecondMenuCollapsed).toHaveBeenLastCalledWith(true);

    registeredHandler!({ type: 'toggle-second-menu', collapsed: false });
    expect(setSecondMenuCollapsed).toHaveBeenLastCalledWith(false);
  });

  it('new-task 命令 → 调用 createNewTask（壳层 ⌘N 接管下发）', () => {
    const createNewTask = vi.fn();
    initHostBridgeEvents({ setSecondMenuCollapsed: vi.fn(), createNewTask });

    registeredHandler!({ type: 'new-task' });
    expect(createNewTask).toHaveBeenCalledTimes(1);
  });

  it('host-activity 命令 → 分发到 hostVisibility（休眠控制），不依赖注入 handlers', () => {
    __resetForTest();
    initHostBridgeEvents({ setSecondMenuCollapsed: vi.fn(), createNewTask: vi.fn() });

    registeredHandler!({ type: 'host-activity', visible: false });
    expect(getHostVisibility()).toBe(false);

    registeredHandler!({ type: 'host-activity', visible: true });
    expect(getHostVisibility()).toBe(true);
    __resetForTest();
  });

  it('未知命令类型 → 不调用 setSecondMenuCollapsed（仅 console.warn）', () => {
    const setSecondMenuCollapsed = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    initHostBridgeEvents({ setSecondMenuCollapsed, createNewTask: vi.fn() });

    registeredHandler!({ type: 'unknown-cmd' } as any);
    expect(setSecondMenuCollapsed).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('非法 payload（null / 非对象）→ 静默忽略，不抛错', () => {
    const setSecondMenuCollapsed = vi.fn();
    initHostBridgeEvents({ setSecondMenuCollapsed, createNewTask: vi.fn() });

    expect(() => registeredHandler!(null as any)).not.toThrow();
    expect(() => registeredHandler!(undefined as any)).not.toThrow();
    expect(setSecondMenuCollapsed).not.toHaveBeenCalled();
  });

  it('dispose → 注销回调（onHostCommand(null)）', () => {
    const onHostCommandMock = (window as any).NuwaClawBridge.events
      .onHostCommand;
    const dispose = initHostBridgeEvents({
      setSecondMenuCollapsed: vi.fn(),
      createNewTask: vi.fn(),
    });

    dispose();
    expect(onHostCommandMock).toHaveBeenCalledWith(null);
  });

  it('浏览器无桥（onHostCommand 缺失）→ init 仍返回 dispose 且不抛错', () => {
    delete (window as any).NuwaClawBridge;
    expect(() =>
      initHostBridgeEvents({
        setSecondMenuCollapsed: vi.fn(),
        createNewTask: vi.fn(),
      }),
    ).not.toThrow();
  });
});
