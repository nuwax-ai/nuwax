import {
  ConversationBottomConsole,
  CopyToSpaceComponent,
  PagePreviewIframe,
  type ConsoleLayoutMode,
} from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import ConversationProgressCapsule from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule';
import { selectProgressCapsule } from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/selectProgressCapsule';
import type { FileMentionItem } from '@/components/ChatInputHome/MentionPopup/types';
import ConditionRender from '@/components/ConditionRender';
import ResizableSplit from '@/components/ResizableSplit';
import { SUCCESS_CODE } from '@/constants/codes.constants';

import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { ConversationPagePathnameContext } from '@/hooks/ConversationPagePathnameContext';
import { ConversationRendererRouteSearchContext } from '@/hooks/ConversationRendererRouteSearchContext';
import useAgentDetails from '@/hooks/useAgentDetails';
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import { useConversationChanged } from '@/hooks/useDirectorySync';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import useStyle3PcKeepAliveEnabled from '@/hooks/useStyle3PcKeepAliveEnabled';
import useSubscription from '@/hooks/useSubscription';
import useTerminalWsUrl from '@/hooks/useTerminalWsUrl';

import AgentDetailModal from '@/components/business-component/AgentDetailModal';
import type { ConversationToolResource } from '@/features/conversation/presentation-v2/types';
import {
  conversationPageCacheManager,
  createConversationPageCacheKey,
  type ConversationWorkspaceView,
} from '@/features/conversation/react/useConversationPageCache';
import { useConversationRuntimeSession } from '@/features/conversation/react/useConversationRuntimeSession';
import { fullPageInstanceCacheManager } from '@/features/conversation/react/useFullPageInstanceCache';
import type { ClientConversationPageInstanceProps } from '@/models/appTabKeepAlive';
import { ConversationPageModelProvider } from '@/modelScopes/ConversationPageModelProvider';
import { usePageModel } from '@/modelScopes/usePageModel';
import { t } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  HideDesktopEnum,
  MessageTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { FileNode } from '@/types/interfaces/appDev';
import type { MessageSourceType } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  RoleInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import { buildAppProRoute } from '@/utils/appProRoute';
import { addBaseTarget, parsePageAppProjectId } from '@/utils/common';
import { normalizeSandboxIdValue } from '@/utils/effectiveSandbox';
import { openKnownBusinessRouteWindow } from '@/utils/hostBridge/openBusinessRouteWindow';
import { parseOpenAppChromeFlags } from '@/utils/openAppChromeFlags';

