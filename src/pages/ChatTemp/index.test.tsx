/**
 * ChatTemp 页面单元测试（不改业务代码）
 *
 * 覆盖已有逻辑：
 * - 租户配置无验证码时查询临时会话
 * - 查询成功：开场白 / 问题建议 / 必填变量 wholeDisabled
 * - 发送消息乐观更新 + SSE 事件合并（PROCESSING / MESSAGE / FINAL_RESULT / ERROR）
 * - onError / onClose 收尾
 */
import { TEMP_CONVERSATION_UID } from '@/constants/common.constants';
import {
  ConversationEventTypeEnum,
  MessageModeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseModel,
  mockUseParams,
  mockCreateSSEConnection,
  mockUseRequest,
  mockMessageWarning,
  mockMessageError,
  mockUuidV4,
  mockCheckConversationActive,
  mockDisabledConversationActive,
  mockSetCurrentConversationRequestId,
  mockSetConversationInfoMessageList,
  mockResetInit,
  mockHandleChatProcessingList,
  mockRunTenantConfig,
  mockApiTempChatConversationQuery,
  mockApiTempChatConversationCreate,
  mockApiTempChatConversationStop,
  chatInputPropsRef,
  stableTenantConfigInfo,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockUseParams: vi.fn(),
  mockCreateSSEConnection: vi.fn(),
  mockUseRequest: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockMessageError: vi.fn(),
  mockUuidV4: vi.fn(),
  mockCheckConversationActive: vi.fn(),
  mockDisabledConversationActive: vi.fn(),
  mockSetCurrentConversationRequestId: vi.fn(),
  mockSetConversationInfoMessageList: vi.fn(),
  mockResetInit: vi.fn(),
  mockHandleChatProcessingList: vi.fn(),
  mockRunTenantConfig: vi.fn(),
  mockApiTempChatConversationQuery: vi.fn(),
  mockApiTempChatConversationCreate: vi.fn(),
  mockApiTempChatConversationStop: vi.fn(),
  chatInputPropsRef: { current: null as any },
  /** 保持引用稳定，避免 tenantConfig effect 因新对象反复触发 asyncFun */
  stableTenantConfigInfo: {
    captchaSceneId: '',
    captchaPrefix: '',
    openCaptcha: false,
    siteName: 'Nuwax',
    siteUrl: 'https://example.com',
  },
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
  useParams: (...args: unknown[]) => mockUseParams(...args),
}));

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('uuid', () => ({
  v4: (...args: unknown[]) => mockUuidV4(...args),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      warning: (...args: unknown[]) => mockMessageWarning(...args),
      error: (...args: unknown[]) => mockMessageError(...args),
    },
  };
});

vi.mock('@/utils/fetchEventSource', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSEConnection(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: unknown[]) =>
    args.length ? `${key}:${args.join(',')}` : key,
}));

vi.mock('@/services/tempChat', () => ({
  apiTempChatConversationCreate: mockApiTempChatConversationCreate,
  apiTempChatConversationQuery: mockApiTempChatConversationQuery,
}));

vi.mock('@/services/agentConfig', () => ({
  apiTempChatConversationStop: mockApiTempChatConversationStop,
}));

vi.mock('@/hooks/useConversationScrollDetection', () => ({
  useConversationScrollDetection: vi.fn(),
}));

vi.mock('@/hooks/useMessageEventDelegate', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/common')>();
  return {
    ...actual,
    addBaseTarget: vi.fn(),
  };
});

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/components/ChatInputHome', () => ({
  default: (props: any) => {
    chatInputPropsRef.current = props;
    return (
      <div data-testid="chat-input-home">
        <button
          type="button"
          data-testid="send-btn"
          onClick={() => props.onEnter?.('hello from test')}
        >
          send
        </button>
        <span data-testid="whole-disabled">
          {String(!!props.wholeDisabled)}
        </span>
      </div>
    );
  },
}));

vi.mock('./ChatInputPhone', () => ({
  default: () => <div data-testid="chat-input-phone" />,
}));

vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div
      data-testid="chat-view"
      data-message-id={String(messageInfo.id ?? '')}
      data-status={String(messageInfo.status ?? '')}
      data-think={messageInfo.think || ''}
      data-thinking-finished={String(messageInfo.thinkingFinished)}
    >
      {messageInfo.text}
    </div>
  ),
}));

