import type {
  AgentInterventionHandlersOverride,
  AgentMode,
} from '@/components/business-component/AgentIntervention';
import type { UnifiedChatQueueContext } from '@/components/business-component/MessageQueue/useUnifiedChatQueue';
import type { DefaultSelectedEnum } from '@/types/enums/agent';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import * as React from 'react';

export interface UnifiedAgentInfo {
  id?: number;
  name?: string;
  icon?: string;
  type?: string;
  openingChatMsg?: string;
  guidQuestionDtos?: any[];
  eventBindConfig?: any;
  hasPermission?: boolean;
  sandboxId?: string;
  hideDesktop?: number;
  expandPageArea?: number;
  /** 是否允许用户在对话框中选择 Agent 模式（1 允许，其他不允许） */
  allowChooseMode?: DefaultSelectedEnum | number;
}

export interface UnifiedChatSessionProps {
  // 会话的核心数据
  conversationId?: number;
  messageList?: MessageInfo[];
  roleInfo?: RoleInfo;
  isLoading?: boolean; // 会话正在进行首次加载的 Loading 状态
  loadingMore?: boolean; // 是否正在向上拉取历史消息
  isMoreMessage?: boolean; // 是否还有历史消息可拉取
  /**
   * 会话流式/任务活跃（停止按钮、队列入队等）。
   * 与 showTaskExecutingWait 分离：后者仅 taskStatus=EXECUTING 且无流式消息时展示横幅。
   */
  isConversationActive?: boolean;
  /**
   * 本地是否正在通过 SSE 发送/接收（model 原始 isConversationActive，【不】含「后台 taskStatus===EXECUTING」）。
   * 供流式恢复 hook 判断「本地是否在驱动输出」——若混入 taskStatus，EXECUTING 会话会被误判为
   * 本地流式中，导致既不轮询也不订阅 sub（续不上）。未传时回退到 isConversationActive。
   */
  isLocallyStreaming?: boolean;
  messageBottomMode?: 'none' | 'home' | 'chat'; // 消息底部操作栏模式：none | home | chat
  showDebug?: boolean;
  loadingSuggest?: boolean; // 会话建议加载状态
  chatSuggestList?: string[]; // 页面会话建议（开场白问题推荐）

  // 智能体配置与信息
  agentInfo?: UnifiedAgentInfo;

  /** 由上层（如新建项目页）透传的初始 Agent 模式，用于初始化介入图层的选择器 */
  initialAgentMode?: AgentMode;

  // 事件与业务回调
  onSendMessage?: (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => void;
  onClear?: () => Promise<void>; // 刷新/清空会话的回调
  onLoadMoreMessage?: (id: number) => void; // 向上滚动到顶加载历史消息的回调

  // 输入框相关受控状态与属性
  selectedModelId?: number;
  onModelSelect?: (modelId: number) => void;
  allowOtherModel?: number;
  manualComponents?: any[];
  selectedComponentList?: any[];
  onSelectComponent?: (comp: any) => void;
  requiredNameList?: string[];
  variableParams?: Record<string, string | number> | null;
  form?: any; // Form 实例
  variables?: any[];
  userFillVariables?: any;
  isVariablesFilled?: boolean;
  isVariablesDisabled?: boolean;
  clearLoading?: boolean;
  isSelectionLocked?: boolean;
  hasUserSentMessage?: boolean;
  readonly?: boolean;
  showAnnouncement?: boolean;
  mentionPlacement?: 'up' | 'down';

  // 文件预览与智能体电脑状态/操作 (通用型智能体 TaskAgent 专属)
  selectedComputerId?: string;
  onComputerSelect?: (id: string) => void;

  showScrollBtn?: boolean;
  allowAutoScrollRef?: React.MutableRefObject<boolean>;
  scrollTimeoutRef?: React.MutableRefObject<any>;
  setShowScrollBtn?: (show: boolean) => void;

  // 自定义差异化组件渲染插槽 (极高扩展性，用以兼容 AppDev 中特有的 Diff markdown 渲染和空状态)
  renderMessageItem?: (
    message: MessageInfo,
    isLastMessage: boolean,
  ) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;

  // 功能配置开关
  enableMention?: boolean; // 是否支持 @ 提及项目文件/技能
  placeholder?: string;
  messageViewRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  /** 额外禁用输入框，用于跨会话联动控制输入态 */
  chatInputDisabled?: boolean;

  // 输入框属性透传，用于支持展示不同的工具栏、工具列表配置
  chatInputProps?: Partial<ChatInputProps>;

  /**
   * 队列两次消费之间的最小间隔（ms），用于规避会话状态切换的中间空白；默认 500。
   */
  queueMinConsumeInterval?: number;

  /**
   * 消息队列上下文覆盖（预览 Tab 等隔离会话源场景）。
   * 未传时使用全局 conversationInfo model。
   */
  queueContext?: UnifiedChatQueueContext;
  // ===== 原 ChatInputHome 中 useModel('conversationInfo') 数据，改为从外部传入 =====
  /** 停止会话的异步函数 */
  runStopConversation?: (id: string) => Promise<any>;
  /** 停止会话接口的加载状态 */
  loadingStopConversation?: boolean;
  /** 获取当前会话 ID */
  getCurrentConversationId?: () => number | null;
  /** 获取当前会话请求 ID */
  getCurrentConversationRequestId?: () => string;
  /** 强制将会话设置为非活跃状态 */
  disabledConversationActive?: () => void;
  /** 会话消息加载中状态 */
  loadingConversation?: boolean;
  /** 其它接口加载中状态（用于禁用发送按钮） */
  isLoadingOtherInterface?: boolean;
  /** 当前会话详情 */
  conversationInfo?: ConversationInfo | null;

  /**
   * 隔离会话源（如 ConversationAgent 预览 Tab）的干预回执注入；
   * 未传时默认使用全局 conversationInfo model。
   */
  interventionHandlers?: AgentInterventionHandlersOverride;

  // ===== 会话流式恢复(sub)：刷新页面 / 新开标签时重建 EXECUTING 会话的流式输出 =====
  // 未注入下列 action 的页面（如隔离会话源）将不启用恢复。
  /** 订阅 sub 流（model 的 resumeConversationStream） */
  onResumeConversationStream?: (
    conversationId: number | string,
    currentList: MessageInfo[],
    onClose?: () => void,
  ) => void;
  /** 中断 sub 流（model 的 abortResumeStream） */
  onAbortResumeStream?: () => void;
  /** 刷新历史并返回最新 messageList（model 的 runAsync 包装）；多页签续上时补全用户消息 */
  onReloadConversationHistoryAsync?: (
    conversationId: number | string,
  ) => Promise<MessageInfo[] | undefined | null>;
}
