import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { TaskStatus } from '@/types/enums/agent';
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
}: UseUnifiedChatQueueParams) => {
  const { isConversationActive, conversationInfo, runStopConversation } =
    useModel('conversationInfo');

  const isActive =
    !!isConversationActive ||
    conversationInfo?.taskStatus === TaskStatus.EXECUTING;

  const messageQueueCtrl = useChatMessageQueue({
    isActive,
    messageList: messageList || [],
    conversationId,
    sendMessage: (
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
    runStopConversation,
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
  };
};
