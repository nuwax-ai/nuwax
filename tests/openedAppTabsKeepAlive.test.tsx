/**
 * OpenedAppTabsKeepAlive 保活容器单测（/agent 标签纳入后）：
 * - agent 标签按 openedAppTabs 渲染，激活实例可见、其余 display:none 保活；
 * - 无标签直开 /agent/:id 生成 direct 临时实例；带 skillId/skillName query 时
 *   同路径标签实例让位（保持挂载不可见），由 direct 实例接管；
 * - user-app 实例链路回归不变；双渲染器均未注册时容器渲染空。
 */
import OpenedAppTabsKeepAlive from '@/layouts/SidebarShell/OpenedAppTabsKeepAlive';
import type {
  AgentTabRendererPair,
  AppTabInstanceProps,
} from '@/models/appTabKeepAlive';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** 可变测试状态（umi mock 闭包读取，用例内直接改写触发重渲染） */
const state = {
  tabs: [] as Array<{ routePath: string; homepageUrl?: string }>,
  pathname: '/',
  search: '',
  renderer: null as React.FC<AppTabInstanceProps> | null,
  agentRenderer: null as AgentTabRendererPair | null,
};

vi.mock('umi', () => ({
  useModel: (ns: string) => {
    if (ns === 'openedAppTabs') {
      return { openedAppTabs: state.tabs };
    }
    if (ns === 'appTabKeepAlive') {
      return { renderer: state.renderer, agentRenderer: state.agentRenderer };
    }
    return {};
  },
  useLocation: () => ({ pathname: state.pathname, search: state.search }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

const UserAppStub: React.FC<AppTabInstanceProps> = ({ appId }) => (
  <div data-testid={`user-app-${appId}`} />
);
const AgentTabStub: React.FC<{ agentId: number; active: boolean }> = ({
  agentId,
  active,
}) => <div data-testid={`agent-tab-${agentId}`} data-active={String(active)} />;
const AgentDirectStub: React.FC<{ agentId: number }> = ({ agentId }) => (
  <div data-testid={`agent-direct-${agentId}`} />
);

/** 实例包裹层（key div，display 切换发生处） */
const wrapperOf = (testid: string) =>
  screen.getByTestId(testid).parentElement as HTMLElement;
/** 容器层（整体占位切换发生处） */
const containerOf = (testid: string) =>
  wrapperOf(testid).parentElement as HTMLElement;

describe('OpenedAppTabsKeepAlive 保活容器', () => {
  beforeEach(() => {
    state.tabs = [];
    state.pathname = '/';
    state.search = '';
    state.renderer = null;
    state.agentRenderer = null;
  });

  it('双渲染器均未注册时渲染空', () => {
    const { container } = render(<OpenedAppTabsKeepAlive />);
    expect(container.innerHTML).toBe('');
  });

  it('agent 标签按数据渲染：激活可见、其余保活隐藏', () => {
    state.tabs = [{ routePath: '/agent/11' }, { routePath: '/agent/22' }];
    state.pathname = '/agent/11';
    state.agentRenderer = { tab: AgentTabStub, direct: AgentDirectStub };
    render(<OpenedAppTabsKeepAlive />);
    expect(wrapperOf('agent-tab-11').style.display).toBe('block');
    expect(wrapperOf('agent-tab-11')).toBeVisible();
    expect(wrapperOf('agent-tab-22').style.display).toBe('none');
    expect(screen.queryByTestId('agent-direct-11')).toBeNull();
  });

  it('混合标签并存：user-app 与 agent 实例同容器、激活精确匹配', () => {
    state.tabs = [
      { routePath: '/user-app/33', homepageUrl: 'https://a.b/c' },
      { routePath: '/agent/11' },
    ];
    state.pathname = '/user-app/33';
    state.renderer = UserAppStub;
    state.agentRenderer = { tab: AgentTabStub, direct: AgentDirectStub };
    render(<OpenedAppTabsKeepAlive />);
    expect(wrapperOf('user-app-33').style.display).toBe('block');
    expect(wrapperOf('agent-tab-11').style.display).toBe('none');
    // 有任一实例激活时容器整体占位
    expect(containerOf('agent-tab-11').style.display).toBe('block');
  });

  it('路由不在任何标签上时容器整体隐藏（实例仍挂载保活）', () => {
    state.tabs = [{ routePath: '/agent/11' }];
    state.pathname = '/nuwa-apps';
    state.agentRenderer = { tab: AgentTabStub, direct: AgentDirectStub };
    render(<OpenedAppTabsKeepAlive />);
    expect(wrapperOf('agent-tab-11').style.display).toBe('none');
    expect(containerOf('agent-tab-11').style.display).toBe('none');
  });

  it('无标签直开 /agent/:id：渲染 direct 临时实例并接管显示', () => {
    state.pathname = '/agent/55';
    state.agentRenderer = { tab: AgentTabStub, direct: AgentDirectStub };
    render(<OpenedAppTabsKeepAlive />);
    expect(wrapperOf('agent-direct-55').style.display).toBe('block');
    expect(containerOf('agent-direct-55').style.display).toBe('block');
  });

  it('skill query 入口：同路径标签实例让位（挂载不可见），direct 接管', () => {
    state.tabs = [{ routePath: '/agent/11' }];
    state.pathname = '/agent/11';
    state.search = '?skillId=9&skillName=demo';
    state.agentRenderer = { tab: AgentTabStub, direct: AgentDirectStub };
    render(<OpenedAppTabsKeepAlive />);
    // 标签实例保持挂载（保活不销毁）但不可见
    expect(wrapperOf('agent-tab-11').style.display).toBe('none');
    expect(screen.getByTestId('agent-tab-11').dataset.active).toBe('false');
    expect(wrapperOf('agent-direct-11').style.display).toBe('block');
  });

  it('user-app 直连兜底回归：无标签 /user-app/:id 渲染临时实例', () => {
    state.pathname = '/user-app/77';
    state.renderer = UserAppStub;
    render(<OpenedAppTabsKeepAlive />);
    expect(wrapperOf('user-app-77').style.display).toBe('block');
    expect(screen.queryByTestId('agent-direct-77')).toBeNull();
  });

  it('仅注册 user-app 渲染器时 agent 标签不渲染也不报错', () => {
    state.tabs = [{ routePath: '/agent/11' }];
    state.pathname = '/agent/11';
    state.renderer = UserAppStub;
    const { container } = render(<OpenedAppTabsKeepAlive />);
    expect(screen.queryByTestId('agent-tab-11')).toBeNull();
    // agent 渲染器未注册:agent 实例无渲染器可渲染,容器是空壳占位
    expect(container.firstElementChild?.children.length).toBe(0);
  });
});