import {
  useSourceControl,
  type SelectedChangeFile,
} from '@/components/business-component/FileTreeGitSourcePanel';
import {
  findSearchFileByRelativePath,
  mapSearchFileToNode,
} from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel/SearchView/mapSearchFileToNode';
import type { FileTreeContainerProps } from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import { resolveGitignoreWritePlan } from '@/components/business-component/FileTreeGitSourcePanel/utils/gitignoreWritePlan';
import { useFileTreePreviewView } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView';
import {
  apiAgentConversation,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { fetchContentOutcome } from '@/services/skill';
import {
  apiGetStaticFileList,
  apiSearchFiles,
  apiUpdateStaticFile,
} from '@/services/vncDesktop';

import { jumpToPageDevelop } from '@/utils/router';
import {
  TTYD_TERMINAL_WIRE_PROTOCOL,
  TTYD_TERMINAL_WS_SUBPROTOCOLS,
} from '@/utils/terminalWsUrl';
import { LoadingOutlined } from '@ant-design/icons';
import { message as antdMessage, Form } from 'antd';
import classNames from 'classnames';
import { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import ConversationInstanceCacheSlot from './components/ConversationInstanceCacheSlot';
import LeftContent from './components/LeftContent';
import ShowArea from './components/ShowArea';
import { isNormalProjectConversation } from './hooks/isNormalProjectConversation';
import { useAutoPreviewFile } from './hooks/useAutoPreviewFile';
import { useChatConversation } from './hooks/useChatConversation';
import { useChatFiles } from './hooks/useChatFiles';
import { useChatNormalProjectNameSync } from './hooks/useChatNormalProjectNameSync';
import { useChatSandbox } from './hooks/useChatSandbox';
import { useChatVariables } from './hooks/useChatVariables';
import { useChatViewMode } from './hooks/useChatViewMode';
import { useWorkspaceDirectoryFiles } from './hooks/useWorkspaceDirectoryFiles';
import styles from './index.less';
import {
  parentDirectory,
  WORKSPACE_SOURCE_ID,
  workspaceNodeId,
  workspaceRelativePath,
} from './utils/fileDataSource';
import { resolveSandboxFileOpen } from './utils/sandboxPath';

const cx = classNames.bind(styles);
export interface ChatCoreProps {
  id: number;
  agentId: number;
  locationState?: any;
  /** 直渲染入口切出时传 false；客户端局部模型入口由 CachedChatPage 常驻。 */
  active?: boolean;
  /** 宿主创建实例时的路由 state，优先于后来导航产生的全局 location.state。 */
  initialLocationState?: any;
  /** 仅常驻实例使用：固定创建时的路由参数，隐藏后不读取其他页面的 location。 */
  freezeRouteLocation?: boolean;
  routeLocationSnapshot?: {
    pathname: string;
    search: string;
    state?: any;
    key?: string;
    navigationAction?: 'PUSH' | 'POP' | 'REPLACE';
  };
  showSidebar?: boolean; // 是否渲染右侧属性面板，默认 true
  showPayment?: boolean; // 是否包含订阅/扣费弹窗等逻辑，默认 true
  enableResizable?: boolean; // 是否开启拖拽分栏布局，默认 true
  showClearContext?: boolean; // 是否展示清除上下文按钮（刷子），默认 true
  defaultFileTreeVisible?: boolean; // 是否默认显示文件树，默认 false
  /**
   * #5a 文件树懒加载收尾：本页是否自管文件树数据（单层 hook），默认 true。
   * 置 true 时模型层跳过全量递归拉取、只发刷新信号；依赖模型全量树做
   * 变更信号的宿主（如 SkillDetailsConversation）显式传 false 保持原行为。
   */
  fileTreeSelfManaged?: boolean;
  /**
   * 是否启用项目型会话直开兜底跳转（默认 false）。
   * 仅独立 /home/chat 路由页传 true：全栈（UserApp）等项目会话在此页只有
   * 空壳，按侧栏同款分发规则 replace 到对应 IDE。EditAgent 预览等内嵌宿主
   * 必须保持 false，避免被踢出宿主页。
   */
  enableDevTargetRedirect?: boolean;
  renderTitle?: (props: {
    effectiveAgent: any;
    isAppSidebarMode: boolean;
  }) => React.ReactNode;
  renderHeaderRight?: (props: { effectiveAgent: any }) => React.ReactNode;
}

/**
 * 主页咨询聊天页面
 */
const ChatCoreInner: React.FC<ChatCoreProps> = ({
  id,
  agentId,
  locationState,
  initialLocationState,
  freezeRouteLocation = false,
  routeLocationSnapshot,
  active = true,
  showSidebar = true,
  showPayment = true,
  enableResizable = true,
  showClearContext = true,
  defaultFileTreeVisible = false,
  fileTreeSelfManaged = true,
  enableDevTargetRedirect = false,
  renderTitle,
  renderHeaderRight,
}) => {
  const pageCacheKey = useMemo(
    () => createConversationPageCacheKey('chat', id),
    [id],
  );
  const location = useLocation();
  const initialRouteRef = useRef({
    location: routeLocationSnapshot
      ? { ...location, ...routeLocationSnapshot }
      : location,
    action: routeLocationSnapshot?.navigationAction ?? history.action,
  });
  const routeLocation = freezeRouteLocation
    ? {
        ...initialRouteRef.current.location,
        state:
          initialLocationState !== undefined
            ? initialLocationState
            : initialRouteRef.current.location.state,
      }
    : location;
  const routeAction = freezeRouteLocation
    ? initialRouteRef.current.action
    : history.action;
  const chromeFlags = useMemo(
    () => parseOpenAppChromeFlags(routeLocation.search),
    [routeLocation.search],
  );
  const { handleAutoPreviewLastFile } = useAutoPreviewFile();
  const stateToUse = freezeRouteLocation
    ? routeLocation.state
    : initialLocationState !== undefined
    ? initialLocationState
    : locationState !== undefined
    ? locationState
    : location.state;
  // 附加state
  const message = stateToUse?.message;
  const files = stateToUse?.files;
  // 组件列表（首页传入时已含专家合并，按 id+type 去重）
  const infos = stateToUse?.infos;
  // 技能ID列表
  const skillIds = stateToUse?.skillIds;
  // 资料库已选文档（首页能力弹窗选中，随首条消息发送）
  const firstSelectedDocs = stateToUse?.selectedDocs;
  // 消息来源
  const messageSourceType: MessageSourceType =
    (stateToUse?.messageSourceType as MessageSourceType) || 'new_chat'; // new_chat 新增会话
  // 默认的智能体详情信息
  const defaultAgentDetail = stateToUse?.defaultAgentDetail;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = stateToUse?.variableParams;
  // 模型ID(undefined=尚未选择,由 ModelSelector 按列表自动落回)
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(
    stateToUse?.modelId,
  );
  // 模型选择按智能体隔离:切换智能体时清空当前选中,交由 ModelSelector
  // 按新智能体的可用列表自动落回(列表首位即该智能体最近使用的模型);
  // 否则上一智能体手选的模型会"串"到下一智能体的对话框(若同在其列表中)。
  // 首挂载不清(保留 locationState 透传的初值),同智能体切任务也不受影响
  const prevAgentIdRef = useRef(agentId);
  useEffect(() => {
    if (prevAgentIdRef.current === agentId) return;
    prevAgentIdRef.current = agentId;
    setSelectedModelId(undefined);
  }, [agentId]);
  const [form] = Form.useForm();

  // 智能体详情悬浮弹窗（取代原 AgentSidebar 互斥侧栏，与右侧面板共存）
  const [isAgentDetailModalOpen, setIsAgentDetailModalOpen] =
    useState<boolean>(false);

  // 会话进度面板展开态（受控）：页头「会话进度」按钮驱动胶囊组件
  const [capsulePanelOpen, setCapsulePanelOpen] = useState<boolean>(false);

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);

  const [clearLoading, setClearLoading] = useState<boolean>(false);

  // 异步查询会话加载状态
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);
  const hasRenderedChatRef = useRef(false);
  const runtimeLineRef =
    useRef<ReturnType<typeof useConversationRuntimeSession>>(null);

  // 开放应用智能体会话聊天页面相关状态
  const {
    handleSetAppAgentDetail,
    isAppSidebarMode: globalIsAppSidebarMode,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    createAppNewConversation,
    openPaymentModal,
    setOpenPaymentModal,
    localCalledTrialCount,
    incrementCalledTrialCount,
  } = useModel('useOpenApp');
  const isAppSidebarMode = freezeRouteLocation
    ? routeLocation.pathname.startsWith('/app/')
    : globalIsAppSidebarMode;

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
    if (!active || !showPayment || !openPaymentModal || isAppSidebarMode) {
      return;
    }

    // 打开智能体订阅套餐弹窗
    queryAgentSubscriptionPlans(agentId);
  }, [
    active,
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
    setFileTreeSelfManaged,
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
  } = usePageModel('conversationInfo');

  const previousAutoScrollRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!active) {
      if (previousAutoScrollRef.current === null) {
        previousAutoScrollRef.current = allowAutoScrollRef.current;
      }
      allowAutoScrollRef.current = false;
      return;
    }
    if (previousAutoScrollRef.current === null) return;
    const shouldFollowTail = previousAutoScrollRef.current;
    previousAutoScrollRef.current = null;
    allowAutoScrollRef.current = shouldFollowTail;
    if (shouldFollowTail) {
      const frame = requestAnimationFrame(() => {
        const element = messageViewRef.current;
        if (element) element.scrollTop = element.scrollHeight;
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [active, allowAutoScrollRef, messageViewRef]);

  // 工作区目录懒加载（#5a 单层树）：首拉门控 = 文件树面板可见——「打开面板才拉」，
  // 新会话挂载不预发 file-list（后端契约：工作区在 chat 之后才建立）
  const workspaceDirectoryFiles = useWorkspaceDirectoryFiles(id, {
    enabled: active && isFileTreeVisible,
  });

  useConversationChanged((event) => {
    if (
      event.operation !== 'updated' ||
      !event.patch ||
      String(conversationInfo?.id ?? id ?? '') !== event.conversationId
    ) {
      return;
    }
    setConversationInfo((previous: ConversationInfo | null | undefined) => {
      if (!previous || String(previous.id) !== event.conversationId) {
        return previous;
      }
      const next = {
        ...previous,
        ...(event.patch?.topic !== undefined
          ? { topic: event.patch.topic }
          : {}),
        ...(event.patch?.icon !== undefined ? { icon: event.patch.icon } : {}),
        ...(event.patch?.taskStatus !== undefined
          ? { taskStatus: event.patch.taskStatus }
          : {}),
      };
      return next.topic === previous.topic &&
        next.icon === previous.icon &&
        next.taskStatus === previous.taskStatus
        ? previous
        : next;
    });
  });

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    usePageModel('chat');

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
    conversationId: id,
    location: { ...routeLocation, state: stateToUse },
    history: { action: routeAction },
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

  const rememberWorkspaceView = useCallback(
    (view: ConversationWorkspaceView) => {
      conversationPageCacheManager.update(pageCacheKey, { view });
    },
    [pageCacheKey],
  );

  const handleHidePagePreview = useCallback(() => {
    hidePagePreview();
    rememberWorkspaceView('closed');
  }, [hidePagePreview, rememberWorkspaceView]);

  /** 关闭文件树时同步折叠终端，避免再次打开文件树时终端以展开状态恢复 */
  const handleClosePreviewView = useCallback(() => {
    setTerminalConsoleVisible(false);
    closePreviewView();
    rememberWorkspaceView('closed');
  }, [closePreviewView, rememberWorkspaceView]);

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

  // =============== 项目型会话直开兜底跳转 ===============
  // 全栈（UserApp）/网页应用（PageApp）/智能体开发（Agent）会话各有 IDE 宿主，
  // 历史记录/收藏夹等旧链直开 /home/chat 时应回到对应 IDE。分两段：
  // ①详情正常返回时（普通/常规会话都带 devTarget* 字段），非项目型不动，
  //   项目型按侧栏同款分发规则（NewHomeSection.handleConversationClick）replace；
  // ②UserApp 会话详情端点直接 404（Conversation not found）——空壳页正是它
  //   ——详情迟迟不出时用会话列表反查一次（列表端点带 devTarget*），命中即跳。
  // id 门槛先行：模型加载期可能残留上一会话数据，仅当前路由会话可触发。
  // 仅独立路由页启用（enableDevTargetRedirect，内嵌宿主默认 false 不受影响）。
  const redirectDevTargetConversation = useCallback(
    (
      info: Pick<
        ConversationInfo,
        'id' | 'devTargetType' | 'devTargetId' | 'devSpaceId'
      >,
    ) => {
      const { devTargetType, devTargetId, devSpaceId } = info;
      if (!devTargetType || !devTargetId || !devSpaceId) return;
      if (devTargetType === 'Agent') {
        history.replace(
          `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${info.id}`,
        );
      } else if (devTargetType === 'PageApp') {
        history.replace(`/space/${devSpaceId}/app-dev/${devTargetId}`);
      } else if (devTargetType === 'UserApp') {
        history.replace(buildAppProRoute(devSpaceId, devTargetId, info.id));
      }
    },
    [],
  );

  // ① 详情已出：仅项目型（Agent/PageApp/UserApp）才跳，普通会话不动
  useEffect(() => {
    if (!active || !enableDevTargetRedirect) return;
    const info = conversationInfo;
    if (!info || info.id !== id) return;
    redirectDevTargetConversation(info);
  }, [
    conversationInfo,
    id,
    enableDevTargetRedirect,
    active,
    redirectDevTargetConversation,
  ]);

  // ② 详情超时兜底：2.5s 仍无本会话数据（UserApp 详情 404 等）→ 列表反查一次。
  //    正常会话在窗口内加载成功即取消定时器，不产生额外请求
  const devTargetLookupFiredRef = useRef(false);
  useEffect(() => {
    if (!active || !enableDevTargetRedirect) return;
    let cancelled = false;
    devTargetLookupFiredRef.current = false;
    if (conversationInfo?.id === id) return;
    const conversationId = id;
    const timer = setTimeout(() => {
      if (devTargetLookupFiredRef.current) return;
      devTargetLookupFiredRef.current = true;
      void apiAgentConversationList({
        agentId: null,
        // 全量找会话（含已归档）做 devTarget 兜底跳转
        archivedFilter: 'all',
        limit: 50,
      })
        .then((res) => {
          const hit = (res?.data || []).find(
            (item) => item.id === conversationId,
          );
          if (hit && !cancelled) {
            redirectDevTargetConversation(hit);
          }
        })
        .catch(() => {
          // 反查失败维持现状（与详情 404 的空壳表现一致，不额外打扰）
        });
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    conversationInfo?.id,
    id,
    enableDevTargetRedirect,
    active,
    redirectDevTargetConversation,
  ]);

  // 常规项目：nameDefined 为 false 时 generate-info 补全项目元数据
  useChatNormalProjectNameSync({
    conversationInfo,
    prompt: message,
    navigationAction: routeAction,
  });

  // =============== 会话 icon 缺失时，补拉会话 icon ===============

  /** 主题已更新但 icon 仍为空时，补拉会话 icon */
  const conversationIconUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    conversationIconUpdateRef.current = null;
  }, [id]);

  useEffect(() => {
    if (
      !conversationInfo?.id ||
      // 无名会话不做 icon 补齐（bug2382）：空 topic 的 update 会经共享 runUpdateTopic
      // 的 onSuccess 置 needUpdateTopicRef=false，抢先毒化首条消息的自动命名；
      // 自动命名成功后本 effect 会以新名字重评估，icon 链路不受损
      !conversationInfo.topic ||
      conversationInfo.topicUpdated !== 1 ||
      conversationInfo.icon !== null ||
      conversationIconUpdateRef.current === conversationInfo.id
    ) {
      return;
    }

    // 更新会话 icon，如果更新失败，则重置 conversationIconUpdateRef
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

  // 打开扩展页面；自动初始化可跳过持久化，用户操作与会话事件默认记录。
  const handleOpenPreview = useCallback(
    (agent: any, persist = true) => {
      if (agent && agent?.expandPageArea && agent?.pageHomeIndex) {
        showPagePreview({
          name: t('PC.Pages.Chat.pagePreview'),
          uri: process.env.BASE_URL + agent?.pageHomeIndex,
          params: {},
          executeId: '',
        });
        if (persist) {
          conversationPageCacheManager.update(pageCacheKey, {
            view: 'pagePreview',
          });
        }
      } else {
        showPagePreview(null);
        if (persist) {
          conversationPageCacheManager.update(pageCacheKey, {
            view: 'closed',
          });
        }
      }
    },
    [pageCacheKey, showPagePreview],
  );

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
    const preferredView =
      conversationPageCacheManager.getPanelPreference(pageCacheKey);
    if (!defaultFileTreeVisible && preferredView === undefined) {
      handleOpenPreview(targetAgent, true);
    } else if (!defaultFileTreeVisible && preferredView === 'pagePreview') {
      handleOpenPreview(targetAgent, false);
    } else {
      showPagePreview(null);
    }
  }, [
    agentId,
    id,
    pageCacheKey,
    defaultFileTreeVisible,
    defaultAgentDetail,
    conversationInfo?.agent,
    handleOpenPreview,
    showPagePreview,
  ]);

  // 这两项由开放应用全局模型持有，后台缓存实例不得覆盖当前页。
  useEffect(() => {
    if (!active) return;
    const targetAgent =
      conversationInfo?.id === id
        ? conversationInfo.agent
        : defaultAgentDetail?.agentId === agentId
        ? defaultAgentDetail
        : null;
    if (!targetAgent) return;
    setOpenPaymentModal(
      Boolean(targetAgent.paymentRequired && !targetAgent.subscribed),
    );
    handleSetAppAgentDetail(targetAgent);
  }, [
    active,
    agentId,
    conversationInfo?.agent,
    conversationInfo?.id,
    defaultAgentDetail,
    id,
    handleSetAppAgentDetail,
    setOpenPaymentModal,
  ]);

  useEffect(() => {
    let cancelled = false;
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
          if (cancelled) return;
          data = _data;
        } finally {
          if (!cancelled) setLoadingAsync(false);
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
          const effectiveSandboxId =
            getEffectiveSandboxId(data) || CLOUD_SANDBOX_ID;

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
            selectedDocs: firstSelectedDocs,
            modelId: selectedModelId,
            agentMode: (stateToUse?.agentMode as AgentMode) || 'yolo',
          };

          const runtimeSession = runtimeLineRef.current?.session;
          if (runtimeSession) {
            runtimeSession.send({
              conversationId: id,
              message,
              files,
              infos,
              variableParams: firstVariableParams,
              sandboxId: effectiveSandboxId,
              currentInfo: data,
              isSuggestEnabled: data?.agent?.openSuggest === 1,
              skillIds,
              selectedDocs: firstSelectedDocs,
              modelId: selectedModelId,
              agentMode: (stateToUse?.agentMode as AgentMode) || 'yolo',
            });
          } else {
            onMessageSend(sendParams);
          }
        }
      };
      void asyncFun();
    }
    // 路由离开后，旧请求的回包不得再触发预览和首条消息发送。
    return () => {
      cancelled = true;
    };
  }, [
    id,
    message,
    files,
    infos,
    firstVariableParams,
    skillIds,
    firstSelectedDocs,
  ]);

  useEffect(() => {
    // 应用智能体模式下，不获取当前智能体的历史记录
    if (!active || isAppSidebarMode) {
      return;
    }
    // 获取当前智能体的历史记录
    runHistoryItem({
      agentId,
      limit: 20,
    });
  }, [id, agentId, isAppSidebarMode, active]);

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
  // 清空上下文新会话的创建绑定（bug 2451：执行按创建时绑定路由）：清空已重置
  // 手动选择，绑定=智能体绑定/云哨兵，与选择器清空后显示一致（hook 内 state
  // 闭包过时，须以渲染期值传入）；类型归一（bug2443）：智能体绑定沙箱可能为
  // 非数字形态，归一透传勿 Number 转 NaN（NaN 非空值，下游 ?? 兜底拦不住）
  const createConversationSandboxId = useMemo(
    () =>
      normalizeSandboxIdValue(effectiveAgent?.sandboxId) ??
      Number(CLOUD_SANDBOX_ID),
    [effectiveAgent?.sandboxId],
  );
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
    createConversationSandboxId,
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

  const getCurrentConversationIdRef = useRef(getCurrentConversationId);
  getCurrentConversationIdRef.current = getCurrentConversationId;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    // 切换会话时立即隐藏页面预览，并清除文件面板全局状态（fileTreeData / taskAgentSelectedFileId 等）
    hidePagePreview();
    clearFilePanelInfo();
    // 发送标记属于上一会话；新会话在用户再次发送前不能沿用
    setHasUserSentMessage(false);
    if (activeRef.current) setOpenPaymentModal(false);

    // 重置 clearLoading：此时 cleanup 已执行 resetInit() 清空了 conversationInfo，
    // conversationInfo 会无缝接管加载显示，不会出现 AgentChatEmpty 闪现
    setClearLoading(false);

    return () => {
      // 直渲染入口仍可能共享全局模型。只清理本实例当前持有的会话；
      // 局部模型入口也用同一守卫，避免过期回包误触发清理。
      if (Number(getCurrentConversationIdRef.current()) !== Number(id)) {
        return;
      }
      resetInit();
      setSelectedComponentList([]);
      hidePagePreview(); // 组件卸载时主动隐藏预览，避免用户下一次进入时预览还在！
      if (activeRef.current) setOpenPaymentModal(false);
    };
  }, [id]);

  // 互斥面板控制器：管理 PagePreview、ShowArea 的互斥展示（AgentSidebar 已改为悬浮弹窗）
  useExclusivePanels({
    pagePreviewData,
    hidePagePreview,
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
    fileTreeData: workspaceDirectoryFiles.files,
    handleRefreshFileList: async (_id, path) =>
      workspaceDirectoryFiles.refresh(path),
    onFileMutationSuccessRef: refreshGitListRef,
  });

  // 渲染线放在产物入口判断之前：V2 的消息列表在 runtime，不回写页面模型。
  // 图标是否出现直接看这份正在展示的列表，不必在 onSendMessage 上再打发送标记。
  const runtimeLine = useConversationRuntimeSession({
    conversationId: id,
    messageViewRef,
    allowAutoScrollRef,
    getSandboxId: () => getEffectiveSandboxId() || CLOUD_SANDBOX_ID,
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
  runtimeLineRef.current = runtimeLine;

  /**
   * 当前会话是否已有有效消息。空列表、或只有一条开场白，都不算。
   * V2 看运行时消息列表；旧线看页面模型。详情未对上当前路由时视为还没有有效消息，
   * 避免清空后用上一会话的列表去显示产物入口、请求 git。
   */
  const hasValidMessageList = useMemo(() => {
    const sessionInfo = runtimeLine
      ? (runtimeLine.conversationProps?.conversationInfo as
          | { id?: number | string }
          | null
          | undefined)
      : conversationInfo;
    const sessionMessageList = runtimeLine
      ? runtimeLine.messageList
      : messageList;
    if (sessionInfo?.id === undefined || String(sessionInfo.id) !== String(id)) {
      return false;
    }
    const currentMessageList = sessionMessageList || [];
    if (!currentMessageList.length) {
      return false;
    }
    return !(
      currentMessageList.length === 1 &&
      currentMessageList[0]?.messageType === MessageTypeEnum.ASSISTANT
    );
  }, [runtimeLine, conversationInfo, id, messageList]);

  /** 有有效消息后才显示产物入口，并允许在预览面板展开时请求 git */
  const canUseFilePreview = hasValidMessageList;

  /**
   * 文件预览面板是否展开。未展开时工作区可能还没有文件，甚至尚未建立，
   * 此时不请求 git status / diff。
   */
  const isFilePreviewPanelOpen =
    isFileTreeVisible && viewMode === 'preview';

  /** 面板未展开或会话未开始时，不允许刷新 Git status */
  const isGitStatusRefreshDisabled =
    !canUseFilePreview || !isFilePreviewPanelOpen;

  /** V2 工具详情点击打开的文件（相对路径）；用于选中失败时精确归因提示 */
  const toolResourceSelectRef = useRef('');

  /**
   * V2 工具详情点击打开的工作区外沙箱文件（桌面等）：
   * 右侧面板临时切换为独立预览，不依赖工作区文件树。
   */
  const [externalPreviewFile, setExternalPreviewFile] = useState<{
    cId: number;
    targetDir: string;
    relativePath: string;
  } | null>(null);

  /**
   * 退出工作区外文件独立预览：该面板整块顶替文件树面板（文件树/终端/云电脑
   * 都不可见），故任何回到工作区面板的动作都要先清它，否则右侧停在独立预览、
   * 用户无法切回文件树预览。
   */
  const exitExternalPreview = useCallback(() => {
    setExternalPreviewFile(null);
  }, []);

  const workspaceTaskSelectedFileId = taskAgentSelectedFileId
    ? workspaceNodeId(workspaceRelativePath(taskAgentSelectedFileId))
    : '';

  /**
   * 任务结果点击正在加载的父目录。此期间父目录视为未加载，
   * 避免逐层树在搜索完成前把目标判成不存在。
   */
  const openingTaskResultRef = useRef<{
    parent: string;
    trigger: number;
  } | null>(null);
  const taskAgentSelectedFileIdRef = useRef(taskAgentSelectedFileId);
  taskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
  /**
   * 同一次点击只标记一次。必须在预览 hook 的 effect 之前写上，
   * 否则自动选中会先把目标当已加载，再打开一次文件。
   */
  const taskResultOpenMarkRef = useRef<number | string | undefined>(undefined);
  if (
    taskAgentSelectTrigger &&
    taskAgentSelectedFileId &&
    taskResultOpenMarkRef.current !== taskAgentSelectTrigger
  ) {
    taskResultOpenMarkRef.current = taskAgentSelectTrigger;
    const openingParent = parentDirectory(
      workspaceRelativePath(taskAgentSelectedFileId).replace(
        /^\/+|\/+$/g,
        '',
      ),
    );
    if (openingParent && typeof taskAgentSelectTrigger === 'number') {
      openingTaskResultRef.current = {
        parent: openingParent,
        trigger: taskAgentSelectTrigger,
      };
    }
  }

  /**
   * #5a 文件树懒加载收尾：向模型声明本页自管文件树（单层 hook）。
   * 模型层据此跳过全量递归拉取；卸载时复位，避免影响后续依赖模型树的页面。
   */
  useEffect(() => {
    setFileTreeSelfManaged(fileTreeSelfManaged);
    return () => setFileTreeSelfManaged(false);
  }, [fileTreeSelfManaged, setFileTreeSelfManaged]);

  /**
   * #5a 文件树懒加载收尾：订阅模型层刷新信号，节流刷新已加载目录。
   * 门控后模型层不再全量拉树、只发 fileTreeRefreshTrigger（SSE 流式期间 /
   * 任务结束 / 打开预览均会触发），此处刷新「已加载的全部目录」（含根层，
   * refreshAllLoaded）补齐列表同步——不止 currentPath 单层，修复「打开的
   * 目录不刷新」。当前打开文件的正文重拉由 useFileTreePreviewView 内已有的
   * trigger 监听负责，两者互不重复。
   */
  const handledDirectoryRefreshTriggerRef = useRef<number>(0);
  const activeDirectoryRefreshRef = useRef<() => void>(() => {});
  activeDirectoryRefreshRef.current = workspaceDirectoryFiles.refreshAllLoaded;
  const throttledRefreshActiveDirectory = useMemo(
    () =>
      throttle(() => activeDirectoryRefreshRef.current(), 2000, {
        leading: true,
        trailing: true,
      }),
    [],
  );
  useEffect(
    () => () => throttledRefreshActiveDirectory.cancel(),
    [throttledRefreshActiveDirectory],
  );
  useEffect(() => {
    if (
      !fileTreeRefreshTrigger ||
      handledDirectoryRefreshTriggerRef.current === fileTreeRefreshTrigger ||
      // 面板关闭期间不刷目录（打开面板时 openPreviewView 的 needRefresh 会补拉）
      !active ||
      !isFileTreeVisible
    ) {
      return;
    }
    handledDirectoryRefreshTriggerRef.current = fileTreeRefreshTrigger;
    throttledRefreshActiveDirectory();
  }, [
    fileTreeRefreshTrigger,
    throttledRefreshActiveDirectory,
    active,
    isFileTreeVisible,
  ]);

  /** TaskResult / 文件树选中等打开预览前，关闭版本记录面板（gitSourceControl 初始化后赋值） */
  const closeVersionPanelForFilePreviewRef = useRef<() => void>(() => {});

  // 文件视图 props
  const fileView = useFileTreePreviewView({
    taskAgentSelectedFileId: workspaceTaskSelectedFileId,
    taskAgentSelectTrigger,
    // 会话结束文件树刷新后兜底重拉当前打开文件正文
    fileTreeRefreshTrigger,
    originalFiles: workspaceDirectoryFiles.files,
    fileTreeDataLoading: workspaceDirectoryFiles.loading,
    targetId: id?.toString() || '',
    readOnly: false,
    onUploadFiles: (files, filePaths) =>
      handleUploadMultipleFiles(
        files,
        filePaths.map((filePath) =>
          [workspaceDirectoryFiles.currentPath, filePath]
            .filter(Boolean)
            .join('/'),
        ),
      ),
    onExportProject: handleExportProject,
    onRenameFile: handleConfirmRenameFile,
    onCreateFileNode: (node, newName) => handleCreateFileNode(node, newName),
    onDeleteFile: (node) =>
      handleDeleteFile(
        node.type === 'folder' && node.relativePath
          ? { ...node, id: node.relativePath }
          : node,
      ),
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
    onRefreshFileTree: workspaceDirectoryFiles.refresh,
    onOpenDirectory: (node) => {
      if (node.relativePath) {
        workspaceDirectoryFiles.navigate(node.relativePath);
      }
    },
    hideDesktop: effectiveAgent?.hideDesktop,
    staticFileBasePath: `/api/computer/static/${id}`,
    isDynamicTheme: true,
    enableGitStatus:
      active &&
      isFilePreviewPanelOpen &&
      effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
      canUseFilePreview &&
      isAgentVersionControlEnabled(effectiveAgent?.enableVersionControl),
    enableVersionControl: effectiveAgent?.enableVersionControl,
    onSelectedFileMissing: (fileId?: string) => {
      // V2 工具详情点击打开的文件在文件树中找不到：按定调提示用户即可
      // （hook 回传的 id 带 workspace: 前缀，归一后再与点击目标比对）
      const relativeFileId = workspaceRelativePath(fileId || '');
      if (relativeFileId && toolResourceSelectRef.current === relativeFileId) {
        toolResourceSelectRef.current = '';
        antdMessage.error(t('PC.Pages.Chat.toolFileOpenMissing'));
      }
      setTaskAgentSelectedFileId('');
    },
    // 懒加载宿主：目标父目录已加载才允许「未命中判 miss」；父目录导航在途时
    // hook 保持等待（目录层到达后完成选中），修复嵌套文件打开竞态
    isAutoSelectDirectoryLoaded: (fileId: string) => {
      const parentPath = parentDirectory(workspaceRelativePath(fileId));
      if (openingTaskResultRef.current?.parent === parentPath) {
        return false;
      }
      return workspaceDirectoryFiles.loadedDirectoryPaths.has(parentPath);
    },
    /** 文件树选中文件时，关闭 Git 版本记录面板 */
    onFileSelectOpenPreview: () => {
      closeVersionPanelForFilePreviewRef.current();
    },
  });

  /**
   * 点击任务结果后直接搜索文件。
   * 命中且路径有上级目录时，打开该目录并加载这一层文件，再用搜索结果的 fileProxyUrl 预览。
   */
  const openSearchedTaskFileRef = useRef(fileView.tree.handleFileSelect);
  openSearchedTaskFileRef.current = fileView.tree.handleFileSelect;
  const loadTaskResultDirectoryRef = useRef(
    workspaceDirectoryFiles.loadDirectory,
  );
  loadTaskResultDirectoryRef.current = workspaceDirectoryFiles.loadDirectory;
  useEffect(() => {
    if (!id || taskAgentSelectTrigger === undefined) {
      return;
    }
    const relativePath = workspaceRelativePath(
      taskAgentSelectedFileIdRef.current,
    ).replace(/^\/+|\/+$/g, '');
    if (!relativePath) {
      return;
    }
    const parentPath = parentDirectory(relativePath);
    const trigger = taskAgentSelectTrigger;
    if (parentPath) {
      openingTaskResultRef.current = { parent: parentPath, trigger };
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiSearchFiles({
          cId: Number(id),
          kw: relativePath,
        });
        if (cancelled || result.code !== SUCCESS_CODE) {
          return;
        }
        const hit = findSearchFileByRelativePath(
          result.data?.files || [],
          relativePath,
        );
        if (!hit) {
          return;
        }
        const node = mapSearchFileToNode(hit, {
          toNodeId: workspaceNodeId,
          dataSourceId: WORKSPACE_SOURCE_ID,
        });
        const directoryPath = parentDirectory(
          node.relativePath || relativePath,
        );
        if (directoryPath) {
          await loadTaskResultDirectoryRef.current(directoryPath);
        }
        if (cancelled) {
          return;
        }
        await openSearchedTaskFileRef.current(node.id, {
          fallbackNode: node,
          selectFolder: node.type === 'folder',
        });
      } catch (error) {
        console.error('搜索任务结果文件失败', error);
      } finally {
        if (openingTaskResultRef.current?.trigger === trigger) {
          openingTaskResultRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, taskAgentSelectTrigger]);

  const [pendingWorkspaceSelectionId, setPendingWorkspaceSelectionId] =
    useState('');

  const openWorkspaceFile = useCallback(
    (fileId: string) => {
      const relativePath = workspaceRelativePath(fileId);
      const selectionId = workspaceNodeId(relativePath);
      setPendingWorkspaceSelectionId(selectionId);
      workspaceDirectoryFiles.navigate(parentDirectory(relativePath));
    },
    [workspaceDirectoryFiles.navigate],
  );

  useEffect(() => {
    if (
      !pendingWorkspaceSelectionId ||
      !workspaceDirectoryFiles.files.some(
        (file) => file.fileId === pendingWorkspaceSelectionId,
      )
    ) {
      return;
    }
    const selectionId = pendingWorkspaceSelectionId;
    setPendingWorkspaceSelectionId('');
    void fileView.tree.handleFileSelect(selectionId);
  }, [
    pendingWorkspaceSelectionId,
    workspaceDirectoryFiles.files,
    fileView.tree.handleFileSelect,
  ]);

  // 刷新 Git 列表
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
    // 独立预览占位时，「文件预览」入口 = 回到工作区文件树预览（不收起面板）：
    // 入口高亮态下若仅切换显隐，用户会一直停在独立预览里出不来
    if (externalPreviewFile) {
      setExternalPreviewFile(null);
      if (!isFileTreeVisible) {
        openPreviewView(id);
      }
      rememberWorkspaceView('filePreview');
      return;
    }

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
      rememberWorkspaceView('filePreview');
      return;
    }

    const openingFileTree = !isFileTreeVisible;
    const switchingToPreview = isFileTreeVisible && viewMode !== 'preview';

    handleFileTreeVisible();
    rememberWorkspaceView(
      openingFileTree || switchingToPreview ? 'filePreview' : 'closed',
    );

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
    externalPreviewFile,
    id,
    rememberWorkspaceView,
  ]);

  /** 打开 / 收起底部终端全屏（与文件预览、智能体电脑互斥） */
  const handleOpenTerminalPanel = useCallback(() => {
    // 终端挂在文件树面板内，先退出独立预览，否则点终端看不到终端
    exitExternalPreview();
    if (isTerminalPanelOpen) {
      setTerminalConsoleCollapseSignal((n) => n + 1);
      setTerminalConsoleLayoutMode('collapsed');
      rememberWorkspaceView('closed');
      return;
    }

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
    rememberWorkspaceView('terminal');
  }, [
    isTerminalPanelOpen,
    isFileTreeVisible,
    viewMode,
    id,
    openPreviewView,
    exitExternalPreview,
    rememberWorkspaceView,
  ]);

  /** 打开 / 切换智能体电脑（与文件预览、终端全屏互斥） */
  const handleOpenDesktopViewClick = useCallback(() => {
    // 云电脑渲染在文件树面板的预览区，先退出独立预览，否则点电脑看不到桌面
    exitExternalPreview();
    if (isTerminalPanelOpen) {
      setTerminalConsoleCollapseSignal((n) => n + 1);
    }
    setTerminalConsoleVisible(false);
    setTerminalConsoleCollapseSignal(0);
    setTerminalConsoleExpandSignal(0);
    setTerminalConsoleLayoutMode('collapsed');
    handleOpenDesktopView();
    const nextView =
      isFileTreeVisible && viewMode === 'desktop' ? 'closed' : 'desktop';
    rememberWorkspaceView(nextView);
    if (nextView === 'desktop') {
      conversationPageCacheManager.setSharedVncOwner(id);
    }
  }, [
    isTerminalPanelOpen,
    isFileTreeVisible,
    viewMode,
    handleOpenDesktopView,
    exitExternalPreview,
    rememberWorkspaceView,
    id,
  ]);

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

  /**
   * 常规项目（NormalProject）会话判定（含 conversationInfo 与路由 id 的守恒
   * 校验，防切换会话窗口期错配）：终端 URL 携带 service_type=
   * computer-normal-project，服务端/本机网关据此把终端初始目录落到 normalProject
   * 业务目录（云端 /home/user/normalProject/{pid}、本机镜像布局）。
   */
  const normalProjectConversation = isNormalProjectConversation(
    conversationInfo,
    id,
  );

  /** 终端 WebSocket 连接地址（ttyd） */
  const terminalWsUrl = useTerminalWsUrl(
    id,
    normalProjectConversation
      ? { serviceType: 'computer-normal-project' }
      : undefined,
  );

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!id) {
        return;
      }

      const gitignoreId = '.gitignore';
      // #5a 懒加载收尾：模型层不再全量拉树，.gitignore 现内容操作时按需拉取。
      // file-server 对「create 已存在文件」「modify 不存在文件」都是静默 no-op
      // 且返回成功，因此必须按三态严格路由：404→create、存在（含空文件）→modify、
      // 拉取失败→中止，否则会出现提示成功、条目未写入的假成功
      const plan = resolveGitignoreWritePlan(
        await fetchContentOutcome(`/api/computer/static/${id}/${gitignoreId}`),
        fileId,
      );

      if (plan.action === 'abort-fetch-error') {
        antdMessage.error(
          t('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
        );
        return;
      }
      if (plan.action === 'skip-duplicate') {
        antdMessage.info(
          t('PC.Pages.ConversationAgentSourceControl.alreadyInGitignore'),
        );
        return;
      }

      try {
        await apiUpdateStaticFile({
          cId: id,
          files: [
            {
              name: gitignoreId,
              contents: plan.contents,
              operation: plan.operation,
              binary: false,
              sizeExceeded: false,
              renameFrom: '',
              isDir: false,
            },
          ],
        });

        antdMessage.success(
          t('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await handleRefreshFileList(id);
        void refreshGitListRef.current?.();
      } catch (error) {
        console.error('Add to gitignore failed:', error);
      }
    },
    [id, handleRefreshFileList],
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
        openWorkspaceFile(fileId);
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

    // 触发链路选中工作区文件（TaskResult / markdown 链接 / 自动预览）时，
    // 工作区文件预览优先，退出独立预览
    exitExternalPreview();
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
    exitExternalPreview,
  ]);

  // 切换会话时，重置 Git 版本记录面板和终端状态
  useEffect(() => {
    setGitVersionPanelOpen(false);
    setTerminalConsoleVisible(false);
    setHasTerminalConsoleRendered(false);
    setTerminalConsoleLayoutMode('default');
    setTerminalConsoleExpandSignal(0);
    setTerminalConsoleCollapseSignal(0);
    setExternalPreviewFile(null);
    prevTaskAgentCollapseTriggerRef.current = undefined;
  }, [id]);

  const pendingWorkspaceRestoreRef = useRef<{
    key: string;
    view: 'desktop' | 'pagePreview';
  } | null>(null);
  const workspaceRestoreActionsRef = useRef({
    openPreviewView,
    openDesktopView: handleOpenDesktopView,
    openPagePreview: handleOpenPreview,
    setIsFileTreePinned,
  });
  workspaceRestoreActionsRef.current = {
    openPreviewView,
    openDesktopView: handleOpenDesktopView,
    openPagePreview: handleOpenPreview,
    setIsFileTreePinned,
  };

  const restoredWorkspaceKeyRef = useRef<string | null>(null);

  // 激活只更新当前页所有权；已有实例切回来沿用内存中的面板，不重复恢复初始视图。
  useEffect(() => {
    if (!active) return;
    const entry = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: id,
      agentId,
    });
    const deactivate = () =>
      conversationPageCacheManager.deactivate(pageCacheKey);
    if (restoredWorkspaceKeyRef.current === pageCacheKey) return deactivate;
    restoredWorkspaceKeyRef.current = pageCacheKey;
    const targetView = defaultFileTreeVisible ? 'filePreview' : entry.view;

    if (defaultFileTreeVisible && entry.view !== 'filePreview') {
      rememberWorkspaceView('filePreview');
    }
    pendingWorkspaceRestoreRef.current = null;
    if (targetView === 'filePreview') {
      workspaceRestoreActionsRef.current.openPreviewView(id);
      workspaceRestoreActionsRef.current.setIsFileTreePinned(true);
      return deactivate;
    }
    if (targetView === 'terminal') {
      setHasTerminalConsoleRendered(true);
      setTerminalConsoleVisible(true);
      setTerminalConsoleLayoutMode('expanded');
      setTerminalConsoleActiveTab('terminal');
      setTerminalConsoleExpandSignal((value) => value + 1);
      workspaceRestoreActionsRef.current.openPreviewView(id);
      return deactivate;
    }
    if (targetView === 'desktop' || targetView === 'pagePreview') {
      pendingWorkspaceRestoreRef.current = {
        key: pageCacheKey,
        view: targetView,
      };
    }
    return deactivate;
  }, [
    active,
    pageCacheKey,
    agentId,
    defaultFileTreeVisible,
    rememberWorkspaceView,
  ]);

  useEffect(() => {
    if (conversationInfo?.id === id) {
      conversationPageCacheManager.markConversationTaskStatus(
        id,
        conversationInfo.taskStatus,
      );
      if (freezeRouteLocation) {
        fullPageInstanceCacheManager.markStatus(
          id,
          conversationInfo.taskStatus,
        );
      }
    }
  }, [
    freezeRouteLocation,
    id,
    conversationInfo?.id,
    conversationInfo?.taskStatus,
  ]);

  // desktop/pagePreview 依赖异步到达的 agent/沙箱信息，仅消费当前 key 的待恢复任务一次。
  useEffect(() => {
    const pending = pendingWorkspaceRestoreRef.current;
    if (!pending || pending.key !== pageCacheKey || !effectiveAgent) return;

    pendingWorkspaceRestoreRef.current = null;
    if (pending.view === 'desktop') {
      if (finalSelectedId === '-1') {
        conversationPageCacheManager.setSharedVncOwner(id);
        workspaceRestoreActionsRef.current.openDesktopView();
      } else {
        rememberWorkspaceView('closed');
      }
      return;
    }
    workspaceRestoreActionsRef.current.openPagePreview(effectiveAgent, false);
  }, [pageCacheKey, effectiveAgent, finalSelectedId, rememberWorkspaceView]);

  useEffect(() => {
    conversationPageCacheManager.updateResources(pageCacheKey, {
      terminalMounted: hasTerminalConsoleRendered,
      terminalConnected:
        active && hasTerminalConsoleRendered && terminalConsoleVisible,
      pageIframeMounted: Boolean(pagePreviewData),
      desktopVisible: active && isFileTreeVisible && viewMode === 'desktop',
    });
  }, [
    active,
    pageCacheKey,
    hasTerminalConsoleRendered,
    terminalConsoleVisible,
    pagePreviewData,
    isFileTreeVisible,
    viewMode,
  ]);

  useEffect(() => {
    if (active && isFileTreeVisible && viewMode === 'desktop') {
      conversationPageCacheManager.setSharedVncOwner(id);
      fullPageInstanceCacheManager.setSharedVncOwner(id);
    } else if (
      !active &&
      conversationPageCacheManager.getSnapshot()
        .sharedVncOwnerConversationId === String(id)
    ) {
      conversationPageCacheManager.setSharedVncOwner(null);
    }
    if (
      !active &&
      fullPageInstanceCacheManager.getSnapshot()
        .sharedVncOwnerConversationId === String(id)
    ) {
      fullPageInstanceCacheManager.setSharedVncOwner(null);
    }
  }, [active, id, isFileTreeVisible, viewMode]);

  // 切换视图时，关闭 Git 版本记录面板
  useEffect(() => {
    if (viewMode === 'desktop') {
      setGitVersionPanelOpen(false);
    }
  }, [viewMode]);

  // 文件树 props
  const loadedWorkspaceFolderIds = useMemo(
    () =>
      new Set(
        [...workspaceDirectoryFiles.loadedDirectoryPaths]
          .filter(Boolean)
          .map(workspaceNodeId),
      ),
    [workspaceDirectoryFiles.loadedDirectoryPaths],
  );

  const chatFileTree: FileTreeContainerProps = useMemo(
    () => ({
      ...fileView.tree,
      loadedFolderIds: loadedWorkspaceFolderIds,
      loadingFolderIds: new Set(
        [...workspaceDirectoryFiles.loadingDirectoryPaths]
          .filter(Boolean)
          .map(workspaceNodeId),
      ),
      toolbarTitle: t('PC.Pages.Chat.fileTreeFiles'),
      onLoadDirectory: workspaceDirectoryFiles.loadDirectory,
      remoteFileSearch: id
        ? {
            cId: Number(id),
            toNodeId: workspaceNodeId,
            dataSourceId: WORKSPACE_SOURCE_ID,
          }
        : undefined,
      handleFileSelect: async (
        fileId: string,
        options?: { selectFolder?: boolean; fallbackNode?: FileNode },
      ) => {
        if (!options?.selectFolder) {
          setTaskAgentSelectedFileId('');
          setGitVersionPanelOpen(false);
          gitSourceControl.setSelectedChangeFile(null);
          collapseTerminalConsole();
        }
        // 搜索命中可能还没懒加载进树，先拉所在目录，避免随后同步树时把预览清掉
        const fallbackPath = options?.fallbackNode?.relativePath;
        if (
          options?.fallbackNode?.type === 'file' &&
          fallbackPath &&
          !options.selectFolder
        ) {
          await workspaceDirectoryFiles.loadDirectory(
            parentDirectory(fallbackPath),
          );
        }
        await fileView.tree.handleFileSelect(fileId, options);
      },
    }),
    [
      fileView.tree,
      id,
      loadedWorkspaceFolderIds,
      workspaceDirectoryFiles.loadingDirectoryPaths,
      workspaceDirectoryFiles.loadDirectory,
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
      visible={active && terminalConsoleVisible}
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
      // 桌面 VNC 是全局唯一连接；隐藏整页时让 FileTreePreviewPanel 卸载 iframe。
      viewMode: active ? viewMode : 'preview',
      hideDesktop: effectiveAgent?.hideDesktop,
      diffFile: gitSourceControl.selectedDiffFile,
      gitVersionPanelOpen,
      onToggleGitVersionPanel: handleToggleGitVersionPanel,
      bottomContent: terminalConsole,
      showSourceControl: isVersionControlEnabled,
      enableVersionControl: effectiveAgent?.enableVersionControl,
      gitVersionControl:
        isFilePreviewPanelOpen &&
        canUseFilePreview &&
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
      active,
      id,
      effectiveAgent?.hideDesktop,
      effectiveAgent?.type,
      effectiveAgent?.enableVersionControl,
      isVersionControlEnabled,
      canUseFilePreview,
      isFilePreviewPanelOpen,
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
    if (!active) return;
    // 单栏风格（style3）：侧边面板固定、滚动区域收敛在 page-container 内，
    // 不再拓宽 html（否则窗口窄于阈值时出现窗口级全局滚动条）
    if (document.body.classList.contains('xagi-nav-style3')) {
      document.documentElement.style.minWidth = 'unset';
      return;
    }
    // 移动端不设置最小宽度
    if (isMobile && !isFileTreeVisible) {
      document.documentElement.style.minWidth = 'unset';
      return;
    }
    // 设置最小宽度-扩展页面/文件树（智能体详情已改为悬浮弹窗，不再有侧栏占位档位）
    if (pagePreviewData || isFileTreeVisible) {
      document.documentElement.style.minWidth = '1660px';
    } else {
      document.documentElement.style.minWidth = '1200px';
    }
    return () => {
      document.documentElement.style.minWidth = 'unset';
    };
  }, [active, pagePreviewData, isFileTreeVisible, isMobile]);

  // 会话活跃口径：本地流式 + 后台 EXECUTING（chatSessionProps.isConversationActive 同一来源）
  const effectiveConversationActive =
    isConversationActive ||
    conversationInfo?.taskStatus === TaskStatus.EXECUTING;
  // 进度面板可用性：与胶囊组件同源纯选择器；有内容才渲染页头「会话进度」按钮，
  // running 只驱动按钮转圈，面板内状态以胶囊组件内部模型为准
  const capsuleModel = useMemo(
    () => selectProgressCapsule(messageList, effectiveConversationActive),
    [messageList, effectiveConversationActive],
  );
  const handleToggleCapsulePanel = useCallback(
    () => setCapsulePanelOpen((value) => !value),
    [],
  );
  const handleCloseCapsulePanel = useCallback(
    () => setCapsulePanelOpen(false),
    [],
  );
  // 进度面板节点：由页面层组装（数据/受控态/TaskAgent 门控），经 LeftContent 挂到
  // left 栏与 chat-section 平级——距栏顶/栏右等距（原先锚在 session-container，
  // 会多出 chat-section 的 padding-right 导致右边距偏大）
  const chatPaneCapsule =
    effectiveAgent?.type === AgentTypeEnum.TaskAgent ? (
      <ConversationProgressCapsule
        conversationId={id}
        messageList={messageList}
        active={effectiveConversationActive}
        enableVersionControl={
          isFilePreviewPanelOpen &&
          canUseFilePreview &&
          isAgentVersionControlEnabled(effectiveAgent?.enableVersionControl)
        }
        open={active && capsulePanelOpen}
        onClose={handleCloseCapsulePanel}
      />
    ) : null;

  // 聊天会话头部相关 props
  const headerProps = {
    showSidebar,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    createAppNewConversation,
    hideMenu: chromeFlags.hideMenu,
    hideNew: chromeFlags.hideNew,
    hideTitle: chromeFlags.hideTitle,
    hideTerminal: chromeFlags.hideTerminal,
    hideTree: chromeFlags.hideTree,
    agentId,
    conversationInfo,
    setConversationInfo,
    isEnableSubscription,
    setOpenPaymentModal,
    isAgentDetailModalOpen,
    handleOpenAgentDetail: () => setIsAgentDetailModalOpen(true),
    // 会话进度面板（TaskAgent）：有内容才显示页头按钮，运行中按钮转圈
    hasCapsuleContent: capsuleModel !== null,
    capsuleRunning: capsuleModel?.running ?? false,
    isCapsulePanelOpen: capsulePanelOpen,
    handleToggleCapsulePanel,
    closePreviewView: handleClosePreviewView,
    handleOpenPreview,
    isShowFilePanel,
    showFilePreview: canUseFilePreview,
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
    // 会话内搜索：当前会话 + 已有会话记录（本会话发过消息，或打开旧会话已加载出消息）
    searchConversationId: conversationInfo?.id ?? null,
    searchHasMessages: hasUserSentMessage || messageList.length > 0,
  };

  // 聊天会话相关 props
  // 渲染线（V2 双线重构）：URL 调试覆盖 > 默认 V2，与数据线正交
  const { renderer: conversationRendererVersion } =
    useConversationRendererPreference();
  // 双线分派（docs/conversation/conversation-dual-track-plan.md）：flag 开启时新线 session 的
  // 会话面 props 覆盖旧线字段；flag 关闭（默认）时 conversationProps 为空对象，
  // 旧线路径原值原行为。runtimeLine 已在产物入口判断前创建。

  const fetchMentionFiles = useCallback(async (): Promise<
    FileMentionItem[]
  > => {
    if (!id) return [];
    const response = await apiGetStaticFileList(id, {
      relativePath: '',
      recursive: true,
      type: 'file',
      limit: 100,
    });
    if (response.code !== SUCCESS_CODE) throw new Error('会话文件列表加载失败');
    return (response.data?.files ?? [])
      .filter((file) => !file.isDir)
      .map((file) => ({
        kind: 'file',
        relativePath: file.name,
        name: file.name.split('/').pop() || file.name,
      }));
  }, [id]);

  /**
   * V2 工具详情资源点击：文件 → 打开预览面板（与 FINAL_RESULT task-result
   * 文件自动打开同链路：开面板 + 设选中 + 触发器）；URL → 新窗口。
   * 工作区外沙箱文件（桌面等）→ 独立预览面板（customTargetDir 锚定家目录，
   * 云端会话放开为后端契约）。路径不属于当前会话/无法解析时按定调直接 toast
   * 提示，不做其他兜底。
   */
  const handleOpenToolResource = (resource: ConversationToolResource) => {
    if (resource.kind === 'url') {
      void openKnownBusinessRouteWindow(resource.target);
      return;
    }
    if (resource.kind !== 'file') {
      return;
    }
    const currentId = id?.toString() || '';
    const decision = resolveSandboxFileOpen(resource.target, currentId);
    if (decision.type === 'reject') {
      antdMessage.error(
        t(
          decision.reason === 'not-in-conversation'
            ? 'PC.Pages.Chat.toolFileOpenNotInConversation'
            : 'PC.Pages.Chat.toolFileOpenUnsupportedPath',
        ),
      );
      return;
    }
    openPreviewView(currentId);
    if (decision.type === 'open-external') {
      // 清工作区自动选中，右侧面板切换为独立预览
      toolResourceSelectRef.current = '';
      setTaskAgentSelectedFileId('');
      setExternalPreviewFile({
        cId: Number(currentId),
        targetDir: decision.targetDir,
        relativePath: decision.relativePath,
      });
      return;
    }
    exitExternalPreview();
    // 记录本次点击目标：文件树拉取完成后仍找不到时由 onSelectedFileMissing 提示
    toolResourceSelectRef.current = decision.relativePath;
    setTaskAgentSelectedFileId(decision.relativePath);
    setTaskAgentSelectTrigger(Date.now());
  };

  const chatSessionProps = {
    onFetchMentionFiles:
      id && effectiveAgent?.type === AgentTypeEnum.TaskAgent
        ? fetchMentionFiles
        : undefined,
    conversationId: id,
    messageList,
    messageRenderer: conversationRendererVersion,
    onOpenToolResource: handleOpenToolResource,
    roleInfo,
    isLoading: loadingConversation,
    loadingMore,
    isMoreMessage,
    // 流式输出中 + 后台 taskStatus 执行中，驱动停止按钮与「智能体执行中」提示
    isConversationActive: effectiveConversationActive,
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
      enableVersionControl: effectiveAgent?.enableVersionControl,
    },
    onSendMessage: handleMessageSend,
    onClear: showClearContext && !chromeFlags.hideNew ? handleClear : undefined,
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
    restoreConversationSandbox: true,
    onComputerSelect: setSelectedComputerId,
    showScrollBtn,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
    readonly: !effectiveAgent?.allowPrivateSandbox,
    enableMention:
      effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
      // allowAtSkill 兼容数字/字符串 1（后端两种形态都可能返回）
      Number(effectiveAgent?.allowAtSkill) === 1,
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

  const isBlockingLoading = clearLoading || loadingAsync;
  if (!isBlockingLoading) hasRenderedChatRef.current = true;

  // 首次进入尚无可展示内容时使用整页 Loading；之后切会话改用覆盖层，避免卸载缓存实例。
  // 不要把 loadingConversation 算进来：流式恢复若误走 runAsync，会反复遮挡执行中内容。
  if (isBlockingLoading && !hasRenderedChatRef.current) {
    return (
      <div className={cx(styles['chat-loading-container'])}>
        <LoadingOutlined />
      </div>
    );
  }

  // 是否展开视图
  const isExpandedView = !!(pagePreviewData || isFileTreeVisible);
  const isPagePreviewVisible = Boolean(pagePreviewData && !isFileTreeVisible);
  const pagePreviewContent = pagePreviewData ? (
    <>
      <PagePreviewIframe
        pagePreviewData={pagePreviewData}
        showHeader={true}
        onClose={handleHidePagePreview}
        showCloseButton={!effectiveAgent?.hideChatArea}
        titleClassName={cx(styles['title-style'])}
        showCopyButton={showCopyButton}
        allowCopy={effectiveAgent?.allowCopy === AllowCopyEnum.Yes}
        onCopyClick={() => setOpenCopyModal(true)}
        copyButtonText={t('PC.Pages.Chat.copyTemplate')}
        copyButtonClassName={styles['copy-btn']}
      />
      {showCopyButton && effectiveAgent && pagePreviewData.uri && (
        <CopyToSpaceComponent
          spaceId={effectiveAgent.spaceId}
          mode={AgentComponentTypeEnum.Page}
          componentId={parsePageAppProjectId(pagePreviewData.uri)}
          title={''}
          open={active && openCopyModal}
          isTemplate={true}
          onSuccess={(_: any, targetSpaceId: number) => {
            setOpenCopyModal(false);
            jumpToPageDevelop(targetSpaceId);
          }}
          onCancel={() => setOpenCopyModal(false)}
        />
      )}
    </>
  ) : null;
  const pagePreviewCache = (
    <ConversationInstanceCacheSlot
      activeKey={pageCacheKey}
      active={isPagePreviewVisible}
      retain={Boolean(pagePreviewData)}
      testId="conversation-page-preview-cache"
    >
      {pagePreviewContent}
    </ConversationInstanceCacheSlot>
  );

  return (
    <div
      className={cx(styles['chat-root'])}
      data-nuwaclaw-perf-scope="chat-root"
    >
      {isBlockingLoading && (
        <div className={cx(styles['chat-loading-overlay'])}>
          <LoadingOutlined />
        </div>
      )}
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
                  pageCacheKey={pageCacheKey}
                  isFileTreeVisible={isFileTreeVisible}
                  effectiveAgent={effectiveAgent}
                  isAppSidebarMode={isAppSidebarMode}
                  headerProps={headerProps}
                  chatSessionProps={chatSessionProps}
                  fileSidebarProps={fileSidebarProps}
                  externalFilePreview={externalPreviewFile}
                  onExternalFilePreviewBack={exitExternalPreview}
                  chatPaneCapsule={chatPaneCapsule}
                />
              )
            }
            rightHidden={!isPagePreviewVisible}
            right={pagePreviewCache}
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
                  pageCacheKey={pageCacheKey}
                  isFileTreeVisible={isFileTreeVisible}
                  effectiveAgent={effectiveAgent}
                  isAppSidebarMode={isAppSidebarMode}
                  headerProps={headerProps}
                  chatSessionProps={chatSessionProps}
                  fileSidebarProps={fileSidebarProps}
                  externalFilePreview={externalPreviewFile}
                  onExternalFilePreviewBack={exitExternalPreview}
                  chatPaneCapsule={chatPaneCapsule}
                />
              </div>
            )}
            <div
              style={{
                display: isPagePreviewVisible ? 'block' : 'none',
                flex: '1',
                minWidth: 0,
              }}
            >
              {pagePreviewCache}
            </div>
          </div>
        )}
      </div>
      {/* 智能体详情悬浮弹窗：与文件树/终端/云电脑面板共存，不再互斥 */}
      <AgentDetailModal
        open={active && isAgentDetailModalOpen}
        onClose={() => setIsAgentDetailModalOpen(false)}
        agentId={agentId}
        loading={loadingConversation}
        agentDetail={effectiveAgent}
      />
      {/*展示台区域*/}
      <ShowArea />

      <ConditionRender
        condition={showPayment && isEnableSubscription && !isAppSidebarMode}
      >
        {/* 付费订阅套餐弹窗 */}
        <PaymentSubscriptionModal
          open={active && openPaymentModal}
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

