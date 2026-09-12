/**
 * unifiedThemeService 租户模板兜底读取单测
 *
 * 背景（2026-09-10 闪切单栏缺陷）：用户层配置落空走租户兜底时，
 * normalizeTenantConfig 只认旧版模板字段，管理端「主题配置」保存的新版字段
 * （primaryColor/backgroundId/layoutStyle/navigationStyle）读不到，
 * navigationStyle 被误兜底成默认 style3（单栏）。
 *
 * i18nRuntime 传递依赖 umi（vitest 不可 import），统一 mock 为词表 key 直通。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

import { STORAGE_KEYS } from '@/constants/theme.constants';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { unifiedThemeService } from './unifiedThemeService';

/** 预置迁移 guard，避免 loadUserSettings 的一次性迁移干扰用例 */
const seedMigrationGuard = () => {
  localStorage.setItem('xagi-nav-style-migrated-style3', 'test');
};

const seedTenantTemplate = (templateConfig: unknown) => {
  localStorage.setItem(
    STORAGE_KEYS.TENANT_CONFIG_INFO,
    JSON.stringify({ templateConfig: JSON.stringify(templateConfig) }),
  );
};

describe('normalizeTenantConfig（租户兜底字段兼容）', () => {
  beforeEach(() => {
    localStorage.clear();
    seedMigrationGuard();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('新版模板（管理端主题配置保存格式）：导航风格/主题色/背景正确读取，不再误判 style3', () => {
    seedTenantTemplate({
      primaryColor: '#ff4d4f',
      backgroundId: 'bg-variant-8',
      antdTheme: 'light',
      layoutStyle: 'light',
      navigationStyle: 'style1',
      timestamp: 1788954170868,
    });

    unifiedThemeService.reloadConfiguration(false);
    const data = unifiedThemeService.getCurrentData();

    expect(data.source).toBe('tenant');
    expect(data.navigationStyle).toBe('style1');
    expect(data.layoutStyle).toBe('light');
    expect(data.primaryColor).toBe('#ff4d4f');
    expect(data.backgroundId).toBe('bg-variant-8');
  });

  it('旧版模板（selected* 字段）：navigationStyleId 优先，行为与修复前一致', () => {
    seedTenantTemplate({
      selectedThemeColor: '#7221d1',
      selectedBackgroundId: 'bg-variant-1',
      antdTheme: 'light',
      // 旧版 navigationStyle 存的是深浅色（style1=浅/style2=深），非布局类型
      navigationStyle: 'style1',
      navigationStyleId: 'style2',
      timestamp: 1700000000000,
    });

    unifiedThemeService.reloadConfiguration(false);
    const data = unifiedThemeService.getCurrentData();

    expect(data.navigationStyle).toBe('style2');
    expect(data.layoutStyle).toBe('style1');
    expect(data.primaryColor).toBe('#7221d1');
    expect(data.backgroundId).toBe('bg-variant-1');
  });

  it('模板缺导航风格字段时兜底默认 style3', () => {
    seedTenantTemplate({
      selectedThemeColor: '#5147ff',
      selectedBackgroundId: 'bg-variant-8',
    });

    unifiedThemeService.reloadConfiguration(false);

    expect(unifiedThemeService.getCurrentData().navigationStyle).toBe('style3');
  });

  it('用户层配置存在时优先于租户模板', () => {
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({
        selectedThemeColor: '#52c41a',
        navigationStyleId: 'style1',
        navigationStyle: 'style1',
        timestamp: Date.now(),
      }),
    );
    seedTenantTemplate({ layoutStyle: 'light', navigationStyle: 'style2' });

    unifiedThemeService.reloadConfiguration(false);

    const data = unifiedThemeService.getCurrentData();
    expect(data.source).toBe('user');
    expect(data.navigationStyle).toBe('style1');
  });
});

describe('单栏（style3）锁定纯色背景（2026-09-12 需求）', () => {
  beforeEach(() => {
    localStorage.clear();
    seedMigrationGuard();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('写入路径：切入 style3 时背景随导航风格一并收敛纯色并落库', async () => {
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({
        selectedThemeColor: '#5147ff',
        selectedBackgroundId: 'bg-variant-1',
        navigationStyleId: 'style1',
        navigationStyle: 'light',
        antdTheme: 'light',
        timestamp: Date.now(),
      }),
    );
    unifiedThemeService.reloadConfiguration(false);

    await unifiedThemeService.updateNavigationStyle(
      ThemeNavigationStyleType.STYLE3,
    );

    expect(unifiedThemeService.getCurrentData().backgroundId).toBe('bg-solid');
    // 收敛后的值随保存链落库
    expect(
      JSON.parse(
        localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG) || '{}',
      ).selectedBackgroundId,
    ).toBe('bg-solid');
  });

  it('写入路径：经典风格下背景可自由切换，不受不变量影响', async () => {
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({
        selectedBackgroundId: 'bg-variant-1',
        navigationStyleId: 'style1',
        navigationStyle: 'light',
        timestamp: Date.now(),
      }),
    );
    unifiedThemeService.reloadConfiguration(false);

    await unifiedThemeService.updateBackground('bg-variant-3');

    expect(unifiedThemeService.getCurrentData().backgroundId).toBe(
      'bg-variant-3',
    );
  });

  it('加载路径：租户模板 style3 + 图片背景，加载即收敛纯色且来源保持租户', () => {
    seedTenantTemplate({
      primaryColor: '#5147ff',
      backgroundId: 'bg-variant-5',
      layoutStyle: 'light',
      navigationStyle: 'style3',
    });

    unifiedThemeService.reloadConfiguration(false);

    const data = unifiedThemeService.getCurrentData();
    expect(data.navigationStyle).toBe('style3');
    expect(data.backgroundId).toBe('bg-solid');
    expect(data.source).toBe('tenant');
  });

  it('迁移路径：存量 style1 + 图片背景迁移到 style3 后，加载即收敛纯色', () => {
    // 本用例需要真实触发一次性迁移，先撤掉 beforeEach 预置的 guard
    localStorage.removeItem('xagi-nav-style-migrated-style3');
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({
        selectedThemeColor: '#5147ff',
        selectedBackgroundId: 'bg-variant-7',
        navigationStyleId: 'style1',
        navigationStyle: 'dark',
        antdTheme: 'light',
        timestamp: Date.now(),
      }),
    );

    unifiedThemeService.reloadConfiguration(false);

    const data = unifiedThemeService.getCurrentData();
    expect(data.navigationStyle).toBe('style3');
    expect(data.backgroundId).toBe('bg-solid');
  });

  it('默认配置：style3 默认态下空背景收敛为纯色（面板高亮第一个选项）', () => {
    unifiedThemeService.reloadConfiguration(false);

    const data = unifiedThemeService.getCurrentData();
    expect(data.navigationStyle).toBe('style3');
    expect(data.backgroundId).toBe('bg-solid');
    expect(data.source).toBe('default');
  });
});

describe('clearUserThemeConfig（登录页主题保护）', () => {
  beforeEach(() => {
    localStorage.clear();
    seedMigrationGuard();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('认证闪断经过登录页时保留用户显式选择的单栏风格', () => {
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({ navigationStyleId: 'style3' }),
    );
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, '{"theme":"light"}');
    localStorage.setItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME, '1');

    unifiedThemeService.clearUserThemeConfig({ preserveExplicitChoice: true });

    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).not.toBeNull();
  });

  it('没有显式选择标记时仍允许登录页清除用户主题并应用租户默认', () => {
    localStorage.setItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
      JSON.stringify({ navigationStyleId: 'style3' }),
    );
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, '{"theme":"light"}');

    unifiedThemeService.clearUserThemeConfig({ preserveExplicitChoice: true });

    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).toBeNull();
  });
});
