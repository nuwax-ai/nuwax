/**
 * 首页透传消费测试：项目上框手选 Agent，以及专家卡「召唤」→ /home 回显。
 * pageHandoffContext 内存一次性中转，Home 挂载 consume 即清。
 * 桩法对齐 chatInputUnified.home.test.tsx：umi / services / 子组件一律 mock，
 * ChatInputUnified 以捕获 props 的桩替代，断言透传收敛到 summonedExpert prop。
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
vi.mock('@/pages/Home/components/ChatBoxRecommendNav/index.less', () => ({
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

vi.mock('@/components/RecommendList', () => ({
  default: ({ chatSuggestList, onClick }: any) =>
    chatSuggestList.map((item: any) => (
      <button key={item.info} type="button" onClick={() => onClick(item.info)}>
        {item.info}
      </button>
    )),
}));

vi.mock('@/pages/Home/components/HomeCategoryTabs', () => ({
  default: ({ categories, onChange }: any) =>
    categories.map((category: any) => (
      <button
        key={category.key}
        type="button"
        onClick={() => onChange(category.key)}
      >
        {category.label}
      </button>
    )),
}));

// 统一输入框桩：捕获 props（断言透传收敛），渲染召唤专家名供回显断言
const input = vi.hoisted(() => ({ props: {} as Record<string, any> }));
const setText = vi.hoisted(() => vi.fn());
const clearInput = vi.hoisted(() => vi.fn());
vi.mock('@/components/business-component/ChatInputUnified', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, _ref) => {
      React.useImperativeHandle(_ref, () => ({
        setText,
        clear: clearInput,
        focus: vi.fn(),
      }));
      input.props = props;
      return React.createElement(
        'div',
        { 'data-testid': 'home-input' },
        props.summonedExpert?.name ?? '',
        props.showGuidQuestions !== false &&
          props.guidQuestionDtos?.map((item: any) =>
            React.createElement(
              'button',
              {
                key: item.info,
                type: 'button',
                onClick: () => setText(item.info),
              },
              item.info,
            ),
          ),
      );
    }),
  };
});

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.clearAllMocks();
  vi.mocked(apiPublishedAgentInfo).mockResolvedValue({
    data: undefined,
  } as any);
  Object.keys(handoffMap).forEach((key) => delete handoffMap[key]);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('首页项目上框与专家透传消费', () => {
  it('大类 Tab 只切换推荐列表，保留已选智能体、专家及会话框配置', async () => {
    vi.mocked(apiDisplayRecommendList).mockResolvedValueOnce({
      data: {
        recChatBoxNav: {
          Agent: [
            {
              id: 1,
              targetId: 71,
              label: '普通对话',
              functionType: 'Chat',
              category: 'chat',
            },
          ],
        },
      },
    } as any);
    vi.mocked(fetchChatboxCategories).mockResolvedValueOnce([
      { key: 'chat', label: '对话任务' },
      { key: 'projects', label: '项目开发' },
    ] as any);

    render(<Home />);
    fireEvent.click(await screen.findByRole('button', { name: '普通对话' }));
    expect(input.props.selectedTag?.label).toBe('普通对话');
    act(() => {
      input.props.onModelSelect(101);
      input.props.onSpaceSelect(202);
    });
    clearInput.mockClear();

    fireEvent.click(screen.getByRole('button', { name: '项目开发' }));
    expect(screen.queryByRole('button', { name: '普通对话' })).toBeNull();
    expect(input.props.selectedTag?.label).toBe('普通对话');
    expect(input.props.selectedModelId).toBe(101);
    expect(input.props.selectedSpaceId).toBe(202);
    expect(clearInput).not.toHaveBeenCalled();

    act(() =>
      input.props.onExpertAgentSelect({ targetId: 72, name: '专家 A' }),
    );
    expect(input.props.summonedExpert?.name).toBe('专家 A');
    act(() => {
      input.props.onModelSelect(303);
      input.props.onSpaceSelect(404);
    });
    fireEvent.click(screen.getByRole('button', { name: '对话任务' }));
    expect(screen.getByRole('button', { name: '普通对话' })).toBeEnabled();
    expect(input.props.summonedExpert?.name).toBe('专家 A');
    expect(input.props.selectedModelId).toBe(303);
    expect(input.props.selectedSpaceId).toBe(404);
    expect(clearInput).not.toHaveBeenCalled();
  });

  it('选中智能体有提示时替换小分类，清除后无提示则恢复小分类', async () => {
    vi.mocked(apiDisplayRecommendList).mockResolvedValueOnce({
      data: {
        recChatBoxNav: {
          Agent: [
            { id: 1, targetId: 71, label: '普通对话', functionType: 'Chat' },
          ],
        },
      },
    } as any);
    vi.mocked(fetchChatboxCategories).mockResolvedValueOnce([
      { key: 'chat', label: '对话任务' },
    ] as any);
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id) =>
        ({
          data: {
            agentId: id,
            guidQuestionDtos:
              id === 7 ? [] : [{ type: 'Question', info: `问题 ${id}` }],
          },
        } as any),
    );

    render(<Home />);
    fireEvent.click(await screen.findByRole('button', { name: '普通对话' }));
    fireEvent.click(await screen.findByRole('button', { name: '问题 71' }));
    expect(screen.queryByRole('button', { name: '普通对话' })).toBeNull();
    expect(
      screen.getByRole('button', { name: '对话任务' }),
    ).toBeInTheDocument();
    expect(setText).toHaveBeenCalledWith('问题 71');
    expect(handleCreateConversation).not.toHaveBeenCalled();
    act(() => input.props.onClearSelectedTag());
    expect(screen.queryByRole('button', { name: '问题 71' })).toBeNull();
    await screen.findByRole('button', { name: '普通对话' });
  });

  it('展示当前专家问题，点击仅填入草稿，切换与移除后清理', async () => {
    handoffMap.homeSummonedExpert = { agentId: 8, name: '专家 A' };
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id) =>
        ({
          data: {
            agentId: id,
            guidQuestionDtos: [{ type: 'Question', info: `问题 ${id}` }],
          },
        } as any),
    );
    render(<Home />);
    fireEvent.click(await screen.findByRole('button', { name: '问题 8' }));
    expect(setText).toHaveBeenCalledTimes(1);
    expect(setText).toHaveBeenCalledWith('问题 8');
    expect(handleCreateConversation).not.toHaveBeenCalled();
    act(() =>
      input.props.onExpertAgentSelect({ targetId: 10, name: '专家 B' }),
    );
    await screen.findByRole('button', { name: '问题 10' });
    expect(screen.queryByRole('button', { name: '问题 8' })).toBeNull();
    act(() => input.props.onClearSummonedExpert());
    expect(screen.queryByRole('button', { name: '问题 10' })).toBeNull();
  });

  it('快速切换专家时忽略旧详情的晚到响应，空配置不显示问题', async () => {
    let resolveOld!: (value: any) => void;
    handoffMap.homeSummonedExpert = { agentId: 8, name: '专家 A' };
    vi.mocked(apiPublishedAgentInfo).mockImplementation((id) =>
      id === 8
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve({
            data: { agentId: id, guidQuestionDtos: [] },
          } as any),
    );
    render(<Home />);
    await waitFor(() => expect(resolveOld).toBeDefined());
    act(() =>
      input.props.onExpertAgentSelect({ targetId: 10, name: '专家 B' }),
    );
    await act(async () => {
      resolveOld({
        data: {
          agentId: 8,
          guidQuestionDtos: [{ type: 'Question', info: '旧问题' }],
        },
      });
    });
    expect(screen.queryByRole('button', { name: '旧问题' })).toBeNull();
    expect(input.props.agentId).toBe(10);
  });

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
    expect(input.props.showExpertCapability).toBe(false);
    expect(input.props.onClearSelectedTag).toBeTypeOf('function');
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

  it('未手选智能体时等待默认智能体详情，并透传 ChatBot 类型限制能力', async () => {
    let resolveDefault!: (value: any) => void;
    vi.mocked(apiPublishedAgentInfo).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDefault = resolve;
        }),
    );

    render(<Home />);
    await waitFor(() => expect(resolveDefault).toBeDefined());
    expect(apiPublishedAgentInfo).toHaveBeenCalledWith(7);
    expect(input.props.agentTypeLoading).toBe(true);

    await act(async () => {
      resolveDefault({
        data: { agentId: 7, type: 'ChatBot', manualComponents: [] },
      });
    });
    expect(input.props.agentType).toBe('ChatBot');
    expect(input.props.agentTypeLoading).toBe(false);

    await act(async () => {
      await input.props.onEnter(
        '默认智能体问题',
        [],
        [11],
        undefined,
        'yolo',
        [{ slugId: 12 }],
        [{ id: 13, type: 'Agent', name: '专家' }],
      );
    });
    expect(handleCreateConversation).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        infos: [],
        skillIds: [],
        selectedDocs: [],
      }),
    );
  });
});
