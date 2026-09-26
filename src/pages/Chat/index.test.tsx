/**
 * Chat / ChatCore 页面组装与客户端常驻入口测试
 *
 * 覆盖：
 * - ChatPage 将路由 params 传给 ChatCore
 * - loadingConversation / loadingAsync 展示 Loading
 * - 加载完成后渲染 LeftContent，并下发 effectiveAgent
 * - effectiveAgent：优先 conversationInfo.agent
 * - showSidebar=false 不下发智能体详情入口；弹窗默认关闭，入口回调可打开
 * - enableResizable 控制 ResizableSplit
 * - new_chat 时默认选中 DefaultSelected=Yes 的 manualComponents
 */
import { conversationPageCacheManager } from '@/features/conversation/react/useConversationPageCache';
import { fullPageInstanceCacheManager } from '@/features/conversation/react/useFullPageInstanceCache';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { CONVERSATION_RENDERER_EVENT } from '@/utils/conversationRendererPreference';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseModel,
  mockUseParams,
  mockUseLocation,
  mockHistory,
  mockRunAsync,
  mockLeftContent,
  mockAgentDetailModal,
  mockResizableSplit,
  mockInitSelectedComponentList,
  mockUseConversationRuntimeSession,
  mockRuntimeSend,
  mockRegisterClientConversationRenderer,
  mockStyle3PcKeepAliveEnabled,
  mockUseRealScope,
  mockScopedResets,
  mockScopedLoads,
  mockSetOpenPaymentModal,
  mockHandleSetAppAgentDetail,
  mockGlobalAppSidebarMode,
  conversationInfoState,
  agentDetailState,
  modelOverrides,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockUseParams: vi.fn(),
  mockUseLocation: vi.fn(),
  mockHistory: { replace: vi.fn(), push: vi.fn(), action: 'POP', location: {} },
  mockRunAsync: vi.fn(),
  mockLeftContent: vi.fn(),
  mockAgentDetailModal: vi.fn(),
  mockResizableSplit: vi.fn(),
  mockInitSelectedComponentList: vi.fn(),
  mockUseConversationRuntimeSession: vi.fn(),
  mockRuntimeSend: vi.fn(),
  mockRegisterClientConversationRenderer: vi.fn(),
  mockStyle3PcKeepAliveEnabled: { current: false },
  mockUseRealScope: { current: false },
  mockScopedResets: [] as number[],
  mockScopedLoads: [] as number[],
  mockSetOpenPaymentModal: vi.fn(),
  mockHandleSetAppAgentDetail: vi.fn(),
  mockGlobalAppSidebarMode: { current: false },
  conversationInfoState: {
    current: null as any,
  },
  agentDetailState: {
    current: null as any,
  },
  /** 每个用例可按需覆盖 conversationInfo model 字段（如文件树可见、任务结果选中文件） */
  modelOverrides: {
    current: {} as Record<string, unknown>,
  },
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
  useParams: (...args: unknown[]) => mockUseParams(...args),
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
  history: mockHistory,
  // useChatNormalProjectNameSync 等页面内 hook 经 umi 取 useRequest（ahooks）；
  // 此前 mock 缺该导出导致本套件在分支上整体红（预存），补最小桩
  useRequest: vi.fn(() => ({
    data: undefined,
    loading: false,
    error: undefined,
    run: vi.fn(),
  })),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (k: string) => k,
  dict: (k: string) => k,
}));

vi.mock('@/hooks/useStyle3PcKeepAliveEnabled', () => ({
  default: () => mockStyle3PcKeepAliveEnabled.current,
}));

vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: (...args: unknown[]) =>
    mockUseConversationRuntimeSession(...args),
}));

// 通常只测页面组装；并存用例切入真实 Provider，底层 model 接口仍由可控桩驱动。
vi.mock(
  '@/modelScopes/ConversationPageModelProvider',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/modelScopes/ConversationPageModelProvider')
    >();
    return {
      ConversationPageModelProvider: ({
        children,
      }: {
        children: React.ReactNode;
      }) =>
        mockUseRealScope.current ? (
          <actual.ConversationPageModelProvider>
            {children}
          </actual.ConversationPageModelProvider>
        ) : (
          <>{children}</>
        ),
    };
  },
);

