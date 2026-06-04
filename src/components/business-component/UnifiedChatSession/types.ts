import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import type {
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
}

export interface UnifiedChatSessionProps {
  // 会话的核心数据
  conversationId: number;
  messageList: MessageInfo[];
  roleInfo: RoleInfo;
  isLoading: boolean; // 会话正在进行首次加载的 Loading 状态
  loadingMore: boolean; // 是否正在向上拉取历史消息
  isMoreMessage: boolean; // 是否还有历史消息可拉取
  isConversationActive: boolean; // 会话是否活跃（大模型正流式交互中）
  loadingSuggest?: boolean; // 会话建议加载状态
  chatSuggestList?: string[]; // 页面会话建议（开场白问题推荐）

  // 智能体配置与信息
  agentInfo: UnifiedAgentInfo;

  // 事件与业务回调
  onSendMessage: (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => void;
  onClear: () => Promise<void>; // 刷新/清空会话的回调
  onLoadMoreMessage: (id: number) => void; // 向上滚动到顶加载历史消息的回调

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

  // 输入框属性透传，用于支持展示不同的工具栏、工具列表配置
  chatInputProps?: Partial<ChatInputProps>;
}
