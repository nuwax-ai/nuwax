import { describe, expect, it } from 'vitest';
import {
  getSidebarShellLayoutPolicy,
  isFullscreenWorkbenchPath,
  shouldSeedWorkbenchHistoryBase,
} from './fullscreenWorkbenchPaths';

const workbenchPaths = [
  '/space/752/workflow/351',
  '/space/752/agent/433',
  '/space/752/app-dev/9352423779995648',
  '/space/752/app-pro/29/42',
  '/space/752/app-dev-design/9352423779995648',
  '/space/752/agent-dev',
];

describe('全屏工作台路由壳策略', () => {
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

describe('工作台页历史栈兜底判定（shouldSeedWorkbenchHistoryBase）', () => {
  it.each(workbenchPaths)(
    '直开工作台页（历史栈只有本条）需要垫栈底：%s',
    (pathname) => {
      expect(shouldSeedWorkbenchHistoryBase(pathname, 1)).toBe(true);
    },
  );

  it.each(workbenchPaths)(
    '正常压栈进入（历史栈已有来源条目）不需要垫栈底：%s',
    (pathname) => {
      expect(shouldSeedWorkbenchHistoryBase(pathname, 2)).toBe(false);
    },
  );

  it.each(['/home', '/space/752/develop', '/space/752/library', '/'])(
    '非工作台路径一律不垫栈底：%s',
    (pathname) => {
      expect(shouldSeedWorkbenchHistoryBase(pathname, 1)).toBe(false);
    },
  );

  it('历史栈长度为 0（异常兜底）按需垫栈底', () => {
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/app-pro/29/42', 0),
    ).toBe(true);
  });
});

describe('壳链条目垫栈判定（桌面壳启动链，NW-167）', () => {
  it.each(workbenchPaths)(
    '壳中间条目垫在栈前（栈长 ≥2 且路由 idx=0）仍需垫栈底：%s',
    (pathname) => {
      expect(shouldSeedWorkbenchHistoryBase(pathname, 2, { idx: 0 })).toBe(
        true,
      );
      expect(shouldSeedWorkbenchHistoryBase(pathname, 3, { idx: 0, key: 'x' })).toBe(
        true,
      );
    },
  );

  it('正常路由压栈进入（idx ≥1）不垫栈底', () => {
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/app-dev/9352423779995648', 2, {
        idx: 1,
      }),
    ).toBe(false);
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/agent-dev', 4, { idx: 2 }),
    ).toBe(false);
  });

  it('state 无 idx（非 router 写入 / 旧环境）退化为仅按栈长判定', () => {
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/app-dev/9352423779995648', 2, null),
    ).toBe(false);
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/workflow/351', 2, { foo: 1 }),
    ).toBe(false);
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/workflow/351', 2, { idx: '0' }),
    ).toBe(false);
  });

  it('栈长 ≤1 优先于 state 判定（直开场景不受 state 干扰）', () => {
    expect(
      shouldSeedWorkbenchHistoryBase('/space/752/agent-dev', 1, { idx: 5 }),
    ).toBe(true);
  });

  it('非工作台路径即使 idx=0 也不垫栈底', () => {
    expect(shouldSeedWorkbenchHistoryBase('/home', 2, { idx: 0 })).toBe(false);
  });
});
