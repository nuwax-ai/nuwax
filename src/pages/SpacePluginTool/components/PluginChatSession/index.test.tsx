import PluginChatSession from '@/pages/SpacePluginTool/components/PluginChatSession';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSession, mockUseModel, mockUseLocation, mockHistory } = vi.hoisted(
  () => ({
    mockSession: vi.fn(),
    mockUseModel: vi.fn(),
    mockUseLocation: vi.fn(),
    mockHistory: { location: { state: undefined } },
  }),
);

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: unknown) => {
    mockSession(props);
    return <div />;
  },
}));
vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: () => null,
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
  beforeEach(() => vi.clearAllMocks());

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
});
