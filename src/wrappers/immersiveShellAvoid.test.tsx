import { fullPageInstanceCacheManager } from '@/features/conversation/react/useFullPageInstanceCache';
import ClientConversationKeepAlive from '@/layouts/SidebarShell/ClientConversationKeepAlive';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImmersiveShellAvoid from './immersiveShellAvoid';

const mocks = vi.hoisted(() => ({
  location: { pathname: '/home', search: '' },
  immersive: true,
  navigationStyle: 'style3',
  isMobile: false,
  outletIsEmpty: false,
}));

vi.mock('@/utils/hostBridge', () => ({
  isImmersiveShell: () => mocks.immersive,
  syncShellAvoidanceCss: vi.fn(),
}));

vi.mock('@/hooks/useUnifiedTheme', () => ({
  default: () => ({ effectiveNavigationStyle: mocks.navigationStyle }),
}));

vi.mock('umi', () => {
  const WorkbenchRenderer = () => <div data-testid="resident-workbench" />;
  const clientConversationRenderers = {
    'ide-workspace': WorkbenchRenderer,
    'agent-workspace': WorkbenchRenderer,
  };
  return {
    history: { action: 'PUSH' },
    useLocation: () => mocks.location,
    useModel: (name: string) =>
      name === 'layout'
        ? { isMobile: mocks.isMobile }
        : { clientConversationRenderers },
    Outlet: () =>
      mocks.outletIsEmpty ? null : <div data-testid="route-workbench" />,
  };
});

beforeEach(() => {
  mocks.location = { pathname: '/home', search: '' };
  mocks.immersive = true;
  mocks.navigationStyle = 'style3';
  mocks.isMobile = false;
  mocks.outletIsEmpty = false;
  fullPageInstanceCacheManager.invalidateAll('test-setup');
});

afterEach(() => {
  act(() => fullPageInstanceCacheManager.invalidateAll('test-cleanup'));
});

describe('沉浸式路由包装层与常驻工作台', () => {
  it.each([
    ['/space/752/app-pro/147/1694001', ''],
    ['/space/752/agent-dev', '?agentId=1596&conversationId=1694001'],
  ])('PC style3 空路由 %s 与真实缓存宿主并列时不占一屏', (pathname, search) => {
    mocks.location = { pathname, search };
    // 对应路由入口交给常驻宿主后返回 null；页面由真实缓存容器挂载。
    mocks.outletIsEmpty = true;
    const { container } = render(
      <div id="page-container-selector">
        <ImmersiveShellAvoid />
        <ClientConversationKeepAlive />
      </div>,
    );

    const pageContainer = container.firstElementChild!;
    expect(pageContainer.children).toHaveLength(1);
    expect(pageContainer.firstElementChild).toBe(
      screen.getByTestId('client-conversation-keepalive'),
    );
    expect(container.querySelector('.immersive-shell-page')).toBeNull();
    expect(screen.getByTestId('resident-workbench')).toBeVisible();
    expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(1);
  });

  it('同 app 会话 A→独立编辑器→B→A 切换时包装层不留下，缓存实例仍保留', () => {
    mocks.location = {
      pathname: '/space/752/app-pro/147/1694001',
      search: '',
    };
    mocks.outletIsEmpty = true;
    const PageSlots = () => (
      <div id="page-container-selector">
        <ImmersiveShellAvoid />
        <ClientConversationKeepAlive />
      </div>
    );
    const view = render(<PageSlots />);
    const firstWorkbench = view.container.querySelector(
      '[data-client-page-key="ide-workspace:752:147:1694001"]',
    );
    expect(firstWorkbench).toBeVisible();

    act(() => {
      mocks.location = { pathname: '/space/752/workflow/123', search: '' };
      mocks.outletIsEmpty = false;
      view.rerender(<PageSlots />);
    });
    expect(
      view.container.querySelector('.immersive-shell-page'),
    ).not.toBeNull();
    expect(firstWorkbench).not.toBeVisible();

    act(() => {
      mocks.location = {
        pathname: '/space/752/app-pro/147/1694002',
        search: '',
      };
      mocks.outletIsEmpty = true;
      view.rerender(<PageSlots />);
    });
    expect(view.container.querySelector('.immersive-shell-page')).toBeNull();
    expect(firstWorkbench).not.toBeVisible();
    expect(
      view.container.querySelector(
        '[data-client-page-key="ide-workspace:752:147:1694002"]',
      ),
    ).toBeVisible();

    act(() => {
      mocks.location = {
        pathname: '/space/752/app-pro/147/1694001',
        search: '',
      };
      view.rerender(<PageSlots />);
    });
    expect(view.container.querySelector('.immersive-shell-page')).toBeNull();
    expect(
      view.container.querySelector(
        '[data-client-page-key="ide-workspace:752:147:1694001"]',
      ),
    ).toBe(firstWorkbench);
    expect(firstWorkbench).toBeVisible();
  });

  it.each([
    { navigationStyle: 'style1', isMobile: false },
    { navigationStyle: 'style2', isMobile: false },
    { navigationStyle: 'style3', isMobile: true },
  ])(
    '$navigationStyle / mobile=$isMobile 仍由路由包装层承担避让',
    ({ navigationStyle, isMobile }) => {
      mocks.location = {
        pathname: '/space/752/app-pro/147/1694001',
        search: '',
      };
      mocks.navigationStyle = navigationStyle;
      mocks.isMobile = isMobile;
      const { container } = render(
        <div id="page-container-selector">
          <ImmersiveShellAvoid />
          <ClientConversationKeepAlive />
        </div>,
      );

      expect(screen.getByTestId('route-workbench').parentElement).toHaveClass(
        'immersive-shell-page-inner',
      );
      expect(container.querySelector('.immersive-shell-page')).not.toBeNull();
      expect(screen.queryByTestId('resident-workbench')).toBeNull();
      expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(
        0,
      );
    },
  );

  it.each([
    ['/space/752/app-pro/147/0', ''],
    ['/space/0/app-pro/147/1694001', ''],
    ['/space/752/app-pro/0/1694001', ''],
    ['/space/752/app-pro/147', ''],
    ['/space/752/agent-dev', '?agentId=1596'],
    ['/space/752/agent-dev', '?agentId=0&conversationId=1694001'],
    ['/space/752/agent-dev', '?agentId=1596&conversationId=0'],
    ['/space/0/agent-dev', '?agentId=1596&conversationId=1694001'],
    ['/space/752/workflow/123', ''],
    ['/space/752/app-dev/123', ''],
    ['/app/chat/1596/1694001', ''],
  ])('无效或非缓存独立路由 %s%s 保留包装层', (pathname, search) => {
    mocks.location = { pathname, search };
    const { container } = render(<ImmersiveShellAvoid />);

    expect(container.firstElementChild).toHaveClass('immersive-shell-page');
    expect(screen.getByTestId('route-workbench').parentElement).toHaveClass(
      'immersive-shell-page-inner',
    );
  });

  it('浏览器独立工作台直出 Outlet', () => {
    mocks.immersive = false;
    mocks.navigationStyle = 'style2';
    mocks.location = {
      pathname: '/space/752/app-pro/147/1694001',
      search: '',
    };
    const { container } = render(<ImmersiveShellAvoid />);

    expect(container.firstElementChild).toBe(
      screen.getByTestId('route-workbench'),
    );
    expect(container.querySelector('.immersive-shell-page')).toBeNull();
  });
});
