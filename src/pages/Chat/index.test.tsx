/**
 * Chat / ChatCore 页面组装单测（不改业务代码）
 *
 * 覆盖：
 * - ChatPage 将路由 params 传给 ChatCore
 * - loadingConversation / loadingAsync 展示 Loading
 * - 加载完成后渲染 LeftContent，并下发 effectiveAgent
 * - effectiveAgent：优先 conversationInfo.agent
 * - showSidebar=false 不渲染 AgentSidebar
 * - enableResizable 控制 ResizableSplit
 * - new_chat 时默认选中 DefaultSelected=Yes 的 manualComponents
 */
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseModel,
  mockUseParams,
  mockUseLocation,
  mockHistory,
  mockRunAsync,
  mockLeftContent,
  mockAgentSidebar,
  mockResizableSplit,
  mockInitSelectedComponentList,
  conversationInfoState,
  agentDetailState,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockUseParams: vi.fn(),
  mockUseLocation: vi.fn(),
  mockHistory: { replace: vi.fn(), push: vi.fn(), action: 'POP', location: {} },
  mockRunAsync: vi.fn(),
  mockLeftContent: vi.fn(),
  mockAgentSidebar: vi.fn(),
  mockResizableSplit: vi.fn(),
  mockInitSelectedComponentList: vi.fn(),
  conversationInfoState: {
    current: null as any,
  },
  agentDetailState: {
    current: null as any,
  },
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
  useParams: (...args: unknown[]) => mockUseParams(...args),
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
  history: mockHistory,
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (k: string) => k,
  dict: (k: string) => k,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('./components/LeftContent', () => ({
  default: (props: any) => {
    mockLeftContent(props);
    return (
      <div
        data-testid="left-content"
        data-agent-name={props.effectiveAgent?.name || ''}
      />
    );
  },
}));

vi.mock('./components/ShowArea', () => ({
  default: () => <div data-testid="show-area" />,
}));

vi.mock('@/components/AgentSidebar', () => ({
  default: (props: any) => {
    mockAgentSidebar(props);
    return <div data-testid="agent-sidebar" />;
  },
}));

vi.mock('@/components/ResizableSplit', () => ({
  default: (props: any) => {
    mockResizableSplit(props);
    return (
      <div data-testid="resizable-split">
        {props.left}
        {props.right}
      </div>
    );
  },
}));

vi.mock('@/components/ConditionRender', () => ({
  default: ({ condition, children }: { condition?: boolean; children?: any }) =>
    condition ? <>{children}</> : null,
}));

vi.mock('@/components/business-component', () => ({
  ConversationBottomConsole: () => null,
  CopyToSpaceComponent: () => null,
  PagePreviewIframe: () => null,
}));

vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));

vi.mock(
  '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView',
  () => ({
    useFileTreePreviewView: () => ({
      tree: {
        selectedFileId: '',
        handleFileSelect: vi.fn(),
        handleRefreshFileList: vi.fn(),
      },
      preview: { isSavingFiles: false },
      changeFiles: [],
      refreshGitList: vi.fn(),
      isRefreshingGitList: false,
      gitBranch: 'main',
    }),
  }),
);

vi.mock('@/components/business-component/FileTreeGitSourcePanel', () => ({
  useSourceControl: () => ({
    selectedChangeFiles: [],
    setSelectedChangeFiles: vi.fn(),
    selectedChangeFile: null,
    setSelectedChangeFile: vi.fn(),
    selectedDiffFile: null,
    clearSelectedDiff: vi.fn(),
    isCommitting: false,
    refreshGitList: vi.fn(),
    handleDiffFileSelect: vi.fn(),
    handleOpenChangeFile: vi.fn(),
    handleDiscardChange: vi.fn(),
    handleStageChanges: vi.fn(),
    handleUnstageChanges: vi.fn(),
    handleAddToGitignore: vi.fn(),
    handleCommit: vi.fn(),
  }),
}));

