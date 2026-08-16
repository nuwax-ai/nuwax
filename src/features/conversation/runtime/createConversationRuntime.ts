import {
  reduceConversationEvent,
  type ConversationEventReducerAdapters,
  type ConversationEventReduction,
} from '@/features/conversation/domain/reduceConversationEvent';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  createLiveConnectionController,
  type LiveConnectionController,
} from './liveConnectionController';

export interface ConversationRuntime {
  readonly liveConnection: LiveConnectionController;
  reduceStreamEvent(
    messages: MessageInfo[],
    ownerMessageId: string,
    event: ConversationChatResponse,
  ): ConversationEventReduction;
  resetStreamProjection(): void;
  getActiveOutputMessageId(): string;
}

/**
 * 会话 Runtime Factory 的第一条纵切。
 *
 * Runtime 隐藏跨事件的 activeOutputMessageId，并与 live 连接所有权绑定为同一实例状态。
 * React model 仍暂时拥有 messageList 与 effects，后续迁移可在不改变调用方 Interface 的前提下
 * 继续把一致性与 effect Adapter 收入该实例。
 */
export function createConversationRuntime(
  adapters: ConversationEventReducerAdapters,
): ConversationRuntime {
  let activeOutputMessageId = '';
  const liveConnection = createLiveConnectionController();

  return {
    liveConnection,

    reduceStreamEvent(messages, ownerMessageId, event) {
      const reduction = reduceConversationEvent(
        { messages, activeOutputMessageId },
        ownerMessageId,
        event,
        adapters,
      );
      activeOutputMessageId = reduction.activeOutputMessageId;
      return reduction;
    },

    resetStreamProjection() {
      activeOutputMessageId = '';
    },

    getActiveOutputMessageId() {
      return activeOutputMessageId;
    },
  };
}
