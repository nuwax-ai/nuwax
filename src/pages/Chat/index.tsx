import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import ConditionRender from '@/components/ConditionRender';
import ResizableSplit from '@/components/ResizableSplit';

import useAgentDetails from '@/hooks/useAgentDetails';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import useSubscription from '@/hooks/useSubscription';

import { t } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  DefaultSelectedEnum,
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

import type { FileTreeContainerProps } from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import { useConversationAgentFileView } from '@/pages/ConversationAgent/hooks/useConversationAgentFileView';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import LeftContent from './components/LeftContent';
import ShowArea from './components/ShowArea';
import { useAutoPreviewFile } from './hooks/useAutoPreviewFile';
import { useChatConversation } from './hooks/useChatConversation';
import { useChatFiles } from './hooks/useChatFiles';
import { useChatGitSourceControl } from './hooks/useChatGitSourceControl';
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
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    handleClearSideEffect,
    setIsLoadingOtherInterface,
    requiredNameList,
    setConversationInfo,
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
    restartVncPod,
    restartAgent,
    // 通用型智能体会话中点击选中的文件ID
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    // 通用型智能体文件选择触发标志
    taskAgentSelectTrigger,
    // 会话是否正在进行中（有消息正在处理）
    isConversationActive,
    // 加载更多消息相关
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
  } = useModel('conversationInfo');

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    useModel('chat');

  const { isMobile } = useModel('layout');
  // 会话记录
  const { runHistoryItem } = useModel('conversationHistory');

  // 统一 Agent 数据源：优先使用会话关联的智能体快照，兜底使用详情接口数据
  const effectiveAgent = useMemo(() => {
    return conversationInfo?.agent || agentDetail;
  }, [conversationInfo?.agent, agentDetail]);

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);

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
    closePreviewView,
    openDesktopView,
    pagePreviewData,
  });
  const [clearLoading, setClearLoading] = useState<boolean>(false);

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
  const shouldBlockNavigation = useRef(false);

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

  useNavigationGuard({
    condition: () => shouldBlockNavigation.current,
    // 只有通用型智能体在会话活跃时才启用导航拦截，会话型智能体不需要
    enabled:
      isConversationActive && effectiveAgent?.type === AgentTypeEnum.TaskAgent,
    title: t('PC.Pages.Chat.taskExecuting'),
    message: t('PC.Pages.Chat.leaveTaskWarning'),
    discardText: t('PC.Pages.Chat.confirmLeave'),
  });

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
    // 初始化智能体详情信息（优先使用状态中的详情，否则等待 conversationInfo.agent 快照）
    const targetAgent = conversationInfo?.agent || defaultAgentDetail;
    if (targetAgent) {
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
    }
  }, [agentId, defaultAgentDetail, conversationInfo?.agent]);

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  // 异步查询会话加载状态
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);

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
            agentMode:
              (localStorage.getItem('nuwax_agent_mode_cache') as AgentMode) ||
              'yolo',
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
    conversationInfo,
    runAsync,
    allowAutoScrollRef,
    messageViewRef,
    incrementCalledTrialCount,
    selectedComponentList,
    selectedModelId,
  });

  useEffect(() => {
    // 切换会话时立即隐藏预览，防止旧数据重新打开导致闪烁
    hidePagePreview();

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
    handleUploadMultipleFiles,
    handleExportProject,
  } = useChatFiles({
    id,
    fileTreeData,
    handleRefreshFileList,
  });

  const fileView = useConversationAgentFileView({
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
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
    agentSandboxId: finalSelectedId,
    onClose: closePreviewView,
    isFileTreePinned,
    onFileTreePinnedChange: setIsFileTreePinned,
    isCanDeleteSkillFile: true,
    onRefreshFileTree: () => refreshFileListImmediately(id),
    hideDesktop: effectiveAgent?.hideDesktop,
    staticFileBasePath: `/api/computer/static/${id}`,
    isDynamicTheme: true,
  });

  const gitSourceControl = useChatGitSourceControl({
    conversationId: id,
    fileTreeData,
    changeFiles: fileView.changeFiles,
    handleSaveFiles,
    discardChangeFile: fileView.preview.discardChangeFile,
    openChangeFile: async (fileId: string) => {
      setTaskAgentSelectedFileId('');
      await fileView.tree.handleFileSelect(fileId);
    },
    refreshGitList: fileView.refreshGitList,
    handleRefreshFileList,
    onDiffFileSelect: () => {
      if (viewMode === 'desktop') {
        openPreviewView(id);
      }
    },
  });

  const chatFileTree: FileTreeContainerProps = useMemo(
    () => ({
      ...fileView.tree,
      handleFileSelect: async (fileId: string) => {
        setTaskAgentSelectedFileId('');
        gitSourceControl.setSelectedChangeFile(null);
        await fileView.tree.handleFileSelect(fileId);
      },
    }),
    [
      fileView.tree,
      setTaskAgentSelectedFileId,
      gitSourceControl.setSelectedChangeFile,
    ],
  );

  const fileSidebarProps = useMemo(
    () => ({
      tree: chatFileTree,
      preview: fileView.preview,
      viewMode,
      hideDesktop: effectiveAgent?.hideDesktop,
      diffFile: gitSourceControl.selectedDiffFile,
      previewPanelProps: {
        agentSandboxId: finalSelectedId,
        agentSandboxName: '',
        onRestartServer: () => restartVncPod(id, finalSelectedId),
        onRestartAgent: () => restartAgent(id),
        onExportProject: handleExportProject,
        idleDetection: {
          enabled: effectiveAgent?.type === AgentTypeEnum.TaskAgent,
          onIdleTimeout: () => openPreviewView(id),
        },
      },
      sourceControl: {
        gitWorkspace: {
          workspaceType: 'taskAgent' as const,
          cid: id ?? null,
        },
        changeFiles: fileView.changeFiles,
        selectedChangeFile: gitSourceControl.selectedChangeFile,
        isCommitting:
          gitSourceControl.isCommitting || fileView.preview.isSavingFiles,
        isRefreshingGitList: fileView.isRefreshingGitList,
        onRefreshGitList: fileView.refreshGitList,
        onDiffFileSelect: gitSourceControl.handleDiffFileSelect,
        onOpenChangeFile: gitSourceControl.handleOpenChangeFile,
        onAfterDiscardChange: gitSourceControl.handleAfterDiscardChange,
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
      gitSourceControl.selectedDiffFile,
      gitSourceControl.selectedChangeFile,
      gitSourceControl.isCommitting,
      gitSourceControl.handleDiffFileSelect,
      gitSourceControl.handleOpenChangeFile,
      gitSourceControl.handleAfterDiscardChange,
      gitSourceControl.handleAddToGitignore,
      gitSourceControl.handleCommit,
      viewMode,
      id,
      effectiveAgent?.hideDesktop,
      effectiveAgent?.type,
      finalSelectedId,
      handleExportProject,
      openPreviewView,
      restartVncPod,
      restartAgent,
    ],
  );

  // 设置最小宽度
  useEffect(() => {
    // 移动端不设置最小宽度
    if (isMobile) {
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
    closePreviewView,
    handleOpenPreview,
    isShowFilePanel,
    viewMode,
    handleFileTreeVisible,
    handleOpenDesktopView,
    renderTitle,
    renderHeaderRight,
  };

  const chatSessionProps = {
    conversationId: id,
    messageList,
    roleInfo,
    isLoading: loadingConversation,
    loadingMore,
    isMoreMessage,
    isConversationActive: conversationInfo?.taskStatus === TaskStatus.EXECUTING,
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
    },
    onSendMessage: handleMessageSend,
    onClear: showClearContext ? handleClear : undefined,
    onLoadMoreMessage: handleLoadMoreMessage,
    selectedModelId,
    onModelSelect: setSelectedModelId,
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
    readonly: effectiveAgent?.allowPrivateSandbox === DefaultSelectedEnum.No,
    enableMention:
      effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
      effectiveAgent?.allowAtSkill === DefaultSelectedEnum.Yes,
    showAnnouncement: true,
    mentionPlacement: 'up',
    messageViewRef,
  };

  if (clearLoading || loadingConversation || loadingAsync) {
    return (
      <div className={cx(styles['chat-loading-container'])}>
        <LoadingOutlined />
      </div>
    );
  }

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
          [styles['main-area-mobile']]: isMobile,
        })}
      >
        {enableResizable ? (
          <ResizableSplit
            resetTrigger={
              pagePreviewData || isFileTreeVisible ? 'visible' : 'hidden'
            }
            minLeftWidth={430}
            defaultLeftWidth={33}
            // 当文件树显示时，左侧占满flex-1, 文件树占flex-2
            left={
              effectiveAgent?.hideChatArea ? null : (
                <LeftContent
                  isMobile={isMobile}
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
                    className={cx({
                      [styles['mobile-page-preview-container']]: isMobile,
                    })}
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
            className={styles['chat-flex-container']}
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
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
                  isMobile={isMobile}
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
                  className={cx({
                    [styles['mobile-page-preview-container']]: isMobile,
                  })}
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
