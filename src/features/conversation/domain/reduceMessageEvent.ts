import { MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatMessage,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';

export interface MessageEventReduction {
  messages: MessageInfo[];
  activeOutputMessageId: string;
  applied: boolean;
}

/**
 * 归并 live/sub 的 MESSAGE 事件。
 *
 * activeOutputMessageId 是后端当前输出段的 ID，不是乐观助手消息 ID。新 ID 的 finished
 * 消息代表工作流新增一条 assistant 输出，应插入到乐观占位前，而不是覆盖已有输出。
 */
export function reduceMessageEvent(
  messageList: MessageInfo[],
  currentMessageId: string,
  activeOutputMessageId: string,
  chunk: ConversationChatMessage,
): MessageEventReduction {
  if (!messageList.length) {
    return {
      messages: messageList,
      activeOutputMessageId,
      applied: false,
    };
  }

  const currentIndex = messageList.findIndex(
    (message) => message.id === currentMessageId,
  );
  if (currentIndex < 0) {
    return {
      messages: messageList,
      activeOutputMessageId,
      applied: false,
    };
  }

  const currentMessage = messageList[currentIndex];
  let nextMessage: MessageInfo;
  let replaceCount = 1;
  let nextActiveOutputMessageId = activeOutputMessageId;

  if (chunk.type === MessageModeEnum.THINK) {
    nextMessage = {
      ...currentMessage,
      think: `${currentMessage.think}${chunk.text}`,
      thinkingFinished: chunk.finished === true,
      status: MessageStatusEnum.Incomplete,
    };
  } else if (chunk.type === MessageModeEnum.QUESTION) {
    nextMessage = {
      ...currentMessage,
      text: `${currentMessage.text}${chunk.text}`,
      thinkingFinished: true,
      status: (chunk.finished
        ? null
        : MessageStatusEnum.Incomplete) as MessageStatusEnum,
    };
  } else if (
    activeOutputMessageId &&
    activeOutputMessageId !== chunk.id &&
    chunk.finished
  ) {
    nextMessage = {
      ...currentMessage,
      id: chunk.id,
      text: `${currentMessage.text}${chunk.text}`,
      thinkingFinished: true,
      status: null as unknown as MessageStatusEnum,
    };
    replaceCount = 0;
  } else {
    nextActiveOutputMessageId = chunk.id;
    nextMessage = {
      ...currentMessage,
      text: `${currentMessage.text}${chunk.text}`,
      thinkingFinished: true,
      status: chunk.finished
        ? MessageStatusEnum.Complete
        : MessageStatusEnum.Incomplete,
    };
  }

  const messages = [...messageList];
  messages.splice(currentIndex, replaceCount, nextMessage);
  return {
    messages,
    activeOutputMessageId: nextActiveOutputMessageId,
    applied: true,
  };
}
