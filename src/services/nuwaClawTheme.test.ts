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

/** 当前 html 上 --xagi-color-primary 的值（'' 即未写入） */
function rootPrimary(): string {
  return document.documentElement.style.getPropertyValue(
    '--xagi-color-primary',
  );
}

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
    const syncTheme = vi.fn();
    (window as any).NuwaClawBridge = {
      auth: {},
      native: {},
      theme: { syncTheme },
    };
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
      '#F3F4F6',
    );
    expect(root.style.getPropertyValue('--xagi-layout-bg-secondary')).toBe(
      '#EAEBEF',
    );
    // 主内容区面板（token @pageContainerBg 消费；漏配曾致内容区始终白）
    expect(root.style.getPropertyValue('--xagi-layout-bg-container')).toBe(
      '#F3F4F6',
    );
    // html 灰底兜住 style1 浮动面板的缝隙（jsdom 会把颜色规范化成 rgb() 形式）
    expect(root.style.backgroundColor).toBe('rgb(234, 235, 239)');
    // 桌面端不用背景图（米白纯色）
    expect(root.style.getPropertyValue('--xagi-background-image')).toBe('none');
    // 菜单背景实色（@navFirstMenuBg/@navSecondMenuBg 消费的变量）
    expect(root.style.getPropertyValue('--xagi-color-bg-container')).toBe(
      '#EEEFF2',
    );
    // 菜单项高亮：米白浮起色替代原纯白（@navItem*Bg/@navSecondItemActiveBg 消费）
    expect(root.style.getPropertyValue('--xagi-nav-item-active-bg')).toBe(
      '#F2F3F6',
    );
    expect(
      root.style.getPropertyValue('--xagi-nav-second-item-active-bg'),
    ).toBe('#EEF0F3');
    // 生效时把同套调色板推给壳（原生侧统一米白效果的唯一来源）
    expect(syncTheme).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, primary: NUWACLAW_PRIMARY }),
    );
  });

  it('nuwaclaw + 用户已显式设主色 → 不生效（不锁）：active=false，覆盖变量不写入', () => {
    const syncTheme = vi.fn();
    (window as any).NuwaClawBridge = {
      auth: {},
      native: {},
      theme: { syncTheme },
    };
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
    // 让位时通知壳回落自身主题（active:false，不带调色板）
    expect(syncTheme).toHaveBeenCalledWith({ active: false });
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
      '#F3F4F6',
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

  it('nuwaclaw + 用户层为租户模板回声（值全等）→ 不算显式定制，女娲主题生效', () => {
    // 网关形态不命中的根因场景（用户 dump 实证）：登录同步把 templateConfig
    // 写入用户层（source:'user'），值逐项 ≡ 租户默认 —— 是回声不是用户定制
    const syncTheme = vi.fn();
    (window as any).NuwaClawBridge = {
      auth: {},
      native: {},
      theme: { syncTheme },
    };
    const template = {
      selectedThemeColor: '#5147ff',
      selectedBackgroundId: 'bg-variant-8',
    };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({ templateConfig: JSON.stringify(template) }),
    );
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify(template),
    );
    expect(isNuwaClawThemeActive()).toBe(true);
    dispose = initNuwaClawTheme();
    expect(mockUpdateData).toHaveBeenCalledWith({
      primaryColor: NUWACLAW_PRIMARY,
      backgroundId: 'bg-solid',
    });
    expect(rootPrimary()).toBe(NUWACLAW_PRIMARY);
    expect(syncTheme).toHaveBeenCalledWith(
      expect.objectContaining({ active: true }),
    );
  });

  it('nuwaclaw + 用户层偏离租户默认（真定制）→ 让位', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({
        templateConfig: JSON.stringify({
          selectedThemeColor: '#5147ff',
          selectedBackgroundId: 'bg-variant-8',
        }),
      }),
    );
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({
        selectedThemeColor: '#ff4d4f',
        selectedBackgroundId: 'bg-variant-8',
      }),
    );
    mockCurrentData.primaryColor = '#ff4d4f';
    expect(isNuwaClawThemeActive()).toBe(false);
    dispose = initNuwaClawTheme();
    expect(mockUpdateData).not.toHaveBeenCalled();
    expect(rootPrimary()).toBe('');
  });

  it('nuwaclaw + 回声色大小写差异（#5147FF vs #5147ff）→ 仍视为全等回声，生效', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({
        templateConfig: JSON.stringify({ selectedThemeColor: '#5147ff' }),
      }),
    );
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: '#5147FF' }),
    );
    expect(isNuwaClawThemeActive()).toBe(true);
  });

  it('nuwax + 租户配置损坏（templateConfig 非法 JSON）→ 无租户默认可参照，用户层有值即算显式', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({ templateConfig: '{broken json' }),
    );
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: '#5147ff' }),
    );
    mockCurrentData.primaryColor = '#5147ff';
    expect(isNuwaClawThemeActive()).toBe(false);
  });

  it('nuwaclaw + 仅租户 themeConfig.default*（无 templateConfig）→ 仍作为默认值参与回声比对', () => {
    (window as any).NuwaClawBridge = { auth: {}, native: {} };
    localStorage.setItem(
      STORAGE_KEYS_MOCK.TENANT_CONFIG_INFO,
      JSON.stringify({
        themeConfig: {
          defaultThemeColor: '#5147ff',
          defaultBackgroundId: 'bg-variant-8',
        },
      }),
    );
    // 用户层 ≡ default* → 回声，生效
    expect(isNuwaClawThemeActive()).toBe(true);
    // 用户层偏离 default* → 显式，让位
    localStorage.setItem(
      STORAGE_KEYS_MOCK.USER_THEME_CONFIG,
      JSON.stringify({ selectedThemeColor: '#ff4d4f' }),
    );
    mockCurrentData.primaryColor = '#ff4d4f';
    expect(isNuwaClawThemeActive()).toBe(false);
  });
});
