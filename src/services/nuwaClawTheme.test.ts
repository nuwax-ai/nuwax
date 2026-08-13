import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * nuwaClawTheme 的依赖（theme.constants 经 i18nRuntime、unifiedThemeService 经 theme.constants）
 * 在 vitest 顶层 import 会触发 esbuild/TextEncoder 崩溃（@umijs/bundler-utils 传递依赖）。
 * 故用 vi.mock 替换这两个重依赖，仅保留 nuwaClawBridge（纯 TS，无 umi）真实运行，
 * 聚焦验证 nuwaClawTheme 自身的「桌面端 + 未显式定制 = 生效；切过即让位」逻辑。
 */
const { STORAGE_KEYS_MOCK, mockCurrentData } = vi.hoisted(() => ({
  STORAGE_KEYS_MOCK: {
    USER_THEME_CONFIG: '__user_theme__',
    GLOBAL_SETTINGS: '__global_settings__',
    TENANT_CONFIG_INFO: '__tenant_config__',
  } as const,
  mockCurrentData: { antdTheme: 'light' as const, source: 'default' },
}));

vi.mock('@/constants/theme.constants', () => ({
  STORAGE_KEYS: STORAGE_KEYS_MOCK,
}));
vi.mock('@/services/unifiedThemeService', () => ({
  unifiedThemeService: {
    getCurrentData: () => mockCurrentData,
    addListener: () => {},
    removeListener: () => {},
  },
}));

import {
  initNuwaClawTheme,
  isNuwaClawThemeActive,
  NUWACLAW_PRIMARY,
} from './nuwaClawTheme';

describe('nuwaClawTheme · nuwaclaw 桌面专属主题适配', () => {
  const originalBridge = (window as any).NuwaClawBridge;
  const keys = Object.values(STORAGE_KEYS_MOCK);
  const snapshot: Record<string, string | null> = {};
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    keys.forEach((k) => {
      snapshot[k] = localStorage.getItem(k);
      localStorage.removeItem(k);
    });
    // 清掉上一轮可能叠加的 nuwaclaw 覆盖变量
    document.documentElement.style.cssText = '';
    dispose = undefined;
  });

  afterEach(() => {
    dispose?.();
    if (originalBridge === undefined) delete (window as any).NuwaClawBridge;
    else (window as any).NuwaClawBridge = originalBridge;
    keys.forEach((k) => {
      if (snapshot[k] === null) localStorage.removeItem(k);
      else localStorage.setItem(k, snapshot[k]!);
    });
  });

  it('浏览器环境（无桥）→ 不生效；init 为 no-op，不写任何覆盖变量', () => {
    delete (window as any).NuwaClawBridge;
    expect(isNuwaClawThemeActive()).toBe(false);
    dispose = initNuwaClawTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe('');
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe('');
  });

  it('nuwaclaw（有桥）+ 无用户/租户配置 → 生效：叠加品牌蓝主色 + 亮色布局变量', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    expect(isNuwaClawThemeActive()).toBe(true);
    dispose = initNuwaClawTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe(
      NUWACLAW_PRIMARY,
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe(
      '#FFFFFF',
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-secondary')).toBe(
      '#F7F8FA',
    );
  });

  it('nuwaclaw + 用户已显式设主色 → 不生效（不锁）：active=false，覆盖变量不写入', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: '#ff4d4f' }),
    );
    expect(isNuwaClawThemeActive()).toBe(false);
    dispose = initNuwaClawTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe('');
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe('');
  });

  it('nuwaclaw + 仅租户配置 → 不生效（尊重企业品牌，让位 tenant 层）', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({
        templateConfig: JSON.stringify({ selectedThemeColor: '#000000' }),
      }),
    );
    expect(isNuwaClawThemeActive()).toBe(false);
  });
});
