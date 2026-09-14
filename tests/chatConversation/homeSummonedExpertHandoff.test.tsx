/**
 * 首页透传消费测试：项目上框手选 Agent，以及专家卡「召唤」→ /home 回显。
 * pageHandoffContext 内存一次性中转，Home 挂载 consume 即清。
 * 桩法对齐 chatInputUnified.home.test.tsx：umi / services / 子组件一律 mock，
 * ChatInputUnified 以捕获 props 的桩替代，断言透传收敛到 summonedExpert prop。
 */
import Home from '@/pages/Home';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { fetchChatboxCategories } from '@/services/square';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 透传上下文底层数据（与真实 pageHandoffContext model 同构：读清一次性）；
// 经 hoisted 暴露给 umi mock 与用例断言共享
const handoffMap = vi.hoisted(() => ({} as Record<string, unknown>));

vi.mock('umi', () => ({
  // Home 消费 effect 依赖 location.key（同路由 push 重新消费），测试固定一个 key
  useLocation: () => ({ key: 'test-home-key' }),
  useModel: (name: string) => {
    if (name === 'pageHandoffContext') {
      return {
        contextMap: handoffMap,
        setContext: (key: string, payload: unknown) => {
          handoffMap[key] = payload;
        },
        getContext: (key?: string) => (key ? handoffMap[key] : undefined),
        clearContext: (key?: string) => {
          if (key) delete handoffMap[key];
        },
        consumeContext: (key?: string) => {
          const value = key ? handoffMap[key] : undefined;
          if (key) delete handoffMap[key];
          return value;
        },
      };
    }
    if (name === 'tenantConfigInfo') {
      return {
        tenantConfigInfo: {
          homeSlogan: 'hi',
          defaultAgentId: 7,
          defaultTaskAgentId: 9,
          enableSubscription: 0,
        },
      };
    }
    if (name === 'spaceModel') {
      return { getSpaceId: () => 1 };
    }
    return {};
  },
}));

vi.mock('@/pages/Home/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('antd', () => ({
  App: { useApp: () => ({ message: { warning: vi.fn(), error: vi.fn() } }) },
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

vi.mock('@/services/agentDev', () => ({
  apiPublishedAgentInfo: vi.fn(async () => ({ data: undefined })),
}));

vi.mock('@/services/displayRecommend', () => ({
  apiDisplayRecommendList: vi.fn(async () => ({
    data: { recChatBoxNav: { Agent: [] } },
  })),
}));

vi.mock('@/services/square', () => ({
  fetchChatboxCategories: vi.fn(async () => []),
}));

vi.mock('@/pages/SpaceCreateProject/utils/projectCreateStrategy', () => ({
  createProjectAndNavigate: vi.fn(),
}));

// 受保护图标 hook 桩：公开 URL 原样返回，/api/f/ 与空值回落 undefined
// （驱动 chip 回退默认图的分支）
vi.mock('@/hooks/useAuthProtectedImageSrc', () => ({
  useAuthProtectedImageSrc: (url?: string) => ({
    displaySrc: url && !String(url).startsWith('/api/f/') ? url : undefined,
    loading: false,
    error: false,
  }),
}));

vi.mock('@/assets/images/agent_image.png', () => ({
  default: 'agent-image-png',
}));

const handleCreateConversation = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation }),
}));

vi.mock('@/hooks/useSelectedComponent', () => ({
  default: () => ({
    selectedComponentList: [],
    handleSelectComponent: vi.fn(),
    initSelectedComponentList: vi.fn(),
  }),
}));

vi.mock(
  '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer',
  () => ({
    readAgentModeCache: () => undefined,
    writeAgentModeCache: vi.fn(),
  }),
);

vi.mock('@/pages/Home/components/ChatBoxRecommendNav', () => ({
  default: ({ items, onSelect, isItemSelectable }: any) =>
    items.map((item: any) => (
      <button
        key={item.id}
        type="button"
        disabled={isItemSelectable && !isItemSelectable(item)}
        onClick={() => onSelect(item)}
      >
        {item.label}
      </button>
    )),
}));

