import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
// 从 barrel 引入以与 UnifiedChatSession/测试的 mock 面保持同一模块路径
import { useUnifiedChatQueue } from '@/components/business-component/MessageQueue';
import type { UnifiedChatQueueContext } from '@/components/business-component/MessageQueue/useUnifiedChatQueue';
import type { ConversationSessionView } from '@/features/conversation/domain/sessionView';
import { selectConversationSessionView } from '@/features/conversation/domain/sessionView';
import { TaskStatus } from '@/types/enums/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type React from 'react';
import { createContext, useContext, useMemo, useRef } from 'react';

/**
 * 会话域 React 编排层的创建参数（方案 §4 ConversationSessionProvider）。
 * 由入口（或 UnifiedChatSession 的自包兜底）提供原始字段，Provider 统一创建
 * 队列 / 干预派生态 / Session View，消除组件内的状态组合。
 */
export interface ConversationSessionProviderProps {
  children: React.ReactNode;
  conversationId?: number;
  messageList: MessageInfo[];
  /** 纯本地流式（model 原始 isConversationActive） */
  modelStreamActive?: boolean;
  awaitingChatTerminal?: boolean;
  taskStatus?: TaskStatus;
  selectedModelId?: number;
  /** 真正发送消息的回调（队列消费与直发共用） */
  onSendMessage?: (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => void;
  minConsumeInterval?: number;
  /** 隔离入口的队列上下文覆盖 */
  queueContext?: UnifiedChatQueueContext;
}

export interface ConversationSessionContextValue {
  sessionView: ConversationSessionView;
  messageQueue: ReturnType<typeof useUnifiedChatQueue>;
  hasPendingIntervention: boolean;
  activeInterventions: ReturnType<typeof useActiveInterventionQueue>;
  /** 智能体模式 ref（interventionLayer 写入、队列发送读取） */
  agentModeRef: React.MutableRefObject<AgentMode>;
}

const ConversationSessionContext =
  createContext<ConversationSessionContextValue | null>(null);

/**
 * 会话 Session Provider：队列、干预派生态与 Session View 的唯一创建点。
 *
 * - 队列与干预状态在此上提（方案 Phase 6 后半：sessionView 完整注入的前置）；
 * - `useConversationSession` 供 UnifiedChatSession / 会话子树消费，返回 null 表示
 *   未被包裹（组件进入自包兜底模式）。
 */
export function ConversationSessionProvider({
  children,
  conversationId,
  messageList,
  modelStreamActive,
  awaitingChatTerminal,
  taskStatus,
  selectedModelId,
  onSendMessage,
  minConsumeInterval,
  queueContext,
}: ConversationSessionProviderProps) {
  const agentModeRef = useRef<AgentMode>('yolo');
  const activeInterventions = useActiveInterventionQueue(messageList);
  const hasPendingIntervention = activeInterventions.length > 0;

  const messageQueue = useUnifiedChatQueue({
    conversationId,
    messageList,
    selectedModelId,
    agentModeRef,
    onSendMessage,
    minConsumeInterval,
    hasPendingIntervention,
    queueContext: queueContext ?? {
      streamActive: modelStreamActive,
      taskExecuting: taskStatus === TaskStatus.EXECUTING,
    },
  });

  const sessionView = useMemo(
    () =>
      selectConversationSessionView({
        conversationId,
        modelStreamActive,
        awaitingChatTerminal,
        taskStatus,
        messageList,
        hasQueuedMessages: messageQueue.hasQueuedMessages,
        hasPendingIntervention,
      }),
    [
      conversationId,
      modelStreamActive,
      awaitingChatTerminal,
      taskStatus,
      messageList,
      messageQueue.hasQueuedMessages,
      hasPendingIntervention,
    ],
  );

  const value = useMemo<ConversationSessionContextValue>(
    () => ({
      sessionView,
      messageQueue,
      hasPendingIntervention,
      activeInterventions,
      agentModeRef,
    }),
    [sessionView, messageQueue, hasPendingIntervention, activeInterventions],
  );

  return (
    <ConversationSessionContext.Provider value={value}>
      {children}
    </ConversationSessionContext.Provider>
  );
}

/** 消费会话 Session Context；未被 Provider 包裹时返回 null（自包兜底模式入口）。 */
export function useConversationSession(): ConversationSessionContextValue | null {
  return useContext(ConversationSessionContext);
}