vi.mock('./hooks/useChatFiles', () => ({
  useChatFiles: () => ({
    handleFileClick: vi.fn(),
    handleTaskResultClick: vi.fn(),
    handleCreateFileNode: vi.fn(),
    handleDeleteFile: vi.fn(),
    handleConfirmRenameFile: vi.fn(),
    handleSaveFiles: vi.fn(),
    handleSaveFileContent: Object.assign(vi.fn(), { cancel: vi.fn() }),
    handleUploadMultipleFiles: vi.fn(),
    handleExportProject: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAgentDetails', () => ({
  default: () => ({
    get agentDetail() {
      return agentDetailState.current;
    },
    setAgentDetail: (v: any) => {
      agentDetailState.current = v;
    },
  }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    agentSubscriptionPlans: [],
    loadingAgentSubscriptionPlans: false,
    mySubscriptionInfo: null,
    loadingMySubscription: false,
    createSubscriptionOrder: vi.fn(),
    queryAgentSubscriptionPlans: vi.fn(),
  }),
}));

vi.mock('@/hooks/useExclusivePanels', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/useMessageEventDelegate', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/useSelectedComponent', () => ({
  default: () => ({
    selectedComponentList: [],
    setSelectedComponentList: vi.fn(),
    handleSelectComponent: vi.fn(),
    initSelectedComponentList: mockInitSelectedComponentList,
  }),
}));

vi.mock('@/hooks/useTerminalWsUrl', () => ({
  default: () => ({ terminalWsUrl: '', refreshTerminalWsUrl: vi.fn() }),
}));

vi.mock('./hooks/useAutoPreviewFile', () => ({
  useAutoPreviewFile: () => ({ handleAutoPreviewLastFile: vi.fn() }),
}));

vi.mock('./hooks/useChatConversation', () => ({
  useChatConversation: () => ({
    handleClear: vi.fn(),
    handleMessageSend: vi.fn(),
  }),
}));

vi.mock('./hooks/useChatSandbox', () => ({
  useChatSandbox: () => ({
    setSelectedComputerId: vi.fn(),
    isSelectionLocked: false,
    setIsSelectionLocked: vi.fn(),
    hasUserSentMessage: false,
    setHasUserSentMessage: vi.fn(),
    getEffectiveSandboxId: vi.fn(() => undefined),
    finalSelectedId: '',
  }),
}));

vi.mock('./hooks/useChatVariables', () => ({
  useChatVariables: () => ({
    variableParams: null,
    setVariableParams: vi.fn(),
    isSendMessageRef: { current: false },
    isChatInputDisabled: false,
    isVariablesFilled: false,
  }),
}));

vi.mock('./hooks/useChatViewMode', () => ({
  useChatViewMode: () => ({
    isShowFilePanel: false,
    showCopyButton: false,
    handleFileTreeVisible: vi.fn(),
    handleOpenDesktopView: vi.fn(),
  }),
}));

vi.mock('@/utils/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/common')>();
  return {
    ...actual,
    addBaseTarget: vi.fn(),
    parsePageAppProjectId: vi.fn(() => 0),
  };
});

vi.mock('@/utils/router', () => ({
  jumpToPageDevelop: vi.fn(),
}));

vi.mock('@/services/vncDesktop', () => ({
  apiUpdateStaticFile: vi.fn(),
}));

vi.mock('@/constants/agent.constants', () => ({
  isAgentVersionControlEnabled: () => false,
}));

import ChatPage, { ChatCore } from './index';

