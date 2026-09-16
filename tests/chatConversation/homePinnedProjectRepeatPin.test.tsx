/**
 * 禅道bug2394 回归：项目上框「+」重复触发不得带出租户默认智能体的工具。
 * 三守卫各有用例——全栈上框未命中不回落默认智能体（工具不被默认工具稳定
 * 占据）、同项目重复 pin 幂等（不清选中不重发请求）、切换会话对象后旧
 * 详情晚到不覆盖（cancelled 守卫）。桩法对齐 homeSummonedExpertHandoff.test.tsx。
 */
import Home from '@/pages/Home';
import { apiPublishedAgentInfo } from '@/services/agentDev';
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

// 透传上下文底层数据：与真实 pageHandoffContext 同构（setContext/consumeContext
// 后 contextMap 换新引用，驱动 Home consume effect 重跑——模拟「已在 /home 连续
// 点 + 不重挂载」的重复 pin 场景）
const handoffState = vi.hoisted(() => {
  const map: Record<string, unknown> = {};
  const api = {
    map,
    snapshot: {} as Record<string, unknown>,
    setContext(key: string, payload: unknown) {
      map[key] = payload;
      api.snapshot = { ...map };
    },
    getContext(key?: string) {
      return key ? map[key] : undefined;
    },
    clearContext(key?: string) {
      if (!key) return;
      delete map[key];
      api.snapshot = { ...map };
    },
    consumeContext(key?: string) {
      const value = api.getContext(key);
      api.clearContext(key);
      return value;
    },
    reset() {
      Object.keys(map).forEach((key) => delete map[key]);
      api.snapshot = {};
    },
  };
  return api;
});

const messageMock = vi.hoisted(() => ({ warning: vi.fn() }));

