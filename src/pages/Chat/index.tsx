import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import {
  ConversationBottomConsole,
  CopyToSpaceComponent,
  PagePreviewIframe,
  type ConsoleLayoutMode,
} from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import ConditionRender from '@/components/ConditionRender';
import ResizableSplit from '@/components/ResizableSplit';

import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import useSubscription from '@/hooks/useSubscription';
import useTerminalWsUrl from '@/hooks/useTerminalWsUrl';

import { useConversationRuntimeSession } from '@/features/conversation/react/useConversationRuntimeSession';
import { t } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  DefaultSelectedEnum,
  HideDesktopEnum,
  MessageTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { MessageSourceType } from '@/types/interfaces/common';
import type {
  RoleInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import { addBaseTarget, parsePageAppProjectId } from '@/utils/common';

import {
  useSourceControl,
  type SelectedChangeFile,
} from '@/components/business-component/FileTreeGitSourcePanel';
import type { FileTreeContainerProps } from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import { useFileTreePreviewView } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView';
import { apiAgentConversation } from '@/services/agentConfig';
import { apiUpdateStaticFile } from '@/services/vncDesktop';
import type { UpdateFileInfo } from '@/types/interfaces/fileTree';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';

import { updateFilesListContent } from '@/utils/fileTree';
import { jumpToPageDevelop } from '@/utils/router';
import {
  TTYD_TERMINAL_WIRE_PROTOCOL,
  TTYD_TERMINAL_WS_SUBPROTOCOLS,
} from '@/utils/terminalWsUrl';
import { LoadingOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import LeftContent from './components/LeftContent';
import ShowArea from './components/ShowArea';
import { useAutoPreviewFile } from './hooks/useAutoPreviewFile';
import { useChatConversation } from './hooks/useChatConversation';
import { useChatFiles } from './hooks/useChatFiles';
import { useChatSandbox } from './hooks/useChatSandbox';
import { useChatVariables } from './hooks/useChatVariables';
import { useChatViewMode } from './hooks/useChatViewMode';
import styles from './index.less';

const cx = classNames.bind(styles);
export interface ChatCoreProps {
  id: number;
  agentId: number;
  locationState?: any;
  showSidebar?: boolean; // 是否渲染右侧属性面板，默认 true
  showPayment?: boolean; // 是否包含订阅/扣费弹窗等逻辑，默认 true
  enableResizable?: boolean; // 是否开启拖拽分栏布局，默认 true
  showClearContext?: boolean; // 是否展示清除上下文按钮（刷子），默认 true
  defaultFileTreeVisible?: boolean; // 是否默认显示文件树，默认 false
  renderTitle?: (props: {
    effectiveAgent: any;
    isAppSidebarMode: boolean;
  }) => React.ReactNode;
  renderHeaderRight?: (props: { effectiveAgent: any }) => React.ReactNode;
}

/**
 * 主页咨询聊天页面
 */
export const ChatCore: React.FC<ChatCoreProps> = ({
  id,
  agentId,
  locationState,
  showSidebar = true,
  showPayment = true,
  enableResizable = true,
  showClearContext = true,
  defaultFileTreeVisible = false,
  renderTitle,
  renderHeaderRight,
}) => {
  const location = useLocation();
  const { handleAutoPreviewLastFile } = useAutoPreviewFile();
  const stateToUse = locationState || location.state;
  // 附加state
  const message = stateToUse?.message;
  const files = stateToUse?.files;
  const infos = stateToUse?.infos;
  // 技能ID列表
  const skillIds = stateToUse?.skillIds;
  // 消息来源
  const messageSourceType: MessageSourceType =
    (stateToUse?.messageSourceType as MessageSourceType) || 'new_chat'; // new_chat 新增会话
  // 默认的智能体详情信息
  const defaultAgentDetail = stateToUse?.defaultAgentDetail;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = stateToUse?.variableParams;
  // 模型ID
  const [selectedModelId, setSelectedModelId] = useState<number>(
    stateToUse?.modelId,
  );
  const [form] = Form.useForm();

  const [isSidebarVisible, setIsSidebarVisible] =
    useState<boolean>(showSidebar);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);

  const [clearLoading, setClearLoading] = useState<boolean>(false);

  // 异步查询会话加载状态
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);

  // 开放应用智能体会话聊天页面相关状态
  const {
    handleSetAppAgentDetail,
    isAppSidebarMode,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    createAppNewConversation,
    openPaymentModal,
    setOpenPaymentModal,
    localCalledTrialCount,
    incrementCalledTrialCount,
  } = useModel('useOpenApp');

  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 是否开启订阅功能
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  // 智能体订阅
  const {
    // 智能体订阅套餐
    agentSubscriptionPlans,
    loadingAgentSubscriptionPlans,
    // 当前生效智能体套餐
    mySubscriptionInfo,
    // 加载当前生效智能体套餐loading
    loadingMySubscription,
    // 创建智能体订阅订单
    createSubscriptionOrder,
    queryAgentSubscriptionPlans,
  } = useSubscription();

  useEffect(() => {
    if (!showPayment || !openPaymentModal || isAppSidebarMode) {
      return;
    }

    // 打开智能体订阅套餐弹窗
    queryAgentSubscriptionPlans(agentId);
  }, [
    showPayment,
    openPaymentModal,
    isAppSidebarMode,
    queryAgentSubscriptionPlans,
    agentId,
  ]);

  // 智能体详情
  const { agentDetail, setAgentDetail } = useAgentDetails();

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const {
    conversationInfo,
    loadingConversation,
    manualComponents,
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    // 双线分支：新线 effects 所需页面资源补充解构（单份共享注入；其余基线已解构）
    setCardList,
    setTaskAgentSelectTrigger,
    setFileTreeRefreshTrigger,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    handleClearSideEffect,
    setIsLoadingOtherInterface,
    requiredNameList,
    setConversationInfo,
    syncConversationSnapshotMessages,
    runUpdateTopic,
    variables,
    showType,
    setShowType,
    // 文件树显隐状态
    isFileTreeVisible,
    // 文件树是否固定（用户点击后固定）
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    // 清除文件面板信息
    clearFilePanelInfo,
    // 文件树数据
    fileTreeData,
    fileTreeDataLoading,
    // 文件树视图模式
    viewMode,
    // 处理文件列表刷新事件
    handleRefreshFileList,
    refreshFileListImmediately,
    openPreviewView,
    openDesktopView,
    ensureDesktopConnection,
    restartVncPod,
    restartAgent,
    // 通用型智能体会话中点击选中的文件ID
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    // 通用型智能体文件选择触发标志
    taskAgentSelectTrigger,
    // 会话结束文件树刷新后兜底重拉当前打开文件正文的触发标志
    fileTreeRefreshTrigger,
    // 会话是否正在进行中（有消息正在处理）
    isConversationActive,
    isAwaitingChatTerminal,
    // 统一终态清算入口（终态确认后一次性收敛 taskStatus + awaiting + 活跃态 + 末条消息）
    finalizeConversationTerminal,
    // 停止会话相关
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    disabledConversationActive,
    // 其它接口加载状态
    isLoadingOtherInterface,
    // 加载更多消息相关
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
    // 会话流式恢复(sub)
    resumeConversationStream,
    abortResumeStream,
    refreshGitListRef,
  } = useModel('conversationInfo');

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    useModel('chat');

  const { isMobile } = useModel('layout');

  // 会话记录
  const { runHistory, runHistoryItem } = useModel('conversationHistory');

  // 统一 Agent 数据源：优先使用会话关联的智能体快照，兜底使用详情接口数据
  const effectiveAgent = useMemo(() => {
    return conversationInfo?.agent || agentDetail;
  }, [conversationInfo?.agent, agentDetail]);

  const {
    setSelectedComputerId,
    isSelectionLocked,
    setIsSelectionLocked,
    hasUserSentMessage,
    setHasUserSentMessage,
    getEffectiveSandboxId,
    finalSelectedId,
  } = useChatSandbox({
    location: { ...location, state: stateToUse },
    history,
    effectiveAgent,
    conversationInfo,
  });

  /** 文件树预览区底部终端是否显示 */
  const [terminalConsoleVisible, setTerminalConsoleVisible] =
    useState<boolean>(false);
  /** 文件树预览区底部终端是否已经渲染过，渲染后保持挂载避免 wss 重连 */
  const [hasTerminalConsoleRendered, setHasTerminalConsoleRendered] =
    useState<boolean>(false);
  /** TaskResult / 消息文件链接打开时，折叠底部终端 */
  const [terminalConsoleCollapseSignal, setTerminalConsoleCollapseSignal] =
    useState<number>(0);
  /** 点击终端入口时全屏展开 */
  const [terminalConsoleExpandSignal, setTerminalConsoleExpandSignal] =
    useState<number>(0);
  /** 底部终端布局与 Tab 状态（用于三入口互斥高亮） */
  const [terminalConsoleLayoutMode, setTerminalConsoleLayoutMode] =
    useState<ConsoleLayoutMode>('default');
  const [terminalConsoleActiveTab, setTerminalConsoleActiveTab] = useState<
    'terminal' | 'logs'
  >('terminal');

  /** 关闭文件树时同步折叠终端，避免再次打开文件树时终端以展开状态恢复 */
  const handleClosePreviewView = useCallback(() => {
    setTerminalConsoleVisible(false);
    closePreviewView();
  }, [closePreviewView]);

  const {
    isShowFilePanel,
    showCopyButton,
    handleFileTreeVisible,
    handleOpenDesktopView,
  } = useChatViewMode({
    effectiveAgent,
    messageList,
    isFileTreeVisible,
    viewMode,
    id,
    sidebarRef,
    openPreviewView,
    closePreviewView: handleClosePreviewView,
    openDesktopView,
    pagePreviewData,
  });

  /**
   * 是否显示「打开智能体电脑」入口：
   * 仅通用型智能体 + 未隐藏远程桌面 + 当前为云端电脑（'-1'）时展示；
   * 个人电脑 / 共享电脑会话不展示该按钮。
   */
  const isShowDesktop =
    isShowFilePanel &&
    effectiveAgent?.hideDesktop === HideDesktopEnum.No &&
    finalSelectedId === '-1';

  /**
   * 切换到非云端电脑时，若当前停留在智能体电脑视图则关闭，
   * 避免按钮隐藏后仍残留桌面预览。
   */
  useEffect(() => {
    if (finalSelectedId !== '-1' && viewMode === 'desktop') {
      handleClosePreviewView();
    }
  }, [finalSelectedId, viewMode, handleClosePreviewView]);

  const {
    variableParams,
    setVariableParams,
    isSendMessageRef,
    isChatInputDisabled,
  } = useChatVariables({
    firstVariableParams,
    requiredNameList,
    form,
  });

  // 导航拦截：追踪会话是否在本次会话中变为活跃状态
  // 使用 ref 追踪初始状态，避免在刷新时因历史消息状态触发拦截
  const wasConversationActiveOnMount = useRef<boolean | null>(null);
  const shouldBlockNavigation = useRef<boolean>(false);

  // 在首次获取到 isConversationActive 值时记录
  useEffect(() => {
    if (wasConversationActiveOnMount.current === null) {
      wasConversationActiveOnMount.current = isConversationActive;
      // 如果初始就是 active，不阻止导航（可能是历史消息状态）
      shouldBlockNavigation.current = false;
    } else if (isConversationActive && !wasConversationActiveOnMount.current) {
      // 如果会话从非活跃变为活跃，说明是本次会话中发送的消息
      shouldBlockNavigation.current = true;
    } else if (!isConversationActive) {
      // 会话结束，重置状态
      shouldBlockNavigation.current = false;
      wasConversationActiveOnMount.current = false;
    }
  }, [isConversationActive]);

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      assistant: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
      system: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  // =============== 会话 icon 缺失时，补拉会话 icon ===============

  /** 主题已更新但 icon 仍为空时，补拉会话 icon */
  const conversationIconUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    conversationIconUpdateRef.current = null;
  }, [id]);

  useEffect(() => {
    if (
      !conversationInfo?.id ||
      conversationInfo.topicUpdated !== 1 ||
      conversationInfo.icon !== null ||
      conversationIconUpdateRef.current === conversationInfo.id
    ) {
      return;
    }

    conversationIconUpdateRef.current = conversationInfo.id;
    void runUpdateTopic({
      id: conversationInfo.id,
      topic: conversationInfo.topic,
    }).catch(() => {
      if (conversationIconUpdateRef.current === conversationInfo.id) {
        conversationIconUpdateRef.current = null;
      }
    });
  }, [conversationInfo, runUpdateTopic]);

  // 打开扩展页面
  const handleOpenPreview = (agent: any) => {
    // 判断是否默认展示页面首页
    if (agent && agent?.expandPageArea && agent?.pageHomeIndex) {
      // 自动触发预览
      showPagePreview({
        name: t('PC.Pages.Chat.pagePreview'),
        uri: process.env.BASE_URL + agent?.pageHomeIndex,
        params: {},
        executeId: '',
      });
    } else {
      showPagePreview(null);
    }
  };

  useEffect(() => {
    // 只有当会话信息是属于当前会话，或者默认详情属于当前智能体时，数据才是有效的，过滤掉切换会话时残留的旧数据
    let targetAgent: any = null;
    if (conversationInfo && conversationInfo.id === id) {
      targetAgent = conversationInfo.agent;
    } else if (defaultAgentDetail && defaultAgentDetail.agentId === agentId) {
      targetAgent = defaultAgentDetail;
    }

    if (!targetAgent) {
      return;
    }

    setAgentDetail(targetAgent);

    // 如果智能体需要付费，则判断是否已订阅, 未订阅，显示付费弹窗
    if (targetAgent.paymentRequired && !targetAgent.subscribed) {
      setOpenPaymentModal(true);
    } else {
      setOpenPaymentModal(false);
    }
    // 设置应用智能体详情
    handleSetAppAgentDetail(targetAgent);
    handleOpenPreview(targetAgent);
  }, [agentId, id, defaultAgentDetail, conversationInfo?.agent]);

  useEffect(() => {
    if (id) {
      setIsLoadingConversation(false);
      // 切换会话时，重置自动滚动标志，确保新会话能够自动滚动到底部
      allowAutoScrollRef.current = true;

      const asyncFun = async () => {
        // 同步查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        let data = null;
        try {
          setLoadingAsync(true);
          const { data: _data } = await runAsync(id);
          data = _data;
        } finally {
          setLoadingAsync(false);
        }
        // 会话消息列表
        const list = data?.messageList || [];
        // 自动预览文件
        handleAutoPreviewLastFile(list, id);

        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
        const isCanMessage =
          !len ||
          (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);
        // 如果message或者附件不为空,可以发送消息，但刷新页面时，不重新发送消息
        if (isCanMessage && (message || files?.length > 0)) {
          const effectiveSandboxId = getEffectiveSandboxId(data);

          // 发送消息参数
          const sendParams: SendMessageParams = {
            id,
            messageInfo: message,
            files,
            infos,
            variableParams: firstVariableParams,
            sandboxId: effectiveSandboxId,
            data,
            skillIds,
            modelId: selectedModelId,
            agentMode: (stateToUse?.agentMode as AgentMode) || 'yolo',
          };

          onMessageSend(sendParams);
        }
      };
      asyncFun();
    }
  }, [id, message, files, infos, firstVariableParams, skillIds]);

  useEffect(() => {
    // 应用智能体模式下，不获取当前智能体的历史记录
    if (isAppSidebarMode) {
      return;
    }
    // 获取当前智能体的历史记录
    runHistoryItem({
      agentId,
      limit: 20,
    });
  }, [id, agentId, isAppSidebarMode]);

  useEffect(() => {
    addBaseTarget();
  }, []);

  useEffect(() => {
    if (messageSourceType === 'new_chat') {
      // 新建会话时，初始化选中的组件列表
      initSelectedComponentList(manualComponents);
    } else {
      // 非新建会话时，使用外面传过来的组件列表
      setSelectedComponentList(infos || []);
    }
  }, [infos, messageSourceType, manualComponents]);

  // 会话相关 props
  const { handleClear, handleMessageSend } = useChatConversation({
    id,
    agentId,
    isAppSidebarMode,
    history,
    form,
    isChatInputDisabled,
    isSendMessageRef,
    variableParams,
    getEffectiveSandboxId,
    setClearLoading,
    handleClearSideEffect,
    setIsMoreMessage,
    setMessageList,
    clearFilePanelInfo,
    setVariableParams,
    setSelectedComputerId,
    setIsSelectionLocked,
    setHasUserSentMessage,
    setIsLoadingOtherInterface,
    onMessageSend,
    allowAutoScrollRef,
    messageViewRef,
    incrementCalledTrialCount,
    selectedComponentList,
    selectedModelId,
  });

  useEffect(() => {
    // 切换会话时立即隐藏页面预览，并清除文件面板全局状态（fileTreeData / taskAgentSelectedFileId 等）
    hidePagePreview();
    clearFilePanelInfo();
    setOpenPaymentModal(false);

    // 重置 clearLoading：此时 cleanup 已执行 resetInit() 清空了 conversationInfo，
    // conversationInfo 会无缝接管加载显示，不会出现 AgentChatEmpty 闪现
    setClearLoading(false);

    return () => {
      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
      setSelectedComponentList([]);
      hidePagePreview(); // 组件卸载时主动隐藏预览，避免用户下一次进入时预览还在！

      setOpenPaymentModal(false);
    };
  }, [id]);

  useEffect(() => {
    if (id && defaultFileTreeVisible) {
      openPreviewView(id);
      setIsFileTreePinned(true);
    }
  }, [id, defaultFileTreeVisible, openPreviewView, setIsFileTreePinned]);

  // 互斥面板控制器：管理 PagePreview、AgentSidebar、ShowArea 的互斥展示
  useExclusivePanels({
    pagePreviewData,
    hidePagePreview,
    isSidebarVisible,
    sidebarRef,
    showType,
    setShowType,
  });

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  const {
    handleCreateFileNode,
    handleDeleteFile,
    handleConfirmRenameFile,
    handleSaveFiles,
    handleSaveFileContent,
    handleUploadMultipleFiles,
    handleExportProject,
  } = useChatFiles({
    id,
    fileTreeData,
    handleRefreshFileList,
    onFileMutationSuccessRef: refreshGitListRef,
  });

  /** 存在有效消息列表时才允许查询 Git status；单条开场白不算有效消息 */
  const hasValidMessageList = useMemo(() => {
    const currentMessageList = messageList || [];
    if (!currentMessageList.length) {
      return false;
    }
    return !(
      currentMessageList.length === 1 &&
      currentMessageList[0]?.messageType === MessageTypeEnum.ASSISTANT
    );
  }, [messageList]);

  /** 无有效消息列表时不允许刷新 Git status，逻辑与进入页面自动拉取 api/git/status 保持一致 */
  const isGitStatusRefreshDisabled = !hasValidMessageList;

  /** TaskResult / 文件树选中等打开预览前，关闭版本记录面板（gitSourceControl 初始化后赋值） */
  const closeVersionPanelForFilePreviewRef = useRef<() => void>(() => {});

  // 文件视图 props
  const fileView = useFileTreePreviewView({
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    // 会话结束文件树刷新后兜底重拉当前打开文件正文
    fileTreeRefreshTrigger,
    originalFiles: fileTreeData,
    fileTreeDataLoading,
    targetId: id?.toString() || '',
    readOnly: false,
    onUploadFiles: handleUploadMultipleFiles,
    onExportProject: handleExportProject,
    onRenameFile: handleConfirmRenameFile,
    onCreateFileNode: handleCreateFileNode,
    onDeleteFile: handleDeleteFile,
    onSaveFiles: handleSaveFiles,
    onSaveFileContent: async (fileId, content, originalFileContent) => {
      const result = await handleSaveFileContent(
        fileId,
        content,
        originalFileContent,
      );
      return result ?? false;
    },
    agentSandboxId: finalSelectedId,
    onClose: handleClosePreviewView,
    isFileTreePinned,
    onFileTreePinnedChange: setIsFileTreePinned,
    isCanDeleteSkillFile: true,
    onRefreshFileTree: () => refreshFileListImmediately(id),
    hideDesktop: effectiveAgent?.hideDesktop,
    staticFileBasePath: `/api/computer/static/${id}`,
    isDynamicTheme: true,
    enableGitStatus:
      effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
      hasValidMessageList &&
      isAgentVersionControlEnabled(effectiveAgent?.enableVersionControl),
    enableVersionControl: effectiveAgent?.enableVersionControl,
    onSelectedFileMissing: () => {
      setTaskAgentSelectedFileId('');
    },
    onFileSelectOpenPreview: () => {
      closeVersionPanelForFilePreviewRef.current();
    },
  });

  refreshGitListRef.current = fileView.refreshGitList;

  /** 折叠底部终端，避免遮挡文件预览（终端未展示时不发信号，避免首次打开被误折叠） */
  const collapseTerminalConsole = useCallback(() => {
    if (!hasTerminalConsoleRendered || !terminalConsoleVisible) {
      return;
    }
    setTerminalConsoleCollapseSignal((n) => n + 1);
  }, [hasTerminalConsoleRendered, terminalConsoleVisible]);

  /** TaskResult / Markdown 文件链接选中文件时，折叠终端以便查看预览 */
  const prevTaskAgentCollapseTriggerRef = useRef<number | string | undefined>(
    undefined,
  );

  /** 底部终端是否处于全屏展开且选中终端 Tab */
  const isTerminalPanelOpen =
    terminalConsoleVisible &&
    terminalConsoleLayoutMode === 'expanded' &&
    terminalConsoleActiveTab === 'terminal';

  /** 顶部三入口互斥 active：同一时刻仅高亮一个 */
  const isFileTreeIconActive =
    isFileTreeVisible && viewMode === 'preview' && !isTerminalPanelOpen;
  const isTerminalIconActive = isTerminalPanelOpen;
  const isDesktopIconActive = isFileTreeVisible && viewMode === 'desktop';

  /**
   * 打开文件预览：与终端全屏、智能体电脑互斥
   */
  const handleFileTreeVisibleClick = useCallback(() => {
    const hasSelectedPreviewFile = Boolean(
      fileView.tree.selectedFileId || taskAgentSelectedFileId,
    );

    if (isTerminalPanelOpen) {
      setTerminalConsoleCollapseSignal((n) => n + 1);
      setTerminalConsoleVisible(false);
      setTerminalConsoleLayoutMode('collapsed');
      if (!isFileTreeVisible) {
        openPreviewView(id);
      }
      if (!hasSelectedPreviewFile) {
        setIsFileTreePinned(true);
      }
      if (
        !isGitStatusRefreshDisabled &&
        effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
        isAgentVersionControlEnabled(effectiveAgent?.enableVersionControl)
      ) {
        void fileView.refreshGitList();
      }
      return;
    }

    const openingFileTree = !isFileTreeVisible;
    const switchingToPreview = isFileTreeVisible && viewMode !== 'preview';

    handleFileTreeVisible();

    if (openingFileTree || switchingToPreview) {
      setTerminalConsoleVisible(false);
      if (!hasSelectedPreviewFile) {
        setIsFileTreePinned(true);
      }
      if (
        !isGitStatusRefreshDisabled &&
        effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
        isAgentVersionControlEnabled(effectiveAgent?.enableVersionControl)
      ) {
        void fileView.refreshGitList();
      }
    }
  }, [
    isTerminalPanelOpen,
    isFileTreeVisible,
    viewMode,
    handleFileTreeVisible,
    fileView.tree.selectedFileId,
    fileView.refreshGitList,
    taskAgentSelectedFileId,
    setIsFileTreePinned,
    isGitStatusRefreshDisabled,
    effectiveAgent?.type,
    effectiveAgent?.enableVersionControl,
    openPreviewView,
    id,
  ]);

  /** 打开 / 收起底部终端全屏（与文件预览、智能体电脑互斥） */
  const handleOpenTerminalPanel = useCallback(() => {
    if (isTerminalPanelOpen) {
      setTerminalConsoleCollapseSignal((n) => n + 1);
      setTerminalConsoleLayoutMode('collapsed');
      return;
    }

    sidebarRef.current?.close();
    setHasTerminalConsoleRendered(true);
    setTerminalConsoleVisible(true);
    setTerminalConsoleCollapseSignal(0);
    // 同步父级布局状态，避免子组件已是 expanded 时不触发 onLayoutModeChange 导致图标未激活
    setTerminalConsoleLayoutMode('expanded');
    setTerminalConsoleActiveTab('terminal');

    if (!isFileTreeVisible || viewMode === 'desktop') {
      openPreviewView(id);
    }

    setTerminalConsoleExpandSignal((n) => n + 1);
  }, [isTerminalPanelOpen, isFileTreeVisible, viewMode, id, openPreviewView]);

  /** 打开 / 切换智能体电脑（与文件预览、终端全屏互斥） */
  const handleOpenDesktopViewClick = useCallback(() => {
    if (isTerminalPanelOpen) {
      setTerminalConsoleCollapseSignal((n) => n + 1);
    }
    setTerminalConsoleVisible(false);
    setTerminalConsoleCollapseSignal(0);
    setTerminalConsoleExpandSignal(0);
    setTerminalConsoleLayoutMode('collapsed');
    sidebarRef.current?.close();
    handleOpenDesktopView();
  }, [isTerminalPanelOpen, handleOpenDesktopView]);

  useEffect(
    () => () => {
      handleSaveFileContent.cancel();
    },
    [handleSaveFileContent],
  );

  // Git 源代码管理 props
  const [selectedChangeFile, setSelectedChangeFile] =
    useState<SelectedChangeFile | null>(null);

  // Git 版本记录面板状态
  const [gitVersionPanelOpen, setGitVersionPanelOpen] =
    useState<boolean>(false);

  /** 终端 WebSocket 连接地址（ttyd） */
  const terminalWsUrl = useTerminalWsUrl(id);

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!id) {
        return;
      }

      const gitignoreId = '.gitignore';
      const existing = fileTreeData?.find(
        (item: StaticFileInfo) => item.fileId === gitignoreId,
      );
      const currentContent = existing?.contents ?? '';
      const entry = fileId.startsWith('/') ? fileId.slice(1) : fileId;

      if (
        currentContent
          .split('\n')
          .some(
            (line: string) => line.trim() === entry || line.trim() === fileId,
          )
      ) {
        message.info(
          t('PC.Pages.ConversationAgentSourceControl.alreadyInGitignore'),
        );
        return;
      }

      const newContent = currentContent
        ? `${currentContent.replace(/\n$/, '')}\n${entry}`
        : entry;

      try {
        if (existing) {
          const updatedFilesList = updateFilesListContent(
            fileTreeData || [],
            [
              {
                fileId: gitignoreId,
                fileContent: newContent,
                originalFileContent: currentContent,
              },
            ],
            'modify',
          );
          await apiUpdateStaticFile({
            cId: id,
            files: updatedFilesList as UpdateFileInfo[],
          });
        } else {
          await apiUpdateStaticFile({
            cId: id,
            files: [
              {
                name: gitignoreId,
                contents: `${newContent}\n`,
                operation: 'create',
                binary: false,
                sizeExceeded: false,
                renameFrom: '',
                isDir: false,
              },
            ],
          });
        }

        message.success(
          t('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await handleRefreshFileList(id);
        void refreshGitListRef.current?.();
      } catch (error) {
        console.error('Add to gitignore failed:', error);
      }
    },
    [id, fileTreeData, handleRefreshFileList],
  );

  // Git 源代码管理 props
  const gitSourceControl = useSourceControl({
    workspace: {
      workspaceType: 'taskAgent',
      cid: id ?? null,
    },
    changeFiles: fileView.changeFiles,
    selectedChangeFile,
    setSelectedChangeFile,
    callbacks: {
      openChangeFile: (fileId: string) => {
        setSelectedChangeFile(null);
        setTaskAgentSelectedFileId('');
        void fileView.tree.handleFileSelect(fileId);
      },
      addFileToGitignore: handleAddToGitignore,
      onDiffFileSelect: () => {
        if (viewMode === 'desktop') {
          openPreviewView(id);
        }
      },
      onCommitSuccess: async () => {
        await fileView.refreshGitList();
        setSelectedChangeFile(null);
      },
      onAfterDiscardChanges: async () => {
        await fileView.tree.handleRefreshFileList();
      },
      onRefreshGitList: id
        ? async () => {
            await fileView.refreshGitList();
          }
        : undefined,
    },
  });

  /** 切换 Git 版本记录面板（选中 diff 时先清除 diff 再打开面板） */
  const handleToggleGitVersionPanel = useCallback(() => {
    if (gitSourceControl.selectedDiffFile) {
      gitSourceControl.clearSelectedDiff();
      setGitVersionPanelOpen(true);
      return;
    }
    setGitVersionPanelOpen((prev) => !prev);
  }, [gitSourceControl.selectedDiffFile, gitSourceControl.clearSelectedDiff]);

  // 关闭版本记录面板
  closeVersionPanelForFilePreviewRef.current = () => {
    setGitVersionPanelOpen(false);
    gitSourceControl.clearSelectedDiff();
  };

  /**
   * TaskResult / Markdown 文件链接选中文件时：
   * 关闭版本记录面板并折叠终端，确保右侧文件预览可见
   */
  useEffect(() => {
    if (!taskAgentSelectedFileId || taskAgentSelectTrigger === undefined) {
      return;
    }
    if (taskAgentSelectTrigger === prevTaskAgentCollapseTriggerRef.current) {
      return;
    }
    prevTaskAgentCollapseTriggerRef.current = taskAgentSelectTrigger;

    closeVersionPanelForFilePreviewRef.current();

    if (!hasTerminalConsoleRendered || !terminalConsoleVisible) {
      return;
    }
    setTerminalConsoleCollapseSignal((n) => n + 1);
    setTerminalConsoleLayoutMode('collapsed');
  }, [
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    hasTerminalConsoleRendered,
    terminalConsoleVisible,
  ]);

  useEffect(() => {
    setGitVersionPanelOpen(false);
    setTerminalConsoleVisible(false);
    setHasTerminalConsoleRendered(false);
    setTerminalConsoleLayoutMode('default');
    setTerminalConsoleExpandSignal(0);
    setTerminalConsoleCollapseSignal(0);
    prevTaskAgentCollapseTriggerRef.current = undefined;
  }, [id]);

  useEffect(() => {
    if (viewMode === 'desktop') {
      setGitVersionPanelOpen(false);
    }
  }, [viewMode]);

  // 文件树 props
  const chatFileTree: FileTreeContainerProps = useMemo(
    () => ({
      ...fileView.tree,
      handleFileSelect: async (
        fileId: string,
        options?: { selectFolder?: boolean },
      ) => {
        if (!options?.selectFolder) {
          setTaskAgentSelectedFileId('');
          setGitVersionPanelOpen(false);
          gitSourceControl.setSelectedChangeFile(null);
          collapseTerminalConsole();
        }
        await fileView.tree.handleFileSelect(fileId, options);
      },
    }),
    [
      fileView.tree,
      setTaskAgentSelectedFileId,
      gitSourceControl.setSelectedChangeFile,
      collapseTerminalConsole,
    ],
  );

  /** 文件树预览区底部终端，仅显示终端 Tab，不展示日志 */
  const terminalConsole = hasTerminalConsoleRendered ? (
    <ConversationBottomConsole
      className={cx(styles['terminal-console'])}
      conversationId={finalSelectedId === '-1' ? id : undefined}
      visible={terminalConsoleVisible}
      wsUrl={terminalWsUrl}
      wireProtocol={TTYD_TERMINAL_WIRE_PROTOCOL}
      wsSubprotocols={[...TTYD_TERMINAL_WS_SUBPROTOCOLS]}
      defaultActiveTab="terminal"
      defaultLayoutMode="default"
      expandSignal={terminalConsoleExpandSignal}
      collapseSignal={terminalConsoleCollapseSignal}
      onLayoutModeChange={setTerminalConsoleLayoutMode}
      onActiveTabChange={setTerminalConsoleActiveTab}
      showLogsTab={false}
    />
  ) : null;

  /** 文件树侧边栏 props */
  const isVersionControlEnabled = isAgentVersionControlEnabled(
    effectiveAgent?.enableVersionControl,
  );

  /** 文件树侧边栏 props */
  const fileSidebarProps = useMemo(
    () => ({
      tree: chatFileTree,
      preview: fileView.preview,
      viewMode,
      hideDesktop: effectiveAgent?.hideDesktop,
      diffFile: gitSourceControl.selectedDiffFile,
      gitVersionPanelOpen,
      onToggleGitVersionPanel: handleToggleGitVersionPanel,
      bottomContent: terminalConsole,
      showSourceControl: isVersionControlEnabled,
      enableVersionControl: effectiveAgent?.enableVersionControl,
      gitVersionControl:
        effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
        isVersionControlEnabled
          ? {
              workspace: {
                workspaceType: 'taskAgent' as const,
                cid: id ?? null,
              },
              branch: fileView.gitBranch,
              onRollbackSuccess: () => {
                if (id) {
                  void handleRefreshFileList(id);
                  void fileView.refreshGitList();
                }
              },
            }
          : undefined,
      previewPanelProps: {
        agentSandboxId: finalSelectedId,
        agentSandboxName: '',
        onRestartServer: () => restartVncPod(id, finalSelectedId),
        onRestartAgent: () => restartAgent(id),
        onExportProject: handleExportProject,
        // 重试前先 ensurePod + 恢复 keepalive，避免容器被回收后仅检测状态永远失败
        onReconnect: () => ensureDesktopConnection(id),
        isTerminalExpanded:
          terminalConsoleVisible && terminalConsoleLayoutMode !== 'collapsed',
        idleDetection: {
          enabled: effectiveAgent?.type === AgentTypeEnum.TaskAgent,
          onIdleTimeout: () => openPreviewView(id),
        },
      },
      sourceControl: {
        changeFiles: fileView.changeFiles,
        selectedChangeFile: gitSourceControl.selectedChangeFile,
        isCommitting:
          gitSourceControl.isCommitting || fileView.preview.isSavingFiles,
        isRefreshingGitList: fileView.isRefreshingGitList,
        refreshDisabled: isGitStatusRefreshDisabled,
        onRefreshGitList: isGitStatusRefreshDisabled
          ? undefined
          : fileView.refreshGitList,
        onDiffFileSelect: gitSourceControl.handleDiffFileSelect,
        onOpenChangeFile: gitSourceControl.handleOpenChangeFile,
        onDiscardChanges: gitSourceControl.handleDiscardChange,
        onStageChanges: gitSourceControl.handleStageChanges,
        onUnstageChanges: gitSourceControl.handleUnstageChanges,
        onAddToGitignore: (fileId: string) => {
          void gitSourceControl.handleAddToGitignore(fileId);
        },
        onCommit: gitSourceControl.handleCommit,
      },
    }),
    [
      chatFileTree,
      fileView.preview,
      fileView.changeFiles,
      fileView.isRefreshingGitList,
      fileView.refreshGitList,
      isGitStatusRefreshDisabled,
      gitSourceControl.selectedDiffFile,
      gitSourceControl.selectedChangeFile,
      gitSourceControl.isCommitting,
      gitSourceControl.handleDiffFileSelect,
      gitSourceControl.handleOpenChangeFile,
      gitSourceControl.handleDiscardChange,
      gitSourceControl.handleStageChanges,
      gitSourceControl.handleUnstageChanges,
      gitSourceControl.handleAddToGitignore,
      gitSourceControl.handleCommit,
      gitVersionPanelOpen,
      handleToggleGitVersionPanel,
      terminalConsole,
      fileView.gitBranch,
      viewMode,
      id,
      effectiveAgent?.hideDesktop,
      effectiveAgent?.type,
      effectiveAgent?.enableVersionControl,
      isVersionControlEnabled,
      finalSelectedId,
      handleExportProject,
      openPreviewView,
      openDesktopView,
      ensureDesktopConnection,
      restartVncPod,
      restartAgent,
    ],
  );

  // 设置最小宽度
  useEffect(() => {
    // 移动端不设置最小宽度
    if (isMobile && !isFileTreeVisible) {
      document.documentElement.style.minWidth = 'unset';
      return;
    }
    // 设置最小宽度-扩展页面/文件树
    if (pagePreviewData || isFileTreeVisible) {
      document.documentElement.style.minWidth = '1660px';
    } else {
      // 设置最小宽度-调试详情
      if (showSidebar && isSidebarVisible) {
        document.documentElement.style.minWidth = '1540px';
      } else {
        document.documentElement.style.minWidth = '1200px';
      }
    }
    return () => {
      document.documentElement.style.minWidth = 'unset';
    };
  }, [
    pagePreviewData,
    isFileTreeVisible,
    showSidebar,
    isSidebarVisible,
    isMobile,
  ]);

  // 聊天会话头部相关 props
  const headerProps = {
    showSidebar,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    createAppNewConversation,
    agentId,
    conversationInfo,
    setConversationInfo,
    isEnableSubscription,
    setOpenPaymentModal,
    isSidebarVisible,
    sidebarRef,
    hidePagePreview,
    closePreviewView: handleClosePreviewView,
    handleOpenPreview,
    isShowFilePanel,
    isShowDesktop,
    viewMode,
    handleFileTreeVisible: handleFileTreeVisibleClick,
    isFileTreeIconActive,
    isTerminalIconActive,
    isDesktopIconActive,
    handleOpenTerminalPanel,
    handleOpenDesktopView: handleOpenDesktopViewClick,
    renderTitle,
    renderHeaderRight,
    // 会话内搜索：当前会话 + 已有会话记录
    searchConversationId: conversationInfo?.id ?? null,
    searchHasMessages: hasUserSentMessage,
  };

  // 聊天会话相关 props
  // 双线分派（docs/conversation/conversation-dual-track-plan.md）：flag 开启时新线 session 的
  // 会话面 props 覆盖旧线字段；flag 关闭（默认）时 conversationProps 为空对象，
  // 旧线路径原值原行为。页面资源（卡片/桌面/文件树等）单份共享注入新线 effects。
  const runtimeLine = useConversationRuntimeSession({
    conversationId: id,
    messageViewRef,
    allowAutoScrollRef,
    effectsResources: {
      isAppSidebarMode,
      runHistory,
      runHistoryItem,
      showPagePreview,
      openDesktopView,
      setCardList,
      setShowType,
      refreshFileListThrottled: handleRefreshFileList,
      refreshFileListImmediately,
      refreshGitListRef,
      openPreviewView,
      setTaskAgentSelectedFileId,
      setTaskAgentSelectTrigger,
      setFileTreeRefreshTrigger,
    },
  });

  const chatSessionProps = {
    conversationId: id,
    messageList,
    roleInfo,
    isLoading: loadingConversation,
    loadingMore,
    isMoreMessage,
    // 流式输出中 + 后台 taskStatus 执行中，驱动停止按钮与「智能体执行中」提示
    isConversationActive:
      isConversationActive ||
      conversationInfo?.taskStatus === TaskStatus.EXECUTING,
    // 本地是否正在 SSE 发送/接收（纯，不含后台 EXECUTING），供流式恢复 hook 使用
    isLocallyStreaming: isConversationActive,
    isAwaitingChatTerminal,
    // 会话流式恢复(sub)：刷新页面/新开标签时重建 EXECUTING 会话的流式输出
    onResumeConversationStream: resumeConversationStream,
    onAbortResumeStream: abortResumeStream,
    // 流式恢复拉历史必须静默：不要走 model 的 runAsync（会置 loadingConversation），
    // 否则 Chat 整页被 Loading 卸载重挂，执行中/思考中会不断闪动。
    onReloadConversationHistoryAsync: async (reloadId: number) => {
      const result = await apiAgentConversation(Number(reloadId));
      if (result?.data) {
        syncConversationSnapshotMessages(result.data);
      }
      return result?.data?.messageList;
    },
    onConversationSnapshot: syncConversationSnapshotMessages,
    resumeDebugSource: 'chat:main-agent-session',
    onTerminalTaskStatus: (status: TaskStatus) => {
      if (!id) return;
      // 统一终态清算：轮询/sub 关闭路径拿到的终态同样要收敛状态机，
      // 不能只写 taskStatus（1677549 复现：taskStatus 落了 COMPLETE 页面仍卡「会话中」）
      finalizeConversationTerminal(id, status, 'poll-snapshot');
    },
    loadingSuggest,
    chatSuggestList,
    agentInfo: {
      id: agentId,
      name: effectiveAgent?.name,
      icon: effectiveAgent?.icon,
      type: effectiveAgent?.type,
      openingChatMsg: effectiveAgent?.openingChatMsg,
      guidQuestionDtos: effectiveAgent?.guidQuestionDtos,
      eventBindConfig: effectiveAgent?.eventBindConfig,
      hasPermission: effectiveAgent?.hasPermission,
      sandboxId: effectiveAgent?.sandboxId,
      hideDesktop: effectiveAgent?.hideDesktop,
      expandPageArea: effectiveAgent?.expandPageArea,
      allowChooseMode: effectiveAgent?.allowChooseMode,
    },
    onSendMessage: handleMessageSend,
    onClear: showClearContext ? handleClear : undefined,
    onLoadMoreMessage: handleLoadMoreMessage,
    selectedModelId,
    onModelSelect: setSelectedModelId,
    initialAgentMode: stateToUse?.agentMode,
    allowOtherModel: effectiveAgent?.allowOtherModel,
    manualComponents,
    selectedComponentList,
    onSelectComponent: handleSelectComponent,
    requiredNameList,
    variableParams,
    form,
    variables,
    userFillVariables: firstVariableParams,
    isVariablesDisabled: !!firstVariableParams || isSendMessageRef.current,
    clearLoading,
    isSelectionLocked,
    hasUserSentMessage,
    selectedComputerId: finalSelectedId,
    onComputerSelect: setSelectedComputerId,
    showScrollBtn,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
    readonly: !effectiveAgent?.allowPrivateSandbox,
    enableMention:
      effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
      effectiveAgent?.allowAtSkill === DefaultSelectedEnum.Yes,
    showAnnouncement: true,
    mentionPlacement: 'up',
    messageViewRef,
    // 原 conversationInfo model 数据，传给独立版输入组件
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    disabledConversationActive,
    loadingConversation,
    isLoadingOtherInterface,
    conversationInfo,
    // 双线分派：新线会话面在末尾展开覆盖（flag off 时空对象不影响旧线值）
    ...(runtimeLine?.conversationProps ?? {}),
  };

  // 仅首屏/切会话（loadingAsync）使用整页 Loading。
  // 不要把 loadingConversation 算进来：流式恢复若误走 runAsync，会反复卸载聊天区导致闪动。
  if (clearLoading || loadingAsync) {
    return (
      <div className={cx(styles['chat-loading-container'])}>
        <LoadingOutlined />
      </div>
    );
  }

  // 是否展开视图
  const isExpandedView = !!(pagePreviewData || isFileTreeVisible);

  return (
    <div
      className={cx(styles['chat-root'])}
      data-nuwaclaw-perf-scope="chat-root"
    >
      {/* 智能体聊天和预览页面 */}
      <div
        className={cx(styles['main-area'], {
          [styles['main-area-expanded']]: isExpandedView,
        })}
      >
        {enableResizable ? (
          <ResizableSplit
            resetTrigger={
              pagePreviewData || isFileTreeVisible ? 'visible' : 'hidden'
            }
            minLeftWidth={430}
            defaultLeftWidth={40}
            // 当文件树显示时，左侧占满flex-1, 文件树占flex-2
            left={
              effectiveAgent?.hideChatArea ? null : (
                <LeftContent
                  isFileTreeVisible={isFileTreeVisible}
                  effectiveAgent={effectiveAgent}
                  isAppSidebarMode={isAppSidebarMode}
                  headerProps={headerProps}
                  chatSessionProps={chatSessionProps}
                  fileSidebarProps={fileSidebarProps}
                />
              )
            }
            right={
              pagePreviewData &&
              !isFileTreeVisible && (
                <>
                  <PagePreviewIframe
                    pagePreviewData={pagePreviewData}
                    showHeader={true}
                    onClose={hidePagePreview}
                    showCloseButton={!effectiveAgent?.hideChatArea}
                    titleClassName={cx(styles['title-style'])}
                    // 复制模板按钮相关 props
                    showCopyButton={showCopyButton}
                    allowCopy={effectiveAgent?.allowCopy === AllowCopyEnum.Yes}
                    onCopyClick={() => setOpenCopyModal(true)}
                    copyButtonText={t('PC.Pages.Chat.copyTemplate')}
                    copyButtonClassName={styles['copy-btn']}
                  />
                  {/* 复制模板弹窗 */}
                  {showCopyButton && effectiveAgent && pagePreviewData?.uri && (
                    <CopyToSpaceComponent
                      spaceId={effectiveAgent!.spaceId}
                      mode={AgentComponentTypeEnum.Page}
                      componentId={parsePageAppProjectId(pagePreviewData?.uri)}
                      title={''}
                      open={openCopyModal}
                      isTemplate={true}
                      onSuccess={(_: any, targetSpaceId: number) => {
                        setOpenCopyModal(false);
                        // 跳转
                        jumpToPageDevelop(targetSpaceId);
                      }}
                      onCancel={() => setOpenCopyModal(false)}
                    />
                  )}
                </>
              )
            }
          />
        ) : (
          <div
            className={cx('flex', 'w-full', 'h-full')}
            style={{
              gap: '16px',
            }}
          >
            {effectiveAgent?.hideChatArea ? null : (
              <div
                style={{
                  flex: pagePreviewData && !isFileTreeVisible ? '0 0 50%' : '1',
                  minWidth: 0,
                }}
              >
                <LeftContent
                  isFileTreeVisible={isFileTreeVisible}
                  effectiveAgent={effectiveAgent}
                  isAppSidebarMode={isAppSidebarMode}
                  headerProps={headerProps}
                  chatSessionProps={chatSessionProps}
                  fileSidebarProps={fileSidebarProps}
                />
              </div>
            )}
            {pagePreviewData && !isFileTreeVisible && (
              <div style={{ flex: '1', minWidth: 0 }}>
                <PagePreviewIframe
                  pagePreviewData={pagePreviewData}
                  showHeader={true}
                  onClose={hidePagePreview}
                  showCloseButton={!effectiveAgent?.hideChatArea}
                  titleClassName={cx(styles['title-style'])}
                  showCopyButton={showCopyButton}
                  allowCopy={effectiveAgent?.allowCopy === AllowCopyEnum.Yes}
                  onCopyClick={() => setOpenCopyModal(true)}
                  copyButtonText={t('PC.Pages.Chat.copyTemplate')}
                  copyButtonClassName={styles['copy-btn']}
                />
                {showCopyButton && effectiveAgent && pagePreviewData?.uri && (
                  <CopyToSpaceComponent
                    spaceId={effectiveAgent!.spaceId}
                    mode={AgentComponentTypeEnum.Page}
                    componentId={parsePageAppProjectId(pagePreviewData?.uri)}
                    title={''}
                    open={openCopyModal}
                    isTemplate={true}
                    onSuccess={(_: any, targetSpaceId: number) => {
                      setOpenCopyModal(false);
                      jumpToPageDevelop(targetSpaceId);
                    }}
                    onCancel={() => setOpenCopyModal(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 非应用智能体模式下，显示智能体详情侧边栏 */}
      <ConditionRender
        condition={showSidebar && !isAppSidebarMode && !isFileTreeVisible}
      >
        {/* AgentSidebar - 只在文件树隐藏时显示 */}
        <AgentSidebar
          ref={sidebarRef}
          className={cx(
            styles[isSidebarVisible ? 'agent-sidebar-w' : 'agent-sidebar'],
          )}
          agentId={agentId}
          loading={loadingConversation}
          agentDetail={effectiveAgent}
          onVisibleChange={setIsSidebarVisible}
        />
      </ConditionRender>
      {/*展示台区域*/}
      <ShowArea />

      <ConditionRender
        condition={showPayment && isEnableSubscription && !isAppSidebarMode}
      >
        {/* 付费订阅套餐弹窗 */}
        <PaymentSubscriptionModal
          open={openPaymentModal}
          targetType="Agent"
          calledTrialCount={localCalledTrialCount}
          trialCount={agentDetail?.trialCount}
          isNeedSubscription={
            agentDetail?.paymentRequired && !agentDetail?.subscribed
          }
          loading={loadingAgentSubscriptionPlans || loadingMySubscription}
          // 套餐列表
          plans={agentSubscriptionPlans}
          // 当前订阅信息
          currentSubscribedInfo={
            mySubscriptionInfo?.currentSubscription ?? null
          }
          // 关闭回调
          onClose={() => setOpenPaymentModal(false)}
          // 订阅回调
          onSubscribe={createSubscriptionOrder}
        />
      </ConditionRender>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  return (
    <ChatCore
      id={Number(params.id)}
      agentId={Number(params.agentId)}
      locationState={location.state}
      showSidebar={true}
      showPayment={true}
      enableResizable={true}
    />
  );
};

export default ChatPage;
