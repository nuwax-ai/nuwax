import PluginChatSession from '@/pages/SpacePluginTool/components/PluginChatSession';
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