/** 构造 conversationInfo model 返回值 */
const buildConversationInfoModel = (
  overrides: Record<string, unknown> = {},
) => {
  const messageViewRef = { current: null };
  const allowAutoScrollRef = { current: true };
  const scrollTimeoutRef = { current: null };
  const refreshGitListRef = { current: null };
  return {
    conversationInfo: conversationInfoState.current,
    loadingConversation: false,
    manualComponents: [],
    messageList: [],
    setMessageList: vi.fn(),
    chatSuggestList: [],
    runAsync: mockRunAsync,
    setIsLoadingConversation: vi.fn(),
    loadingSuggest: false,
    onMessageSend: vi.fn(),
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn: false,
    setShowScrollBtn: vi.fn(),
    resetInit: vi.fn(),
    handleClearSideEffect: vi.fn(),
    setIsLoadingOtherInterface: vi.fn(),
    requiredNameList: [],
    setConversationInfo: vi.fn((updater: any) => {
      if (typeof updater === 'function') {
        conversationInfoState.current = updater(conversationInfoState.current);
      } else {
        conversationInfoState.current = updater;
      }
    }),
    variables: [],
    userFillVariables: null,
    showType: undefined,
    setShowType: vi.fn(),
    isFileTreeVisible: false,
    isFileTreePinned: false,
    setIsFileTreePinned: vi.fn(),
    viewMode: 'preview',
    setViewMode: vi.fn(),
    openPreviewView: vi.fn(),
    closePreviewView: vi.fn(),
    openDesktopView: vi.fn(),
    clearFilePanelInfo: vi.fn(),
    fileTreeData: [],
    setFileTreeData: vi.fn(),
    fileTreeDataLoading: false,
    handleRefreshFileList: vi.fn(),
    refreshFileListImmediately: vi.fn(),
    taskAgentSelectedFileId: '',
    setTaskAgentSelectedFileId: vi.fn(),
    taskAgentSelectTrigger: 0,
    setTaskAgentSelectTrigger: vi.fn(),
    vncContainerInfo: null,
    ensureDesktopConnection: vi.fn(),
    restartVncPod: vi.fn(),
    restartAgent: vi.fn(),
    isRestartAgentLoading: false,
    isConversationActive: false,
    runStopConversation: vi.fn(),
    loadingStopConversation: false,
    getCurrentConversationId: vi.fn(),
    getCurrentConversationRequestId: vi.fn(),
    disabledConversationActive: vi.fn(),
    isLoadingOtherInterface: false,
    isMoreMessage: false,
    setIsMoreMessage: vi.fn(),
    loadingMore: false,
    handleLoadMoreMessage: vi.fn(),
    resumeConversationStream: vi.fn(),
    abortResumeStream: vi.fn(),
    refreshGitListRef,
    respondAcpPermission: vi.fn(),
    respondMcpAsk: vi.fn(),
    ...overrides,
  };
};

