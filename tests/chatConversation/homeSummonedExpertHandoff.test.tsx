/**
 * 首页召唤专家透传消费测试（/expert-skill-connector 专家卡「召唤」→ /home 回显）：
 * 接入契约见 useSummonExpertHandoff——pageHandoffContext 内存一次性中转，
 * Home 挂载 consume 即清，chip 回显专家并以专家 agentId 作为会话对象。
 * 桩法对齐 chatInputUnified.home.test.tsx：umi / services / 子组件一律 mock，
 * ChatInputUnified 以捕获 props 的桩替代，断言透传收敛到 summonedExpert prop。
 */
import Home from '@/pages/Home';
import { cleanup, render, waitFor } from '@testing-library/react';
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

vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation: vi.fn() }),
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
  default: () => null,
}));

vi.mock('@/pages/Home/components/HomeCategoryTabs', () => ({
  default: () => null,
}));

// 统一输入框桩：捕获 props（断言透传收敛），渲染召唤专家名供回显断言
const input = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/business-component/ChatInputUnified', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any) => {
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

describe('首页召唤专家透传消费（专家页召唤 → /home 回显）', () => {
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
