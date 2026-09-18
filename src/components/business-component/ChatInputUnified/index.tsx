import SvgIcon from '@/components/base/SvgIcon';
import {
  PLAN_MODE_ENABLED,
  type AgentMode,
} from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import {
  ChatInputVoiceFooter,
  mergeVoiceTranscript,
} from '@/components/business-component/VoiceInput';
import type { CapabilityTypeEnum } from '@/components/ChatInputHome/CapabilityModal/types';
import ComputerTypeSelector from '@/components/ChatInputHome/ComputerTypeSelector';
import styles from '@/components/ChatInputHome/index.less';
import ManualComponentItem from '@/components/ChatInputHome/ManualComponentItem';
import MentionEditor, {
  DEFAULT_CAPABILITY_RESOURCE_TYPES,
} from '@/components/ChatInputHome/MentionEditor';
import type {
  ExpertMentionInfo,
  FetchMentionFiles,
  MentionEditorHandle,
  MentionItem,
} from '@/components/ChatInputHome/MentionPopup/types';
import ModelSelector from '@/components/ChatInputHome/ModelSelector';
import SpaceSelector from '@/components/ChatInputHome/SpaceSelector';
import { useSlashPlugins } from '@/components/ChatInputHome/useSlashPlugins';
import WorkspaceDirPickerModal from '@/components/ChatInputHome/WorkspaceDirPickerModal';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import PermissionMask from '@/components/PermissionMask';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ENABLE_CHAT_MESSAGE_QUEUE } from '@/constants/feature.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { selectSessionActive } from '@/features/conversation/domain/runtimeSelectors';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { useChatboxAgentConfig } from '@/hooks/useChatboxAgentConfig';
import useSubscription from '@/hooks/useSubscription';
import { t } from '@/services/i18nRuntime';
import { apiConnectorProviderPageList } from '@/services/systemManage';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { UploadFileStatus } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { handleUploadFileList } from '@/utils/upload';
import {
  ArrowDownOutlined,
  BranchesOutlined,
  CloseOutlined,
  DesktopOutlined,
  DownOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  HistoryOutlined,
  LinkOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RightOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Dropdown,
  message,
  Switch,
  Tooltip,
  Upload,
  UploadProps,
} from 'antd';
import classNames from 'classnames';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import ConversationCacheDebugFab from './ConversationCacheDebugFab';
import ConversationDebugFab from './ConversationDebugFab';
import {
  clearDraft,
  loadDraft,
  resolveDraftSurface,
  saveDraft,
} from './draftStorage';

const cx = classNames.bind(styles);

const VoiceFooter = ChatInputVoiceFooter;

/**
 * 召唤专家 chip 展示信息（首页场景：以该专家智能体身份创建会话；
 * iconSrc 为经 useAuthProtectedImageSrc 鉴权解析后的地址，加载失败隐藏）
 */
export interface SummonedExpertChipInfo {
  agentId: number;
  name: string;
  iconSrc?: string;
}

/** 已连接连接器展示信息（工具栏头像组） */
interface ConnectedConnectorInfo {
  key: string;
  name: string;
  icon?: string;
}

/** 连接器头像底色板（与能力弹窗卡片 ICON_BACKGROUNDS 同风格 tint） */
const CONNECTOR_AVATAR_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

/** 连接器头像：受保护地址经 Bearer 解析，公开 URL 直出；空/失败回退名称首字 */
const ConnectorAvatar: React.FC<{
  connector: ConnectedConnectorInfo;
  index: number;
}> = ({ connector, index }) => {
  const { displaySrc } = useAuthProtectedImageSrc(connector.icon);
  return (
    <Avatar
      src={displaySrc}
      className={cx(styles['connector-avatar'])}
      style={{
        backgroundColor:
          CONNECTOR_AVATAR_BACKGROUNDS[
            index % CONNECTOR_AVATAR_BACKGROUNDS.length
          ],
      }}
    >
      {connector.name.charAt(0)}
    </Avatar>
  );
};

/**
 * ChatInputUnified 组件的 Props 类型
 * 将原 ChatInputHome 中 useModel('conversationInfo') 的数据改为外部传入，
 * 实现组件独立性，避免与 model 强关联。
 */
export interface ChatInputUnifiedProps {
  // ===== 原 ChatInputHome 的受控属性 =====
  className?: React.CSSProperties;
  wholeDisabled?: boolean;
  clearDisabled?: boolean;
  clearLoading?: boolean;
  showClearIcon?: boolean;
  visible?: boolean;
  isClearInput?: boolean;
  onScrollBottom?: () => void;
  onClear?: () => void;
  onEnter: (
    message: string,
    files: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    agentMode?: AgentMode,
    selectedDocs?: SelectedDocInfo[],
    expertComponents?: AgentSelectedComponentInfo[],
  ) => void;
  enableMention?: boolean;
  onFetchMentionFiles?: FetchMentionFiles;
  mentionPlacement?: 'auto' | 'up' | 'down';
  showAnnouncement?: boolean;
  onTempChatStop?: (requestId: string) => void;
  loadingStopTempConversation?: boolean;
  showTaskAgentToggle?: boolean;
  isTaskAgentActive?: boolean;
  onToggleTaskAgent?: () => void;
  selectedComputerId?: string;
  onComputerSelect?: (id: string) => void;
  /**
   * 发起会话时选择的工作目录（仅个人电脑场景）：
   * 不传 onWorkspaceDirChange 时工作目录栏不渲染
   */
  workspacePath?: string;
  onWorkspaceDirChange?: (dir: string) => void;
  /** 禁用个人电脑（如全栈应用等类型）：电脑选择锁定云端、工作目录栏隐藏 */
  disablePersonalComputer?: boolean;
  /** 是否展示空间选择器（首页创建项目类推荐时使用） */
  showSpaceSelector?: boolean;
  selectedSpaceId?: number;
  onSpaceSelect?: (spaceId: number) => void;
  /** 推荐标签 pill：选中后内联展示在输入框行首，可取消 */
  selectedTag?: { label: string };
  onClearSelectedTag?: () => void;
  /**
   * 首页项目上框（项目列表「+ 新建会话」透传）：输入卡底部灰底栏展示绑定项目
   * （图标 + 名称，可删除）。存在期间工作区/沙箱由项目隐含，
   * 隐藏工作目录栏与电脑选择器。
   */
  pinnedProject?: {
    /** 项目名称 */
    name: string;
    /** 项目类型（UserApp=全栈 / NormalProject=常规，悬停提示用） */
    projectType: AgentComponentTypeEnum;
    /** 项目图标 URL（可为受保护地址，展示走 useAuthProtectedImageSrc） */
    icon?: string;
  };
  /** 移除项目上框（恢复首页默认形态） */
  onClearPinnedProject?: () => void;
  /** 会话调试悬浮按钮（会话页默认展示；首页等场景传 false 关闭） */
  showDebugFab?: boolean;
  /**
   * / 能力弹窗是否开放「专家」类型（产品策略：选择专家仅首页开放；
   * 默认 false 仅隐藏入口，专家选中链路 expertComponents 保持可用）
   */
  showExpertCapability?: boolean;
  /**
   * @ 弹层首页模式：@ 触发「专家（便捷视图）+ 资料库（最近访问）」弹层
   * （与 showExpertCapability 同为首页场景开放；缺省按数据源回落会话页
   * 模式：上下文文件 + 资料库）
   */
  atHomePanel?: boolean;
  /**
   * 草稿缓存作用域 key：默认按当前会话 id 持久化；
   * 首页等无会话场景传固定 key（如 'home'）即可启用草稿
   */
  draftKey?: string;
  /** 召唤专家回执 chip（首页场景：提交时以该专家 agentId 创建会话） */
  summonedExpert?: SummonedExpertChipInfo;
  onClearSummonedExpert?: () => void;
  /**
   * 首页场景：能力弹窗选中专家 = 切换会话智能体（清掉分类/推荐所选，
   * 提交时以专家 agentId 走会话创建）。提供本回调时专家选中不再走内部
   * expertComponents（消息级组件）通道；会话页不传，保持消息级语义。
   */
  onExpertAgentSelect?: (expert: ExpertMentionInfo) => void;
  agentId?: number;
  agentSandboxId?: string | number;
  fixedSelection?: boolean;
  hasPermission?: boolean;
  isSandboxUnavailable?: boolean;
  readonly?: boolean;
  maskText?: string;
  autoSelectComputer?: boolean;
  saveComputerOnSelect?: boolean;
  /**
   * 严格绑定模式（首页）：沙箱选择按 agent 绑定——切换后显示该 agent 自己的
   * 记忆（未绑定过回落云端默认），不继承上一个 agent 的选择；默认 false 保持既有行为
   */
  strictAgentMemory?: boolean;
  isPersonalComputer?: boolean;
  allowOtherModel?: DefaultSelectedEnum;
  selectedModelId?: number;
  onModelSelect?: (modelId: number) => void;
  agentType?: string;
  agentMode?: AgentMode;
  onAgentModeChange?: (mode: AgentMode) => void;
  /** agent 侧版本管理开关，作为会话框配置（chatbox.config）未配置过时的默认值 */
  agentEnableVersionControl?: DefaultSelectedEnum;
  placeholder?: string;
  defaultMentions?: MentionItem[];
  tabsSlot?: React.ReactNode;
  usageScenarios?: any[];
  manualComponents?: any[];
  selectedComponentList?: any[];
  onSelectComponent?: (infos: any) => void;
  prefix?: React.ReactNode;
  /** 演示模式：语音输入走本地模拟，不访问麦克风与 STT（示例页用） */
  voiceInputMock?: boolean;

