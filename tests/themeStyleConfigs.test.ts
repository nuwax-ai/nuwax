import { describe, expect, it, vi } from 'vitest';

// theme.constants 经 i18nRuntime 传递依赖 umi（测试环境会触发 esbuild 基线问题），
// 拦截掉 i18n 运行时，本测试只关心常量本身
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

import {
  DEFAULT_THEME_CONFIG,
  STYLE_CONFIGS,
} from '@/constants/theme.constants';

/** 布局深浅色 × 导航风格 的完整组合键（applyToDOM 按此拼接取配置） */
const LAYOUT_STYLES = ['light', 'dark'] as const;
const NAVIGATION_STYLES = ['style1', 'style2', 'style3'] as const;

describe('STYLE_CONFIGS 布局组合完整性（style3 单栏接入）', () => {
  it.each(LAYOUT_STYLES.flatMap(
    (layoutStyle) =>
      NAVIGATION_STYLES.map(
        (navigationStyle) => `${layoutStyle}-${navigationStyle}`,
      ),
  ))('组合键 %s 存在且含 navigation 变量', (comboKey) => {
    const config = STYLE_CONFIGS[comboKey];
    expect(config).toBeDefined();
    expect(config.navigation['--xagi-nav-first-menu-width']).toBeTruthy();
    expect(Object.keys(config.layout).length).toBeGreaterThan(0);
  });

  it('style3 变量组克隆自 style1（保持单栏改造上线时的线上表现）', () => {
    expect(STYLE_CONFIGS['light-style3'].layout).toEqual(
      STYLE_CONFIGS['light-style1'].layout,
    );
    expect(STYLE_CONFIGS['dark-style3'].navigation).toEqual(
      STYLE_CONFIGS['dark-style1'].navigation,
    );
  });

  it('默认导航风格为 style3（单栏）', () => {
    expect(DEFAULT_THEME_CONFIG.NAVIGATION_STYLE).toBe('style3');
  });
});