vi.mock('umi', () => ({
  useLocation: () => ({ key: 'test-home-key' }),
  useModel: (name: string) => {
    if (name === 'pageHandoffContext') {
      return {
        contextMap: handoffState.snapshot,
        setContext: handoffState.setContext,
        getContext: handoffState.getContext,
        clearContext: handoffState.clearContext,
        consumeContext: handoffState.consumeContext,
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
  App: { useApp: () => ({ message: messageMock }) },
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

// 工具选中 hook 桩：共享 initSelectedComponentList spy，
// 断言「默认智能体的 manualComponents 从未落地重置工具选中」
const selectedComponentMocks = vi.hoisted(() => ({
  initSelectedComponentList: vi.fn(),
  handleSelectComponent: vi.fn(),
}));
vi.mock('@/hooks/useSelectedComponent', () => ({
  default: () => ({
    selectedComponentList: [],
    selectedComponentDetails: [],
    handleSelectComponent: selectedComponentMocks.handleSelectComponent,
    initSelectedComponentList: selectedComponentMocks.initSelectedComponentList,
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

// 统一输入框桩：捕获 props（selectedTag/manualComponents/pinnedProject）
const input = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/business-component/ChatInputUnified', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any) => {
      input.props = props;
      return React.createElement('div', { 'data-testid': 'home-input' });
    }),
  };
});

// 默认智能体(7)与全栈命中(88)的工具集，名字区分用于断言来源
const DEFAULT_AGENT_TOOLS = [{ id: 701, type: 1, name: '默认工具' }];
const HIT_AGENT_TOOLS = [{ id: 881, type: 1, name: '全栈工具' }];

const agentDetailOf = (id: number, manualComponents: unknown[] = []) => ({
  id,
  manualComponents,
});

const pinUserAppProject = () => {
  handoffState.setContext('homePinnedProject', {
    projectId: 5,
    projectType: 'UserApp',
    name: '全栈 A',
    devAgentId: 88,
  });
};

const mockHitRecommend = () => {
  vi.mocked(apiDisplayRecommendList).mockResolvedValueOnce({
    data: {
      recChatBoxNav: {
        Agent: [
          {
            id: 1,
            targetId: 88,
            label: '全栈应用开发',
            functionType: 'UserAppDev',
          },
          { id: 2, targetId: 71, label: '普通对话', functionType: 'Chat' },
        ],
      },
    },
  } as any);
  vi.mocked(fetchChatboxCategories).mockResolvedValueOnce([
    { key: 'projects', label: '项目开发' },
  ] as any);
};

const initNeverReceivedDefaultTools = () => {
  const initCalls = selectedComponentMocks.initSelectedComponentList.mock.calls;
  return !initCalls.some(([components]) =>
    (components || []).some(
      (component: any) => component?.id === DEFAULT_AGENT_TOOLS[0].id,
    ),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  handoffState.reset();
});

afterEach(cleanup);

describe('项目上框重复触发与默认智能体竞态（禅道bug2394）', () => {
  it('全栈上框推荐位未命中时不回落租户默认智能体，工具栏不被默认工具占据', async () => {
    pinUserAppProject();
    // 推荐列表非空但无 UserAppDev 同类型：精确/类型兜底双双未命中——修复前
    // currentAgentId 会稳定回落 7，默认智能体工具常驻上框态
    vi.mocked(apiDisplayRecommendList).mockResolvedValueOnce({
      data: {
        recChatBoxNav: {
          Agent: [
            { id: 2, targetId: 71, label: '普通对话', functionType: 'Chat' },
          ],
        },
      },
    } as any);
    vi.mocked(fetchChatboxCategories).mockResolvedValueOnce([
      { key: 'projects', label: '项目开发' },
    ] as any);
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id: number) =>
        ({
          data: agentDetailOf(id as number, DEFAULT_AGENT_TOOLS),
        } as any),
    );

    render(<Home />);
    // 未命中走 agentMissed 提示引导手选
    await waitFor(() =>
      expect(messageMock.warning).toHaveBeenCalledWith(
        'PC.Pages.Home.pinnedProject.agentMissed',
      ),
    );
    // 详情数据不落地：工具栏保持空，默认智能体工具从未初始化选中
    expect(input.props.manualComponents).toEqual([]);
    expect(initNeverReceivedDefaultTools()).toBe(true);
  });

  it('同项目重复 pin 只刷新上框数据：不清选中、不发新详情请求', async () => {
    pinUserAppProject();
    mockHitRecommend();
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id: number) =>
        ({
          data: agentDetailOf(id as number, HIT_AGENT_TOOLS),
        } as any),
    );

    const { rerender } = render(<Home />);
    await waitFor(() =>
      expect(input.props.selectedTag?.label).toBe('全栈应用开发'),
    );
    await waitFor(() =>
      expect(input.props.manualComponents).toEqual(HIT_AGENT_TOOLS),
    );
    const callsAfterFirstPin = vi.mocked(apiPublishedAgentInfo).mock.calls
      .length;

    // 模拟项目列表再点一次「+」：同 projectId 新对象写入 + contextMap 引用变化
    handoffState.setContext('homePinnedProject', {
      projectId: 5,
      projectType: 'UserApp',
      name: '全栈 A 改名',
      devAgentId: 88,
    });
    rerender(<Home />);

    // 选中保持、不追加详情请求（会话对象未变）
    expect(input.props.selectedTag?.label).toBe('全栈应用开发');
    expect(vi.mocked(apiPublishedAgentInfo).mock.calls.length).toBe(
      callsAfterFirstPin,
    );
    // 上框数据仍刷新（名称更新生效）
    await waitFor(() =>
      expect(input.props.pinnedProject?.name).toBe('全栈 A 改名'),
    );
  });

  it('切换会话对象后旧详情响应晚到不覆盖新对象详情（cancelled 守卫）', async () => {
    mockHitRecommend();
    let resolveSlow!: () => void;
    vi.mocked(apiPublishedAgentInfo).mockImplementation(async (id: number) => {
      if (id === 7) {
        // 默认智能体详情挂起（模拟慢响应竞态窗口）
        return new Promise((resolve) => {
          resolveSlow = () =>
            resolve({ data: agentDetailOf(7, DEFAULT_AGENT_TOOLS) });
        }) as any;
      }
      return { data: agentDetailOf(id as number, HIT_AGENT_TOOLS) } as any;
    });

    render(<Home />);
    // 无 pin 无选中：挂载即请求默认智能体 7（挂起中）
    await waitFor(() =>
      expect(
        vi.mocked(apiPublishedAgentInfo).mock.calls.some(([id]) => id === 7),
      ).toBe(true),
    );
    // 用户手选 pill（88）：切换会话对象，7 的在途响应应作废
    fireEvent.click(
      await screen.findByRole('button', { name: '全栈应用开发' }),
    );
    await waitFor(() =>
      expect(input.props.manualComponents).toEqual(HIT_AGENT_TOOLS),
    );

    // 默认智能体的慢响应此刻才回来
    await act(async () => {
      resolveSlow();
    });
    // 新会话对象详情不被默认工具覆盖
    expect(input.props.manualComponents).toEqual(HIT_AGENT_TOOLS);
    expect(initNeverReceivedDefaultTools()).toBe(true);
  });
});
