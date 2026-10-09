import { describe, expect, it } from 'vitest';

import { resolveSidebarCollapsePolicy } from '@/layouts/DynamicMenusLayout/sidebarCollapsePolicy';

describe('resolveSidebarCollapsePolicy', () => {
  it('沉浸壳折叠时整条侧栏收起（单栏 + 二级菜单一起）', () => {
    expect(
      resolveSidebarCollapsePolicy({
        collapsed: true,
        immersiveShell: true,
        secondMenuAvailable: true,
      }),
    ).toEqual({
      primarySidebarCollapsed: true,
      secondMenuVisible: false,
    });
  });

  it('沉浸壳展开时单栏与可用二级菜单都显示', () => {
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

  it('浏览器折叠时整栏隐藏', () => {
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
