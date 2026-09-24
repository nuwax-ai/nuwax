/**
 * SidebarShell 形态切换保挂载测试（禅道bug2487）。
 *
 * 守卫行为契约：
 * - variant 在 page ↔ bare 间翻转（窗口缩放跨越移动断点 768 时
 *   layouts/index 依 isMobile 换形态）时，children 始终保持挂载：
 *   不重挂、不丢内部状态（如 AppDevPro 预览 iframe / 会话现场）。
 * - bare 形态不挂侧栏与 page-container；page 形态两者齐全。
 * - 侧栏引导数据（loadMenus 等）跨形态翻转不重复装载。
 */
import { render, screen } from '@testing-library/react';
import React, { useEffect, useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SidebarShell from './index';

const {
  layoutState,
  loadMenusMock,
  runQueryCategoryMock,
  asyncSpaceListFunMock,
} = vi.hoisted(() => ({
  layoutState: {
    isMobile: false,
    setIsMobile: vi.fn(),
    realHidden: false,
    setRealHidden: vi.fn(),
    fullMobileMenu: false,
    setFullMobileMenu: vi.fn(),
    getCurrentMenuWidth: vi.fn(() => 200),
    handleCloseMobileMenu: vi.fn(),
    isSecondMenuCollapsed: false,
  },
  loadMenusMock: vi.fn(),
  runQueryCategoryMock: vi.fn(),
  asyncSpaceListFunMock: vi.fn(),
}));

vi.mock('umi', () => ({
  useModel: (name: string) => {
    if (name === 'layout') return layoutState;
    if (name === 'spaceModel')
      return { asyncSpaceListFun: asyncSpaceListFunMock };
    if (name === 'menuModel') return { loadMenus: loadMenusMock };
    return {};
  },
}));

vi.mock('@/hooks/useCategory', () => ({
  default: () => ({ runQueryCategory: runQueryCategoryMock }),
}));

// i18nRuntime 打桩：组件收集链上多个模块（userService → home.constants、
// square.constants 等）在模块顶层调 dict()，真实实现依赖 umi 运行时
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

// 保活容器替身：本测试关注 variant 翻转的插槽结构，容器内的
// openedAppTabs/appTabKeepAlive model 语义由 tests/openedAppTabsKeepAlive.test.tsx 专测
vi.mock('./OpenedAppTabsKeepAlive', () => ({
  default: () => <div data-testid="keep-alive-container" />,
}));

vi.mock('./ClientConversationKeepAlive', () => ({
  default: () => <div data-testid="client-conversation-keep-alive" />,
}));

vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({
    effectiveNavigationStyle: 'style3',
    layoutStyle: 'style3',
  }),
}));

vi.mock('../DynamicMenusLayout', () => ({
  default: () => <div data-testid="dynamic-menus" />,
}));

vi.mock('../HoverMenu', () => ({
  default: () => <div data-testid="hover-menu" />,
}));
vi.mock('../Message', () => ({ default: () => <div data-testid="message" /> }));
vi.mock('../Setting', () => ({ default: () => <div data-testid="setting" /> }));
vi.mock('../MobileMenu', () => ({
  default: () => <div data-testid="mobile-menu" />,
}));

// less 模块按类名直出（与 FilePreview 测试同款处理）
vi.mock('../index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

/** 记录挂载/卸载次数与存活 DOM 节点的探针children */
let probeMountCount = 0;
let probeUnmountCount = 0;
let probeNode: HTMLDivElement | null = null;
const Probe: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    probeMountCount += 1;
    probeNode = ref.current;
    return () => {
      probeUnmountCount += 1;
    };
  }, []);
  return (
    <div ref={ref} data-testid="probe">
      workbench-content
    </div>
  );
};

describe('SidebarShell variant 翻转不重挂 children', () => {
  beforeEach(() => {
    probeMountCount = 0;
    probeUnmountCount = 0;
    probeNode = null;
    vi.clearAllMocks();
    layoutState.isMobile = false;
  });

  it('page → bare → page 翻转时 children 保持挂载（bug2487）', () => {
    const { rerender } = render(
      <SidebarShell variant="page">
        <Probe />
      </SidebarShell>,
    );

    // page 形态：侧栏 + page-container 齐全，探针挂载一次
    expect(probeMountCount).toBe(1);
    expect(document.getElementById('mobile-menu-container')).toBeTruthy();
    expect(document.getElementById('page-container-selector')).toBeTruthy();
    expect(screen.getByTestId('probe')).toBeTruthy();

    // 缩窗跨越移动断点 → layouts 依 isMobile 切 bare
    rerender(
      <SidebarShell variant="bare">
        <Probe />
      </SidebarShell>,
    );

    // bare：侧栏与 page-container 摘除
    expect(document.getElementById('mobile-menu-container')).toBeNull();
    expect(document.getElementById('page-container-selector')).toBeNull();
    // 关键契约：children 未重挂（仍是一次挂载，DOM 节点未换）
    expect(probeMountCount).toBe(1);
    expect(probeNode?.isConnected).toBe(true);
    expect(screen.getByTestId('probe').textContent).toBe('workbench-content');

    // 拖回桌面宽度 → page 形态恢复，children 仍不重挂
    rerender(
      <SidebarShell variant="page">
        <Probe />
      </SidebarShell>,
    );
    expect(document.getElementById('mobile-menu-container')).toBeTruthy();
    expect(document.getElementById('page-container-selector')).toBeTruthy();
    expect(probeMountCount).toBe(1);
    expect(probeUnmountCount).toBe(0);
    expect(probeNode?.isConnected).toBe(true);
  });

  it('侧栏引导数据跨形态翻转只装载一次', () => {
    const { rerender } = render(
      <SidebarShell variant="page">
        <Probe />
      </SidebarShell>,
    );
    rerender(
      <SidebarShell variant="bare">
        <Probe />
      </SidebarShell>,
    );
    rerender(
      <SidebarShell variant="page">
        <Probe />
      </SidebarShell>,
    );
    expect(loadMenusMock).toHaveBeenCalledTimes(1);
    expect(runQueryCategoryMock).toHaveBeenCalledTimes(1);
    expect(asyncSpaceListFunMock).toHaveBeenCalledTimes(1);
  });
});
