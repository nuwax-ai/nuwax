/**
 * 侧栏折叠 hook 移动端防护测试（#16 review 修复「移动端空侧栏遮死」）：
 * 单栏模式下 isSecondMenuCollapsed=true 会让整屏 fixed 容器失去平移偏移
 * （getCurrentMenuWidth=0 → translateX(0)，空壳侧栏盖死内容且 caret 失效）。
 * 1. 移动端初始化强制展开（不吃 sessionStorage 偏好 / hideMenu 参数）；
 * 2. 移动端 toggleCollapse 切换的是抽屉（fullMobileMenu），绝不进入折叠态；
 * 3. 桌面端行为不变：偏好持久化到 sessionStorage、toggle 更新折叠状态；
 * 4. 桌面端 hideMenu=true 仍可折叠（独立会话页场景）。
 */
import { useSidebarCollapse } from '@/layouts/DynamicMenusLayout/useSidebarCollapse';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { setIsSecondMenuCollapsed, setFullMobileMenu } = vi.hoisted(() => ({
  setIsSecondMenuCollapsed: vi.fn(),
  setFullMobileMenu: vi.fn(),
}));

const layoutState: Record<string, unknown> = {
  isMobile: false,
  isSecondMenuCollapsed: false,
  setIsSecondMenuCollapsed,
  setFullMobileMenu,
};

let searchParams = new URLSearchParams('');

vi.mock('umi', () => ({
  useModel: () => layoutState,
  useSearchParams: () => [searchParams],
}));

vi.mock('@/utils/nuwaClawBridge', () => ({
  isImmersiveShell: () => false,
}));

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  searchParams = new URLSearchParams('');
  layoutState.isMobile = false;
  layoutState.isSecondMenuCollapsed = false;
});

describe('useSidebarCollapse 移动端防护', () => {
  it('移动端初始化强制展开，不读取偏好也不吃 hideMenu', () => {
    sessionStorage.setItem(
      'menu-collapsed-user-preference',
      JSON.stringify({ collapsed: true }),
    );
    searchParams = new URLSearchParams('hideMenu=true');
    layoutState.isMobile = true;
    renderHook(() => useSidebarCollapse());
    expect(setIsSecondMenuCollapsed).toHaveBeenCalledTimes(1);
    expect(setIsSecondMenuCollapsed).toHaveBeenCalledWith(false);
  });

  it('移动端 toggleCollapse 切换抽屉而非折叠态', () => {
    layoutState.isMobile = true;
    const { result } = renderHook(() => useSidebarCollapse());
    act(() => result.current.toggleCollapse());
    expect(setFullMobileMenu).toHaveBeenCalledTimes(1);
    expect(setIsSecondMenuCollapsed).not.toHaveBeenCalledWith(true);
  });

  it('桌面端 hideMenu=true 时折叠（独立会话页场景）', () => {
    searchParams = new URLSearchParams('hideMenu=true');
    renderHook(() => useSidebarCollapse());
    expect(setIsSecondMenuCollapsed).toHaveBeenCalledWith(true);
  });

  it('桌面端 toggleCollapse 写偏好并更新状态', () => {
    layoutState.isSecondMenuCollapsed = false;
    const { result } = renderHook(() => useSidebarCollapse());
    act(() => result.current.toggleCollapse());
    expect(setIsSecondMenuCollapsed).toHaveBeenCalledWith(true);
    expect(sessionStorage.getItem('menu-collapsed-user-preference')).toContain(
      '"collapsed":true',
    );
    expect(setFullMobileMenu).not.toHaveBeenCalled();
  });
});