vi.mock('@/pages/Home/components/HomeCategoryTabs', () => ({
  default: () => null,
}));

// 统一输入框桩：捕获 props（断言透传收敛），渲染召唤专家名供回显断言
const input = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/business-component/ChatInputUnified', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, _ref) => {
      input.props = props;
      return React.createElement(
        'div',
        { 'data-testid': 'home-input' },
        props.summonedExpert?.name ?? '',
      );
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(handoffMap).forEach((key) => delete handoffMap[key]);
});

afterEach(cleanup);

describe('首页项目上框与专家透传消费', () => {
  it('常规项目上框允许手选常规项目 Agent，选中后保持并用于创建会话', async () => {
    handoffMap.homePinnedProject = {
      projectId: 18,
      projectType: 'NormalProject',
      name: '项目 A',
    };
    vi.mocked(apiDisplayRecommendList).mockResolvedValueOnce({
      data: {
        recChatBoxNav: {
          Agent: [
            { id: 1, targetId: 71, label: '普通对话', functionType: 'Chat' },
            {
              id: 2,
              targetId: 72,
              label: '项目 Agent',
              functionType: 'NormalProjectDev',
            },
            {
              id: 3,
              targetId: 73,
              label: '另一个项目 Agent',
              functionType: 'NormalProjectDev',
            },
          ],
        },
      },
    } as any);
    vi.mocked(fetchChatboxCategories).mockResolvedValueOnce([
      { key: 'projects', label: '项目开发' },
    ] as any);

    render(<Home />);
    await screen.findByRole('button', { name: '项目 Agent' });
    expect(screen.getByRole('button', { name: '普通对话' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: '另一个项目 Agent' }),
    ).toBeEnabled();
    expect(input.props.selectedTag).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: '项目 Agent' }));
    await waitFor(() =>
      expect(input.props.selectedTag?.label).toBe('项目 Agent'),
    );
    await act(async () => {
      await input.props.onEnter('新任务');
    });
    expect(input.props.pinnedProject?.name).toBe('项目 A');
    expect(handleCreateConversation).toHaveBeenCalledWith(
      72,
      expect.objectContaining({
        projectId: 18,
        projectType: 'NormalProject',
        message: '新任务',
      }),
    );
  });

  it('挂载消费 handoff：chip 回显专家并以专家 agentId 作会话对象，读取即清', async () => {
    handoffMap.homeSummonedExpert = {
      agentId: 8,
      name: '智慧校园助手',
      icon: 'https://cdn.example.com/a.png',
    };
    render(<Home />);
    await waitFor(() =>
      expect(input.props.summonedExpert).toEqual(
        expect.objectContaining({ agentId: 8, name: '智慧校园助手' }),
      ),
    );
    // 公开图标 URL 原样透传到 chip
    expect(input.props.summonedExpert.iconSrc).toBe(
      'https://cdn.example.com/a.png',
    );
    // 页面回显专家名
    expect(
      document.querySelector('[data-testid="home-input"]')?.textContent,
    ).toContain('智慧校园助手');
    // 一次性消费：透传上下文读后即清（刷新/二次挂载不再残留）
    expect(handoffMap.homeSummonedExpert).toBeUndefined();
  });

  it('图标缺失或受保护地址解析失败时回退默认智能体图', async () => {
    handoffMap.homeSummonedExpert = {
      agentId: 9,
      name: '大赛',
      icon: '/api/f/protected-icon',
    };
    render(<Home />);
    await waitFor(() =>
      expect(input.props.summonedExpert?.iconSrc).toBe('agent-image-png'),
    );
  });

  it('无透传（直接进首页或刷新）不渲染召唤 chip', async () => {
    render(<Home />);
    await waitFor(() => expect(input.props.onEnter).toBeDefined());
    expect(input.props.summonedExpert).toBeUndefined();
  });
});