vi.mock('@/components/AgentChatEmpty', () => ({
  default: ({ name }: { name?: string }) => (
    <div data-testid="agent-chat-empty">{name}</div>
  ),
}));

vi.mock('@/components/NewConversationSet', () => ({
  default: () => <div data-testid="new-conversation-set" />,
}));

vi.mock('@/components/RecommendList', () => ({
  default: ({
    chatSuggestList,
  }: {
    chatSuggestList?: Array<string | { content?: string }>;
  }) => (
    <div data-testid="recommend-list">
      {(chatSuggestList || [])
        .map((item) => (typeof item === 'string' ? item : item?.content || ''))
        .join(',')}
    </div>
  ),
}));

vi.mock('@/components/ConditionRender', () => ({
  default: ({
    condition,
    children,
  }: {
    condition?: boolean;
    children?: ReactNode;
  }) => (condition ? <>{children}</> : null),
}));

vi.mock('@/components/ResizableSplit', () => ({
  default: ({ left }: { left?: ReactNode }) => (
    <div data-testid="resizable-split">{left}</div>
  ),
}));

vi.mock('@/components/business-component/PagePreviewIframe', () => ({
  default: () => null,
}));

vi.mock('@/components/AliyunCaptcha', () => ({
  default: () => <div data-testid="aliyun-captcha" />,
}));

import ChatTemp from './index';

type SseHandlers = {
  onMessage?: (res: ConversationChatResponse) => void;
  onError?: () => void;
  onClose?: () => void;
};

