/**
 * conversationInfo 模块类型定义
 */

import { CreateUpdateModeEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import type {
  AgentManualComponentInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type {
  CardInfo,
  ConversationFinalResult,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import type {
  StaticFileInfo,
  VncDesktopContainerInfo,
} from '@/types/interfaces/vncDesktop';
import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from 'react';

/**
 * 会话状态 Hook 返回类型
 */
export interface ConversationStateReturn {
  conversationInfo: ConversationInfo | null | undefined;
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >;
  currentConversationId: number | null;
  setCurrentConversationId: Dispatch<SetStateAction<number | null>>;
  currentConversationRequestId: string;
  setCurrentConversationRequestId: Dispatch<SetStateAction<string>>;
  requestId: string;
  setRequestId: Dispatch<SetStateAction<string>>;
  finalResult: ConversationFinalResult | null;
  setFinalResult: Dispatch<SetStateAction<ConversationFinalResult | null>>;
  variables: BindConfigWithSub[];
  setVariables: Dispatch<SetStateAction<BindConfigWithSub[]>>;
  requiredNameList: string[];
  setRequiredNameList: Dispatch<SetStateAction<string[]>>;
  userFillVariables: Record<string, string | number> | null;
  setUserFillVariables: Dispatch<
    SetStateAction<Record<string, string | number> | null>
  >;
  handleVariables: (variables: BindConfigWithSub[]) => void;
  needUpdateTopicRef: MutableRefObject<boolean>;
  getCurrentConversationId: () => number | null;
  getCurrentConversationRequestId: () => string;
  isSuggest: MutableRefObject<boolean>;
  setIsSuggest: (suggest: boolean) => void;
  manualComponents: AgentManualComponentInfo[];
  setManualComponents: Dispatch<SetStateAction<AgentManualComponentInfo[]>>;
  showType: EditAgentShowType;
  setShowType: Dispatch<SetStateAction<EditAgentShowType>>;
  cardList: CardInfo[];
  setCardList: Dispatch<SetStateAction<CardInfo[]>>;
  isLoadingConversation: boolean;
  setIsLoadingConversation: Dispatch<SetStateAction<boolean>>;
  isLoadingOtherInterface: boolean;
  setIsLoadingOtherInterface: Dispatch<SetStateAction<boolean>>;
}

/**
 * 消息列表 Hook 返回类型
 */
export interface MessageListReturn {
  messageList: MessageInfo[];
  setMessageList: Dispatch<SetStateAction<MessageInfo[]>>;
  messageListRef: MutableRefObject<MessageInfo[]>;
  messageIdRef: MutableRefObject<string>;
  isMoreMessage: boolean;
  setIsMoreMessage: Dispatch<SetStateAction<boolean>>;
  loadingMore: boolean;
  setLoadingMore: Dispatch<SetStateAction<boolean>>;
  isConversationActive: boolean;
  setIsConversationActive: Dispatch<SetStateAction<boolean>>;
  checkConversationActive: (messages: MessageInfo[]) => void;
  disabledConversationActive: () => void;
  chatSuggestList: string[] | GuidQuestionDto[];
  setChatSuggestList: Dispatch<SetStateAction<string[] | GuidQuestionDto[]>>;
}

/**
 * 滚动行为 Hook 返回类型
 */
export interface ScrollBehaviorReturn {
  messageViewRef: RefObject<HTMLDivElement | null>;
  scrollTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  allowAutoScrollRef: MutableRefObject<boolean>;
  showScrollBtn: boolean;
  setShowScrollBtn: Dispatch<SetStateAction<boolean>>;
  messageViewScrollToBottom: () => void;
  handleScrollBottom: () => void;
}

/**
 * 弹窗状态 Hook 返回类型
 */
export interface DialogStateReturn {
  isHistoryConversationOpen: boolean;
  openHistoryConversation: () => void;
  closeHistoryConversation: () => void;
  isTimedTaskOpen: boolean;
  timedTaskMode: CreateUpdateModeEnum | undefined;
  openTimedTask: (mode: CreateUpdateModeEnum) => void;
  closeTimedTask: () => void;
}

/**
 * 文件树 Hook 返回类型
 */
export interface FileTreeReturn {
  isFileTreeVisible: boolean;
  setIsFileTreeVisible: Dispatch<SetStateAction<boolean>>;
  isFileTreePinned: boolean;
  setIsFileTreePinned: Dispatch<SetStateAction<boolean>>;
  fileTreeData: StaticFileInfo[];
  setFileTreeData: Dispatch<SetStateAction<StaticFileInfo[]>>;
  fileTreeDataLoading: boolean;
  setFileTreeDataLoading: Dispatch<SetStateAction<boolean>>;
  viewMode: 'preview' | 'desktop';
  setViewMode: Dispatch<SetStateAction<'preview' | 'desktop'>>;
  viewModeRef: MutableRefObject<'preview' | 'desktop'>;
  isFileTreeVisibleRef: MutableRefObject<boolean>;
  taskAgentSelectedFileId: string;
  setTaskAgentSelectedFileId: Dispatch<SetStateAction<string>>;
  taskAgentSelectTrigger: number | string;
  setTaskAgentSelectTrigger: Dispatch<SetStateAction<number | string>>;
  handleRefreshFileList: (conversationId?: number) => Promise<void>;
  openPreviewChangeState: (mode: 'preview' | 'desktop') => void;
  closePreviewView: () => void;
  clearFilePanelInfo: () => void;
  openPreviewView: (cId: number) => Promise<void>;
}

/**
 * 远程桌面 Hook 返回类型
 */
export interface VncDesktopReturn {
  vncContainerInfo: VncDesktopContainerInfo | null;
  setVncContainerInfo: Dispatch<SetStateAction<VncDesktopContainerInfo | null>>;
  openDesktopView: (cId: number) => Promise<void>;
  restartVncPod: (cId: number) => Promise<any>;
  restartAgent: (agentId: number) => void;
  isRestartAgentLoading: boolean;
  runKeepalivePodPolling: (cId: number) => void;
  stopKeepalivePodPolling: () => void;
}
