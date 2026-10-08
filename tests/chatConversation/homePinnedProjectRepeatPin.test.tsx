/**
 * 禅道bug2394 回归：项目上框「+」重复触发不得带出租户默认智能体的工具。
 * 三守卫各有用例——全栈上框未命中不回落默认智能体（工具不被默认工具稳定
 * 占据）、同项目重复 pin 保留智能体（不重发智能体详情）、切换会话对象后旧
 * 详情晚到不覆盖（cancelled 守卫）。桩法对齐 homeSummonedExpertHandoff.test.tsx。
 */
import Home from '@/pages/Home';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { fetchChatboxCategories } from '@/services/square';
import { apiNormalProjectGetById } from '@/services/userProjectApp';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode } from 'react';
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
vi.mock('@/components/SiteFooter/index.less', () => ({
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

vi.mock('@/services/userProjectApp', () => ({
  apiNormalProjectGetById: vi.fn(),
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
  vi.mocked(apiNormalProjectGetById).mockReset();
  vi.mocked(apiNormalProjectGetById).mockResolvedValue({
    code: '0000',
    data: undefined,
  } as any);
});

afterEach(cleanup);

describe('项目新建任务的电脑与工作目录', () => {
  beforeEach(() => {
    vi.mocked(apiDisplayRecommendList).mockResolvedValue({
      data: { recChatBoxNav: { Agent: [] } },
    } as any);
    vi.mocked(fetchChatboxCategories).mockResolvedValue([]);
    // 即便默认智能体不开放电脑选择、绑定了另一台电脑，项目配置仍可修改。
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (agentId: number) =>
        ({
          data: {
            agentId,
            type: 'ChatBot',
            allowPrivateSandbox: 0,
            sandboxId: 888,
            manualComponents: [],
          },
        } as any),
    );
  });

  const pinNormalProject = (overrides: Record<string, unknown> = {}) => {
    handoffState.setContext('homePinnedProject', {
      projectId: 6,
      projectType: 'NormalProject',
      name: '常规项目 B',
      sandboxId: 366,
      workspacePath: '/work/project',
      ...overrides,
    });
  };

  it.each([true, false])('owner=%s 时继承项目配置并允许修改', async (owner) => {
    pinNormalProject({ owner });
    render(<Home />);
    await waitFor(() => {
      expect(input.props.agentTypeLoading).toBe(false);
      expect(input.props.wholeDisabled).toBe(false);
    });

    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/project');
    expect(input.props.isTaskAgentActive).toBe(true);
    expect(input.props.readonly).toBe(false);
    expect(input.props.agentSandboxId).toBeUndefined();
    expect(input.props.autoSelectComputer).toBe(false);
    expect(input.props.fixedSelection).toBeFalsy();
    expect(input.props.onWorkspaceDirChange).toBeTypeOf('function');
    expect(apiNormalProjectGetById).toHaveBeenCalledTimes(1);
    expect(apiNormalProjectGetById).toHaveBeenCalledWith(6);

    await act(async () => input.props.onEnter('项目任务'));
    expect(handleCreateConversation).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        projectId: 6,
        projectType: 'NormalProject',
        sandboxId: 366,
        selectedComputerId: '366',
        workspacePath: '/work/project',
      }),
    );
  });

  it('发送采用用户修改的目录和电脑，换电脑先清掉旧目录', async () => {
    pinNormalProject();
    render(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));

    act(() => input.props.onWorkspaceDirChange('/work/edited'));
    await act(async () => input.props.onEnter('修改目录'));
    expect(handleCreateConversation).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({
        sandboxId: 366,
        workspacePath: '/work/edited',
      }),
    );

    act(() => input.props.onComputerSelect('777'));
    expect(input.props.selectedComputerId).toBe('777');
    expect(input.props.workspacePath).toBe('');
    act(() => input.props.onWorkspaceDirChange('/other/project'));
    await act(async () => input.props.onEnter('修改电脑'));
    expect(handleCreateConversation).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({
        projectId: 6,
        sandboxId: 777,
        selectedComputerId: '777',
        workspacePath: '/other/project',
      }),
    );

    act(() => input.props.onComputerSelect('-1'));
    expect(input.props.workspacePath).toBe('');
    await act(async () => input.props.onEnter('云端任务'));
    expect(handleCreateConversation).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ sandboxId: -1, workspacePath: undefined }),
    );
  });

  it('再次点击同项目新建任务恢复默认配置，保留智能体；切换项目继承新配置', async () => {
    pinNormalProject();
    const { rerender } = render(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    act(() => input.props.onComputerSelect('777'));
    act(() => input.props.onWorkspaceDirChange('/other/draft'));
    const requestCount = vi.mocked(apiPublishedAgentInfo).mock.calls.length;

    pinNormalProject({ name: '常规项目 B 改名', workspacePath: '/work/new' });
    rerender(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    expect(input.props.pinnedProject.name).toBe('常规项目 B 改名');
    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/new');
    expect(vi.mocked(apiPublishedAgentInfo)).toHaveBeenCalledTimes(
      requestCount,
    );
    expect(apiNormalProjectGetById).toHaveBeenCalledTimes(2);

    pinNormalProject({
      projectId: 8,
      name: '常规项目 C',
      sandboxId: 999,
      workspacePath: '/work/project-c',
    });
    rerender(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    expect(input.props.selectedComputerId).toBe('999');
    expect(input.props.workspacePath).toBe('/work/project-c');
  });

  it('项目类型不同但数字 ID 相同时也继承新项目配置', async () => {
    pinUserAppProject();
    const { rerender } = render(<Home />);
    await waitFor(() => expect(input.props.pinnedProject.name).toBe('全栈 A'));

    pinNormalProject({ projectId: 5 });
    rerender(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/project');
  });

  it.each([-1, 0, undefined])(
    '项目电脑为 %s 时默认云端，不继承个人目录',
    async (sandboxId) => {
      pinNormalProject({ sandboxId });
      render(<Home />);
      await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
      expect(input.props.selectedComputerId).toBe('-1');
      expect(input.props.workspacePath).toBe('');
      expect(input.props.autoSelectComputer).toBe(false);
    },
  );

  it('项目内换智能体保留电脑和目录，移除项目恢复智能体选择规则', async () => {
    pinNormalProject();
    render(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));

    act(() =>
      input.props.onExpertAgentSelect({ targetId: 67, name: '新专家' }),
    );
    await waitFor(() => expect(input.props.agentId).toBe(67));
    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/project');
    expect(input.props.autoSelectComputer).toBe(false);
    expect(input.props.agentSandboxId).toBeUndefined();

    act(() => input.props.onClearPinnedProject());
    expect(input.props.pinnedProject).toBeUndefined();
    expect(input.props.selectedComputerId).toBe('-1');
    expect(input.props.workspacePath).toBe('');
    expect(input.props.autoSelectComputer).toBe(true);
    expect(input.props.agentSandboxId).toBe(888);
    expect(input.props.readonly).toBe(true);
  });

  it.each([
    {
      workspacePath: '/explicit',
      agentWorkspacePath: '/agent',
      fileWorkspacePath: '/files',
      expected: '/explicit',
    },
    {
      workspacePath: null,
      agentWorkspacePath: '/agent',
      fileWorkspacePath: '/files',
      expected: '/agent',
    },
    { fileWorkspacePath: '/files', expected: '/files' },
    {
      workspacePath: null,
      agentWorkspacePath: null,
      fileWorkspacePath: null,
      expected: '',
    },
  ])(
    '读取一次最新详情并按移动端字段优先级继承 $expected',
    async ({ expected, ...paths }) => {
      vi.mocked(apiNormalProjectGetById).mockResolvedValue({
        code: '0000',
        data: { sandboxId: 417, sandboxType: 'Personal', ...paths },
      } as any);
      pinNormalProject({ workspacePath: undefined });
      render(<Home />);
      await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
      expect(apiNormalProjectGetById).toHaveBeenCalledTimes(1);
      expect(input.props.selectedComputerId).toBe('417');
      expect(input.props.workspacePath).toBe(expected);
    },
  );

  it('云端项目实际沙箱 ID 映射为云端电脑，仍可改用个人电脑', async () => {
    vi.mocked(apiNormalProjectGetById).mockResolvedValue({
      code: '0000',
      data: {
        sandboxId: 333,
        sandboxType: 'Cloud',
        agentWorkspacePath: '/container/project',
      },
    } as any);
    pinNormalProject({ sandboxId: 333, sandboxType: 'Cloud' });
    render(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    expect(input.props.selectedComputerId).toBe('-1');
    expect(input.props.workspacePath).toBe('');
    await act(async () => input.props.onEnter('云端项目任务'));
    expect(handleCreateConversation).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({
        projectId: 6,
        sandboxId: -1,
        workspacePath: undefined,
      }),
    );

    act(() => input.props.onComputerSelect('personal-computer'));
    act(() => input.props.onWorkspaceDirChange('/work/edited'));
    await act(async () => input.props.onEnter('改用个人电脑'));
    expect(handleCreateConversation).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({
        sandboxId: 'personal-computer',
        workspacePath: '/work/edited',
      }),
    );
  });

  it('配置加载期间阻止修改和发送，A → B → A 的旧响应不能覆盖最后的配置', async () => {
    const finishes: Array<(response: any) => void> = [];
    vi.mocked(apiNormalProjectGetById).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishes.push(resolve);
        }),
    );
    pinNormalProject();
    const { rerender } = render(<Home />);
    expect(input.props.wholeDisabled).toBe(true);
    act(() => input.props.onComputerSelect('777'));
    act(() => input.props.onWorkspaceDirChange('/ignored'));
    await act(async () => input.props.onEnter('加载中任务'));
    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/project');
    expect(handleCreateConversation).not.toHaveBeenCalled();

    pinNormalProject({ projectId: 8 });
    rerender(<Home />);
    pinNormalProject();
    rerender(<Home />);
    expect(apiNormalProjectGetById).toHaveBeenCalledTimes(3);
    await act(async () =>
      finishes[0]({
        code: '0000',
        data: { sandboxId: 111, agentWorkspacePath: '/old/a' },
      }),
    );
    expect(input.props.wholeDisabled).toBe(true);
    await act(async () =>
      finishes[2]({
        code: '0000',
        data: { sandboxId: 417, agentWorkspacePath: '/new/a' },
      }),
    );
    await act(async () =>
      finishes[1]({
        code: '0000',
        data: { sandboxId: 222, agentWorkspacePath: '/old/b' },
      }),
    );
    expect(input.props.selectedComputerId).toBe('417');
    expect(input.props.workspacePath).toBe('/new/a');
    expect(input.props.wholeDisabled).toBe(false);
  });

  it('移除项目后晚到配置不会重新绑定项目或覆盖首页选择', async () => {
    let finish!: (response: any) => void;
    vi.mocked(apiNormalProjectGetById).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    pinNormalProject();
    render(<Home />);
    act(() => input.props.onClearPinnedProject());
    await act(async () =>
      finish({
        code: '0000',
        data: { sandboxId: 417, agentWorkspacePath: '/old' },
      }),
    );
    expect(input.props.pinnedProject).toBeUndefined();
    expect(input.props.selectedComputerId).toBe('-1');
    expect(input.props.workspacePath).toBe('');
    expect(input.props.wholeDisabled).toBe(false);
  });

  it('详情请求失败被消费，保留入口默认值并允许继续修改', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiNormalProjectGetById).mockRejectedValue(new Error('网络失败'));
    pinNormalProject();
    render(<Home />);
    await waitFor(() => expect(input.props.wholeDisabled).toBe(false));
    expect(input.props.selectedComputerId).toBe('366');
    expect(input.props.workspacePath).toBe('/work/project');
    act(() => input.props.onComputerSelect('777'));
    expect(input.props.selectedComputerId).toBe('777');
    errorSpy.mockRestore();
  });

  it('StrictMode 重放 effect 时只读取一次配置，完成后恢复可编辑状态', async () => {
    let finish!: (response: any) => void;
    vi.mocked(apiNormalProjectGetById).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    pinNormalProject();
    render(
      <StrictMode>
        <Home />
      </StrictMode>,
    );
    expect(apiNormalProjectGetById).toHaveBeenCalledTimes(1);
    expect(input.props.wholeDisabled).toBe(true);
    await act(async () =>
      finish({
        code: '0000',
        data: { sandboxId: 417, agentWorkspacePath: '/work/project' },
      }),
    );
    expect(input.props.selectedComputerId).toBe('417');
    expect(input.props.workspacePath).toBe('/work/project');
    expect(input.props.wholeDisabled).toBe(false);
  });
});

