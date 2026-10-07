import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beginRepoRuntime,
  endRepoRuntime,
  toRepoPortalRect,
} from '../../micro-frontends/repo-web/overlay/src/hostRuntime';

afterEach(() => {
  endRepoRuntime();
  vi.restoreAllMocks();
});

describe('资料库浮出编辑器的锚点矩形', () => {
  it('内嵌根偏移与边框只改变坐标，保留小数宽高供编辑器设置尺寸', () => {
    const root = document.createElement('div');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 200,
    } as DOMRect);
    Object.defineProperties(root, {
      clientLeft: { value: 3 },
      clientTop: { value: 5 },
      clientWidth: { value: 400 },
      clientHeight: { value: 300 },
    });
    beginRepoRuntime(root, { path: '/repo/' }, true);

    expect(
      toRepoPortalRect({ left: 143, right: 227.5, top: 245, bottom: 277.25 }),
    ).toEqual({
      left: 40,
      right: 124.5,
      top: 40,
      bottom: 72.25,
      width: 84.5,
      height: 32.25,
    });
  });

  it('独立页面沿用视口坐标和尺寸', () => {
    expect(
      toRepoPortalRect({ left: 20, right: 120, top: 30, bottom: 65 }),
    ).toEqual({
      left: 20,
      right: 120,
      top: 30,
      bottom: 65,
      width: 100,
      height: 35,
    });
  });
});
