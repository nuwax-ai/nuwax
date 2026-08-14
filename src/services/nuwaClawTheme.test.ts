import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * nuwaClawTheme 的依赖（theme.constants 经 i18nRuntime、unifiedThemeService 经 theme.constants）
 * 在 vitest 顶层 import 会触发 esbuild/TextEncoder 崩溃（@umijs/bundler-utils 传递依赖）。
 * 故用 vi.mock 替换这两个重依赖，仅保留 nuwaClawBridge（纯 TS，无 umi）真实运行，
 * 聚焦验证 nuwaClawTheme 自身的「桌面端 + 未显式定制 = 生效；切过即让位」逻辑。
 */
const { STORAGE_KEYS_MOCK, mockCurrentData, mockUpdateData } = vi.hoisted(
  () => ({
    STORAGE_KEYS_MOCK: {
      USER_THEME_CONFIG: '__user_theme__',
      GLOBAL_SETTINGS: '__global_settings__',
      TENANT_CONFIG_INFO: '__tenant_config__',
    } as const,
    mockCurrentData: {
      antdTheme: 'light' as const,
      source: 'default',
      primaryColor: '#5147ff',
      layoutStyle: 'light' as const,
      backgroundId: '',
    },
    mockUpdateData: vi.fn(),
  }),
);

vi.mock('@/constants/theme.constants', () => ({
  STORAGE_KEYS: STORAGE_KEYS_MOCK,
}));
vi.mock('@/services/unifiedThemeService', () => ({
  unifiedThemeService: {
    getCurrentData: () => mockCurrentData,
    updateData: mockUpdateData,
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
    mockUpdateData.mockClear();
    // 复位各用例可能动态修改的生效数据
    mockCurrentData.primaryColor = '#5147ff';
    mockCurrentData.layoutStyle = 'light';
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

  it('nuwaclaw（有桥）+ 无用户/租户配置 → 生效：写入女娲主题为正式默认配置 + 叠加亮色布局变量', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    expect(isNuwaClawThemeActive()).toBe(true);
    dispose = initNuwaClawTheme();
    // 桌面端默认切换：把「女娲蓝 + 纯色背景」写进正式主题配置（面板自然高亮）
    expect(mockUpdateData).toHaveBeenCalledWith({
      primaryColor: NUWACLAW_PRIMARY,
      backgroundId: 'bg-solid',
    });
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe(
      NUWACLAW_PRIMARY,
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe(
      '#F1EFE9',
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-secondary')).toBe(
      '#E7E4DA',
    );
    // 主内容区面板（token @pageContainerBg 消费；漏配曾致内容区始终白）
    expect(root.style.getPropertyValue('--xagi-layout-bg-container')).toBe(
      '#F1EFE9',
    );
    // html 米灰底兜住 style1 浮动面板的缝隙（jsdom 会把颜色规范化成 rgb() 形式）
    expect(root.style.backgroundColor).toBe('rgb(231, 228, 218)');
    // 桌面端不用背景图（米白纯色）
    expect(root.style.getPropertyValue('--xagi-background-image')).toBe('none');
    // 菜单背景实色（@navFirstMenuBg/@navSecondMenuBg 消费的变量）
    expect(root.style.getPropertyValue('--xagi-color-bg-container')).toBe(
      '#EAE7DE',
    );
    // 菜单项高亮：米白浮起色替代原纯白（@navItem*Bg/@navSecondItemActiveBg 消费）
    expect(root.style.getPropertyValue('--xagi-nav-item-active-bg')).toBe(
      '#FBFAF6',
    );
    expect(
      root.style.getPropertyValue('--xagi-nav-second-item-active-bg'),
    ).toBe('#FBFAF6');
  });

  it('nuwaclaw + 用户已显式设主色 → 不生效（不锁）：active=false，覆盖变量不写入', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: '#ff4d4f' }),
    );
    // 服务层按用户配置归一后的生效主色
    mockCurrentData.primaryColor = '#ff4d4f';
    expect(isNuwaClawThemeActive()).toBe(false);
    dispose = initNuwaClawTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe('');
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe('');
    // 让位时未写背景图禁用（不碰 unifiedThemeService 可能设置的用户图）
    expect(root.style.getPropertyValue('--xagi-background-image')).toBe('');
    // 让位时 html 灰底一并回收（回落 global.less 的 #fff）
    expect(root.style.backgroundColor).toBe('');
  });

  it('nuwaclaw + 用户显式选「女娲蓝」+ 浅色布局 → 生效（注册进主题切换维度的正式选项）', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: NUWACLAW_PRIMARY }),
    );
    mockCurrentData.primaryColor = NUWACLAW_PRIMARY;
    mockCurrentData.layoutStyle = 'light';
    expect(isNuwaClawThemeActive()).toBe(true);
    dispose = initNuwaClawTheme();
    // 已显式定制 → 不再重写默认（用户的选择不被覆盖）
    expect(mockUpdateData).not.toHaveBeenCalled();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--xagi-color-primary')).toBe(
      NUWACLAW_PRIMARY,
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-primary')).toBe(
      '#F1EFE9',
    );
    expect(root.style.getPropertyValue('--xagi-background-image')).toBe('none');
  });

  it('nuwaclaw + 女娲蓝但切深色布局 → 让位；GLOBAL_SETTINGS 仅语言不构成显式定制', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: NUWACLAW_PRIMARY }),
    );
    mockCurrentData.primaryColor = NUWACLAW_PRIMARY;
    mockCurrentData.layoutStyle = 'dark';
    expect(isNuwaClawThemeActive()).toBe(false);

    // GLOBAL_SETTINGS 只存语言（无 primaryColor/backgroundImageId）→ 仍属 default 层，桌面默认生效
    localStorage.removeItem(STORAGE_KEYS_MOCK.USER_THEME_CONFIG);
    localStorage.setItem(
      STORAGE_KEYS_MOCK.GLOBAL_SETTINGS,
      JSON.stringify({ language: 'zh-CN' }),
    );
    mockCurrentData.layoutStyle = 'light';
    expect(isNuwaClawThemeActive()).toBe(true);
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
