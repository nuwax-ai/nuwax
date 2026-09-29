import ImMenuBadge from '@/components/business-component/ImMenuBadge';
import { subscribeImEvents } from '@/services/imEventBridge';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { OpenTypeEnum } from '@/types/menuPermission/menu-manage';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/userService', () => ({
  getCurrentLoginStatus: () => true,
  subscribeLoginStatus: () => () => {},
}));

const messageMenu = {
  code: 'message',
  path: '/instant-message',
  openType: OpenTypeEnum.CurrentTab,
} as MenuItemDto;

let pushUnread: (total: number) => void = () => {};
let dispose = () => {};

function connect(total: number) {
  window.__im = {
    onUnreadChange: (callback) => {
      pushUnread = (next) => callback({ total: next });
      return () => {};
    },
    getSnapshot: () => ({
      connState: 'connected',
      connected: true,
      unreadTotal: total,
      userId: '1',
    }),
  };
  dispose = subscribeImEvents();
}

function renderBadge(menu?: MenuItemDto) {
  const view = render(
    <ImMenuBadge menu={menu}>
      <span>入口</span>
    </ImMenuBadge>,
  );
  const count = () =>
    view.container.querySelector('.ant-badge-count')?.textContent ?? null;
  return { view, count };
}

afterEach(() => {
  dispose();
  delete window.__im;
});

describe('消息导航未读角标', () => {
  it.each([
    [0, null],
    [1, '1'],
    [99, '99'],
    [100, '99+'],
  ])('未读 %i 显示 %s', (total, text) => {
    connect(total);
    expect(renderBadge(messageMenu).count()).toBe(text);
  });

  it('IM 推送未读变化后角标跟随', () => {
    connect(5);
    const { count } = renderBadge(messageMenu);
    act(() => pushUnread(120));
    expect(count()).toBe('99+');
  });

  it('非消息菜单、新标签打开的消息菜单和缺省菜单不包角标', () => {
    connect(8);
    for (const menu of [
      { ...messageMenu, code: 'notify', path: '/notify' },
      { ...messageMenu, openType: OpenTypeEnum.NewTab },
      undefined,
    ]) {
      const { view } = renderBadge(menu);
      expect(view.container.querySelector('.ant-badge')).toBeNull();
      expect(view.getByText('入口')).toBeInTheDocument();
      view.unmount();
    }
  });
});
