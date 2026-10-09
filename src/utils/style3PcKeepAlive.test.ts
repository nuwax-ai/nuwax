import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { describe, expect, it } from 'vitest';
import { resolveStyle3PcKeepAliveEnabled } from './style3PcKeepAlive';

describe('PC style3 整页保活门禁', () => {
  it('桌面端 style3 启用且不区分浏览器或商业客户端宿主', () => {
    expect(
      resolveStyle3PcKeepAliveEnabled(ThemeNavigationStyleType.STYLE3, false),
    ).toBe(true);
  });

  it.each([ThemeNavigationStyleType.STYLE1, ThemeNavigationStyleType.STYLE2])(
    '%s 桌面端不启用',
    (navigationStyle) => {
      expect(resolveStyle3PcKeepAliveEnabled(navigationStyle, false)).toBe(
        false,
      );
    },
  );

  it('移动端 style3 不启用', () => {
    expect(
      resolveStyle3PcKeepAliveEnabled(ThemeNavigationStyleType.STYLE3, true),
    ).toBe(false);
  });
});
