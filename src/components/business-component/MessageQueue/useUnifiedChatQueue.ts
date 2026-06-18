import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { TaskStatus } from '@/types/enums/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useCallback } from 'react';
import { useModel } from 'umi';
import type { QueuedMessage } from './types';
import { useChatMessageQueue } from './useChatMessageQueue';

/** 隔离会话源（如 ConversationAgent 预览 Tab）时覆盖队列上下文 */
export interface UnifiedChatQueueContext {
  /** 流式活跃（messageList Loading/Incomplete），驱动 auto-consume */
  streamActive?: boolean;
  /** 后台任务执行中（taskStatus===EXECUTING），仅参与入队拦截 */
  taskExecuting?: boolean;
  /** 停止当前会话（立即发送队列消息时调用） */
  runStopConversation?: (id: number | string) => void;
}

export interface UseUnifiedChatQueueParams {
  /** 当前会话 ID */
  conversationId?: number;
  /** 消息列表（用于错误时暂停消费判定） */
  messageList?: MessageInfo[];
  /** 当前选中的模型 ID */
  selectedModelId?: number;
  /** 智能体模式 ref（发送时取最新值） */
  agentModeRef: React.MutableRefObject<AgentMode>;
  /** 真正发送消息的回调（来自 UnifiedChatSession 的 onSendMessage prop） */
  onSendMessage?: (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => void;
  /**
   * 队列两次消费之间的最小间隔（ms），默认 100（与 useChatMessageQueue 一致）。
   */
  minConsumeInterval?: number;
  /** 当前是否有待处理 intervention（ask/question/审批），为 true 时暂停队列消费 */
  hasPendingIntervention?: boolean;
  /**
   * 可选：覆盖 conversationInfo model 的活跃/停止上下文。
   * 预览 Tab 使用 conversationAgent model 时传入，避免与左侧主聊天串扰。
   */
  queueContext?: UnifiedChatQueueContext;
}

/**
 * UnifiedChatSession 专用消息队列 hook
 *
 * 信号：
 * - streamActive = model/context 流式 OR messageList 末条 Loading/Incomplete
 * - 入队 / 消费阻塞：streamActive || taskExecuting（+ intervention 仅消费）
 * - auto-consume：上述阻塞全部解除后才触发
 */
export const useUnifiedChatQueue = ({
  conversationId,
  messageList,
  selectedModelId,
  agentModeRef,
  onSendMessage,
  minConsumeInterval,
  hasPendingIntervention,
  queueContext,
}: UseUnifiedChatQueueParams) => {
  const {
    isConversationActive: modelStreamActive,
    conversationInfo,
    runStopConversation: modelRunStop,
  } = useModel('conversationInfo');

  const streamActiveByModel = queueContext?.streamActive ?? modelStreamActive;
  const streamActive = streamActiveByModel || isSessionStreamBusy(messageList);
  const taskExecuting =
    queueContext?.taskExecuting ??
    conversationInfo?.taskStatus === TaskStatus.EXECUTING;
  const isEnqueueBlocked = streamActive || taskExecuting;
  const runStopConversation = queueContext?.runStopConversation ?? modelRunStop;

  const rawSend = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      skillIds?: number[],
      modelId?: number,
      selectedAgentMode?: AgentMode,
    ) => {
      onSendMessage?.(
        messageInfo,
        files,
        skillIds,
        modelId || selectedModelId,
        selectedAgentMode || agentModeRef.current,
      );
    },
    [onSendMessage, selectedModelId, agentModeRef],
  );

  const messageQueueCtrl = useChatMessageQueue({
    isConversationActive: streamActive,
    isEnqueueBlocked,
    isTaskExecuting: taskExecuting,
    messageList: messageList || [],
    conversationId,
    sendMessage: rawSend,
    runStopConversation,
    minConsumeInterval,
    hasPendingIntervention,
  });

  const handleEditQueued = useCallback(
    (qMsg: QueuedMessage) => {
      const item = messageQueueCtrl.editQueued(qMsg);
      if (item) {
        eventBus.emit(EVENT_NAMES.QUEUE_EDIT_MESSAGE, {
          text: item.text,
          files: item.files,
          skillIds: item.skillIds,
          modelId: item.modelId,
          selectedAgentMode: item.selectedAgentMode,
          conversationId,
        });
      }
    },
    [messageQueueCtrl, conversationId],
  );

  return {
    ...messageQueueCtrl,
    handleEditQueued,
    rawSend,
  };
};
