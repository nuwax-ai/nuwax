/**
 * NavigationStylePanel 深浅卡禁用态组件测试（2026-09-20 单栏锁浅色需求）。
 *
 * - 默认全量三档（style1/2/3），系统/用户两侧同源
 * - themeToggleDisabled：深浅选项区置灰（disabled 类 + 提示词条）且点击不触发回调
 *
 * vitest 下 plain .less 非 CSS Modules、默认导出 undefined（仓内既有坑）：
 * 回显 key 本身，保住 [class*="colorPreview"] 这类按字面类名的断言。
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));

vi.mock('@/utils/hostBridge', () => ({
  isDesktopHost: () => false,
}));

vi.mock('./NavigationStylePanel.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import NavigationStylePanel from './NavigationStylePanel';

/** 深浅两张预览卡（浅色在前、深色在后），点击挂在外层 colorPreview 上 */
const colorPreviews = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[class*="colorPreview"]'));

describe('NavigationStylePanel 深浅卡禁用（单栏锁浅色）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('默认渲染全量三档导航风格（style1/2/3），系统/用户两侧同源', () => {
    const { container } = render(
      <NavigationStylePanel
        isNavigationDarkMode={false}
        onNavigationThemeToggle={() => {}}
      />,
    );
    // 整词 class 选择器：[class*=styleOption] 会连外层 styleOptions 容器一起算
    expect(container.querySelectorAll('.styleOption').length).toBe(3);
  });

  it('themeToggleDisabled：深浅选项区置灰 + 提示词条，点击不触发切换回调', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <NavigationStylePanel
        isNavigationDarkMode={false}
        onNavigationThemeToggle={onToggle}
        themeToggleDisabled
      />,
    );
    // 选项区整体带 disabled 类（.colorOptions 整词匹配，避开外层
    // navigationColorOptions 的子串误命中）；置灰态下提示词条可见
    expect(
      container.querySelector('.colorOptions')?.classList.contains('disabled'),
    ).toBe(true);
    expect(
      screen.getByText(
        'PC.Components.ThemeConfigNavigationStylePanel.themeLockedHint',
      ),
    ).toBeTruthy();
    // 深色卡（第二张）点击被兜底拦截（jsdom 不吃 pointer-events，靠 JS 守卫）
    fireEvent.click(colorPreviews(container)[1]!);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('未禁用时点击深色卡正常触发切换回调', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <NavigationStylePanel
        isNavigationDarkMode={false}
        onNavigationThemeToggle={onToggle}
      />,
    );
    fireEvent.click(colorPreviews(container)[1]!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
