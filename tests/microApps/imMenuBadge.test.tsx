import ImMenuBadge from '@/components/business-component/ImMenuBadge';
import DynamicMenusLayout from '@/layouts/DynamicMenusLayout';
import { imUnreadState, subscribeImEvents } from '@/services/imEventBridge';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  MenuEnabledEnum,
  OpenTypeEnum,
} from '@/types/menuPermission/menu-manage';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  loggedIn: true,
  loginListeners: new Set<() => void>(),
  menuTree: [] as MenuItemDto[],
  location: { pathname: '/home', search: '', hash: '', key: 'initial' },
  style: 'style3',
}));

vi.mock('umi', () => ({
  request: mocks.request,
  useLocation: () => mocks.location,
  useModel: () => ({ menuTree: mocks.menuTree }),
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ effectiveNavigationStyle: mocks.style }),
}));
vi.mock('@/layouts/DynamicMenusLayout/ClassicLayout', () => ({
  default: () => <span>经典导航</span>,
}));
vi.mock('@/layouts/DynamicMenusLayout/SidebarNavLayout', () => ({
  default: () => <span>单栏导航</span>,
}));
vi.mock('@/layouts/DynamicMenusLayout/useCreditSummaryPolling', () => ({
  useCreditSummaryPolling: () => {},
}));

vi.mock('@/services/userService', () => ({
  getCurrentLoginStatus: () => mocks.loggedIn,
  subscribeLoginStatus: (listener: () => void) => {
    mocks.loginListeners.add(listener);
    return () => mocks.loginListeners.delete(listener);
  },
}));

const messageMenu = {
  code: 'message',
  path: '/instant-message',
  openType: OpenTypeEnum.CurrentTab,
  status: MenuEnabledEnum.Enabled,
} as MenuItemDto;

let pushUnread: (total: number) => void = () => {};
let dispose = () => {};
const originalBridge = window.NuwaClawBridge;

const success = (total: number) => ({ code: '0000', data: { total } });