vi.mock('@/models/conversationInfo', () => ({
  default: function MockConversationInfoModel() {
    const [conversationInfo, setConversationInfo] = React.useState<any>(null);
    const [messageList, setMessageList] = React.useState<any[]>([]);
    const currentIdRef = React.useRef<number | null>(null);
    // Vitest 在模块初始化完成后才挂载这个 mock 组件。
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const base = React.useMemo(() => buildConversationInfoModel(), []);
    const runAsync = React.useCallback(async (id: number) => {
      mockScopedLoads.push(id);
      currentIdRef.current = id;
      const data = {
        id,
        agent: { id: 200, name: `Agent-${id}` },
        messageList: [{ id: `message-${id}`, text: `内容-${id}` }],
      };
      setConversationInfo(data);
      setMessageList(data.messageList);
      return { data };
    }, []);
    const resetInit = React.useCallback(() => {
      if (currentIdRef.current !== null) {
        mockScopedResets.push(currentIdRef.current);
      }
      currentIdRef.current = null;
      setConversationInfo(null);
      setMessageList([]);
    }, []);
    return {
      ...base,
      conversationInfo,
      setConversationInfo,
      messageList,
      setMessageList,
      runAsync,
      resetInit,
      getCurrentConversationId: () => currentIdRef.current,
    };
  },
}));

vi.mock('@/services/skill', () => ({
  // handleAddToGitignore 按需拉 .gitignore 内容（#5a 懒加载收尾）；
  // 三态版用例未触发该流程，给个不抛错的 error 态即可
  fetchContentFromUrl: vi.fn().mockRejectedValue(new Error('not found')),
  fetchContentOutcome: vi.fn().mockResolvedValue({ status: 'error' }),
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
        data-message-text={props.chatSessionProps?.messageList
          ?.map((item: any) => item.text)
          .join(',')}
        data-renderer={props.chatSessionProps?.messageRenderer}
      />
    );
  },
}));

vi.mock('./components/ConversationInstanceCacheSlot', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/ShowArea', () => ({
  default: () => <div data-testid="show-area" />,
}));