describe('ChatTemp', () => {
  let sseHandlers: SseHandlers;
  let abortFn: ReturnType<typeof vi.fn>;
  let queryOnSuccess:
    | ((result: { data: ConversationInfo }) => void)
    | undefined;
  let queryOnError: (() => void) | undefined;
  let queryRun: ReturnType<typeof vi.fn>;
  let uuidSeq: number;

  const baseConversation = (
    overrides: Partial<ConversationInfo> = {},
  ): ConversationInfo =>
    ({
      id: 1,
      agent: {
        name: 'Temp Agent',
        icon: 'https://example.com/icon.png',
        openingChatMsg: '欢迎使用临时会话',
        guidQuestionDtos: [{ content: '预设问题1' }],
        variables: [],
        manualComponents: [],
      },
      messageList: [],
      ...overrides,
    } as ConversationInfo);

  beforeEach(() => {
    vi.clearAllMocks();
    chatInputPropsRef.current = null;
    queryOnSuccess = undefined;
    queryOnError = undefined;
    uuidSeq = 0;
    mockUuidV4.mockImplementation(() => {
      uuidSeq += 1;
      return `temp-uuid-${uuidSeq}`;
    });

    mockUseParams.mockReturnValue({ chatKey: 'chat-key-1' });
    sessionStorage.setItem(TEMP_CONVERSATION_UID, 'uid-existing');

    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationInfo') {
        return {
          checkConversationActive: mockCheckConversationActive,
          disabledConversationActive: mockDisabledConversationActive,
          setCurrentConversationRequestId: mockSetCurrentConversationRequestId,
          setMessageList: mockSetConversationInfoMessageList,
          resetInit: mockResetInit,
        };
      }
      if (name === 'tenantConfigInfo') {
        return {
          tenantConfigInfo: stableTenantConfigInfo,
          runTenantConfig: mockRunTenantConfig,
        };
      }
      if (name === 'chat') {
        return {
          handleChatProcessingList: mockHandleChatProcessingList,
          pagePreviewData: null,
          hidePagePreview: vi.fn(),
        };
      }
      return {};
    });

    queryRun = vi.fn();
    mockUseRequest.mockImplementation((service: unknown, options?: any) => {
      // 临时会话查询：捕获 onSuccess / onError
      if (service === mockApiTempChatConversationQuery) {
        queryOnSuccess = options?.onSuccess;
        queryOnError = options?.onError;
        return {
          run: (...args: unknown[]) => {
            queryRun(...args);
            return undefined;
          },
          runAsync: vi.fn(),
          loading: false,
        };
      }
      if (service === mockApiTempChatConversationCreate) {
        return {
          run: vi.fn(),
          runAsync: vi.fn().mockResolvedValue({
            success: true,
            data: { uid: 'uid-new' },
          }),
          loading: false,
        };
      }
      if (service === mockApiTempChatConversationStop) {
        return {
          run: vi.fn(),
          runAsync: vi.fn(),
          loading: false,
        };
      }
      return {
        run: vi.fn(),
        runAsync: vi.fn(),
        loading: false,
      };
    });

    abortFn = vi.fn();
    sseHandlers = {};
    mockCreateSSEConnection.mockImplementation(async (options: SseHandlers) => {
      sseHandlers = options;
      return abortFn;
    });

    Element.prototype.scrollTo = vi.fn() as typeof Element.prototype.scrollTo;
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  /** 渲染页面并模拟查询成功回调 */
  const renderAndLoadConversation = async (
    data: ConversationInfo = baseConversation(),
  ) => {
    render(<ChatTemp />);
    expect(mockResetInit).toHaveBeenCalled();
    expect(mockRunTenantConfig).toHaveBeenCalled();

    await waitFor(() => {
      expect(queryRun).toHaveBeenCalledWith({
        chatKey: 'chat-key-1',
        conversationUid: 'uid-existing',
      });
    });

    await act(async () => {
      queryOnSuccess?.({ data });
    });
  };

  it('挂载时 resetInit，无验证码时按已有 uid 查询会话', async () => {
    await renderAndLoadConversation();
    expect(screen.getByTestId('chat-input-home')).toBeInTheDocument();
  });

  it('无历史消息时展示开场白，并显示预置问题建议', async () => {
    await renderAndLoadConversation();

    await waitFor(() => {
      const views = screen.getAllByTestId('chat-view');
      expect(views[0]).toHaveTextContent('欢迎使用临时会话');
    });
    expect(screen.getByTestId('recommend-list').textContent).toContain(
      '预设问题1',
    );
  });

  it('有必填变量且未填写时 wholeDisabled=true', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [
            {
              name: 'city',
              require: true,
              systemVariable: false,
            },
          ],
          openingChatMsg: '',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
        messageList: [],
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('whole-disabled')).toHaveTextContent('true');
    });
  });

  it('wholeDisabled 时点击发送只提示，不建 SSE', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [
            {
              name: 'city',
              require: true,
              systemVariable: false,
            },
          ],
          openingChatMsg: 'hi',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('whole-disabled')).toHaveTextContent('true');
    });

    await userEvent.click(screen.getByTestId('send-btn'));
    expect(mockMessageWarning).toHaveBeenCalled();
    expect(mockCreateSSEConnection).not.toHaveBeenCalled();
  });

  it('发送消息：乐观追加 user + assistant，并建立 SSE', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: 'welcome',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('whole-disabled')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByTestId('send-btn'));

    await waitFor(() => {
      expect(mockCreateSSEConnection).toHaveBeenCalled();
    });

    const views = screen.getAllByTestId('chat-view');
    // 开场白 + user + assistant
    expect(views.length).toBeGreaterThanOrEqual(3);
    expect(views.some((el) => el.textContent === 'hello from test')).toBe(true);
    expect(
      views.some(
        (el) => el.getAttribute('data-status') === MessageStatusEnum.Loading,
      ),
    ).toBe(true);
    expect(abortFn).toHaveBeenCalled();
  });

  it('SSE MESSAGE THINK / 普通文本 / FINAL_RESULT / ERROR 合并正确', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: '',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
        messageList: [],
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('whole-disabled')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(sseHandlers.onMessage).toBeTypeOf('function'));

    const assistantId = 'temp-uuid-2'; // user=1, assistant=2（无开场白 uuid）

    // THINK
    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'r1',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 't1',
          type: MessageModeEnum.THINK,
          id: 'think-1',
          finished: false,
        },
      } as ConversationChatResponse);
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === assistantId);
      expect(el?.getAttribute('data-think')).toContain('t1');
      expect(el?.getAttribute('data-status')).toBe(
        MessageStatusEnum.Incomplete,
      );
      expect(el?.getAttribute('data-thinking-finished')).toBe('false');
    });

    // 真实流中的 CHAT 分片仍为 finished=false，但已代表上一轮 THINK 结束
    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'r1',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'answer',
          type: MessageModeEnum.CHAT,
          id: 'chat-1',
          finished: false,
        },
      } as ConversationChatResponse);
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === assistantId);
      expect(el?.textContent).toContain('answer');
      expect(el?.getAttribute('data-status')).toBe(
        MessageStatusEnum.Incomplete,
      );
      expect(el?.getAttribute('data-thinking-finished')).toBe('true');
    });

    // FINAL_RESULT
    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'r-final',
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: { success: true, outputText: 'done' },
      } as ConversationChatResponse);
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === assistantId);
      expect(el?.getAttribute('data-status')).toBe(MessageStatusEnum.Complete);
    });
    expect(mockSetCurrentConversationRequestId).toHaveBeenCalledWith('r-final');
  });

  it('SSE PROCESSING：写入 Loading；ERROR 事件置 Error', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: '',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
      }),
    );

    await userEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(sseHandlers.onMessage).toBeTypeOf('function'));
    const assistantId = 'temp-uuid-2';

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'rp',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'thinking before tool',
          type: MessageModeEnum.THINK,
          id: 'think-before-tool',
          finished: false,
        },
      } as ConversationChatResponse);
      sseHandlers.onMessage?.({
        requestId: 'rp',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          executeId: 'e1',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'e1' },
        },
      } as ConversationChatResponse);
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === assistantId);
      expect(el?.getAttribute('data-status')).toBe(MessageStatusEnum.Loading);
      expect(el?.getAttribute('data-thinking-finished')).toBe('true');
    });
    expect(mockHandleChatProcessingList).toHaveBeenCalled();

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 're',
        eventType: ConversationEventTypeEnum.ERROR,
        data: {},
      } as ConversationChatResponse);
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === assistantId);
      expect(el?.getAttribute('data-status')).toBe(MessageStatusEnum.Error);
    });
  });

  it('SSE onError：当前消息置 Error 并 disabledConversationActive', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: '',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
      }),
    );

    await userEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(sseHandlers.onError).toBeTypeOf('function'));

    await act(async () => {
      sseHandlers.onError?.();
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === 'temp-uuid-2');
      expect(el?.getAttribute('data-status')).toBe(MessageStatusEnum.Error);
    });
    expect(mockMessageError).toHaveBeenCalled();
    expect(mockDisabledConversationActive).toHaveBeenCalled();
  });

  it('SSE onClose：末条仍 Loading 时改为 Error', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: '',
          guidQuestionDtos: [],
          manualComponents: [],
        } as any,
      }),
    );

    await userEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(sseHandlers.onClose).toBeTypeOf('function'));

    await act(async () => {
      sseHandlers.onClose?.();
    });

    await waitFor(() => {
      const el = screen
        .getAllByTestId('chat-view')
        .find((node) => node.getAttribute('data-message-id') === 'temp-uuid-2');
      expect(el?.getAttribute('data-status')).toBe(MessageStatusEnum.Error);
    });
    expect(mockDisabledConversationActive).toHaveBeenCalled();
  });

  it('查询失败时调用 disabledConversationActive', async () => {
    render(<ChatTemp />);
    await waitFor(() => expect(queryOnError).toBeTypeOf('function'));

    await act(async () => {
      queryOnError?.();
    });
    expect(mockDisabledConversationActive).toHaveBeenCalled();
  });

  it('历史最后一条为 QUESTION 时展示 ext 建议', async () => {
    await renderAndLoadConversation(
      baseConversation({
        agent: {
          name: 'Temp Agent',
          variables: [],
          openingChatMsg: '',
          guidQuestionDtos: [{ content: '不应显示' }],
          manualComponents: [],
        } as any,
        messageList: [
          {
            id: 'hist-1',
            type: MessageModeEnum.QUESTION,
            text: 'q?',
            status: MessageStatusEnum.Complete,
            ext: [{ content: '历史建议A' }, { content: '历史建议B' }],
          } as MessageInfo,
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('recommend-list').textContent).toContain(
        '历史建议A',
      );
      expect(screen.getByTestId('recommend-list').textContent).toContain(
        '历史建议B',
      );
    });
  });
});