function deferred() {
  let resolve!: (value: ReturnType<typeof success>) => void;
  const promise = new Promise<ReturnType<typeof success>>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

async function settle() {
  await act(async () => {});
}

function login(loggedIn: boolean) {
  act(() => {
    mocks.loggedIn = loggedIn;
    mocks.loginListeners.forEach((listener) => listener());
  });
}

function renderNavigation() {
  const content = () => (
    <>
      <DynamicMenusLayout />
      <ImMenuBadge menu={messageMenu}>伙伴</ImMenuBadge>
    </>
  );
  const view = render(content());
  return {
    ...view,
    navigate(pathname: string, search = '', hash = '') {
      mocks.location = { pathname, search, hash, key: String(Math.random()) };
      view.rerender(content());
    },
    rerenderNavigation() {
      view.rerender(content());
    },
  };
}

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

beforeEach(() => {
  mocks.request.mockReset().mockResolvedValue(success(0));
  mocks.loggedIn = true;
  mocks.menuTree = [messageMenu];
  mocks.location = { pathname: '/home', search: '', hash: '', key: 'initial' };
  mocks.style = ThemeNavigationStyleType.STYLE3;
  window.NuwaClawBridge = undefined;
});

afterEach(() => {
  cleanup();
  dispose();
  dispose = () => {};
  mocks.loginListeners.clear();
  delete window.__im;
  window.NuwaClawBridge = originalBridge;
});

describe('导航主动校准伙伴未读数', () => {
  it.each([ThemeNavigationStyleType.STYLE1, ThemeNavigationStyleType.STYLE3])(
    '%s 未打开伙伴时也查询，切换其他菜单及参数变化继续更新',
    async (style) => {
      mocks.style = style;
      mocks.request.mockResolvedValue(success(5));
      const view = renderNavigation();
      await settle();
      expect(window.__im).toBeUndefined();
      expect(view.getByTitle('5')).toHaveAttribute('data-show', 'true');
      expect(mocks.request).toHaveBeenCalledWith(
        '/api/instant-message/unread-total',
        { method: 'GET', silentPolling: true },
      );
      mocks.request.mockResolvedValue(success(8));
      view.navigate('/space');
      await settle();
      expect(view.getByTitle('8')).toHaveAttribute('data-show', 'true');
      mocks.request.mockResolvedValue(success(11));
      view.navigate('/space/resource', '?type=agent');
      await settle();
      expect(view.getByTitle('11')).toHaveAttribute('data-show', 'true');
      view.navigate('/space/resource', '?type=skill');
      await settle();
      expect(mocks.request).toHaveBeenCalledTimes(4);
      // 同址 push/replace 会改变 history key，仍不重复查询。
      view.navigate('/space/resource', '?type=skill');
      view.rerenderNavigation();
      expect(mocks.request).toHaveBeenCalledTimes(4);
    },
  );

  it('菜单延迟就绪时补查，菜单对象更新或切换布局不重复查询', async () => {
    mocks.menuTree = [];
    const view = renderNavigation();
    expect(mocks.request).not.toHaveBeenCalled();
    mocks.menuTree = [
      {
        code: 'parent',
        status: MenuEnabledEnum.Enabled,
        children: [messageMenu],
      } as MenuItemDto,
    ];
    mocks.request.mockResolvedValue(success(3));
    view.rerenderNavigation();
    await settle();
    expect(view.getByTitle('3')).toHaveAttribute('data-show', 'true');
    mocks.menuTree = [...mocks.menuTree];
    mocks.style = ThemeNavigationStyleType.STYLE1;
    view.rerenderNavigation();
    expect(mocks.request).toHaveBeenCalledOnce();
  });

  it('快速切换的旧响应不会覆盖最新查询', async () => {
    const old = deferred();
    mocks.request
      .mockReturnValueOnce(old.promise)
      .mockResolvedValue(success(9));
    const view = renderNavigation();
    view.navigate('/space');
    await settle();
    expect(imUnreadState.getSnapshot()).toBe(9);
    await act(async () => old.resolve(success(20)));
    expect(imUnreadState.getSnapshot()).toBe(9);
  });

  it('IM 挂载的初始快照不使在途导航查询失效', async () => {
    const pending = deferred();
    mocks.request.mockReturnValue(pending.promise);
    renderNavigation();
    act(() => connect(0));
    await act(async () => pending.resolve(success(9)));
    expect(imUnreadState.getSnapshot()).toBe(9);
  });

  it('导航已查询成功时，IM 初始占位快照不覆盖最新数量', async () => {
    mocks.request.mockResolvedValue(success(9));
    renderNavigation();
    await settle();
    act(() => connect(0));
    expect(imUnreadState.getSnapshot()).toBe(9);
  });

  it.each([
    ['伙伴禁用', [{ ...messageMenu, status: MenuEnabledEnum.Disabled }]],
    ['伙伴未启用', [{ ...messageMenu, status: undefined }]],
    [
      '祖先禁用',
      [
        {
          code: 'parent',
          status: MenuEnabledEnum.Disabled,
          children: [messageMenu],
        },
      ],
    ],
  ])('%s 时不触发查询', async (_label, menus) => {
    mocks.menuTree = menus as MenuItemDto[];
    const view = renderNavigation();
    view.navigate('/space');
    await settle();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it.each([5, 7, 0])(
    '查询期间收到 IM 推送 %i，晚到响应不覆盖推送',
    async (total) => {
      connect(5);
      const pending = deferred();
      mocks.request.mockReturnValue(pending.promise);
      const view = renderNavigation();
      act(() => pushUnread(total));
      await act(async () => pending.resolve(success(99)));
      expect(imUnreadState.getSnapshot()).toBe(total);
      // IM 隐藏保活时，从其他导航切换也仍能通过查询更新。
      mocks.request.mockResolvedValue(success(2));
      view.navigate('/space');
      await settle();
      expect(view.getByTitle('2')).toHaveAttribute('data-show', 'true');
    },
  );

  it('未打开 IM 时登出清零，旧请求不能串到重新登录的账号', async () => {
    const pending = deferred();
    mocks.request
      .mockResolvedValueOnce(success(6))
      .mockReturnValueOnce(pending.promise);
    const view = renderNavigation();
    await settle();
    expect(imUnreadState.getSnapshot()).toBe(6);
    view.navigate('/space');
    login(false);
    expect(imUnreadState.getSnapshot()).toBe(0);
    mocks.request.mockResolvedValue(success(2));
    login(true);
    await settle();
    await act(async () => pending.resolve(success(100)));
    expect(imUnreadState.getSnapshot()).toBe(2);
  });

  it.each(['卸载', '权限移除', '清会话'])(
    '%s 后在途响应不得回写',
    async (action) => {
      const pending = deferred();
      mocks.request
        .mockResolvedValueOnce(success(4))
        .mockReturnValueOnce(pending.promise);
      const view = renderNavigation();
      await settle();
      view.navigate('/space');
      if (action === '卸载') view.unmount();
      if (action === '权限移除') {
        mocks.menuTree = [];
        view.rerenderNavigation();
      }
      if (action === '清会话')
        act(() => eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED));
      const previous = imUnreadState.getSnapshot();
      await act(async () => pending.resolve(success(100)));
      expect(imUnreadState.getSnapshot()).toBe(previous);
    },
  );

  it.each([
    new Error('offline'),
    { code: 'FAIL', data: { total: 0 } },
    success(-1),
    success(1.5),
    { code: '0000', data: {} },
  ])('失败或非法结果 %j 保留原值，下次导航可重试', async (failure) => {
    mocks.request.mockResolvedValueOnce(success(5));
    const view = renderNavigation();
    await settle();
    if (failure instanceof Error) mocks.request.mockRejectedValueOnce(failure);
    else mocks.request.mockResolvedValueOnce(failure);
    view.navigate('/space');
    await settle();
    expect(imUnreadState.getSnapshot()).toBe(5);
    mocks.request.mockResolvedValueOnce({
      code: '0000',
      data: { total: 0, dndTotal: 9 },
    });
    view.navigate('/home');
    await settle();
    expect(imUnreadState.getSnapshot()).toBe(0);
  });

  it('未登录时不请求，登录后立即补查', async () => {
    mocks.loggedIn = false;
    const view = renderNavigation();
    view.navigate('/space');
    expect(mocks.request).not.toHaveBeenCalled();
    mocks.request.mockResolvedValue(success(3));
    login(true);
    await settle();
    expect(imUnreadState.getSnapshot()).toBe(3);
    expect(mocks.request).toHaveBeenCalledOnce();
  });

  it.each(['无伙伴菜单', '原生未读桥'])(
    '%s 时不发起 Web 请求',
    async (mode) => {
      if (mode === '无伙伴菜单') mocks.menuTree = [];
      else {
        window.NuwaClawBridge = {
          host: { getProduct: () => 'nuwax' },
          im: {
            getUnreadSnapshot: vi.fn(),
            onUnreadChanged: vi.fn(),
          },
        };
      }
      const view = renderNavigation();
      view.navigate('/space');
      await settle();
      login(false);
      login(true);
      expect(mocks.request).not.toHaveBeenCalled();
    },
  );
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