vi.mock('@/components/business-component/AgentDetailModal', () => ({
  default: (props: any) => {
    mockAgentDetailModal(props);
    // open 受控：关闭时不渲染（与 antd Modal 行为一致）
    return props.open ? <div data-testid="agent-detail-modal" /> : null;
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
  // 同步真实签名：hook 返回 string（原 { terminalWsUrl, refreshTerminalWsUrl } 为陈旧形状）
  default: () => '',
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
  apiGetStaticFileList: vi.fn().mockResolvedValue({
    code: '0000',
    data: { files: [] },
  }),
  apiUpdateStaticFile: vi.fn(),
}));

vi.mock('@/constants/agent.constants', () => ({
  isAgentVersionControlEnabled: () => false,
}));

import ChatPage, { CachedChatPage, ChatCore } from './index';

/** 构造 conversationInfo model 返回值 */
function buildConversationInfoModel(overrides: Record<string, unknown> = {}) {
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
    fileTreeRefreshTrigger: 0,
    setFileTreeRefreshTrigger: vi.fn(),
    fileTreeSelfManaged: false,
    setFileTreeSelfManaged: vi.fn(),
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
}

describe('ChatCore / ChatPage', () => {
  beforeEach(() => {
    conversationPageCacheManager.invalidateAll('test-setup');
    fullPageInstanceCacheManager.invalidateAll('test-setup');
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.clearAllMocks();
    conversationInfoState.current = null;
    modelOverrides.current = {};
    mockStyle3PcKeepAliveEnabled.current = false;
    mockGlobalAppSidebarMode.current = false;
    mockUseRealScope.current = false;
    mockScopedResets.length = 0;
    mockScopedLoads.length = 0;
    mockUseConversationRuntimeSession.mockReturnValue(null);
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
        return buildConversationInfoModel(modelOverrides.current);
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
          handleSetAppAgentDetail: mockHandleSetAppAgentDetail,
          isAppSidebarMode: mockGlobalAppSidebarMode.current,
          isAppSidebarVisible: false,
          toggleAppSidebarVisible: vi.fn(),
          createAppNewConversation: vi.fn(),
          openPaymentModal: false,
          setOpenPaymentModal: mockSetOpenPaymentModal,
          localCalledTrialCount: 0,
          incrementCalledTrialCount: vi.fn(),
        };
      }
      if (name === 'tenantConfigInfo') {
        return { tenantConfigInfo: { enableSubscription: 0 } };
      }
      if (name === 'appTabKeepAlive') {
        return {
          registerClientConversationRenderer:
            mockRegisterClientConversationRenderer,
        };
      }
      return {};
    });
  });

  afterEach(() => {
    conversationPageCacheManager.invalidateAll('test-cleanup');
    fullPageInstanceCacheManager.invalidateAll('test-cleanup');
    localStorage.clear();
    window.history.replaceState(null, '', '/');
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

  it('PC style3 路由只注册常驻渲染器，不在 Outlet 重复挂载会话', () => {
    mockStyle3PcKeepAliveEnabled.current = true;
    mockUseLocation.mockReturnValue({
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
    });
    render(<ChatPage />);
    expect(mockRegisterClientConversationRenderer).toHaveBeenCalledWith(
      'conversation',
      CachedChatPage,
    );
    expect(mockRunAsync).not.toHaveBeenCalled();
    expect(screen.queryByTestId('left-content')).toBeNull();
  });

  it.each([
    '',
    '?hideMenu=true&hideNew=true&hideTitle=true&hideTerminal=true&hideTree=true',
  ])(
    'PC style3 独立 /app/chat 会话仍在 Outlet 渲染（query=%s）',
    async (search) => {
      mockStyle3PcKeepAliveEnabled.current = true;
      mockGlobalAppSidebarMode.current = true;
      mockUseLocation.mockReturnValue({
        pathname: '/app/chat/200/100',
        search,
        state: null,
      });
      render(<ChatPage />);
      await waitFor(() =>
        expect(screen.getByTestId('left-content')).toBeInTheDocument(),
      );
      expect(mockRunAsync).toHaveBeenCalledWith(100);
      expect(mockRegisterClientConversationRenderer).not.toHaveBeenCalled();
    },
  );

  it('PC style3 无效会话 id 仍走原路由页面兜底', () => {
    mockStyle3PcKeepAliveEnabled.current = true;
    mockUseParams.mockReturnValue({ id: '0', agentId: '200' });
    const { container } = render(<ChatPage />);
    expect(mockRegisterClientConversationRenderer).not.toHaveBeenCalled();
    expect(container.querySelector('.anticon-loading')).toBeInTheDocument();
  });

  it('隐藏页不挂载共享会话模型，重新激活时再按固定 id 加载', async () => {
    const { rerender } = render(
      <ChatCore id={100} agentId={200} active={false} />,
    );
    expect(mockUseModel).not.toHaveBeenCalled();
    expect(mockRunAsync).not.toHaveBeenCalled();

    rerender(<ChatCore id={100} agentId={200} active />);
    await waitFor(() => expect(mockRunAsync).toHaveBeenCalledWith(100));

    rerender(<ChatCore id={100} agentId={200} active={false} />);
    expect(screen.queryByTestId('left-content')).toBeNull();
  });

  it('旧页详情回包到达时不再发送首条消息', async () => {
    let resolveRequest: (value: any) => void = () => {};
    mockRunAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    mockUseConversationRuntimeSession.mockReturnValue({
      session: { send: mockRuntimeSend },
      conversationProps: {},
    });

    const { unmount } = render(
      <ChatCore
        id={100}
        agentId={200}
        initialLocationState={{ message: '离开前待发的消息' }}
      />,
    );
    await waitFor(() => expect(mockRunAsync).toHaveBeenCalledWith(100));
    unmount();
    await act(async () => {
      resolveRequest({ data: { id: 100, messageList: [] } });
    });
    expect(mockRuntimeSend).not.toHaveBeenCalled();
  });

  it('旧页卸载时不清空已经由其他会话接管的共享模型', async () => {
    const resetInit = vi.fn();
    modelOverrides.current = {
      getCurrentConversationId: () => 101,
      resetInit,
    };
    const { unmount } = render(<ChatCore id={100} agentId={200} />);
    await waitFor(() => expect(mockRunAsync).toHaveBeenCalledWith(100));
    unmount();
    expect(resetInit).not.toHaveBeenCalled();
  });

  it('客户端实例切出再切回时保留固定路由与已挂载会话', async () => {
    const route = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: { message: '本会话消息' },
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const { rerender } = render(<CachedChatPage route={route} active />);
    await waitFor(() => expect(mockRunAsync).toHaveBeenCalledTimes(1));

    mockUseLocation.mockReturnValue({
      pathname: '/home/chat/101/201',
      search: '',
      state: { message: '其他会话消息' },
      key: 'k2',
    });
    rerender(<CachedChatPage route={route} active={false} />);
    rerender(
      <CachedChatPage
        route={{
          ...route,
          search: '?conversationRenderer=v1',
          state: { message: '同 key 后续 state 不应重发' },
          navigationAction: 'REPLACE',
        }}
        active
      />,
    );
    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('left-content')).toHaveAttribute(
      'data-renderer',
      'v2',
    );
  });

  it('隐藏桌面会话时卸载 VNC 视图并释放独占标记，切回恢复', async () => {
    modelOverrides.current = {
      isFileTreeVisible: true,
      viewMode: 'desktop',
    };
    const route = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const { rerender } = render(<CachedChatPage route={route} active />);
    await waitFor(() =>
      expect(screen.getByTestId('left-content')).toBeInTheDocument(),
    );
    expect(mockLeftContent.mock.lastCall?.[0].fileSidebarProps.viewMode).toBe(
      'desktop',
    );
    expect(
      conversationPageCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBe('100');
    expect(
      fullPageInstanceCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBe('100');

    rerender(<CachedChatPage route={route} active={false} />);
    expect(mockLeftContent.mock.lastCall?.[0].fileSidebarProps.viewMode).toBe(
      'preview',
    );
    expect(
      conversationPageCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBeNull();
    expect(
      fullPageInstanceCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBeNull();

    rerender(<CachedChatPage route={route} active />);
    expect(mockLeftContent.mock.lastCall?.[0].fileSidebarProps.viewMode).toBe(
      'desktop',
    );
    expect(
      conversationPageCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBe('100');
    expect(
      fullPageInstanceCacheManager.getSnapshot().sharedVncOwnerConversationId,
    ).toBe('100');
  });

  it('隐藏页的详情状态更新会同步整页缓存执行优先级', async () => {
    fullPageInstanceCacheManager.activate({
      key: 'conversation:100',
      kind: 'conversation',
      conversationId: 100,
    });
    conversationInfoState.current = {
      id: 100,
      taskStatus: TaskStatus.EXECUTING,
      agent: { id: 200, name: 'Agent' },
    };
    const route = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const { rerender } = render(<CachedChatPage route={route} active />);
    expect(fullPageInstanceCacheManager.getEntry(route.key)?.running).toBe(
      true,
    );

    conversationInfoState.current = {
      ...conversationInfoState.current,
      taskStatus: TaskStatus.COMPLETE,
    };
    rerender(<CachedChatPage route={route} active={false} />);
    expect(fullPageInstanceCacheManager.getEntry(route.key)?.running).toBe(
      false,
    );
    expect(
      fullPageInstanceCacheManager.getEntry(route.key)?.terminalAt,
    ).not.toBeNull();
  });

  it('隐藏页关闭详情弹窗入口，切回仍保留本页展开状态', async () => {
    const route = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const { rerender } = render(<CachedChatPage route={route} active />);
    await waitFor(() =>
      expect(screen.getByTestId('left-content')).toBeInTheDocument(),
    );
    act(() => {
      mockLeftContent.mock.lastCall?.[0].headerProps.handleOpenAgentDetail();
    });
    expect(screen.getByTestId('agent-detail-modal')).toBeInTheDocument();

    rerender(<CachedChatPage route={route} active={false} />);
    expect(screen.queryByTestId('agent-detail-modal')).toBeNull();
    rerender(<CachedChatPage route={route} active />);
    expect(screen.getByTestId('agent-detail-modal')).toBeInTheDocument();
  });

  it('后台会话详情到达时不改写开放应用全局弹窗与智能体详情', async () => {
    mockGlobalAppSidebarMode.current = true;
    conversationInfoState.current = {
      id: 100,
      agent: {
        agentId: 200,
        name: 'Background Agent',
        paymentRequired: true,
        subscribed: false,
      },
    };
    const route = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    render(<CachedChatPage route={route} active={false} />);
    await waitFor(() =>
      expect(screen.getByTestId('left-content')).toBeInTheDocument(),
    );
    expect(mockLeftContent.mock.lastCall?.[0].isAppSidebarMode).toBe(false);
    expect(mockSetOpenPaymentModal).not.toHaveBeenCalled();
    expect(mockHandleSetAppAgentDetail).not.toHaveBeenCalled();
  });

  it('真实局部 Provider 下 A/B 消息互不覆盖，淘汰 A 不清理 B', async () => {
    mockUseRealScope.current = true;
    const routeA = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const routeB = {
      ...routeA,
      key: 'conversation:101',
      conversationId: 101,
      pathname: '/home/chat/101/200',
      params: { id: '101', agentId: '200' },
    };
    const { rerender } = render(
      <>
        <CachedChatPage key="A" route={routeA} active />
      </>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toHaveAttribute(
        'data-message-text',
        '内容-100',
      );
    });

    rerender(
      <>
        <CachedChatPage key="A" route={routeA} active={false} />
        <CachedChatPage key="B" route={routeB} active />
      </>,
    );
    await waitFor(() => {
      const contents = screen
        .getAllByTestId('left-content')
        .map((element) => element.getAttribute('data-message-text'));
      expect(contents).toContain('内容-100');
      expect(contents).toContain('内容-101');
    });
    expect(mockScopedLoads).toEqual([100, 101]);
    expect(mockScopedResets).toEqual([]);

    rerender(
      <>
        <CachedChatPage key="A" route={routeA} active />
        <CachedChatPage key="B" route={routeB} active={false} />
      </>,
    );
    expect(mockScopedLoads).toEqual([100, 101]);

    rerender(
      <>
        <CachedChatPage key="B" route={routeB} active />
      </>,
    );
    expect(screen.getByTestId('left-content')).toHaveAttribute(
      'data-message-text',
      '内容-101',
    );
    expect(mockScopedResets).toContain(100);
    expect(mockScopedResets).not.toContain(101);
  });

  it('A/B 固定各自的 URL 渲染偏好，隐藏期间全局 query 变化不串页', async () => {
    const routeA = {
      key: 'conversation:100',
      kind: 'conversation' as const,
      conversationId: 100,
      pathname: '/home/chat/100/200',
      search: '?conversationRenderer=v1',
      state: null,
      params: { id: '100', agentId: '200' },
      navigationAction: 'PUSH' as const,
    };
    const routeB = {
      ...routeA,
      key: 'conversation:101',
      conversationId: 101,
      pathname: '/home/chat/101/200',
      search: '?conversationRenderer=v2',
      params: { id: '101', agentId: '200' },
    };
    render(
      <>
        <div data-testid="route-A">
          <CachedChatPage route={routeA} active={false} />
        </div>
        <div data-testid="route-B">
          <CachedChatPage route={routeB} active />
        </div>
      </>,
    );
    await waitFor(() => {
      expect(
        screen
          .getByTestId('route-A')
          .querySelector('[data-testid="left-content"]'),
      ).toHaveAttribute('data-renderer', 'v1');
      expect(
        screen
          .getByTestId('route-B')
          .querySelector('[data-testid="left-content"]'),
      ).toHaveAttribute('data-renderer', 'v2');
    });

    window.history.replaceState(
      null,
      '',
      '/home/chat/101/200?conversationRenderer=v2',
    );
    act(() => {
      window.dispatchEvent(new Event(CONVERSATION_RENDERER_EVENT));
    });
    expect(
      screen
        .getByTestId('route-A')
        .querySelector('[data-testid="left-content"]'),
    ).toHaveAttribute('data-renderer', 'v1');
    expect(
      screen
        .getByTestId('route-B')
        .querySelector('[data-testid="left-content"]'),
    ).toHaveAttribute('data-renderer', 'v2');
  });

  it('runtime 开启时首条自动发送直接进入 runtime session', async () => {
    const legacySend = vi.fn();
    modelOverrides.current = { onMessageSend: legacySend };
    const loadedConversation = {
      id: 100,
      messageList: [],
      agent: { name: 'ConvAgent', id: 200, openSuggest: 1 },
    };
    mockRunAsync.mockResolvedValue({ data: loadedConversation });
    mockUseConversationRuntimeSession.mockReturnValue({
      session: { send: mockRuntimeSend },
      conversationProps: {},
    });

    render(
      <ChatCore
        id={100}
        agentId={200}
        locationState={{
          message: '首条消息',
          files: [{ key: 'f1', url: '/f1', name: 'a.txt', type: 'text/plain' }],
          infos: [{ id: 9, type: 'Plugin' }],
          variableParams: { city: '杭州' },
          skillIds: [11],
          selectedDocs: [{ id: 12, name: '资料' }],
          modelId: 456,
          agentMode: 'ask',
        }}
      />,
    );

    await waitFor(() => expect(mockRuntimeSend).toHaveBeenCalledTimes(1));
    expect(mockRuntimeSend).toHaveBeenCalledWith({
      conversationId: 100,
      message: '首条消息',
      files: [{ key: 'f1', url: '/f1', name: 'a.txt', type: 'text/plain' }],
      infos: [{ id: 9, type: 'Plugin' }],
      variableParams: { city: '杭州' },
      // 未选电脑时首条自动发送兜底云电脑哨兵 -1
      sandboxId: '-1',
      currentInfo: loadedConversation,
      isSuggestEnabled: true,
      skillIds: [11],
      selectedDocs: [{ id: 12, name: '资料' }],
      modelId: 456,
      agentMode: 'ask',
    });
    expect(legacySend).not.toHaveBeenCalled();
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

  it('showSidebar=false 时不下发智能体详情入口且弹窗不可见', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} showSidebar={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('agent-detail-modal')).toBeNull();
    const lastCall =
      mockLeftContent.mock.calls[mockLeftContent.mock.calls.length - 1];
    expect(lastCall[0].headerProps.showSidebar).toBe(false);
  });

  it('showSidebar=true 时弹窗默认关闭，入口回调可打开', async () => {
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent' },
      messageList: [],
    };

    render(<ChatCore id={100} agentId={200} showSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
    });
    // 默认关闭
    expect(screen.queryByTestId('agent-detail-modal')).toBeNull();

    // LeftContent 收到入口回调，调用后弹窗打开
    const lastCall =
      mockLeftContent.mock.calls[mockLeftContent.mock.calls.length - 1];
    expect(typeof lastCall[0].headerProps.handleOpenAgentDetail).toBe(
      'function',
    );
    act(() => {
      lastCall[0].headerProps.handleOpenAgentDetail();
    });
    expect(screen.getByTestId('agent-detail-modal')).toBeInTheDocument();
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

  it('A→B→A 时按会话恢复各自工作区视图', async () => {
    const openPreviewView = vi.fn();
    modelOverrides.current = { openPreviewView };
    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent', id: 200 },
      messageList: [],
    };
    const view = render(<ChatCore id={100} agentId={200} />);

    await waitFor(() => {
      expect(conversationPageCacheManager.getSnapshot().activeKey).toBe(
        'chat:100',
      );
    });
    act(() => {
      const props = mockLeftContent.mock.calls.at(-1)?.[0];
      props.headerProps.handleFileTreeVisible();
    });
    expect(conversationPageCacheManager.getEntry('chat:100')?.view).toBe(
      'filePreview',
    );

    conversationInfoState.current = {
      id: 101,
      agent: { name: 'OtherAgent', id: 200 },
      messageList: [],
    };
    mockRunAsync.mockResolvedValue({
      data: {
        id: 101,
        messageList: [],
        agent: { name: 'OtherAgent', id: 200 },
      },
    });
    view.rerender(<ChatCore id={101} agentId={200} />);
    await waitFor(() => {
      expect(conversationPageCacheManager.getSnapshot().activeKey).toBe(
        'chat:101',
      );
    });

    conversationInfoState.current = {
      id: 100,
      agent: { name: 'ConvAgent', id: 200 },
      messageList: [],
    };
    mockRunAsync.mockResolvedValue({
      data: {
        id: 100,
        messageList: [],
        agent: { name: 'ConvAgent', id: 200 },
      },
    });
    view.rerender(<ChatCore id={100} agentId={200} />);

    await waitFor(() => {
      expect(openPreviewView).toHaveBeenCalledWith(100);
    });
    expect(conversationPageCacheManager.getEntry('chat:100')?.view).toBe(
      'filePreview',
    );
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

  /**
   * 工作区外文件独立预览（V2 工具详情里的 /home/user/Desktop/*）：该面板整块
   * 顶替文件树面板，文件树/终端/云电脑同时不可见，故必须留退路——否则用户停在
   * 独立预览里，再也回不到工作区文件树预览。
   */
  describe('工作区外文件独立预览的退出链路', () => {
    const lastLeftProps = () => mockLeftContent.mock.calls.at(-1)?.[0] as any;

    /** 渲染 ChatCore（文件树可见）并打开一个工作区外沙箱文件 */
    const renderWithExternalPreview = async () => {
      conversationInfoState.current = {
        id: 100,
        agent: { name: 'ConvAgent', type: AgentTypeEnum.TaskAgent },
        messageList: [],
      };
      modelOverrides.current = { isFileTreeVisible: true };
      const utils = render(<ChatCore id={100} agentId={200} />);
      await waitFor(() => {
        expect(screen.getByTestId('left-content')).toBeInTheDocument();
      });

      act(() => {
        lastLeftProps().chatSessionProps.onOpenToolResource({
          kind: 'file',
          target: '/home/user/Desktop/note.md',
          name: 'note.md',
        });
      });
      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toEqual({
          cId: 100,
          targetDir: '/home/user',
          relativePath: 'Desktop/note.md',
        });
      });
      return utils;
    };

    it('点击文件预览入口，面板从独立预览回到文件树', async () => {
      await renderWithExternalPreview();

      act(() => {
        lastLeftProps().headerProps.handleFileTreeVisible();
      });

      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toBeNull();
      });
    });

    it('点击终端入口退出独立预览（终端挂在文件树面板内）', async () => {
      await renderWithExternalPreview();

      act(() => {
        lastLeftProps().headerProps.handleOpenTerminalPanel();
      });

      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toBeNull();
      });
    });

    it('点击智能体电脑入口退出独立预览（云电脑渲染在面板预览区）', async () => {
      await renderWithExternalPreview();

      act(() => {
        lastLeftProps().headerProps.handleOpenDesktopView();
      });

      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toBeNull();
      });
    });

    it('独立预览头部的返回入口可退出预览', async () => {
      await renderWithExternalPreview();

      act(() => {
        lastLeftProps().onExternalFilePreviewBack();
      });

      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toBeNull();
      });
    });

    it('触发链路选中工作区文件（TaskResult / markdown 链接）时退出独立预览', async () => {
      const utils = await renderWithExternalPreview();

      modelOverrides.current = {
        isFileTreeVisible: true,
        taskAgentSelectedFileId: 'src/a.md',
        taskAgentSelectTrigger: 7,
      };
      utils.rerender(<ChatCore id={100} agentId={200} />);

      await waitFor(() => {
        expect(lastLeftProps().externalFilePreview).toBeNull();
      });
    });
  });
});
