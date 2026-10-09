import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { location, navigate, activate, deactivate, commercialState } =
  vi.hoisted(() => ({
    location: {
      pathname: '/repo',
      search: '',
      hash: '',
      key: undefined as string | undefined,
      state: null as { microAppRestore?: boolean } | null,
    },
    commercialState: { enabled: true },
    navigate: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  }));

vi.mock('@umijs/max', () => ({
  useLocation: () => location,
  useNavigate: () => navigate,
}));
vi.mock('@/layouts/MicroAppHost/store', () => ({
  microAppHostStore: { activate, deactivate },
}));

import MicroAppEntry from '@/pages/MicroAppEntry';

beforeEach(() => {
  commercialState.enabled = true;
  vi.clearAllMocks();
  activate.mockImplementation((entry) => entry);
  Object.assign(location, {
    pathname: '/repo',
    search: '',
    hash: '',
    key: undefined,
    state: null,
  });
});
afterEach(cleanup);

describe('微应用路由控制页', () => {
  it('稳定入口 replace，保留 query/hash 且不提前挂载', () => {
    Object.assign(location, {
      pathname: '/repo-entry',
      search: '?space=3',
      hash: '#documents',
    });
    render(<MicroAppEntry />);
    expect(navigate).toHaveBeenCalledWith('/repo?space=3#documents', {
      replace: true,
    });
    expect(activate).not.toHaveBeenCalled();
  });

  it('深链驱动宿主，内部导航无需 deactivate，离开页面才隐藏', () => {
    Object.assign(location, {
      pathname: '/repo/doc/a',
      search: '?view=read&_refresh=7',
      hash: '#title',
    });
    const result = render(<MicroAppEntry />);
    expect(activate).toHaveBeenLastCalledWith({
      name: 'nuwax-repo-web',
      path: '/repo/doc/a?view=read&_refresh=7#title',
      refreshToken: '7',
    });
    Object.assign(location, { pathname: '/repo/doc/b', search: '', hash: '' });
    act(() => result.rerender(<MicroAppEntry />));
    expect(activate).toHaveBeenLastCalledWith({
      name: 'nuwax-repo-web',
      path: '/repo/doc/b',
      refreshToken: '',
    });
    expect(deactivate).not.toHaveBeenCalled();
    result.unmount();
    expect(deactivate).toHaveBeenCalledWith('nuwax-repo-web');
  });

  it('菜单返回恢复缓存文档并 replace 地址栏，保留本次显式刷新', () => {
    location.search = '?_refresh=42';
    activate.mockReturnValue({
      name: 'nuwax-repo-web',
      path: '/repo/doc/a?mode=read#title',
      refreshToken: '42',
    });
    render(<MicroAppEntry />);
    expect(navigate).toHaveBeenCalledWith(
      '/repo/doc/a?mode=read&_refresh=42#title',
      { replace: true, state: { microAppRestore: true } },
    );
  });

  it('仅刷新标记不同不触发多余 replace', () => {
    Object.assign(location, {
      pathname: '/repo/doc/a',
      search: '?_refresh=42',
      hash: '',
    });
    activate.mockReturnValue({ path: '/repo/doc/a', refreshToken: '42' });
    render(<MicroAppEntry />);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('两个应用切换只隐藏上一个应用，激活各自真实名称和路径', () => {
    const result = render(<MicroAppEntry />);
    Object.assign(location, {
      pathname: '/instant-message/conversation/4',
      search: '',
      hash: '',
    });
    act(() => result.rerender(<MicroAppEntry />));
    expect(deactivate).toHaveBeenCalledWith('nuwax-repo-web');
    expect(activate).toHaveBeenLastCalledWith({
      name: 'nuwax-im-web',
      path: '/instant-message/conversation/4',
      refreshToken: '',
    });
    expect(deactivate).not.toHaveBeenCalledWith('nuwax-im-web');
  });
});

vi.mock('@/hooks/useCommercialEdition', () => ({
  default: () => ({
    aiOSCommercialEdition: commercialState.enabled,
    workCommercialEdition: commercialState.enabled,
    pending: false,
  }),
}));

it.each(['/repo', '/repo-entry', '/instant-message', '/message-entry'])(
  '未授权的 %s 不激活应用或执行稳定入口跳转',
  (pathname) => {
    commercialState.enabled = false;
    location.pathname = pathname;
    render(<MicroAppEntry />);
    expect(activate).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  },
);

it('同一路由授权恢复后激活，撤销后停用', () => {
  commercialState.enabled = false;
  const view = render(<MicroAppEntry />);
  commercialState.enabled = true;
  act(() => view.rerender(<MicroAppEntry />));
  expect(activate).toHaveBeenCalledOnce();
  commercialState.enabled = false;
  act(() => view.rerender(<MicroAppEntry />));
  expect(deactivate).toHaveBeenCalledWith('nuwax-repo-web');
});

it('授权后同一路径的明确导航仍更新 navigationKey，缓存恢复不重复消费', () => {
  location.key = 'navigation-1';
  const view = render(<MicroAppEntry />);
  expect(activate).toHaveBeenLastCalledWith(
    expect.objectContaining({ navigationKey: 'navigation-1' }),
  );
  location.key = 'navigation-2';
  act(() => view.rerender(<MicroAppEntry />));
  expect(activate).toHaveBeenLastCalledWith(
    expect.objectContaining({ navigationKey: 'navigation-2' }),
  );
  location.state = { microAppRestore: true };
  act(() => view.rerender(<MicroAppEntry />));
  expect(activate).toHaveBeenLastCalledWith(
    expect.objectContaining({ navigationKey: undefined }),
  );
});

it('未授权期间路由 key 更新不会激活，恢复后使用最新导航', () => {
  commercialState.enabled = false;
  location.key = 'navigation-1';
  const view = render(<MicroAppEntry />);
  location.key = 'navigation-2';
  act(() => view.rerender(<MicroAppEntry />));
  expect(activate).not.toHaveBeenCalled();
  commercialState.enabled = true;
  act(() => view.rerender(<MicroAppEntry />));
  expect(activate).toHaveBeenLastCalledWith(
    expect.objectContaining({ navigationKey: 'navigation-2' }),
  );
});
