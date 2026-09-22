import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * hostBridgeEvents 依赖 hostBridge（纯 TS，读 window.NuwaClawBridge，无 umi 传递依赖），
 * 可在 vitest 直接 import 运行。本测试聚焦「宿主命令 → 业务能力」分发与生命周期。
 */
import {
  I18N_LANG_USER_SET_MARKER,
  I18N_STORAGE_KEYS,
} from '@/constants/i18n.constants';
import { apiI18nQuery, saveUserLang } from '@/services/i18n';
import { initHostBridgeEvents } from './hostBridgeEvents';
import { __resetForTest, getHostVisibility } from './hostVisibility';
import { getCurrentLang } from './i18nRuntime';

// @/services/i18n 含 umi request 导入，按存量模式以 vi.mock 替换网络层：
// 字典拉取永不完成 = 模拟弱网下请求被壳 reload（约 800ms）销毁打断的竞态场景（bug 2428）
vi.mock('@/services/i18n', () => ({
  apiI18nQuery: vi.fn(() => new Promise(() => {})),
  saveUserLang: vi.fn(() => Promise.resolve()),
}));

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

  it('open-search 命令 → 调用注入的 openSearch（应用菜单「文件 → 搜索」下发）', () => {
    const openSearch = vi.fn();
    initHostBridgeEvents({
      setSecondMenuCollapsed: vi.fn(),
      createNewTask: vi.fn(),
      openSearch,
    });

    registeredHandler!({ type: 'open-search' });
    expect(openSearch).toHaveBeenCalledTimes(1);
  });

  it('open-search 未注入（经典布局无实体）→ 静默 no-op 不抛错', () => {
    initHostBridgeEvents({
      setSecondMenuCollapsed: vi.fn(),
      createNewTask: vi.fn(),
    });

    expect(() => registeredHandler!({ type: 'open-search' })).not.toThrow();
  });

  it('host-activity 命令 → 分发到 hostVisibility（休眠控制），不依赖注入 handlers', () => {
    __resetForTest();
    initHostBridgeEvents({
      setSecondMenuCollapsed: vi.fn(),
      createNewTask: vi.fn(),
    });

    registeredHandler!({ type: 'host-activity', visible: false });
    expect(getHostVisibility()).toBe(false);

    registeredHandler!({ type: 'host-activity', visible: true });
    expect(getHostVisibility()).toBe(true);
    __resetForTest();
  });

  it('set-lang 命令（弱网竞态）→ 字典拉取挂起时同步语种已切换（bug 2428）', async () => {
    localStorage.removeItem(I18N_STORAGE_KEYS.ACTIVE_LANG);
    localStorage.removeItem(I18N_STORAGE_KEYS.USER_SET);
    initHostBridgeEvents({
      setSecondMenuCollapsed: vi.fn(),
      createNewTask: vi.fn(),
    });

    registeredHandler!({ type: 'set-lang', lang: 'ja-JP' });
    await Promise.resolve(); // flush 微任务：异步字典拉取已发出且仍挂起

    // 字典请求已发出但未完成（挂起中），后端持久化更未执行
    expect(apiI18nQuery).toHaveBeenCalledWith('ja-jp', 'PC');
    expect(saveUserLang).not.toHaveBeenCalled();
    // 关键断言：此刻语种与 ACTIVE_LANG 已同步落在新语种——壳随后任意时点重载
    // webview 都按新语种启动，不会以旧语种回声 syncLang 把壳拖回旧语言
    expect(getCurrentLang()).toBe('ja-jp');
    expect(localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG)).toBe('ja-jp');
    expect(localStorage.getItem(I18N_STORAGE_KEYS.USER_SET)).toBe(
      I18N_LANG_USER_SET_MARKER,
    );
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
