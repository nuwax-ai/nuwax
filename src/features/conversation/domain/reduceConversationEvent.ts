import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import type {
  ConversationChatResponse,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import {
  reduceMessageEvent,
  type ThinkBlockAdapter,
} from './reduceMessageEvent';
import {
  reduceProcessingEvent,
  type ProcessingBlockRenderer,
} from './reduceProcessingEvent';
import {
  reduceTerminalEvent,
  type FinalMessageReconciler,
} from './reduceTerminalEvent';

export interface ConversationEventProjection {
  messages: MessageInfo[];
  activeOutputMessageId: string;
}

export interface ConversationEventReducerAdapters {
  renderProcessingBlock: ProcessingBlockRenderer;
  reconcileFinalMessage: FinalMessageReconciler;
  /** 思考内联标签 Adapter（plugins/ds-markdown-think）；缺省不写标签（旧投影行为）。 */
  thinkBlock?: ThinkBlockAdapter;
}

export interface ConversationEventReduction
  extends ConversationEventProjection {
  processing?: ProcessingInfo;
  taskStatus?: TaskStatus;
  applied: boolean;
}

/**
 * 会话 SSE 消息投影的统一 Interface。
 *
 * 这里只处理 PROCESSING / MESSAGE / FINAL_RESULT / ERROR 的确定性状态转换；Intervention
 * 优先级及所有页面、网络、timer、eventBus effect 由 Runtime Adapter 编排。
 */
export function reduceConversationEvent(
  projection: ConversationEventProjection,
  currentMessageId: string,
  event: ConversationChatResponse,
  adapters: ConversationEventReducerAdapters,
): ConversationEventReduction {
  if (event.eventType === ConversationEventTypeEnum.MESSAGE) {
    const reduction = reduceMessageEvent(
      projection.messages,
      currentMessageId,
      projection.activeOutputMessageId,
      event.data,
      adapters.thinkBlock,
    );
    return {
      messages: reduction.messages,
      activeOutputMessageId: reduction.activeOutputMessageId,
      applied: reduction.applied,
    };
  }

  if (event.eventType === ConversationEventTypeEnum.PROCESSING) {
    const currentIndex = projection.messages.findIndex(
      (message) => message.id === currentMessageId,
    );
    if (currentIndex < 0) {
      return { ...projection, applied: false };
    }
    const reduction = reduceProcessingEvent(
      projection.messages[currentIndex],
      event.data,
      adapters.renderProcessingBlock,
      adapters.thinkBlock?.finalizeThinkBlock,
    );
    const messages = [...projection.messages];
    messages.splice(currentIndex, 1, reduction.message);
    return {
      messages,
      activeOutputMessageId: projection.activeOutputMessageId,
      processing: reduction.processing,
      applied: true,
    };
  }

  if (
    event.eventType === ConversationEventTypeEnum.FINAL_RESULT ||
    event.eventType === ConversationEventTypeEnum.ERROR
  ) {
    const reduction = reduceTerminalEvent(
      projection.messages,
      currentMessageId,
      event,
      adapters.reconcileFinalMessage,
      adapters.thinkBlock?.finalizeThinkBlock,
    );
    return {
      messages: reduction.messages,
      activeOutputMessageId:
        event.eventType === ConversationEventTypeEnum.FINAL_RESULT
          ? ''
          : projection.activeOutputMessageId,
      taskStatus: reduction.taskStatus,
      applied: reduction.applied,
    };
  }

  return { ...projection, applied: false };
}
