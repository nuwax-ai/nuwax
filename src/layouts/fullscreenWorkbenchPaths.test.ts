import { describe, expect, it } from 'vitest';
import {
  getSidebarShellLayoutPolicy,
  isFullscreenWorkbenchPath,
} from './fullscreenWorkbenchPaths';

describe('全屏工作台路由壳策略', () => {
  const workbenchPaths = [
    '/space/752/workflow/351',
    '/space/752/agent/433',
    '/space/752/app-dev/9352423779995648',
    '/space/752/app-pro',
    '/space/752/app-dev-design/9352423779995648',
    '/space/752/agent-dev',
  ];

  it.each(workbenchPaths)('识别工作台详情路径 %s', (pathname) => {
    expect(isFullscreenWorkbenchPath(pathname)).toBe(true);
  });

  it('单栏桌面端的网页应用开发详情进入 page-container 壳', () => {
    expect(
      getSidebarShellLayoutPolicy({
        pathname: '/space/752/app-dev/9352423779995648',
        isStyle3: true,
        isMobile: false,
      }),
    ).toEqual({
      variant: 'page',
      suppressSecondMenu: true,
      immersiveMarginTop: false,
    });
  });

  it.each([
    { isStyle3: false, isMobile: false },
    { isStyle3: true, isMobile: true },
  ])('经典风格或移动端仍保持裸全屏：%o', ({ isStyle3, isMobile }) => {
    expect(
      getSidebarShellLayoutPolicy({
        pathname: '/space/752/app-dev/9352423779995648',
        isStyle3,
        isMobile,
      }).variant,
    ).toBe('bare');
  });

  it('普通页面始终使用 page-container 且保留二级菜单', () => {
    expect(
      getSidebarShellLayoutPolicy({
        pathname: '/space/752/project-manage',
        isStyle3: false,
        isMobile: false,
      }),
    ).toEqual({
      variant: 'page',
      suppressSecondMenu: false,
      immersiveMarginTop: true,
    });
  });
});