  // ===== 原 useModel('conversationInfo') 数据，改为从外部传入 =====
  /** 停止会话的异步函数 */
  runStopConversation?: (id: string) => Promise<any>;
  /** 用户点击「停止」主动中止会话时的回调（用于暂停队列自动消费） */
  onUserStopConversation?: () => void;
  /** 停止会话接口的加载状态 */
  loadingStopConversation?: boolean;
  /** 获取当前会话 ID */
  getCurrentConversationId?: () => number | null;
  /** 获取当前会话请求 ID */
  getCurrentConversationRequestId?: () => string;
  /** 会话是否正在活跃（SSE 流式交互中） */
  isConversationActive?: boolean;
  /** 强制将会话设置为非活跃状态 */
  disabledConversationActive?: () => void;
  /** 当前消息列表 */
  messageList?: MessageInfo[];
  /** 会话消息加载中状态 */
  loadingConversation?: boolean;
  /** 其它接口加载中状态（用于禁用发送按钮） */
  isLoadingOtherInterface?: boolean;
  /** 当前会话详情 */
  conversationInfo?: ConversationInfo | null;
}

/** 组件 ref 协议：外部清空/聚焦输入（首页切推荐/分类时使用） */
export interface ChatInputUnifiedRef {
  focus: () => void;
  clear: () => void;
}

/**
 * 统一聊天输入组件
 * 与原 ChatInputHome 功能完全一致，但 conversationInfo model 数据全部从外部 props 传入，
 * 实现与 model 的解耦；会话页（UnifiedChatSession）与首页（/home）共用本组件，
 * 会话态（停止/队列/草稿按会话）与首页态（工作目录/空间/推荐标签/召唤专家）由 props 按需启用。
 */
const ChatInputUnifiedImpl: React.FC<
  ChatInputUnifiedProps & {
    forwardedRef?: React.ForwardedRef<ChatInputUnifiedRef>;
  }