/**
 * 普通路由和内嵌宿主沿用全局 model；未包局部 Provider 时隐藏即卸载，
 * 防止后台 SSE、轮询及 cleanup 改写当前页。客户端常驻入口另用 CachedChatPage。
 */
export const ChatCore: React.FC<ChatCoreProps> = ({
  active = true,
  ...props
}) => (active ? <ChatCoreInner {...props} /> : null);

/** 商业客户端的会话实例：独立 model 和固定路由快照随宿主实例存活。 */
export const CachedChatPage: React.FC<ClientConversationPageInstanceProps> = ({
  route,
  active,
}) => {
  // 同 key 回访仍复用首次实例；后续导航 state/query 不得重放首条消息或改写渲染偏好。
  const initialRouteRef = useRef(route);
  const initialRoute = initialRouteRef.current;
  return (
    <ConversationPagePathnameContext.Provider value={initialRoute.pathname}>
      <ConversationRendererRouteSearchContext.Provider
        value={initialRoute.search}
      >
        <ConversationPageModelProvider>
          <div
            style={{ display: active ? 'contents' : 'none' }}
            aria-hidden={!active}
          >
            <ChatCoreInner
              id={initialRoute.conversationId}
              agentId={Number(initialRoute.params.agentId)}
              initialLocationState={initialRoute.state}
              freezeRouteLocation
              routeLocationSnapshot={initialRoute}
              active={active}
              enableDevTargetRedirect
            />
          </div>
        </ConversationPageModelProvider>
      </ConversationRendererRouteSearchContext.Provider>
    </ConversationPagePathnameContext.Provider>
  );
};

const ChatPage: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const { registerClientConversationRenderer } = useModel('appTabKeepAlive');
  const keepAliveEnabled = useStyle3PcKeepAliveEnabled();
  const isCacheableRoute =
    keepAliveEnabled &&
    // 仅主壳的 /home/chat 有常驻宿主；独立 /app/chat 必须在自身 Outlet 渲染。
    location.pathname === `/home/chat/${params.id}/${params.agentId}` &&
    /^\d+$/.test(String(params.id ?? '')) &&
    /^\d+$/.test(String(params.agentId ?? '')) &&
    Number(params.id) > 0 &&
    Number(params.agentId) > 0;
  useLayoutEffect(() => {
    if (isCacheableRoute) {
      registerClientConversationRenderer('conversation', CachedChatPage);
    }
  }, [isCacheableRoute, registerClientConversationRenderer]);
  if (isCacheableRoute) return null;
  return (
    <ChatCore
      id={Number(params.id)}
      agentId={Number(params.agentId)}
      locationState={location.state}
      showSidebar={true}
      showPayment={true}
      enableResizable={true}
      // 独立路由页启用项目型会话直开兜底跳转（内嵌宿主不传，默认 false）
      enableDevTargetRedirect
    />
  );
};

export default ChatPage;
