import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { selectQueueGate } from '@/features/conversation/domain/runtimeSelectors';
import { TaskStatus } from '@/types/enums/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useCallback } from 'react';
import type { QueuedMessage } from './types';
import { useChatMessageQueue } from './useChatMessageQueue';

/** 隔离会话源（如 ConversationAgent 预览 Tab）时覆盖队列上下文 */
export interface UnifiedChatQueueContext {
  /** 流式活跃（messageList Loading/Incomplete），驱动 auto-consume */
  streamActive?: boolean;
  /** 后台任务执行中（taskStatus===EXECUTING），仅参与入队拦截 */
  taskExecuting?: boolean;
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
   * 队列消费下一条前的最小等待间隔（ms），默认 1200，从「流式结束（消费阻塞解除）时刻」起算。
   * 用于规避会话状态切换的中间空白，避免队列在一次响应结束后过早消费下一条。
   */
  minConsumeInterval?: number;
  /** 当前是否有待处理 intervention（ask/question/审批），为 true 时暂停队列消费 */
  hasPendingIntervention?: boolean;
  /**
   * 队列的流式/任务上下文（必传语义：由 UnifiedChatSession 以自身 props 构造默认值，
   * 隔离入口（预览 Tab 等）显式传入 conversationAgent model 的上下文避免串扰）。
   * 本 hook 不再默认读取全局 conversationInfo model（方案 Phase 6）。
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
  // 队列上下文由调用方（UnifiedChatSession）显式注入：主入口以自身 props 构造，
  // 隔离入口传入独立 model 的上下文。未提供时按空闲处理（无流式/任务阻塞）。
  const queueGate = selectQueueGate(
    queueContext?.streamActive ?? false,
    messageList,
    queueContext?.taskExecuting ? TaskStatus.EXECUTING : undefined,
    hasPendingIntervention,
  );

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
    isConversationActive: queueGate.streamActive,
    isEnqueueBlocked: queueGate.enqueueBlocked,
    isTaskExecuting: queueGate.taskExecuting,
    messageList: messageList || [],
    conversationId,
    sendMessage: rawSend,
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
          // 带上会话 id，监听方（ChatInputHome）据此过滤，避免多实例（主聊天/预览 Tab）串扰
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
