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

/** 思考内联标签 Adapter：与 plugins/ds-markdown-think 的导出同形。 */
export interface ThinkBlockAdapter {
  hasOpenThinkBlock: (text: string) => boolean;
  appendThinkChunk: (
    text: string,
    roundContent: string,
    finalize?: boolean,
  ) => string;
  finalizeThinkBlock: (text: string, roundContent?: string) => string;
}

/**
 * 缺省思考标签 Adapter：不写内联标签（即旧投影行为）。
 * hasOpenThinkBlock 恒 true 使每个 THINK 分片都归入同一未闭合轮次，
 * thinkBlocks 维持单块累计，与旧线「think 字段聚合」语义一致。
 */
export const silentThinkBlockAdapter: ThinkBlockAdapter = {
  hasOpenThinkBlock: () => true,
  appendThinkChunk: (text) => text,
  finalizeThinkBlock: (text) => text,
};

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
  thinkBlock: ThinkBlockAdapter = silentThinkBlockAdapter,
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

  // 正文/问答分片到达即超越当前思考轮：先收口 text 中的思考标签再追加
  const closeOpenThinkBlock = (message: MessageInfo): string =>
    thinkBlock.finalizeThinkBlock(
      message.text || '',
      message.thinkBlocks?.[message.thinkBlocks.length - 1] || '',
    );

  if (chunk.type === MessageModeEnum.THINK) {
    // 思考按流式位置写入 text 内联标签（plugins/ds-markdown-think 协议），
    // think 字段继续累积全量思考供持久化与旧消费方使用。
    const thinkBlocks = [...(currentMessage.thinkBlocks || [])];
    if (!thinkBlock.hasOpenThinkBlock(currentMessage.text || '')) {
      thinkBlocks.push('');
    }
    thinkBlocks[thinkBlocks.length - 1] += chunk.text;
    nextMessage = {
      ...currentMessage,
      text: thinkBlock.appendThinkChunk(
        currentMessage.text || '',
        thinkBlocks[thinkBlocks.length - 1],
        chunk.finished === true,
      ),
      think: `${currentMessage.think}${chunk.text}`,
      thinkBlocks,
      thinkingFinished: chunk.finished === true,
      status: MessageStatusEnum.Incomplete,
    };
  } else if (chunk.type === MessageModeEnum.QUESTION) {
    nextMessage = {
      ...currentMessage,
      text: `${closeOpenThinkBlock(currentMessage)}${chunk.text}`,
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
      text: `${closeOpenThinkBlock(currentMessage)}${chunk.text}`,
      thinkingFinished: true,
      status: null as unknown as MessageStatusEnum,
    };
    replaceCount = 0;
  } else {
    nextActiveOutputMessageId = chunk.id;
    nextMessage = {
      ...currentMessage,
      text: `${closeOpenThinkBlock(currentMessage)}${chunk.text}`,
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
