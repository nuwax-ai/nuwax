import { beforeEach, describe, expect, it } from 'vitest';

import {
  NAV_STYLE_MIGRATION_GUARD_KEY,
  USER_THEME_CONFIG_STORAGE_KEY,
  migrateLegacyNavigationStyleToStyle3,
} from '@/services/navStyleMigration';

/** 构造带 navigationStyleId 的用户主题配置 JSON */
const userThemeConfig = (navigationStyleId: string, extra = {}) =>
  JSON.stringify({
    selectedThemeColor: '#5147ff',
    navigationStyleId,
    ...extra,
  });

describe('migrateLegacyNavigationStyleToStyle3', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('存量 style1 回声被改写为 style3，其余字段保留', () => {
    localStorage.setItem(
      USER_THEME_CONFIG_STORAGE_KEY,
      userThemeConfig('style1', { selectedBackgroundId: 'bg-variant-1' }),
    );

    const migrated = migrateLegacyNavigationStyleToStyle3(localStorage);

    expect(migrated).toBe(true);
    expect(
      JSON.parse(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)!),
    ).toMatchObject({
      navigationStyleId: 'style3',
      selectedBackgroundId: 'bg-variant-1',
      selectedThemeColor: '#5147ff',
    });
    expect(localStorage.getItem(NAV_STYLE_MIGRATION_GUARD_KEY)).toBeTruthy();
  });

  it('存量 style2 同样迁移到 style3', () => {
    localStorage.setItem(
      USER_THEME_CONFIG_STORAGE_KEY,
      userThemeConfig('style2'),
    );

    migrateLegacyNavigationStyleToStyle3(localStorage);

    expect(
      JSON.parse(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)!)
        .navigationStyleId,
    ).toBe('style3');
  });

  it('已是 style3 的配置不改写（只动 navigationStyleId）', () => {
    localStorage.setItem(
      USER_THEME_CONFIG_STORAGE_KEY,
      userThemeConfig('style3'),
    );

    migrateLegacyNavigationStyleToStyle3(localStorage);

    expect(
      JSON.parse(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)!),
    ).toMatchObject({ navigationStyleId: 'style3' });
  });

  it('guard 存在时不再迁移：迁移后的显式选择不被覆盖', () => {
    localStorage.setItem(
      USER_THEME_CONFIG_STORAGE_KEY,
      userThemeConfig('style1'),
    );
    localStorage.setItem(NAV_STYLE_MIGRATION_GUARD_KEY, '1725000000000');

    const migrated = migrateLegacyNavigationStyleToStyle3(localStorage);

    expect(migrated).toBe(false);
    // guard 之后用户显式切回的经典布局必须原样保留
    expect(
      JSON.parse(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)!)
        .navigationStyleId,
    ).toBe('style1');
  });

  it('坏 JSON 不阻断：跳过改写但仍落 guard', () => {
    localStorage.setItem(USER_THEME_CONFIG_STORAGE_KEY, '{not-json');

    expect(() =>
      migrateLegacyNavigationStyleToStyle3(localStorage),
    ).not.toThrow();
    expect(localStorage.getItem(NAV_STYLE_MIGRATION_GUARD_KEY)).toBeTruthy();
    expect(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)).toBe(
      '{not-json',
    );
  });

  it('无存量配置时仅落 guard（新用户走新默认 style3）', () => {
    const migrated = migrateLegacyNavigationStyleToStyle3(localStorage);

    expect(migrated).toBe(true);
    expect(localStorage.getItem(USER_THEME_CONFIG_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(NAV_STYLE_MIGRATION_GUARD_KEY)).toBeTruthy();
  });
});
