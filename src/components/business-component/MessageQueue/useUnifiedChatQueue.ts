import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useCallback } from 'react';
import { useModel } from 'umi';
import type { QueuedMessage } from './types';
import { useChatMessageQueue } from './useChatMessageQueue';

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
   * 队列两次消费之间的最小间隔（ms），默认 500。
   * 用于规避会话状态切换的中间空白，避免队列在一次响应结束后过早消费下一条。
   */
  minConsumeInterval?: number;
  /** 当前是否有待处理 intervention（ask/question/审批），为 true 时暂停队列消费 */
  hasPendingIntervention?: boolean;
}

/**
 * UnifiedChatSession 专用消息队列 hook
 *
 * 在统一会话底层接入消息队列，使所有使用 UnifiedChatSession 的页面
 * （Chat / ConversationAgent / AgentConversationChatPanel 等）自动获得：
 * - 会话活跃时消息入队、空闲时自动消费
 * - 立即发送 / 编辑回填 / 删除 / 清空
 *
 * 入队判定与发送按钮状态一致：isConversationActive || taskStatus === EXECUTING
 */
export const useUnifiedChatQueue = ({
  conversationId,
  messageList,
  selectedModelId,
  agentModeRef,
  onSendMessage,
  minConsumeInterval,
  hasPendingIntervention,
}: UseUnifiedChatQueueParams) => {
  const { isConversationActive, runStopConversation } =
    useModel('conversationInfo');

  // 直接发送（绕过队列拦截）：供 intervention（ask/question/审批）响应的 resume 消息使用，
  // 避免回复被错误入队。用户提交结果后会话跑完空闲时，既有 auto-consume 自动恢复队列消费。
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
    isConversationActive,
    messageList: messageList || [],
    conversationId,
    sendMessage: rawSend,
    runStopConversation,
    minConsumeInterval,
    hasPendingIntervention,
  });

  // 编辑队列消息：从队列移除并通过 eventBus 回填到输入框
  const handleEditQueued = useCallback(
    (qMsg: QueuedMessage) => {
      const item = messageQueueCtrl.editQueued(qMsg);
      if (item) {
        eventBus.emit(EVENT_NAMES.QUEUE_EDIT_MESSAGE, {
          text: item.text,
          files: item.files,
        });
      }
    },
    [messageQueueCtrl],
  );

  return {
    ...messageQueueCtrl,
    handleEditQueued,
    rawSend,
  };
};
