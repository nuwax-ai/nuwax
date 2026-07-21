import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import ChatArea from '@/pages/AppDev/components/ChatArea';
import {
  DataResourceStatus,
  DataResourceType,
} from '@/types/interfaces/dataResource';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseModel,
  mockUseIntersectionObserver,
  intersectionState,
  mockAdjustScrollPositionAfterDOMUpdate,
  mockChatInputHome,
  mockReactScrollToBottomContainer,
  mockMarkdownWrapper,
  mockThinking,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockUseIntersectionObserver: vi.fn(),
  intersectionState: {
    inView: false,
    ref: vi.fn(),
  },
  mockAdjustScrollPositionAfterDOMUpdate: vi.fn(),
  mockChatInputHome: vi.fn(),
  mockReactScrollToBottomContainer: vi.fn(),
  mockMarkdownWrapper: vi.fn(),
  mockThinking: vi.fn(),
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string, ...args: string[]) => [key, ...args].join('|'),
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (...args: unknown[]) =>
    mockUseIntersectionObserver(...args),
}));

vi.mock('@/utils/scrollUtils', () => ({
  adjustScrollPositionAfterDOMUpdate: (...args: unknown[]) =>
    mockAdjustScrollPositionAfterDOMUpdate(...args),
}));

vi.mock('@/services/appDev', () => ({
  cancelAgentTask: vi.fn(),
  cancelAiChatAgentTask: vi.fn(),
}));

