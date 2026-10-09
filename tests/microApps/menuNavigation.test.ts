import type { MenuItemDto } from '@/types/interfaces/menu';
import { OpenTypeEnum } from '@/types/menuPermission/menu-manage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { history, nativeOpenWindow, immersiveShell } = vi.hoisted(() => ({
  history: {
    push: vi.fn(),
    replace: vi.fn(),
    location: { pathname: '/', search: '', hash: '' },
  },
  nativeOpenWindow: vi.fn(),
  immersiveShell: { value: false },
}));

vi.mock('umi', () => ({ history }));
vi.mock('@/utils/hostBridge', () => ({
  isImmersiveShell: () => immersiveShell.value,
  hostBridge: { native: { openWindow: nativeOpenWindow } },
}));

import {
  findFirstLevelCodeByPath,
  isMenuMatch,
  isPathMatch,
} from '@/layouts/DynamicMenusLayout/menuMatching';
import {
  buildOpenIframePath,
  handleOpenUrl,
  isInAppIframeMenu,
  navigateOpenIframePath,
  resolveMenuPath,
} from '@/layouts/DynamicMenusLayout/utils';

const menu = (overrides: Partial<MenuItemDto> = {}): MenuItemDto =>
  ({
    code: 'repo',
    path: '%siteUrl%/repo/',
    openType: OpenTypeEnum.CurrentTab,
    ...overrides,
  } as MenuItemDto);

beforeEach(() => {
  vi.clearAllMocks();
  immersiveShell.value = false;
  history.location = { pathname: '/', search: '', hash: '' };
  localStorage.clear();
});

describe('微应用菜单导航', () => {
  it('当前标签菜单用 SPA 入口，不走 iframe；深链选中其一级或二级父菜单', () => {
    expect(resolveMenuPath(menu()).path).toBe('/repo');
    expect(buildOpenIframePath(menu())).toBe('/repo');
    expect(isInAppIframeMenu(menu())).toBe(false);
    handleOpenUrl(menu());
    expect(history.push).toHaveBeenCalledWith(
      '/repo',
      expect.objectContaining({ menuCode: 'repo' }),
    );
    expect(isMenuMatch(menu(), '/repo/doc/a')).toBe(true);
    expect(isPathMatch('/repo-entry', '/repo/doc/a')).toBe(true);
    expect(isMenuMatch(menu(), '/instant-message')).toBe(false);
    expect(
      findFirstLevelCodeByPath(
        [menu({ code: 'resources', path: '/resources', children: [menu()] })],
        '/repo/doc/a',
      ),
    ).toBe('resources');
  });

  it('消息与资料库的选择状态独立，深链不得串到另一个应用', () => {
    const message = menu({
      code: 'message',
      path: '%siteUrl%/instant-message',
    });
    expect(isMenuMatch(message, '/instant-message/conversation/4')).toBe(true);
    expect(isMenuMatch(message, '/repo/doc/a')).toBe(false);
    expect(isMenuMatch(menu(), '/instant-message/conversation/4')).toBe(false);
    expect(
      findFirstLevelCodeByPath(
        [menu(), message],
        '/instant-message/conversation/4',
      ),
    ).toBe('message');
    expect(isPathMatch('/repo/doc/a', '/repo/doc/b')).toBe(false);
  });

  it('在原生壳也使用 SPA，重复点击当前路径不添加历史或刷新标记', () => {
    immersiveShell.value = true;
    handleOpenUrl(menu());
    expect(nativeOpenWindow).not.toHaveBeenCalled();
    history.location = { pathname: '/repo', search: '', hash: '' };
    history.push.mockClear();
    handleOpenUrl(menu());
    expect(history.push).not.toHaveBeenCalled();
    expect(history.replace).not.toHaveBeenCalled();
  });

  it('新标签语义和同 code 第三方 iframe 保持既有行为', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const newTab = menu({ openType: OpenTypeEnum.NewTab });
    handleOpenUrl(newTab);
    expect(windowOpen).toHaveBeenCalledWith(
      `${window.location.origin}/repo/`,
      '_blank',
    );
    expect(history.push).not.toHaveBeenCalled();
    const thirdParty = menu({ path: 'https://third-party.example/repo/' });
    expect(isInAppIframeMenu(thirdParty)).toBe(true);
    handleOpenUrl(thirdParty);
    expect(history.push).toHaveBeenCalledWith(
      '/open-iframe-page/repo?url=https%3A%2F%2Fthird-party.example%2Frepo%2F',
      expect.any(Object),
    );
    windowOpen.mockRestore();
  });

  it('旧缓存入口导航迁回业务深链', () => {
    navigateOpenIframePath(
      `/open-iframe-page/ziliaoku?url=${encodeURIComponent(
        `${window.location.origin}/repo/doc/a?mode=read#title`,
      )}`,
    );
    expect(history.push).toHaveBeenCalledWith(
      '/repo/doc/a?mode=read#title',
      expect.any(Object),
    );
  });
});