describe('ChatCore / ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conversationInfoState.current = null;
    agentDetailState.current = { name: 'DetailAgent', agentId: 200 };
    mockUseParams.mockReturnValue({ id: '100', agentId: '200' });
    mockUseLocation.mockReturnValue({
      pathname: '/chat/200/100',
      search: '',
      state: null,
      key: 'k1',
    });
    mockRunAsync.mockResolvedValue({
      data: {
        id: 100,
        messageList: [],
        agent: { name: 'ConvAgent', id: 200 },
      },
    });

    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationInfo') {
        return buildConversationInfoModel();
      }
      if (name === 'chat') {
        return {
          pagePreviewData: null,
          showPagePreview: vi.fn(),
          hidePagePreview: vi.fn(),
        };
      }
      if (name === 'layout') {
        return { isMobile: false };
      }
      if (name === 'conversationHistory') {
        return { runHistoryItem: vi.fn() };
      }
      if (name === 'useOpenApp') {
        return {
          handleSetAppAgentDetail: vi.fn(),
          isAppSidebarMode: false,
          isAppSidebarVisible: false,
          toggleAppSidebarVisible: vi.fn(),
          createAppNewConversation: vi.fn(),
          openPaymentModal: false,
          setOpenPaymentModal: vi.fn(),
          localCalledTrialCount: 0,
          incrementCalledTrialCount: vi.fn(),
        };
      }
      if (name === 'tenantConfigInfo') {
        return { tenantConfigInfo: { enableSubscription: 0 } };
      }
      return {};
    });
  });

  it('ChatPage：将路由 params 转为数字传给 ChatCore，并渲染主区域', async () => {
    render(<ChatPage />);

    await waitFor(() => {
      expect(mockRunAsync).toHaveBeenCalledWith(100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
    });
  });

  it('loadingConversation=true 时展示 Loading，不渲染 LeftContent', () => {
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationInfo') {
        return buildConversationInfoModel({ loadingConversation: true });
      }
      if (name === 'chat') {
        return {
          pagePreviewData: null,
          showPagePreview: vi.fn(),
          hidePagePreview: vi.fn(),
        };
      }
      if (name === 'layout') return { isMobile: false };
      if (name === 'conversationHistory') return { runHistoryItem: vi.fn() };
      if (name === 'useOpenApp') {
        return {
          handleSetAppAgentDetail: vi.fn(),
          isAppSidebarMode: false,
          isAppSidebarVisible: false,
          toggleAppSidebarVisible: vi.fn(),
          createAppNewConversation: vi.fn(),
          openPaymentModal: false,
          setOpenPaymentModal: vi.fn(),
          localCalledTrialCount: 0,
          incrementCalledTrialCount: vi.fn(),
        };
      }
      if (name === 'tenantConfigInfo') {
        return { tenantConfigInfo: { enableSubscription: 0 } };
      }
      return {};
    });

    const { container } = render(
      <ChatCore id={100} agentId={200} enableResizable showSidebar />,
    );

    expect(container.querySelector('.anticon-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('left-content')).toBeNull();
  });

  it('加载完成后优先用 conversationInfo.agent 作为 effectiveAgent', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent', id: 200 },
      messageList: [],
    };
    agentDetailState.current = { name: 'DetailAgent', agentId: 200 };

    render(<ChatCore id={100} agentId={200} />);

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toHaveAttribute(
        'data-agent-name',
        'ConvAgent',
      );
    });
  });

  it('无 conversationInfo.agent 时回退 agentDetail', async () => {
    conversationInfoState.current = null;
    agentDetailState.current = { name: 'DetailAgent', agentId: 200 };

    // runAsync 不带 agent，保持 conversationInfo.agent 为空
    mockRunAsync.mockResolvedValue({
      data: { id: 100, messageList: [] },
    });

    render(
      <ChatCore
        id={100}
        agentId={200}
        locationState={{
          defaultAgentDetail: {
            name: 'DetailAgent',
            agentId: 200,
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toHaveAttribute(
        'data-agent-name',
        'DetailAgent',
      );
    });
  });

  it('showSidebar=false 时不渲染 AgentSidebar', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} showSidebar={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('agent-sidebar')).toBeNull();
  });

  it('showSidebar=true 时渲染 AgentSidebar', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} showSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('agent-sidebar')).toBeInTheDocument();
    });
  });

  it('enableResizable=true 使用 ResizableSplit', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} enableResizable />);

    await waitFor(() => {
      expect(screen.getByTestId('resizable-split')).toBeInTheDocument();
    });
    expect(mockResizableSplit).toHaveBeenCalled();
  });

  it('enableResizable=false 不使用 ResizableSplit', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} enableResizable={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('resizable-split')).toBeNull();
  });

  it('new_chat 时用 manualComponents 初始化默认选中组件', async () => {
    const manuals = [
      {
        id: 1,
        type: AgentComponentTypeEnum.Plugin,
        defaultSelected: DefaultSelectedEnum.Yes,
      },
      {
        id: 2,
        type: AgentComponentTypeEnum.Plugin,
        defaultSelected: DefaultSelectedEnum.No,
      },
    ];

    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationInfo') {
        return buildConversationInfoModel({ manualComponents: manuals });
      }
      if (name === 'chat') {
        return {
          pagePreviewData: null,
          showPagePreview: vi.fn(),
          hidePagePreview: vi.fn(),
        };
      }
      if (name === 'layout') return { isMobile: false };
      if (name === 'conversationHistory') return { runHistoryItem: vi.fn() };
      if (name === 'useOpenApp') {
        return {
          handleSetAppAgentDetail: vi.fn(),
          isAppSidebarMode: false,
          isAppSidebarVisible: false,
          toggleAppSidebarVisible: vi.fn(),
          createAppNewConversation: vi.fn(),
          openPaymentModal: false,
          setOpenPaymentModal: vi.fn(),
          localCalledTrialCount: 0,
          incrementCalledTrialCount: vi.fn(),
        };
      }
      if (name === 'tenantConfigInfo') {
        return { tenantConfigInfo: { enableSubscription: 0 } };
      }
      return {};
    });

    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    await act(async () => {
      render(
        <ChatCore
          id={100}
          agentId={200}
          locationState={{ messageSourceType: 'new_chat' }}
        />,
      );
    });

    await waitFor(() => {
      expect(mockInitSelectedComponentList).toHaveBeenCalledWith(manuals);
    });
  });
});
