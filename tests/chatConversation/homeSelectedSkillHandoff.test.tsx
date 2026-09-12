/**
 * 首页外部带入技能透传消费测试（/expert-skill-connector 技能卡「选择」→ /home）：
 * 接入契约见 useSelectSkillHandoff——pageHandoffContext 内存一次性中转
 * （key 'homeSelectedSkill'，与专家 'homeSummonedExpert' 相互独立）。
 * 行为对齐「直接选技能」：Home 挂载 consume 即清，转为编辑器 defaultMentions
 * 技能 chip 回填（skillIds 由 MentionEditor selectedMentions 派生，Home 不再手动并入）。
 * 桩法对齐 homeSummonedExpertHandoff.test.tsx（home 全依赖 mock）。
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

vi.mock('@/hooks/useAuthProtectedImageSrc', () => ({
  useAuthProtectedImageSrc: (url?: string) => ({
    displaySrc: url,
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

// 统一输入框桩：捕获 props（断言 defaultMentions 收敛），渲染技能名供回显断言
const input = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/business-component/ChatInputUnified', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any) => {
      input.props = props;
      const chipNames = (props.defaultMentions || [])
        .map((m: any) => m.name)
        .join(',');
      return React.createElement(
        'div',
        { 'data-testid': 'home-input' },
        chipNames,
      );
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(handoffMap).forEach((key) => delete handoffMap[key]);
});

afterEach(cleanup);

describe('首页外部技能透传消费（技能页选择 → /home 编辑器回填）', () => {
  it('挂载消费 handoff：转为技能 mention chip 回填（defaultMentions），读取即清，与专家透传独立', async () => {
    handoffMap.homeSelectedSkill = {
      skillId: 21,
      name: 'PPT 生成',
      icon: 'https://cdn.example.com/s.png',
    };
    handoffMap.homeSummonedExpert = { agentId: 8, name: '大赛', icon: '' };
    render(<Home />);
    await waitFor(() =>
      expect(input.props.defaultMentions).toEqual([
        expect.objectContaining({
          kind: 'skill',
          targetId: 21,
          name: 'PPT 生成',
          icon: 'https://cdn.example.com/s.png',
        }),
      ]),
    );
    // 专家透传同时生效（两份 key 相互独立）
    expect(input.props.summonedExpert).toEqual(
      expect.objectContaining({ agentId: 8, name: '大赛' }),
    );
    expect(
      document.querySelector('[data-testid="home-input"]')?.textContent,
    ).toContain('PPT 生成');
    // 一次性消费：两份透传读后即清
    expect(handoffMap.homeSelectedSkill).toBeUndefined();
    expect(handoffMap.homeSummonedExpert).toBeUndefined();
  });

  it('无透传（直接进首页或刷新）不注入 defaultMentions', async () => {
    render(<Home />);
    await waitFor(() => expect(input.props.onEnter).toBeDefined());
    expect(input.props.defaultMentions).toBeUndefined();
  });
});