> = ({
  className,
  wholeDisabled = false,
  clearDisabled = false,
  clearLoading = false,
  showClearIcon = true,
  onEnter,
  visible,
  selectedComponentList,
  onSelectComponent,
  onClear,
  isClearInput = true,
  manualComponents,
  onScrollBottom,
  showAnnouncement = false,
  onTempChatStop,
  loadingStopTempConversation,
  showTaskAgentToggle = false,
  isTaskAgentActive = false,
  onToggleTaskAgent,
  selectedComputerId,
  onComputerSelect,
  workspacePath,
  onWorkspaceDirChange,
  disablePersonalComputer = false,
  showSpaceSelector = false,
  selectedSpaceId,
  onSpaceSelect,
  selectedTag,
  onClearSelectedTag,
  pinnedProject,
  onClearPinnedProject,
  showDebugFab = true,
  showExpertCapability = false,
  atHomePanel = false,
  draftKey,
  summonedExpert,
  onClearSummonedExpert,
  onExpertAgentSelect,
  agentId,
  agentSandboxId,
  fixedSelection,
  hasPermission = true,
  isSandboxUnavailable = false,
  maskText,
  autoSelectComputer,
  saveComputerOnSelect,
  strictAgentMemory,
  isPersonalComputer,
  readonly,
  enableMention = true,
  onFetchMentionFiles,
  mentionPlacement = 'auto',
  placeholder,
  defaultMentions,
  allowOtherModel,
  selectedModelId,
  onModelSelect,
  agentType,
  tabsSlot,
  prefix,
  voiceInputMock = false,
  agentMode = 'yolo',
  onAgentModeChange,
  agentEnableVersionControl,
  usageScenarios,

  // 原 useModel('conversationInfo') 数据
  runStopConversation,
  onUserStopConversation,
  loadingStopConversation = false,
  getCurrentConversationId,
  getCurrentConversationRequestId,
  isConversationActive = false,
  disabledConversationActive,
  messageList = [],
  loadingConversation = false,
  isLoadingOtherInterface = false,
  conversationInfo,
  forwardedRef,
}) => {
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  const {
    createSubscriptionOrder,
    querySkillSubscriptionPlans,
    loadingTargetPricing,
    targetSubscriptionPlans,
    mySubscriptionInfo,
    loadingMySubscription,
  } = useSubscription();

  // + 号弹层内审批/版本管理/自动提交开关：服务端 chatbox.config.{agentId} 持久化，
  // mode 的单一真源仍在宿主（agentMode 受控 props），此处只做回填同步与写入
  const {
    enableVersionControl: versionControlEnabled,
    autoCommit: autoCommitEnabled,
    setMode: setChatboxMode,
    setEnableVersionControl,
    setAutoCommit,
  } = useChatboxAgentConfig({
    agentId,
    defaultEnableVersionControl:
      agentEnableVersionControl === DefaultSelectedEnum.Yes ? 1 : 0,
    agentMode,
    onAgentModeChange,
  });

  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [messageInfo, setMessageInfo] = useState<string>('');
  const [skillIds, setSkillIds] = useState<number[]>([]);
  // 资料库（空间文档仓库）已选文档：编辑器 chip 派生（增删/清空自动同步），随消息以 selectedDocs 发送
  const [selectedDocs, setSelectedDocs] = useState<SelectedDocInfo[]>([]);
  // 已选专家（单选，pill 即唯一事实源）：随消息合并进 selectedComponents(Agent)；
  // 附 name 供工具栏回填 pill 展示
  const [expertComponents, setExpertComponents] = useState<
    (AgentSelectedComponentInfo & {
      name: string;
      icon: string;
      description: string;
      defaultSelected: DefaultSelectedEnum;
    })[]
  >([]);
  const [isStoppingConversation, setIsStoppingConversation] =
    useState<boolean>(false);
  const mentionEditorRef = useRef<MentionEditorHandle>(null);
  // 已连接连接器（服务端过滤，与能力弹窗连接器页签同域）：
  // 工具栏头像组数据源；弹窗内连接/断开后经 onCapabilityModalClose 刷新
  const [connectedConnectors, setConnectedConnectors] = useState<
    ConnectedConnectorInfo[]
  >([]);
  const refreshConnectedConnectors = useCallback(async () => {
    try {
      // 服务端过滤已连接：connected=true，一次拉全量
      const res = await apiConnectorProviderPageList({
        connected: 'true',
        pageNum: 1,
        pageSize: 9999,
      });
      if (res?.code !== SUCCESS_CODE) return;
      const list = (res.data?.records as ConnectorProviderInfo[] | null) || [];
      setConnectedConnectors(
        list.map((item) => ({
          key: String(item.service ?? item.id),
          name: item.displayName || item.service || '',
          icon: item.icon,
        })),
      );
    } catch {
      // 静默失败：头像组非关键路径，不阻断输入
    }
  }, []);
  useEffect(() => {
    refreshConnectedConnectors();
  }, [refreshConnectedConnectors]);
  // 工作目录浏览弹窗（env-bar「打开电脑文件夹」入口）
  const [workspacePathPickerOpen, setWorkspaceDirPickerOpen] = useState(false);
  // 项目上框图标（可能为 /api/f/ 受保护地址，走鉴权 fetch + blob）
  const pinnedProjectIcon = useAuthProtectedImageSrc(pinnedProject?.icon);

  // 行首回执 pill 行（专家/召唤专家/首页项目类型）实测宽度：
  // 编辑器 inlinePrefixWidth 让输入文本缩进到 pill 之后（仅首行缩进）
  const inputPrefixPillRowRef = useRef<HTMLDivElement>(null);
  const [inputPrefixPillRowWidth, setInputPrefixPillRowWidth] =
    useState<number>(0);
  // 任一回执 pill 存在即启用行首占位（三者业务上互斥，防御性共存则横向排列）
  const hasInputPrefixPill = !!(
    expertComponents.length > 0 ||
    summonedExpert ||
    selectedTag?.label
  );
  const inputPrefixPillOffset = hasInputPrefixPill
    ? inputPrefixPillRowWidth + 8
    : 0;

  // 行首回执 pill 随编辑器内部滚动同步上移：pill 是绝对定位浮层，首行
  // 滚出可视区时一并滚出，避免长文本滚动后的正文压住 pill；直改 DOM
  // 不走 state（滚动高频触发，避免整输入框重渲染）
  const handleEditorScroll = useCallback((scrollTop: number) => {
    const pillRow = inputPrefixPillRowRef.current;
    if (!pillRow) {
      return;
    }
    pillRow.style.transform =
      scrollTop > 0 ? `translateY(-${scrollTop}px)` : '';
  }, []);

  useLayoutEffect(() => {
    if (!hasInputPrefixPill || !inputPrefixPillRowRef.current) {
      setInputPrefixPillRowWidth(0);
      return;
    }

    const pillRowElement = inputPrefixPillRowRef.current;
    const updatePillRowWidth = () => {
      setInputPrefixPillRowWidth(pillRowElement.offsetWidth);
    };

    updatePillRowWidth();

    if (typeof ResizeObserver === 'undefined') {
      const frameId = window.requestAnimationFrame(updatePillRowWidth);
      return () => window.cancelAnimationFrame(frameId);
    }

    const resizeObserver = new ResizeObserver(updatePillRowWidth);
    resizeObserver.observe(pillRowElement);

    return () => resizeObserver.disconnect();
  }, [hasInputPrefixPill]);

  useImperativeHandle(forwardedRef, () => ({
    focus: () => {
      mentionEditorRef.current?.focus?.();
    },
    clear: () => {
      mentionEditorRef.current?.clear?.();
    },
  }));

  const [isHoveringBtn, setIsHoveringBtn] = useState<boolean>(false);
  const [delayedVisible, setDelayedVisible] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (visible || isHoveringBtn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDelayedVisible(true);
    } else {
      timerRef.current = setTimeout(() => {
        setDelayedVisible(false);
      }, 300);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, isHoveringBtn]);

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  useEffect(() => {
    setFiles(
      uploadFiles.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      ),
    );
  }, [uploadFiles]);

  const disabledSend = useMemo(() => {
    return !messageInfo && !files?.length;
  }, [messageInfo, files]);

  /**
   * 会话活跃态：上层传入的流式/任务信号 + messageList 末条 Loading 兜底
   * 与 ChatInputHome 的 streamActive 逻辑对齐，避免上层漏传时停止按钮不显示
   */
  const isSessionActive = useMemo(
    () =>
      selectSessionActive(
        isConversationActive,
        messageList,
        conversationInfo?.taskStatus,
      ),
    [isConversationActive, messageList, conversationInfo?.taskStatus],
  );

  useEffect(() => {
    if (!isSessionActive) {
      setIsStoppingConversation(false);
    }
  }, [isSessionActive]);

  // 本输入框所属会话 id（发送清草稿 / 队列编辑回填过滤 / 草稿缓存共用；
  // 须先于 confirmSendMessage 定义，ref 供其读取当前值）
  const ownConversationId =
    getCurrentConversationId?.() ?? conversationInfo?.id ?? null;
  const ownConversationIdRef = useRef(ownConversationId);
  ownConversationIdRef.current = ownConversationId;

  // 草稿作用域：会话页面地址 × 会话 id（2026-09-15 定调「结合会话页面地址」）——
  // 同一会话在不同路由面（/home/chat 会话页、/agent 智能体面板、/space 全栈 IDE）
  // 各自独立草稿互不串扰；首页等无会话场景由 draftKey 指定（如 'home'）
  const location = useLocation();
  const draftScope =
    draftKey ??
    (ownConversationId !== null
      ? `${resolveDraftSurface(location.pathname)}:${ownConversationId}`
      : null);
  // 发送后草稿已消费：卸载兜底跳过回写（isClearInput=false 时输入仍在，
  // 不把已发送内容重新落成草稿）；后续再次编辑会复位该标记
  const draftConsumedRef = useRef(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmSendMessage = (value: string) => {
    if (!!value.trim() || !!files?.length) {
      onEnter(
        value,
        files,
        skillIds,
        selectedModelId,
        agentMode,
        selectedDocs,
        expertComponents,
      );
      // 已发送内容不再是草稿：无论 isClearInput 与否都清除（isClearInput=false
      // 时输入保留供失败重试，但草稿已消费，卸载兜底不再回写旧内容）
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
      draftConsumedRef.current = true;
      const scope = draftScope;
      if (scope) {
        clearDraft(scope);
      }
      if (isClearInput) {
        setUploadFiles([]);
        setMessageInfo('');
        setSkillIds([]);
        setSelectedDocs([]);
        setExpertComponents([]);
        mentionEditorRef.current?.clear();
      }
    }
  };

  const handleSendMessage = () => {
    if (
      disabledSend ||
      wholeDisabled ||
      loadingConversation ||
      isLoadingOtherInterface ||
      // 队列关闭时，会话活跃期间禁止点击发送（仅保留停止）
      (!ENABLE_CHAT_MESSAGE_QUEUE && isSessionActive)
    ) {
      return;
    }
    confirmSendMessage(messageInfo);
  };

  const handlePressEnter = () => {
    // 中止会话过程中不能触发 enter
    if (isStoppingConversation) {
      return;
    }
    // 队列关闭时，会话活跃期间拦截回车（无队列入队能力，由 trySend 乐观锁兜底）
    if (!ENABLE_CHAT_MESSAGE_QUEUE && isSessionActive) {
      return;
    }
    confirmSendMessage(messageInfo);
  };

  const applyServerUploadResult = useCallback(
    (fileInfo: UploadFileInfo, result: any): UploadFileInfo => {
      const data = result.data || {};
      return {
        ...fileInfo,
        status: UploadFileStatus.done,
        percent: 100,
        url: data?.url || '',
        key: data?.key || '',
        name: data?.fileName || fileInfo.name,
        type: data?.mimeType || fileInfo.type,
        response: result,
      };
    },
    [],
  );

  const handleDelFile = (uid: string) => {
    setUploadFiles((uploadFiles) =>
      uploadFiles.filter((item) => item.uid !== uid),
    );
  };

  const extractClipboardFiles = useCallback(
    (clipboardData: DataTransfer | null): File[] => {
      if (!clipboardData?.items) {
        return [];
      }
      const files: File[] = [];
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      return files;
    },
    [],
  );

  const getDefaultFileName = useCallback((file: File, index: number) => {
    if (file.type.startsWith('image/')) {
      return t(
        'PC.Components.ChatInputHome.pastedImageFileName',
        Date.now(),
        index + 1,
      );
    }
    return t(
      'PC.Components.ChatInputHome.pastedFileName',
      Date.now(),
      index + 1,
    );
  }, []);

  const uploadFilesToServer = useCallback(
    async (filesToUpload: File[]) => {
      if (wholeDisabled || !filesToUpload.length) {
        return;
      }

      const newUploadFiles: UploadFileInfo[] = filesToUpload.map(
        (file, index) => ({
          uid: uuidv4(),
          name: file.name || getDefaultFileName(file, index),
          size: file.size,
          type: file.type,
          url: '',
          status: UploadFileStatus.uploading,
          percent: 0,
          originFileObj: file,
        }),
      );

      setUploadFiles((prev) => [
        ...prev,
        ...handleUploadFileList(newUploadFiles),
      ]);

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const uploadFile = newUploadFiles[i];

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'tmp');

          const response = await fetch(UPLOAD_FILE_ACTION, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: formData,
          });

          const result = await response.json();

          if (result.code === SUCCESS_CODE && result.data) {
            setUploadFiles((prev) =>
              prev.map((item) =>
                item.uid === uploadFile.uid
                  ? applyServerUploadResult(item, result)
                  : item,
              ),
            );
          } else {
            throw new Error(result.message || 'Upload failed');
          }
        } catch (error) {
          console.error('File upload failed:', error);
          message.error(
            t(
              'PC.Components.ChatInputHome.uploadFailedWithName',
              uploadFile.name,
            ),
          );

          setUploadFiles((prev) =>
            prev.map((item) =>
              item.uid === uploadFile.uid
                ? {
                    ...item,
                    status: UploadFileStatus.error,
                    percent: 0,
                  }
                : item,
            ),
          );
        }
      }
    },
    [applyServerUploadResult, getDefaultFileName, token, wholeDisabled],
  );

  /**
   * + 菜单附件上传：beforeUpload 接管式——antd Upload 仅作文件选择器
   * （return false 阻止其内置 XHR），文件统一走 uploadFilesToServer。
   * 不能改回 action 上传：Upload 挂在 Dropdown 菜单项内，点菜单项弹层
   * 即关闭，内置上传的成功回调在已关闭的弹层里找不到文件列表会静默
   * 丢弃 done 状态，导致附件上传成功后永远 loading。
   */
  const handleBeforeUpload: UploadProps['beforeUpload'] = useCallback(
    (file: Parameters<NonNullable<UploadProps['beforeUpload']>>[0]) => {
      uploadFilesToServer([file]);
      return false;
    },
    [uploadFilesToServer],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (wholeDisabled) {
        return;
      }
      const pastedFiles = extractClipboardFiles(e.clipboardData);
      if (!pastedFiles.length) {
        return;
      }
      e.preventDefault();
      await uploadFilesToServer(pastedFiles);
    },
    [extractClipboardFiles, uploadFilesToServer, wholeDisabled],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (wholeDisabled || !e.dataTransfer.types.includes('Files')) {
        return;
      }
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [wholeDisabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (wholeDisabled) {
        return;
      }
      e.dataTransfer.dropEffect = 'copy';
    },
    [wholeDisabled],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (wholeDisabled) {
        return;
      }

      const droppedFiles = Array.from(e.dataTransfer.files || []);
      if (droppedFiles.length) {
        await uploadFilesToServer(droppedFiles);
      }
    },
    [uploadFilesToServer, wholeDisabled],
  );

  const handleClear = () => {
    if (clearDisabled || wholeDisabled) {
      return;
    }
    disabledConversationActive?.();
    onClear?.();
  };

  const handleStopConversation = useCallback(async () => {
    if (isStoppingConversation) {
      return;
    }
    setIsStoppingConversation(true);

    const requestId = getCurrentConversationRequestId?.() ?? '';
    const conversationId = getCurrentConversationId?.() ?? null;

    if (onTempChatStop && requestId) {
      onTempChatStop(requestId);
    } else if (conversationId && runStopConversation) {
      // 停止的是当前会话：暂停队列自动消费，避免停止后立即发送下一条排队消息。
      // 仅真实会话停止才暂停；临时会话（onTempChatStop）停止与本会话队列无关。
      onUserStopConversation?.();
      runStopConversation(conversationId.toString());
    }
  }, [
    isStoppingConversation,
    getCurrentConversationRequestId,
    getCurrentConversationId,
    runStopConversation,
    onTempChatStop,
    onUserStopConversation,
  ]);

  const getButtonTooltip = () => {
    if (wholeDisabled) {
      return t('PC.Components.ChatInputHome.conversationDisabled');
    }
    if (disabledSend) {
      return t('PC.Components.ChatInputHome.enterQuestion');
    }
    if (isSessionActive) {
      return t('PC.Components.ChatInputHome.clickStopConversation');
    }
    return t('PC.Components.ChatInputHome.clickSendMessage');
  };

  const getStopButtonTooltip = () => {
    if (conversationInfo?.taskStatus === TaskStatus.EXECUTING) {
      if (
        isStoppingConversation ||
        loadingStopConversation ||
        loadingStopTempConversation
      ) {
        return t('PC.Components.ChatInputHome.stoppingTask');
      }
      return t('PC.Components.ChatInputHome.clickStopAgentTask');
    }

    if (!isSessionActive) {
      return t('PC.Components.ChatInputHome.noActiveConversation');
    }
    if (
      isStoppingConversation ||
      loadingStopConversation ||
      loadingStopTempConversation
    ) {
      return t('PC.Components.ChatInputHome.stoppingConversation');
    }
    return t('PC.Components.ChatInputHome.clickStopConversation');
  };

  useEffect(() => {
    return () => {
      disabledConversationActive?.();
      setUploadFiles([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 输入草稿缓存（按「会话页面地址 × 会话 id」持久化，切回/刷新后恢复） =====
  // 最新输入镜像：卸载兜底落盘用（节流定时器可能尚未触发）
  const draftStateRef = useRef({ text: messageInfo, skillIds });
  draftStateRef.current = { text: messageInfo, skillIds };
  // 草稿落盘文本镜像：mention chip 剥离后的纯文本（编辑器挂载后 DOM 直读）。
  // chip 无法跨刷新/切换还原成 chip，序列化残留的 @/ 名称字面量会污染
  // 恢复后的输入框——技能 chip 一并不再随草稿持久化
  const draftTextRef = useRef(messageInfo);
  useEffect(() => {
    draftTextRef.current =
      mentionEditorRef.current?.getPlainText?.() ?? messageInfo;
  }, [messageInfo]);
  // 状态文本当前归属的作用域：仅恢复 effect 建立新作用域时更新——节流落盘前
  // 校验，防「作用域已切换、文本仍旧会话」的过渡渲染把旧内容写进新桶
  const draftStateScopeRef = useRef<string | null>(null);
  // 上一个作用域标记：区分「首挂恢复」（输入为空才回填，不覆盖队列编辑回填）
  // 与「同实例切换会话」（旧内容属于旧会话，无条件切到新草稿）
  const lastDraftScopeRef = useRef<string | null>(null);
  // 恢复：进入会话回填草稿。切换会话（同一实例换了作用域）时旧内容不属于新
  // 会话，无条件由新草稿接管（空草稿=清空输入，防旧会话内容落入新桶）。
  // 编辑器聚焦态下外部 value 通道会被 MentionEditor 聚焦守卫拦截，DOM 直达
  // 走 setEditorText（onChange 回传保持受控 value 一致）
  useEffect(() => {
    if (!draftScope) return;
    if (lastDraftScopeRef.current === draftScope) return;
    const isScopeSwitch = lastDraftScopeRef.current !== null;
    lastDraftScopeRef.current = draftScope;
    // 作用域建立（含无草稿场景：此后输入的文本即归属本作用域）
    draftStateScopeRef.current = draftScope;
    const draft = loadDraft(draftScope);
    const text = draft?.text ?? '';
    if (isScopeSwitch) {
      // 技能 chip 不随草稿持久化（无法还原成 chip）：切换会话直接清空，
      // 避免上一会话技能作为不可见附件带入新会话
      setSkillIds([]);
      setMessageInfo(text);
      mentionEditorRef.current?.setEditorText?.(text);
      return;
    }
    // 首挂：输入为空才回填草稿，不覆盖已开始的输入（含队列编辑回填内容）
    if (!draftStateRef.current.text && text) {
      mentionEditorRef.current?.setEditorText?.(text);
    }
  }, [draftScope]);

  // 节流写回：输入 / 技能选择变化 ~1s 后落盘
  useEffect(() => {
    if (!draftScope) return;
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }
    draftConsumedRef.current = false;
    draftSaveTimerRef.current = setTimeout(() => {
      draftSaveTimerRef.current = null;
      if (draftConsumedRef.current) return;
      // 过渡渲染余波：文本仍属旧作用域时不落盘（恢复 effect 接管后会再触发）
      if (draftStateScopeRef.current !== draftScope) return;
      saveDraft(draftScope, {
        version: 1,
        text: draftTextRef.current,
      });
    }, 1000);
    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
    };
  }, [messageInfo, skillIds, draftScope]);

  // 卸载兜底：离开会话时把当前输入立即落盘（发送成功路径已在 confirmSendMessage 清除草稿）
  useEffect(() => {
    if (!draftScope) return;
    const scope = draftScope;
    return () => {
      if (draftConsumedRef.current) return;
      const text = draftTextRef.current;
      // 卸载兜底只补写、不删除：teardown 阶段镜像可能已被次生效应清空
      // （过渡期 model 复位/二次 teardown 等），空值落盘会误删已持久化的
      // 草稿（2026-09-15 实测切会话 100% 复现丢失）；用户真正清空输入由
      // 1s 节流的空值落盘负责删键
      if (!text.trim()) return;
      saveDraft(scope, { version: 1, text });
    };
  }, [draftScope]);

  // 监听队列消息编辑回填（含 skillIds / modelId / agentMode 快照）
  useEffect(() => {
    const handleEditMessage = ({
      text,
      files: editFiles,
      skillIds: editSkillIds,
      modelId: editModelId,
      selectedAgentMode: editAgentMode,
      conversationId: targetConversationId,
    }: {
      text: string;
      files?: UploadFileInfo[];
      skillIds?: number[];
      modelId?: number;
      selectedAgentMode?: AgentMode;
      conversationId?: number | string;
    }) => {
      if (
        targetConversationId !== undefined &&
        targetConversationId !== null &&
        String(targetConversationId) !== String(ownConversationIdRef.current)
      ) {
        return;
      }
      setMessageInfo((prev) => (prev ? `${prev}\n${text}` : text));
      if (editFiles?.length) {
        setUploadFiles((prev) => [...prev, ...editFiles]);
      }
      if (editSkillIds?.length) {
        setSkillIds(editSkillIds);
      }
      if (editModelId !== undefined) {
        onModelSelect?.(editModelId);
      }
      if (editAgentMode !== undefined) {
        onAgentModeChange?.(editAgentMode);
      }
    };
    eventBus.on(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
    return () =>
      eventBus.off(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
  }, [onModelSelect, onAgentModeChange]);

  const { onPluginSelect, commandManualComponents } = useSlashPlugins(
    manualComponents,
    selectedComponentList,
    onSelectComponent,
  );

  // 能力弹窗开放范围：默认不含专家（仅首页经 showExpertCapability 开放）；
  // 智能体 allowAtSkill 非 1（enableMention=false）时收敛技能维度
  // （/ 技能弹层与能力弹窗技能入口一并屏蔽）
  const capabilityResourceTypes = useMemo<CapabilityTypeEnum[]>(() => {
    const types: CapabilityTypeEnum[] = showExpertCapability
      ? [...DEFAULT_CAPABILITY_RESOURCE_TYPES, 'expert']
      : [...DEFAULT_CAPABILITY_RESOURCE_TYPES];
    return enableMention ? types : types.filter((type) => type !== 'skill');
  }, [showExpertCapability, enableMention]);

  /** 资料库文档 chip 派生（编辑器内容变化自动同步，替代此前的单选追加） */
  const handleDocsChange = useCallback((docs: SelectedDocInfo[]) => {
    setSelectedDocs(docs);
  }, []);

  /** 专家选中（单选）：组为 Agent 组件整体替换（会话仅一个专家，
   * 随消息合并进 selectedComponents，工具栏 pill 回填展示） */
  const handleExpertSelect = useCallback((expert: ExpertMentionInfo) => {
    setExpertComponents([
      {
        id: expert.targetId,
        type: AgentComponentTypeEnum.Agent,
        name: expert.name,
        icon: expert.icon ?? '',
        description: expert.description ?? '',
        defaultSelected: DefaultSelectedEnum.No,
      },
    ]);
  }, []);

  const handleUnsubscribedSkillSelect = useCallback(
    (item: MentionItem) => {
      // 订阅拦截只关乎技能 chip（资料库文档无付费语义）
      const isSkill = item.kind !== 'file' && item.kind !== 'doc';
      if (
        !isSkill ||
        !isEnableSubscription ||
        !item.paymentRequired ||
        item.subscribed
      ) {
        return;
      }
      querySkillSubscriptionPlans(item.targetId);
      setOpenPaymentModal(true);
    },
    [isEnableSubscription, querySkillSubscriptionPlans],
  );

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div
        className={cx(styles['chat-container'], 'flex', 'flex-col', {
          [styles['drag-over']]: isDragging,
          [styles['has-tabs']]: !!tabsSlot,
        })}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ConditionRender condition={isDragging}>
          <div className={cx(styles['drag-overlay'])}>
            {t('PC.Components.ChatInputHome.dropFilesHint')}
          </div>
        </ConditionRender>
        <PermissionMask
          visible={!hasPermission || isSandboxUnavailable}
          text={
            maskText ??
            (!hasPermission
              ? t('PC.Components.ChatInputHome.noAgentPermission')
              : t('PC.Components.ChatInputHome.agentComputerUnavailable'))
          }
        />

        {/* 会话调试悬浮按钮：收纳「会话密度」「会话显示」两个调试入口（首页等场景关闭） */}
        {showDebugFab && (
          <ConversationDebugFab conversationId={ownConversationId} />
        )}

        {/* 页面缓存遥测独立悬浮按钮：LRU 实例 + 执行中实例（TODO 上线前随调试入口统一移除） */}
        {showDebugFab && <ConversationCacheDebugFab />}

        {tabsSlot && (
          <div className={cx(styles['tabs-wrapper'])}>{tabsSlot}</div>
        )}

        <div className={cx(styles['input-wrapper'])}>
          <ConditionRender condition={uploadFiles?.length}>
            <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
          </ConditionRender>
          {/* 输入行：专家/首页项目类型回执 pill 内联在输入框最前面，
              编辑器文本经 inlinePrefixWidth 缩进到 pill 之后 */}
          <div className={cx(styles['input-line'])}>
            {hasInputPrefixPill && (
              <div
                ref={inputPrefixPillRowRef}
                className={cx(styles['input-prefix-pills'])}
              >
                {/* 已选专家回填（会话场景）：会话仅一个专家，pill 即唯一事实源；
                    与首页 summonedExpert 互斥不共存 */}
                {expertComponents.length > 0 && (
                  <span
                    className={cx(
                      'flex',
                      'items-center',
                      styles['expert-pill'],
                    )}
                  >
                    <span className={cx(styles['expert-pill-name'])}>
                      {expertComponents[0].name}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t('PC.Common.Global.delete')}
                      className={cx(styles['expert-pill-remove'])}
                      onClick={() => setExpertComponents([])}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpertComponents([]);
                        }
                      }}
                    >
                      <CloseOutlined />
                    </span>
                  </span>
                )}

                {/* 召唤专家回执 chip（首页场景）：提交时以该专家智能体身份
                    创建会话；可取消回落原智能体 */}
                {summonedExpert && (
                  <span
                    className={cx(
                      'flex',
                      'items-center',
                      styles['expert-pill'],
                    )}
                  >
                    {summonedExpert.iconSrc && (
                      <img
                        src={summonedExpert.iconSrc}
                        alt=""
                        className={cx(styles['expert-pill-icon'])}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className={cx(styles['expert-pill-name'])}>
                      {summonedExpert.name}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t('PC.Common.Global.delete')}
                      className={cx(styles['expert-pill-remove'])}
                      onClick={onClearSummonedExpert}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onClearSummonedExpert?.();
                        }
                      }}
                    >
                      <CloseOutlined />
                    </span>
                  </span>
                )}

                {/* 推荐类型选中回执 pill（首页场景）：关闭走原 onClearSelectedTag
                    逻辑（上层清 selectedRecommend 并清空输入） */}
                {!!selectedTag?.label && (
                  <span
                    className={cx(
                      'flex',
                      'items-center',
                      styles['expert-pill'],
                    )}
                  >
                    <span className={cx(styles['expert-pill-name'])}>
                      {selectedTag.label}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t('PC.Common.Global.delete')}
                      className={cx(styles['expert-pill-remove'])}
                      onClick={onClearSelectedTag}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onClearSelectedTag?.();
                        }
                      }}
                    >
                      <CloseOutlined />
                    </span>
                  </span>
                )}
              </div>
            )}
            <MentionEditor
              onPluginSelect={onPluginSelect}
              onFetchMentionFiles={onFetchMentionFiles}
              ref={mentionEditorRef}
              className={cx(styles.input)}
              disabled={wholeDisabled}
              value={messageInfo}
              // 行首回执 pill 占位：输入文本缩进到 pill 之后
              inlinePrefixWidth={inputPrefixPillOffset}
              // pill 浮层随编辑器滚动同步上移（见 handleEditorScroll）
              onEditorScroll={handleEditorScroll}
              onChange={setMessageInfo}
              onSkillIdsChange={setSkillIds}
              enableMention={enableMention}
              capabilityResourceTypes={capabilityResourceTypes}
              atHomePanel={atHomePanel}
              onDocsChange={handleDocsChange}
              // 能力弹窗关闭：刷新已连接连接器（弹窗内连接/断开就绪）
              onCapabilityModalClose={refreshConnectedConnectors}
              // 首页场景专家选中走外部（切换会话智能体）；否则走内部消息级 expertComponents
              onExpertSelect={onExpertAgentSelect ?? handleExpertSelect}
              mentionPlacement={mentionPlacement}
              onPressEnter={handlePressEnter}
              onPaste={handlePaste}
              placeholder={placeholder}
              defaultMentions={defaultMentions}
              enableSubscription={isEnableSubscription}
              onUnsubscribedSkillSelect={handleUnsubscribedSkillSelect}
              usageScenarios={usageScenarios}
            />
          </div>
          <VoiceFooter.Provider
            disabled={
              wholeDisabled ||
              isSessionActive ||
              loadingConversation ||
              isLoadingOtherInterface ||
              isStoppingConversation
            }
            mock={voiceInputMock}
            onFill={(text) =>
              setMessageInfo((prev) => mergeVoiceTranscript(prev, text))
            }
            onSend={(text) =>
              confirmSendMessage(mergeVoiceTranscript(messageInfo, text))
            }
          >
            {(isVoiceActive) => (
              <>
                <footer
                  className={cx('flex', 'flex-1', styles.footer, {
                    [styles['footer-voice-active']]: isVoiceActive,
                  })}
                >
                  {/* + 号聚合菜单：附件上传 / @ 上下文 / / 能力（原独立入口收进此处） */}
                  <VoiceFooter.HideWhenActive>
                    <Dropdown
                      trigger={['click']}
                      placement="topLeft"
                      overlayClassName={cx(styles['plus-menu-overlay'])}
                      menu={{
                        items: [
                          {
                            key: 'attachment',
                            label: (
                              <Upload
                                disabled={wholeDisabled}
                                beforeUpload={handleBeforeUpload}
                                multiple={true}
                                showUploadList={false}
                              >
                                <span
                                  className={cx(
                                    'flex',
                                    'items-center',
                                    styles['plus-menu-label'],
                                  )}
                                >
                                  <span className={styles['trigger-pill']}>
                                    <PaperClipOutlined />
                                  </span>
                                  {t('PC.Components.ChatInputHome.attachFile')}
                                </span>
                              </Upload>
                            ),
                          },
                          {
                            key: 'at-context',
                            // 无文件数据源时保持可点击：插入 @ 作普通文本，
                            // 检测层发现无数据源自然不弹提示框
                            disabled: wholeDisabled,
                            label: (
                              <span
                                className={cx(
                                  'flex',
                                  'items-center',
                                  styles['plus-menu-label'],
                                )}
                              >
                                <span className={styles['trigger-pill']}>
                                  @
                                </span>
                                {t('PC.Components.ChatInputHome.atContext')}
                              </span>
                            ),
                            onClick: () =>
                              mentionEditorRef.current?.insertTriggerText('@'),
                          },
                          // 「/ 能力」项：智能体 allowAtSkill 非 1 时隐藏
                          //（/ 技能弹层同步屏蔽）
                          ...(enableMention
                            ? [
                                {
                                  key: 'slash-capability',
                                  disabled: wholeDisabled,
                                  label: (
                                    <span
                                      className={cx(
                                        'flex',
                                        'items-center',
                                        styles['plus-menu-label'],
                                      )}
                                    >
                                      <span className={styles['trigger-pill']}>
                                        /
                                      </span>
                                      {t(
                                        'PC.Components.ChatInputHome.slashCapability',
                                      )}
                                    </span>
                                  ),
                                  onClick: () =>
                                    mentionEditorRef.current?.insertTriggerText(
                                      '/',
                                    ),
                                },
                              ]
                            : []),
                          {
                            key: 'connector',
                            disabled: wholeDisabled,
                            label: (
                              <span
                                className={cx(
                                  'flex',
                                  'items-center',
                                  styles['plus-menu-label'],
                                )}
                              >
                                <span className={styles['trigger-pill']}>
                                  <LinkOutlined />
                                </span>
                                {t(
                                  'PC.Components.ChatInputHome.plusMenuConnector',
                                )}
                                <RightOutlined
                                  className={cx(styles['plus-menu-arrow'])}
                                />
                              </span>
                            ),
                            onClick: () =>
                              mentionEditorRef.current?.openCapabilityWithType?.(
                                'connector',
                              ),
                          },
                          { type: 'divider', key: 'plus-menu-divider' },
                          {
                            // 开关行：点击整行切换并阻止菜单收起
                            // （Switch 设为 pointer-events:none 纯展示，交互统一由行承接）
                            key: 'version-control',
                            label: (
                              <div
                                className={cx(
                                  'flex',
                                  'items-center',
                                  'justify-between',
                                  styles['plus-menu-switch-row'],
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!wholeDisabled && !isSessionActive) {
                                    setEnableVersionControl(
                                      !versionControlEnabled,
                                    );
                                  }
                                }}
                              >
                                <span
                                  className={cx(
                                    'flex',
                                    'items-center',
                                    styles['plus-menu-label'],
                                  )}
                                >
                                  <span className={styles['trigger-pill']}>
                                    <HistoryOutlined />
                                  </span>
                                  {t(
                                    'PC.Components.ChatInputHome.versionControlSwitch',
                                  )}
                                </span>
                                <Switch
                                  checked={versionControlEnabled === 1}
                                  disabled={wholeDisabled || isSessionActive}
                                  aria-label={t(
                                    'PC.Components.ChatInputHome.versionControlSwitch',
                                  )}
                                />
                              </div>
                            ),
                          },
                          // 变更自动提交行仅在产物版本管理开启时出现
                          ...(versionControlEnabled === 1
                            ? [
                                {
                                  key: 'auto-commit',
                                  label: (
                                    <div
                                      className={cx(
                                        'flex',
                                        'items-center',
                                        'justify-between',
                                        styles['plus-menu-switch-row'],
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !wholeDisabled &&
                                          !isSessionActive
                                        ) {
                                          setAutoCommit(!autoCommitEnabled);
                                        }
                                      }}
                                    >
                                      <span
                                        className={cx(
                                          'flex',
                                          'items-center',
                                          styles['plus-menu-label'],
                                        )}
                                      >
                                        <span
                                          className={styles['trigger-pill']}
                                        >
                                          <BranchesOutlined />
                                        </span>
                                        {t(
                                          'PC.Components.ChatInputHome.autoCommitSwitch',
                                        )}
                                      </span>
                                      <Switch
                                        checked={autoCommitEnabled === 1}
                                        disabled={
                                          wholeDisabled || isSessionActive
                                        }
                                        aria-label={t(
                                          'PC.Components.ChatInputHome.autoCommitSwitch',
                                        )}
                                      />
                                    </div>
                                  ),
                                },
                              ]
                            : []),
                          {
                            key: 'approval-mode',
                            label: (
                              <div
                                className={cx(
                                  'flex',
                                  'items-center',
                                  'justify-between',
                                  styles['plus-menu-switch-row'],
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!wholeDisabled && !isSessionActive) {
                                    setChatboxMode(
                                      agentMode === 'ask' ? 'yolo' : 'ask',
                                    );
                                  }
                                }}
                              >
                                <span
                                  className={cx(
                                    'flex',
                                    'items-center',
                                    styles['plus-menu-label'],
                                  )}
                                >
                                  <span className={styles['trigger-pill']}>
                                    <SafetyOutlined />
                                  </span>
                                  {t(
                                    'PC.Components.ChatInputHome.approvalModeSwitch',
                                  )}
                                </span>
                                <Switch
                                  checked={agentMode === 'ask'}
                                  disabled={wholeDisabled || isSessionActive}
                                  aria-label={t(
                                    'PC.Components.ChatInputHome.approvalModeSwitch',
                                  )}
                                />
                              </div>
                            ),
                          },
                          ...(PLAN_MODE_ENABLED
                            ? [
                                {
                                  key: 'plan-mode',
                                  label: (
                                    <div
                                      className={cx(
                                        'flex',
                                        'items-center',
                                        'justify-between',
                                        styles['plus-menu-switch-row'],
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !wholeDisabled &&
                                          !isSessionActive
                                        ) {
                                          setChatboxMode(
                                            agentMode === 'plan'
                                              ? 'yolo'
                                              : 'plan',
                                          );
                                        }
                                      }}
                                    >
                                      <span
                                        className={cx(
                                          'flex',
                                          'items-center',
                                          styles['plus-menu-label'],
                                        )}
                                      >
                                        <span
                                          className={styles['trigger-pill']}
                                        >
                                          <FileTextOutlined />
                                        </span>
                                        {t(
                                          'PC.Components.ChatInputHome.agentModePlan',
                                        )}
                                      </span>
                                      <Switch
                                        checked={agentMode === 'plan'}
                                        disabled={
                                          wholeDisabled || isSessionActive
                                        }
                                        aria-label={t(
                                          'PC.Components.ChatInputHome.agentModePlan',
                                        )}
                                      />
                                    </div>
                                  ),
                                },
                              ]
                            : []),
                        ],
                      }}
                    >
                      <Tooltip
                        title={t('PC.Components.ChatInputHome.plusMenu')}
                      >
                        <span
                          className={cx(
                            'flex',
                            'items-center',
                            'content-center',
                            'cursor-pointer',
                            styles.box,
                            styles['plus-box'],
                            { [styles.disabled]: wholeDisabled },
                          )}
                        >
                          <PlusOutlined className={cx(styles['svg-icon'])} />
                        </span>
                      </Tooltip>
                    </Dropdown>
                  </VoiceFooter.HideWhenActive>

                  {!!messageList?.filter((item: MessageInfo) => item.id)
                    ?.length && (
                    <ConditionRender condition={showClearIcon && !!onClear}>
                      <Tooltip
                        title={t('PC.Components.ChatInputHome.clearRecord')}
                      >
                        <span
                          className={cx(
                            styles.clear,
                            'flex',
                            'items-center',
                            'content-center',
                            'cursor-pointer',
                            styles.box,
                            styles['plus-box'],
                            {
                              [styles.disabled]:
                                clearDisabled || wholeDisabled || clearLoading,
                            },
                          )}
                          onClick={handleClear}
                        >
                          {clearLoading ? (
                            <LoadingOutlined />
                          ) : (
                            <SvgIcon
                              name="icons-chat-clear"
                              style={{ fontSize: '14px' }}
                              className={cx(styles['svg-icon'])}
                            />
                          )}
                        </span>
                      </Tooltip>
                    </ConditionRender>
                  )}

                  {/* 审批模式回执 pill：开启审批时显示在 + 号旁，x 关闭即切回自动 */}
                  <VoiceFooter.HideWhenActive>
                    {agentMode === 'ask' && (
                      <Tooltip
                        title={t(
                          'PC.Components.ChatInputHome.agentModeApprovalDesc',
                        )}
                      >
                        <span
                          className={cx(
                            'flex',
                            'items-center',
                            styles['approval-pill'],
                            {
                              [styles.disabled]:
                                wholeDisabled || isSessionActive,
                            },
                          )}
                        >
                          {/* 图标槽：默认盾牌，hover 时切换为关闭 x（CSS 显隐切换） */}
                          <span
                            className={cx(
                              'flex',
                              'items-center',
                              'justify-center',
                              styles['approval-pill-icon-slot'],
                            )}
                          >
                            <SafetyOutlined
                              className={cx(styles['approval-pill-icon'])}
                            />
                            <CloseOutlined
                              className={cx(styles['approval-pill-close'])}
                              onClick={() => {
                                if (!wholeDisabled && !isSessionActive) {
                                  setChatboxMode('yolo');
                                }
                              }}
                            />
                          </span>
                          <span>
                            {t('PC.Components.ChatInputHome.agentModeApproval')}
                          </span>
                        </span>
                      </Tooltip>
                    )}
                  </VoiceFooter.HideWhenActive>
                  <VoiceFooter.HideWhenActive>
                    {PLAN_MODE_ENABLED && agentMode === 'plan' && (
                      <Tooltip
                        title={t(
                          'PC.Components.ChatInputHome.agentModePlanDesc',
                        )}
                      >
                        <span
                          className={cx(
                            'flex',
                            'items-center',
                            styles['approval-pill'],
                            {
                              [styles.disabled]:
                                wholeDisabled || isSessionActive,
                            },
                          )}
                        >
                          <span
                            className={cx(
                              'flex',
                              'items-center',
                              'justify-center',
                              styles['approval-pill-icon-slot'],
                            )}
                          >
                            <FileTextOutlined
                              className={cx(styles['approval-pill-icon'])}
                            />
                            <CloseOutlined
                              className={cx(styles['approval-pill-close'])}
                              onClick={() => {
                                if (!wholeDisabled && !isSessionActive) {
                                  setChatboxMode('yolo');
                                }
                              }}
                            />
                          </span>
                          <span>
                            {t('PC.Components.ChatInputHome.agentModePlan')}
                          </span>
                        </span>
                      </Tooltip>
                    )}
                  </VoiceFooter.HideWhenActive>
                  <VoiceFooter.HideWhenActive>
                    {showTaskAgentToggle && (
                      <Tooltip
                        title={
                          isTaskAgentActive
                            ? t(
                                'PC.Components.ChatInputHome.switchToNormalMode',
                              )
                            : t(
                                'PC.Components.ChatInputHome.useAgentComputerTask',
                              )
                        }
                      >
                        <span
                          className={cx(
                            'flex',
                            'items-center',
                            'content-center',
                            'cursor-pointer',
                            styles.box,
                            styles['plus-box'],
                            styles['task-agent-box'],
                            {
                              [styles['task-agent-active']]: isTaskAgentActive,
                            },
                          )}
                          onClick={onToggleTaskAgent}
                        >
                          <DesktopOutlined style={{ fontSize: '14px' }} />
                        </span>
                      </Tooltip>
                    )}
                  </VoiceFooter.HideWhenActive>

                  {/* 专家/召唤专家/推荐类型回执 pill 已上框：内联至输入框最前面
                      （input-line 行首），不再占位工具栏 */}

                  {/* 已连接连接器头像组（重叠，最多 3 个，超出尾部 +N）：
                      点击唤起能力弹窗并定位连接器页签；数据在弹窗关闭后刷新。
                      ChatBot 类型智能体不展示（未传 agentType 的普通入口不受影响） */}
                  {agentType !== AgentTypeEnum.ChatBot &&
                    connectedConnectors.length > 0 && (
                      <VoiceFooter.HideWhenActive>
                        <Tooltip
                          title={t(
                            'PC.Components.ChatInputHome.connectedConnectors',
                          )}
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={t(
                              'PC.Components.ChatInputHome.connectedConnectors',
                            )}
                            className={cx(
                              'flex',
                              'items-center',
                              styles['connector-group'],
                            )}
                            onClick={() =>
                              mentionEditorRef.current?.openCapabilityWithType?.(
                                'connector',
                                // 头像组入口专用：初始进入「已连接」聚合页签
                                { connectedView: true },
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                mentionEditorRef.current?.openCapabilityWithType?.(
                                  'connector',
                                  { connectedView: true },
                                );
                              }
                            }}
                          >
                            <Avatar.Group maxCount={3} size={20}>
                              {connectedConnectors.map((connector, index) => (
                                <ConnectorAvatar
                                  key={connector.key}
                                  connector={connector}
                                  index={index}
                                />
                              ))}
                            </Avatar.Group>
                          </span>
                        </Tooltip>
                      </VoiceFooter.HideWhenActive>
                    )}

                  <VoiceFooter.HideWhenActive>
                    <ManualComponentItem
                      manualComponents={commandManualComponents}
                      selectedComponentList={selectedComponentList}
                      onSelectComponent={onSelectComponent}
                    />
                  </VoiceFooter.HideWhenActive>

                  <VoiceFooter.Expand />

                  <VoiceFooter.Right
                    defaultActions={
                      isSessionActive ? (
                        <Tooltip title={getStopButtonTooltip()}>
                          <span
                            onClick={handleStopConversation}
                            className={cx(
                              'flex',
                              'items-center',
                              'content-center',
                              'cursor-pointer',
                              styles.box,
                              styles['send-box'],
                              styles['stop-box'],
                              {
                                [styles['stop-box-active']]:
                                  !isStoppingConversation,
                              },
                            )}
                          >
                            {isStoppingConversation ? (
                              <div className={cx(styles['loading-box'])}>
                                <LoadingOutlined
                                  className={cx(styles['loading-icon'])}
                                />
                              </div>
                            ) : (
                              <SvgIcon name="icons-chat-stop" />
                            )}
                          </span>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title={getButtonTooltip()}>
                            <span
                              onClick={handleSendMessage}
                              className={cx(
                                'flex',
                                'items-center',
                                'content-center',
                                'cursor-pointer',
                                styles.box,
                                styles['send-box'],
                                {
                                  [styles.disabled]:
                                    disabledSend ||
                                    wholeDisabled ||
                                    loadingConversation ||
                                    isLoadingOtherInterface,
                                },
                              )}
                            >
                              <SvgIcon
                                name="icons-chat-send"
                                style={{ fontSize: '14px' }}
                              />
                            </span>
                          </Tooltip>
                        </>
                      )
                    }
                  >
                    {prefix}
                    {(isTaskAgentActive ||
                      agentType === AgentTypeEnum.TaskAgent) &&
                      // 项目上框期间沙箱由项目隐含，隐藏电脑选择器
                      !pinnedProject &&
                      !readonly && (
                        <ComputerTypeSelector
                          value={
                            agentSandboxId !== undefined &&
                            agentSandboxId !== null
                              ? String(agentSandboxId)
                              : conversationInfo?.sandboxServerId !==
                                  undefined &&
                                conversationInfo?.sandboxServerId !== null
                              ? String(conversationInfo.sandboxServerId)
                              : selectedComputerId
                          }
                          onChange={(id: string) => {
                            onComputerSelect?.(id);
                            // 切回云电脑时工作目录失效，一并清空（仅个人电脑生效）
                            if (id === '-1' && workspacePath) {
                              onWorkspaceDirChange?.('');
                            }
                          }}
                          disabled={wholeDisabled}
                          agentId={agentId}
                          fixedSelection={fixedSelection || isSessionActive}
                          unavailable={isSandboxUnavailable}
                          autoSelect={autoSelectComputer}
                          saveOnSelect={saveComputerOnSelect}
                          strictAgentMemory={strictAgentMemory}
                          isPersonalComputer={isPersonalComputer}
                          readonly={readonly}
                          cloudOnly={disablePersonalComputer}
                        />
                      )}
                    {allowOtherModel === DefaultSelectedEnum.Yes && (
                      <ModelSelector
                        agentId={agentId}
                        selectedModelId={selectedModelId}
                        onModelSelect={onModelSelect}
                        agentType={agentType}
                      />
                    )}
                    {showSpaceSelector && (
                      <SpaceSelector
                        selectedSpaceId={selectedSpaceId}
                        onSpaceSelect={onSpaceSelect}
                      />
                    )}
                  </VoiceFooter.Right>
                </footer>
                {/**
                 * 项目上框栏（项目列表「+ 新建会话」）：与工作目录栏同槽位同基样式
                 * （workspace-dir-bar 灰底贴边栏），直接展示项目名并可移除
                 * （清空按钮贴文案并排、hover 整行出现；项目类型不作徽标展示，
                 * 降级为整行 title 悬停提示）；存在期间工作区由项目隐含，
                 * 不渲染工作目录栏与电脑选择器。
                 */}
                {pinnedProject && onClearPinnedProject && (
                  <div
                    className={cx(
                      styles['workspace-dir-bar'],
                      styles['pinned-project-bar'],
                    )}
                    title={
                      pinnedProject.projectType ===
                      AgentComponentTypeEnum.UserApp
                        ? t('PC.Pages.Home.pinnedProject.userAppBadge')
                        : t('PC.Pages.Home.pinnedProject.normalProjectBadge')
                    }
                  >
                    {pinnedProjectIcon.displaySrc ? (
                      <img
                        src={pinnedProjectIcon.displaySrc}
                        alt=""
                        className={cx(styles['pinned-project-icon'])}
                      />
                    ) : (
                      <FolderOutlined
                        className={cx(styles['pinned-project-icon'])}
                      />
                    )}
                    <span
                      className={cx(
                        styles['workspace-dir-text'],
                        styles['pinned-project-name'],
                      )}
                      title={pinnedProject.name}
                    >
                      {pinnedProject.name}
                    </span>
                    <Tooltip title={t('PC.Pages.Home.pinnedProject.remove')}>
                      <button
                        type="button"
                        className={cx(styles['pinned-project-remove'])}
                        aria-label={t('PC.Pages.Home.pinnedProject.remove')}
                        onClick={onClearPinnedProject}
                      >
                        <CloseOutlined />
                      </button>
                    </Tooltip>
                  </div>
                )}
                {/**
                 * 工作目录栏（wiki #17 / 5-b，原型 env-bar）：输入卡底部灰底栏，
                 * 仅用户自选个人电脑时展示（智能体绑定电脑 agentSandboxId 固定、
                 * 云电脑均不展示）；目录随会话创建记录（sandboxId+workspacePath）。
                 * 「默认工作目录」=不传 workspacePath；「打开电脑文件夹」=可视化浏览弹窗。
                 */}
                {(isTaskAgentActive || agentType === AgentTypeEnum.TaskAgent) &&
                  !readonly &&
                  !fixedSelection &&
                  !pinnedProject &&
                  !disablePersonalComputer &&
                  selectedComputerId &&
                  selectedComputerId !== '-1' &&
                  onWorkspaceDirChange && (
                    <div className={cx(styles['workspace-dir-bar'])}>
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          selectable: true,
                          selectedKeys: [
                            workspacePath ? 'pick-folder' : 'default',
                          ],
                          items: [
                            {
                              key: 'default',
                              icon: <FolderOutlined />,
                              label: t('PC.Components.WorkspaceDir.defaultDir'),
                            },
                            {
                              key: 'pick-folder',
                              icon: <FolderOpenOutlined />,
                              label: t(
                                'PC.Components.WorkspaceDir.openComputerFolder',
                              ),
                            },
                          ],
                          onClick: ({ key }: { key: string }) => {
                            if (key === 'pick-folder') {
                              setWorkspaceDirPickerOpen(true);
                            } else {
                              onWorkspaceDirChange('');
                            }
                          },
                        }}
                      >
                        <button
                          type="button"
                          className={cx(styles['workspace-dir-trigger'])}
                          title={workspacePath || undefined}
                        >
                          <FolderOutlined />
                          <span className={cx(styles['workspace-dir-text'])}>
                            {workspacePath ||
                              t('PC.Components.WorkspaceDir.defaultDir')}
                          </span>
                          <DownOutlined
                            className={cx(styles['workspace-dir-caret'])}
                          />
                        </button>
                      </Dropdown>
                      <WorkspaceDirPickerModal
                        sandboxId={selectedComputerId}
                        open={workspacePathPickerOpen}
                        onCancel={() => setWorkspaceDirPickerOpen(false)}
                        onConfirm={(dir) => {
                          setWorkspaceDirPickerOpen(false);
                          onWorkspaceDirChange(dir);
                        }}
                      />
                    </div>
                  )}
              </>
            )}
          </VoiceFooter.Provider>
        </div>
      </div>
      {showAnnouncement && (
        <div className={cx(styles['announcement-box'])}>
          {t('PC.Components.ChatInputHome.generatedByAiNotice')}
        </div>
      )}
      <div className={cx(styles['chat-action'])}>
        <div
          className={cx(styles['to-bottom'], {
            [styles.visible]: delayedVisible,
          })}
          onClick={() => {
            setIsHoveringBtn(false);
            setDelayedVisible(false);
            onScrollBottom?.();
          }}
          onMouseEnter={() => setIsHoveringBtn(true)}
          onMouseLeave={() => setIsHoveringBtn(false)}
        >
          <ArrowDownOutlined />
        </div>
      </div>

      <ConditionRender condition={isEnableSubscription}>
        <PaymentSubscriptionModal
          open={openPaymentModal}
          targetType="Skill"
          loading={loadingTargetPricing || loadingMySubscription}
          plans={targetSubscriptionPlans}
          currentSubscribedInfo={
            mySubscriptionInfo?.currentSubscription ?? null
          }
          onClose={() => setOpenPaymentModal(false)}
          onSubscribe={createSubscriptionOrder}
        />
      </ConditionRender>
    </div>
  );
};

/** 对外组件：forwardRef 暴露 focus/clear（首页切推荐/分类时由页面调用） */
const ChatInputUnified = forwardRef<ChatInputUnifiedRef, ChatInputUnifiedProps>(
  (props, ref) => <ChatInputUnifiedImpl {...props} forwardedRef={ref} />,
);

export default ChatInputUnified;