describe('项目上框重复触发与默认智能体竞态（禅道bug2394）', () => {
  it('项目行 + 上框新项目时清掉输入框里原有专家，只保留项目智能体', async () => {
    mockHitRecommend();
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id: number) =>
        ({ data: agentDetailOf(id as number, HIT_AGENT_TOOLS) } as any),
    );

    const { rerender } = render(<Home />);
    act(() => {
      input.props.onExpertAgentSelect({ targetId: 66, name: '原有专家' });
    });
    expect(input.props.summonedExpert?.name).toBe('原有专家');

    // 左侧项目行点击 +：在已挂载的首页写入项目上框上下文。
    handoffState.setContext('homePinnedProject', {
      projectId: 5,
      projectType: 'UserApp',
      name: '全栈 A',
      devAgentId: 88,
    });
    rerender(<Home />);

    await waitFor(() =>
      expect(input.props.selectedTag?.label).toBe('全栈应用开发'),
    );
    expect(input.props.summonedExpert).toBeUndefined();
    expect(input.props.pinnedProject?.name).toBe('全栈 A');
  });

  it('常规项目行 + 上框时也清掉原有专家，允许重新选择专家', async () => {
    const { rerender } = render(<Home />);
    act(() => {
      input.props.onExpertAgentSelect({ targetId: 66, name: '原有专家' });
    });
    expect(input.props.summonedExpert?.name).toBe('原有专家');

    handoffState.setContext('homePinnedProject', {
      projectId: 6,
      projectType: 'NormalProject',
      name: '常规项目 B',
    });
    rerender(<Home />);

    await waitFor(() =>
      expect(input.props.pinnedProject?.name).toBe('常规项目 B'),
    );
    expect(input.props.summonedExpert).toBeUndefined();
    expect(input.props.selectedTag).toBeUndefined();
    expect(input.props.showExpertCapability).toBe(true);

    act(() => {
      input.props.onExpertAgentSelect({ targetId: 67, name: '新专家' });
    });
    expect(input.props.summonedExpert?.name).toBe('新专家');
    expect(input.props.pinnedProject?.name).toBe('常规项目 B');

    act(() => input.props.onClearPinnedProject());
    expect(input.props.showExpertCapability).toBe(true);
  });

  it('全栈项目自动选中智能体后锁定专家入口，不能再用 @ 替换', async () => {
    pinUserAppProject();
    mockHitRecommend();
    vi.mocked(apiPublishedAgentInfo).mockImplementation(
      async (id: number) =>
        ({ data: agentDetailOf(id as number, HIT_AGENT_TOOLS) } as any),
    );

    render(<Home />);
    await waitFor(() =>
      expect(input.props.selectedTag?.label).toBe('全栈应用开发'),
    );
    expect(input.props.showExpertCapability).toBe(false);
    expect(input.props.onClearSelectedTag).toBeUndefined();
    await act(async () => {
      input.props.onExpertAgentSelect({ targetId: 66, name: '新专家' });
    });

    expect(input.props.summonedExpert).toBeUndefined();
    expect(input.props.selectedTag?.label).toBe('全栈应用开发');
    expect(input.props.pinnedProject?.name).toBe('全栈 A');

    act(() => input.props.onClearPinnedProject());
    expect(input.props.showExpertCapability).toBe(true);
  });

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
