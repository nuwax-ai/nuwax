import { describe, expect, it } from 'vitest';

import { resolveSidebarCollapsePolicy } from '@/layouts/DynamicMenusLayout/sidebarCollapsePolicy';

describe('resolveSidebarCollapsePolicy', () => {
  it('Electron 沉浸式折叠时保留主会话列，仅隐藏二级菜单', () => {
    expect(
      resolveSidebarCollapsePolicy({
        collapsed: true,
        immersiveShell: true,
        secondMenuAvailable: true,
      }),
    ).toEqual({
      primarySidebarCollapsed: false,
      secondMenuVisible: false,
    });
  });

  it('Electron 展开时主会话列与可用二级菜单都显示', () => {
    expect(
      resolveSidebarCollapsePolicy({
        collapsed: false,
        immersiveShell: true,
        secondMenuAvailable: true,
      }),
    ).toEqual({
      primarySidebarCollapsed: false,
      secondMenuVisible: true,
    });
  });

  it('浏览器折叠时沿用整栏隐藏行为', () => {
    expect(
      resolveSidebarCollapsePolicy({
        collapsed: true,
        immersiveShell: false,
        secondMenuAvailable: true,
      }),
    ).toEqual({
      primarySidebarCollapsed: true,
      secondMenuVisible: false,
    });
  });

  it('没有二级菜单时不会渲染空列', () => {
    expect(
      resolveSidebarCollapsePolicy({
        collapsed: false,
        immersiveShell: true,
        secondMenuAvailable: false,
      }),
    ).toEqual({
      primarySidebarCollapsed: false,
      secondMenuVisible: false,
    });
  });
});
