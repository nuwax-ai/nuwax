import PluginChatSession from '@/pages/SpacePluginTool/components/PluginChatSession';
import { TaskStatus } from '@/types/enums/agent';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSession,
  mockUseModel,
  mockUseLocation,
  mockHistory,
  mockUseRuntimeSession,
} = vi.hoisted(() => ({
  mockSession: vi.fn(),
  mockUseModel: vi.fn(),
  mockUseLocation: vi.fn(),
  mockHistory: { location: { state: undefined } },
  mockUseRuntimeSession: vi.fn(),
}));

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: unknown) => {
    mockSession(props);
    return <div />;
  },
}));
vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: (...args: unknown[]) =>
    mockUseRuntimeSession(...args),
}));
vi.mock('umi', () => ({
  history: mockHistory,
  useLocation: () => mockUseLocation(),
  useModel: () => mockUseModel(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

describe('PluginChatSession 首条消息', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认无 runtime 线（V1 形态），V2 用例自行覆写
    mockUseRuntimeSession.mockReturnValue(null);
  });

  it('明确不选工具时不被默认工具覆盖，首条消息仍发出', async () => {
    const onMessageSend = vi.fn();
    mockUseLocation.mockReturnValue({
      state: { message: '开发插件', infos: [] },
    });
    mockUseModel.mockReturnValue({
      conversationInfo: {
        id: 7001,
        messageList: [],
        agent: { manualComponents: [{ id: 2, type: 'Workflow' }] },
      },
      messageList: [],
      chatSuggestList: [],
      runAsync: vi.fn().mockResolvedValue({}),
      onMessageSend,
      resetInit: vi.fn(),
    });

    render(<PluginChatSession conversationId={7001} />);

    await waitFor(() => {
      expect(mockSession.mock.calls.at(-1)?.[0].selectedComponentList).toEqual(
        [],
      );
      expect(onMessageSend).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7001,
          messageInfo: '开发插件',
          infos: [],
        }),
      );
    });
  });

  it('V2 线：首条消息直发 runtime store（乐观轮次与渲染同线，bug 2477），不再走 model 线', async () => {
    const send = vi.fn();
    const onMessageSend = vi.fn();
    mockUseLocation.mockReturnValue({
      state: { message: '开发插件', skillIds: [301] },
    });
    mockUseRuntimeSession.mockReturnValue({ session: { send } });
    mockUseModel.mockReturnValue({
      conversationInfo: {
        id: 7001,
        messageList: [],
        agent: { manualComponents: [], openSuggest: 'Open' },
      },
      messageList: [],
      chatSuggestList: [],
      runAsync: vi.fn().mockResolvedValue({}),
      onMessageSend,
      resetInit: vi.fn(),
    });

    render(<PluginChatSession conversationId={7001} />);

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 7001,
        message: '开发插件',
        sandboxId: '-1',
        debug: true,
        skillIds: [301],
        isSuggestEnabled: true,
      }),
    );
    expect(onMessageSend).not.toHaveBeenCalled();
  });
});

describe('PluginChatSession 结束后刷新配置', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ state: undefined });
    mockUseModel.mockReturnValue({
      conversationInfo: { id: 7001, taskStatus: TaskStatus.COMPLETE },
      isConversationActive: false,
      runAsync: vi.fn().mockResolvedValue({}),
      resetInit: vi.fn(),
    });
    mockUseRuntimeSession.mockReturnValue(null);
  });

  it('V2 会话结束时刷新一次，初始加载、持续执行和重复渲染均不刷新', async () => {
    const onFinished = vi.fn();
    const renderSession = () => (
      <PluginChatSession
        conversationId={7001}
        onConversationFinished={onFinished}
      />
    );
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: false });
    const { rerender } = render(renderSession());
    await waitFor(() =>
      expect(mockSession.mock.calls.at(-1)?.[0].isLoading).toBe(false),
    );
    expect(onFinished).not.toHaveBeenCalled();

    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: true });
    rerender(renderSession());
    rerender(renderSession());
    expect(onFinished).not.toHaveBeenCalled();

    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: false });
    rerender(renderSession());
    rerender(renderSession());
    expect(onFinished).toHaveBeenCalledTimes(1);

    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: true });
    rerender(renderSession());
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: false });
    rerender(renderSession());
    expect(onFinished).toHaveBeenCalledTimes(2);
  });

  it('V2 结束判断不受旧线的活跃状态干扰', async () => {
    const onFinished = vi.fn();
    mockUseModel.mockReturnValue({
      ...mockUseModel(),
      isConversationActive: true,
      conversationInfo: { id: 7001, taskStatus: TaskStatus.EXECUTING },
    });
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: true });
    const { rerender } = render(<PluginChatSession conversationId={7001} />);
    await waitFor(() =>
      expect(mockSession.mock.calls.at(-1)?.[0].isLoading).toBe(false),
    );
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: false });
    rerender(
      <PluginChatSession
        conversationId={7001}
        onConversationFinished={onFinished}
      />,
    );
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('V1 本地流结束后等待后台任务终态再刷新', async () => {
    const onFinished = vi.fn();
    const model = {
      ...mockUseModel(),
      isConversationActive: true,
      conversationInfo: { id: 7001, taskStatus: TaskStatus.EXECUTING },
    };
    mockUseModel.mockReturnValue(model);
    const renderSession = () => (
      <PluginChatSession
        conversationId={7001}
        onConversationFinished={onFinished}
      />
    );
    const { rerender } = render(renderSession());
    await waitFor(() =>
      expect(mockSession.mock.calls.at(-1)?.[0].isLoading).toBe(false),
    );
    mockUseModel.mockReturnValue({ ...model, isConversationActive: false });
    rerender(renderSession());
    expect(onFinished).not.toHaveBeenCalled();

    mockUseModel.mockReturnValue({
      ...model,
      isConversationActive: false,
      conversationInfo: { id: 7001, taskStatus: TaskStatus.COMPLETE },
    });
    rerender(renderSession());
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('切换到另一个空闲会话时不误判为上一会话结束', async () => {
    const onFinished = vi.fn();
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: true });
    const { rerender } = render(
      <PluginChatSession
        conversationId={7001}
        onConversationFinished={onFinished}
      />,
    );
    await waitFor(() =>
      expect(mockSession.mock.calls.at(-1)?.[0].isLoading).toBe(false),
    );
    mockUseRuntimeSession.mockReturnValue({ effectiveIsActive: false });
    rerender(
      <PluginChatSession
        conversationId={7002}
        onConversationFinished={onFinished}
      />,
    );
    await waitFor(() =>
      expect(mockSession.mock.calls.at(-1)?.[0].isLoading).toBe(false),
    );
    expect(onFinished).not.toHaveBeenCalled();
  });
});
