import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeSectionDataShell } from './useHomeSectionData';

const {
  route,
  refreshList,
  revalidateVisible,
  hasExecutingChildren,
  commercialState,
} = vi.hoisted(() => ({
  route: { pathname: '/home' },
  commercialState: { enabled: true },
  refreshList: vi.fn(),
  revalidateVisible: vi.fn(),
  hasExecutingChildren: vi.fn(() => false),
}));

vi.mock('umi', () => ({ useLocation: () => route }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('./TaskListSection', () => ({ default: () => null }));
vi.mock('./components/ProjectPanel', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((_props, ref) => {
      React.useImperativeHandle(ref, () => ({
        toggleAll: vi.fn(),
        revalidateVisible,
        hasExecutingChildren,
      }));
      return null;
    }),
  };
});
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import {
  PROJECT_SECTION_COLLAPSED_KEY,
  TASK_SECTION_COLLAPSED_KEY,
} from './collapsePreference';
import SidebarNavHomeSection from './SidebarNavHomeSection';

const shell = {
  scrollShowRef: vi.fn(),
  scrollContainerRef: { current: null },
  hasExecutingTask: false,
  refreshList,
  projectCount: 0,
  visibleConversationList: [],
  loading: false,
  hasMore: false,
  keyword: '',
} as unknown as HomeSectionDataShell;

describe('style3 侧栏切回同步', () => {
  beforeEach(() => {
    commercialState.enabled = true;
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    route.pathname = '/home';
    refreshList.mockClear();
    revalidateVisible.mockClear();
    hasExecutingChildren.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('路由在挂载后 30 秒内切换时，节流到期仍刷新静止的项目和任务列表', () => {
    const view = render(<SidebarNavHomeSection shell={shell} />);

    route.pathname = '/space/1';
    view.rerender(<SidebarNavHomeSection shell={shell} />);
    act(() => vi.advanceTimersByTime(29_999));
    expect(refreshList).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(refreshList).toHaveBeenCalledTimes(1);
    expect(refreshList).toHaveBeenCalledWith(true, {
      silent: true,
    });
    expect(revalidateVisible).toHaveBeenCalledTimes(1);
  });

  it('静止页签仅切回焦点时维持零请求', () => {
    render(<SidebarNavHomeSection shell={shell} />);

    act(() => window.dispatchEvent(new Event('focus')));
    act(() => vi.advanceTimersByTime(30_000));
    expect(refreshList).not.toHaveBeenCalled();
    expect(revalidateVisible).not.toHaveBeenCalled();
  });

  it('路由待刷新期间页签变隐藏，重新可见后仍按路由触发刷新', () => {
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('visible');
    const view = render(<SidebarNavHomeSection shell={shell} />);

    route.pathname = '/space/1';
    view.rerender(<SidebarNavHomeSection shell={shell} />);
    visibility.mockReturnValue('hidden');
    act(() => vi.advanceTimersByTime(30_000));
    expect(refreshList).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    act(() => window.dispatchEvent(new Event('focus')));
    expect(refreshList).toHaveBeenCalledTimes(1);
    expect(refreshList).toHaveBeenCalledWith(true, {
      silent: true,
    });
    expect(revalidateVisible).toHaveBeenCalledTimes(1);
  });

  it('任务首屏未撑出滚动区时可通过查看更多取得下一页', () => {
    const taskShell = { ...shell, hasMore: true };
    render(<SidebarNavHomeSection shell={taskShell} />);

    // 此时没有可滚动容器，也不会触发 scroll；按钮仍应提供分页入口。
    expect(taskShell.scrollContainerRef.current).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.AgentConversation.viewMore',
      }),
    );
    expect(refreshList).toHaveBeenCalledTimes(1);
    expect(refreshList).toHaveBeenCalledWith();
  });

  it('任务加载中或已到末页时不开放查看更多', () => {
    const view = render(
      <SidebarNavHomeSection
        shell={{ ...shell, hasMore: true, loading: true }}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.AgentConversation.viewMore',
      }),
    ).toBeDisabled();

    view.rerender(<SidebarNavHomeSection shell={shell} />);
    expect(
      screen.queryByRole('button', {
        name: 'PC.Components.AgentConversation.viewMore',
      }),
    ).toBeNull();
  });

  it('挂载时沿用上次收起的项目分组，展开后清掉偏好', () => {
    window.localStorage.setItem(PROJECT_SECTION_COLLAPSED_KEY, '1');
    render(<SidebarNavHomeSection shell={shell} />);

    const projectHeader = screen.getByRole('button', {
      name: 'PC.Layouts.DynamicMenusLayout.HomeSection.projectTab',
    });
    expect(projectHeader).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(projectHeader);
    expect(projectHeader).toHaveAttribute('aria-expanded', 'true');
    expect(
      window.localStorage.getItem(PROJECT_SECTION_COLLAPSED_KEY),
    ).toBeNull();
  });

  it('收起任务分组后重新挂载仍保持收起', () => {
    const first = render(<SidebarNavHomeSection shell={shell} />);
    const taskName = 'PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask';

    fireEvent.click(screen.getByRole('button', { name: taskName }));
    expect(window.localStorage.getItem(TASK_SECTION_COLLAPSED_KEY)).toBe('1');

    first.unmount();
    render(<SidebarNavHomeSection shell={shell} />);
    expect(screen.getByRole('button', { name: taskName })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

vi.mock('@/hooks/useCommercialEdition', () => ({
  default: () => ({
    aiOSCommercialEdition: commercialState.enabled,
    workCommercialEdition: commercialState.enabled,
    pending: false,
  }),
}));

it('项目授权刷新时，任务吸顶偏移随项目标题显隐同步更新', () => {
  commercialState.enabled = false;
  const view = render(<SidebarNavHomeSection shell={shell} />);
  const title = 'PC.Layouts.DynamicMenusLayout.HomeSection.projectTab';
  const taskHeader = screen.getByRole('button', {
    name: 'PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask',
  });
  expect(screen.queryByText(title)).toBeNull();
  expect(taskHeader).not.toHaveClass('task-section-tabs-with-project');
  commercialState.enabled = true;
  view.rerender(<SidebarNavHomeSection shell={shell} />);
  expect(screen.getByText(title)).toBeTruthy();
  expect(taskHeader).toHaveClass('task-section-tabs-with-project');

  // 收起项目内容仍保留项目标题，任务偏移不能提前归零。
  fireEvent.click(screen.getByText(title));
  expect(taskHeader).toHaveClass('task-section-tabs-with-project');

  commercialState.enabled = false;
  view.rerender(<SidebarNavHomeSection shell={shell} />);
  expect(screen.queryByText(title)).toBeNull();
  expect(taskHeader).not.toHaveClass('task-section-tabs-with-project');
});