vi.mock('@/components/business-component/AppDevEmptyState', () => ({
  default: ({ type, title }: { type: string; title: string }) => (
    <div data-testid="empty-state" data-type={type}>
      {title}
    </div>
  ),
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: () => <span data-testid="svg-icon" />,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('./components/ChatAreaTabs', () => ({
  default: ({ activeTab, setActiveTab }: any) => (
    <div data-testid="chat-tabs" data-active-tab={activeTab}>
      <button type="button" onClick={() => setActiveTab('chat')}>
        chat tab
      </button>
      <button type="button" onClick={() => setActiveTab('data')}>
        data tab
      </button>
    </div>
  ),
}));

vi.mock('./components/ChatInputHome', () => ({
  default: (props: any) => {
    mockChatInputHome(props);
    return (
      <div data-testid="chat-input">
        <button type="button" onClick={() => props.onEnter?.()}>
          send
        </button>
      </div>
    );
  },
}));

vi.mock('./components/ReactScrollToBottomContainer', () => {
  const React = require('react');
  const scrollElement = {
    scrollTop: 40,
    scrollHeight: 800,
  };
  return {
    default: React.forwardRef(
      ({ children, onScrollPositionChange }: any, ref: any) => {
        mockReactScrollToBottomContainer({ onScrollPositionChange });
        React.useImperativeHandle(ref, () => ({
          getScrollContainer: () => scrollElement,
          handleScrollButtonClick: vi.fn(),
        }));
        return <div data-testid="scroll-container">{children}</div>;
      },
    ),
  };
});

vi.mock('./components/AppDevMarkdownCMDWrapper', () => ({
  default: (props: any) => {
    mockMarkdownWrapper(props);
    return (
      <div
        data-testid="markdown-wrapper"
        data-message-id={props.message.id}
        data-history={String(props.isHistoryMessage)}
      >
        {props.message.text}
      </div>
    );
  },
}));

vi.mock('./components/AssistantThinkingCollapsible', () => ({
  default: (props: any) => {
    mockThinking(props);
    return (
      <div
        data-testid="assistant-thinking"
        data-finished={String(props.isThinkingFinished)}
      >
        {props.think}
      </div>
    );
  },
}));

vi.mock('./components/MessageAttachment', () => ({
  default: ({ attachment, type }: any) => (
    <div data-testid="message-attachment" data-type={type}>
      {attachment?.filename || attachment?.name}
    </div>
  ),
}));

vi.mock('./components/DataResourceList', () => ({
  default: ({ resources }: any) => (
    <div data-testid="data-resource-list">{resources?.length || 0}</div>
  ),
}));

vi.mock('../DesignViewer', () => ({
  default: require('react').forwardRef(() => (
    <div data-testid="design-viewer" />
  )),
}));

function createChat(overrides: Record<string, any> = {}) {
  return {
    chatMessages: [],
    isChatLoading: false,
    isLoadingHistory: false,
    hasMoreHistoryRef: { current: false },
    isLoadingMoreHistoryRef: { current: false },
    currentPageRef: { current: 1 },
    aiChatSessionId: '',
    sendMessage: vi.fn(),
    loadHistorySessions: vi.fn().mockResolvedValue(undefined),
    cancelChat: vi.fn(),
    setChatInput: vi.fn(),
    ...overrides,
  };
}

function renderChatArea(
  props: Partial<React.ComponentProps<typeof ChatArea>> = {},
) {
  return render(
    <ChatArea
      chat={createChat()}
      projectId="project-1"
      selectedDataSources={[]}
      onUpdateDataSources={vi.fn()}
      fileContentState={{}}
      isSupportDesignMode={false}
      modelSelector={{}}
      {...props}
    />,
  );
}

const latestChatInputProps = () =>
  mockChatInputHome.mock.calls.at(-1)?.[0] as any;

describe('AppDev ChatArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intersectionState.inView = false;
    intersectionState.ref = vi.fn();
    mockUseIntersectionObserver.mockReturnValue(intersectionState);
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'menuModel') {
        return { hasPermissionByMenuCode: vi.fn().mockReturnValue(true) };
      }
      if (name === 'autoErrorHandling') {
        return { autoRetryCount: 0 };
      }
      return {};
    });
  });

  it('加载历史时只展示 loading 空态，不渲染消息', () => {
    renderChatArea({
      chat: createChat({
        isLoadingHistory: true,
        chatMessages: [{ id: 'user-1', role: 'USER', text: 'hidden' }],
      }),
    });

    expect(screen.getByTestId('empty-state')).toHaveAttribute(
      'data-type',
      'loading',
    );
    expect(screen.queryByText('hidden')).toBeNull();
    expect(screen.queryByTestId('markdown-wrapper')).toBeNull();
  });

  it('按 AppDev 消息角色渲染用户文本、助手思考和 markdown 正文', () => {
    renderChatArea({
      chat: createChat({
        chatMessages: [
          {
            id: 'user-1',
            role: 'USER',
            text: 'hello\nappdev',
            attachments: [
              {
                type: 'Document',
                content: { id: 'doc-1', filename: 'spec.md' },
              },
            ],
          },
          {
            id: 'assistant-1',
            role: 'ASSISTANT',
            text: '',
            think: 'planning',
            isStreaming: true,
          },
        ],
      }),
    });

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('appdev')).toBeInTheDocument();
    expect(screen.getByTestId('message-attachment')).toHaveAttribute(
      'data-type',
      'Document',
    );
    expect(screen.getByTestId('assistant-thinking')).toHaveAttribute(
      'data-finished',
      'false',
    );
    expect(screen.getByTestId('markdown-wrapper')).toHaveAttribute(
      'data-message-id',
      'assistant-1',
    );
    expect(mockThinking).toHaveBeenCalledWith(
      expect.objectContaining({
        think: 'planning',
        isThinkingFinished: false,
      }),
    );
  });

  it('历史会话消息渲染分隔符，并把 assistant 标记为 history 渲染', () => {
    renderChatArea({
      chat: createChat({
        chatMessages: [
          {
            id: 'assistant-history',
            role: 'ASSISTANT',
            text: 'history answer',
            think: 'history thinking',
            sessionId: 'session-1',
            conversationTopic: 'Build app',
            conversationCreated: '2026-07-11T10:20:00Z',
          },
        ],
      }),
    });

    expect(screen.getByText('Build app')).toBeInTheDocument();
    expect(screen.getByTestId('assistant-thinking')).toHaveAttribute(
      'data-finished',
      'true',
    );
    expect(screen.getByTestId('markdown-wrapper')).toHaveAttribute(
      'data-history',
      'true',
    );
  });

  it('发送时把上传文件、原型图、@文件和技能转换后交给 chat.sendMessage', () => {
    const chat = createChat();
    const onUserManualSendMessage = vi.fn();
    const onUpdateDataSources = vi.fn();
    const selectedDataSources = [
      {
        id: 1,
        name: 'plugin source',
        type: DataResourceType.PLUGIN,
        status: DataResourceStatus.ACTIVE,
        isSelected: true,
      },
    ];
    renderChatArea({
      chat,
      selectedDataSources,
      onUpdateDataSources,
      onUserManualSendMessage,
    });

    act(() => {
      latestChatInputProps().onEnter(
        [
          {
            uid: 'img-1',
            name: 'screen.png',
            type: 'image/png',
            url: 'https://example.test/screen.png',
            width: 320,
            height: 200,
          },
          {
            uid: 'doc-1',
            name: 'brief.pdf',
            type: 'application/pdf',
            url: 'https://example.test/brief.pdf',
            size: 1234,
          },
        ],
        [
          {
            uid: 'proto-1',
            name: 'prototype.png',
            type: 'image/png',
            url: 'https://example.test/prototype.png',
          },
        ],
        [
          {
            type: 'file',
            data: { name: 'src/App.tsx', path: '/src/App.tsx' },
          },
        ],
        undefined,
        [101],
      );
    });

    expect(chat.sendMessage).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: 'Image',
          content: expect.objectContaining({ filename: 'screen.png' }),
        }),
        expect.objectContaining({
          type: 'Document',
          content: expect.objectContaining({ filename: 'brief.pdf' }),
        }),
        expect.objectContaining({
          type: 'Text',
          content: expect.objectContaining({
            filename: 'src/App.tsx',
            source: {
              source_type: 'FilePath',
              data: { path: '/src/App.tsx' },
            },
          }),
        }),
      ],
      [
        {
          url: 'https://example.test/screen.png',
          mimeType: 'image/png',
          fileName: 'screen.png',
          fileKey: 'img-1',
        },
        {
          url: 'https://example.test/brief.pdf',
          mimeType: 'application/pdf',
          fileName: 'brief.pdf',
          fileKey: 'doc-1',
        },
      ],
      [
        {
          url: 'https://example.test/prototype.png',
          mimeType: 'image/png',
          fileName: 'prototype.png',
          fileKey: 'proto-1',
        },
      ],
      undefined,
      [
        {
          type: 'file',
          data: { name: 'src/App.tsx', path: '/src/App.tsx' },
        },
      ],
      [101],
    );
    expect(onUserManualSendMessage).toHaveBeenCalledTimes(1);
    expect(onUpdateDataSources).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1, isSelected: false }),
    ]);
  });

  it('到顶 sentinel 进入视口时只加载下一页历史，并做滚动锚定补偿', async () => {
    const chat = createChat({
      hasMoreHistoryRef: { current: true },
      currentPageRef: { current: 2 },
      chatMessages: Array.from({ length: MESSAGE_PAGE_SIZE }, (_, index) => ({
        id: `m-${index}`,
        role: 'USER',
        text: `message ${index}`,
      })),
    });
    const { rerender } = renderChatArea({ chat });

    intersectionState.inView = true;
    rerender(
      <ChatArea
        chat={chat}
        projectId="project-1"
        selectedDataSources={[]}
        onUpdateDataSources={vi.fn()}
        fileContentState={{}}
        isSupportDesignMode={false}
        modelSelector={{}}
      />,
    );

    await waitFor(() => {
      expect(chat.loadHistorySessions).toHaveBeenCalledWith(3, true);
    });
    expect(mockAdjustScrollPositionAfterDOMUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ scrollTop: 40, scrollHeight: 800 }),
      40,
      800,
    );

    rerender(
      <ChatArea
        chat={chat}
        projectId="project-1"
        selectedDataSources={[]}
        onUpdateDataSources={vi.fn()}
        fileContentState={{}}
        isSupportDesignMode={false}
        modelSelector={{}}
      />,
    );
    expect(chat.loadHistorySessions).toHaveBeenCalledTimes(1);
  });
});
