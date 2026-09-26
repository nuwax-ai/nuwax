import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationFinalResult,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { resolveTerminalTaskStatus } from './taskStatus';

export type FinalMessageReconciler = (
  currentMessage: MessageInfo,
  finalResult: ConversationFinalResult,
) => MessageInfo | null;

/** 收口 text 中未闭合思考标签（终态兜底）；缺省不写入标签。 */
export type ThinkBlockFinalizer = (
  text: string,
  roundContent: string,
) => string;

const silentThinkFinalizer: ThinkBlockFinalizer = (text) => text;

export interface TerminalEventReduction {
  messages: MessageInfo[];
  message?: MessageInfo;
  taskStatus?: TaskStatus;
  removed: boolean;
  applied: boolean;
}

/**
 * 归并协议终态对所属 assistant 消息的确定性投影。
 *
 * Intervention/processing 的 FINAL_RESULT 补齐通过 reconciler Adapter 注入；网络、React、
 * eventBus、suggest、文件等 effect 不属于该 Module。
 */
export function reduceTerminalEvent(
  messageList: MessageInfo[],
  currentMessageId: string,
  event: ConversationChatResponse,
  reconcileFinalMessage: FinalMessageReconciler,
  closeThinkBlock: ThinkBlockFinalizer = silentThinkFinalizer,
): TerminalEventReduction {
  const currentIndex = messageList.findIndex(
    (message) => message.id === currentMessageId,
  );
  if (currentIndex < 0) {
    return {
      messages: messageList,
      removed: false,
      applied: false,
    };
  }

  const currentMessage = messageList[currentIndex];
  const messages = [...messageList];
  // 终态兜底收口：流若结束于思考中，text 里的思考标签保持 finished 形态
  const closeOpenThinkBlock = () =>
    closeThinkBlock(
      currentMessage.text || '',
      currentMessage.thinkBlocks?.[currentMessage.thinkBlocks.length - 1] || '',
    );

  if (event.eventType === ConversationEventTypeEnum.ERROR) {
    const errorText = typeof event.error === 'string' ? event.error.trim() : '';
    const currentText = closeOpenThinkBlock();
    // 后端安全错误文本进入既有正文槽；保留流中已输出的回答，而非用错误替换正文。
    // 同一 ERROR 重投时保留既有错误，避免在正文尾部重复追加。
    const alreadyAppended =
      currentMessage.status === MessageStatusEnum.Error &&
      (currentText === errorText || currentText.endsWith(`\n\n${errorText}`));
    const text = [currentText, alreadyAppended ? '' : errorText]
      .filter(Boolean)
      .join('\n\n');
    const message = {
      ...currentMessage,
      text,
      thinkingFinished: true,
      status: MessageStatusEnum.Error,
      requestId: event.requestId || currentMessage.requestId,
    };
    messages.splice(currentIndex, 1, message);
    return {
      messages,
      message,
      taskStatus: TaskStatus.FAILED,
      removed: false,
      applied: true,
    };
  }

  if (event.eventType !== ConversationEventTypeEnum.FINAL_RESULT) {
    return {
      messages: messageList,
      removed: false,
      applied: false,
    };
  }

  const finalResult = event.data as ConversationFinalResult;
  // 收口必须基于 reconcile 之后的 text：reconciler 会把只在
  // finalResult.componentExecuteResults 里的补投结果以自定义块追加进 text，
  // 若用 reconcile 前的 currentMessage.text 覆盖，补投块会被整体丢弃。
  const reconciled = (reconcileFinalMessage(currentMessage, finalResult) ||
    {}) as Partial<MessageInfo>;
  const message = {
    ...reconciled,
    text: closeThinkBlock(
      reconciled.text || '',
      reconciled.thinkBlocks?.[reconciled.thinkBlocks.length - 1] || '',
    ),
    thinkingFinished: true,
    status: MessageStatusEnum.Complete,
    finalResult,
    requestId: event.requestId,
  } as MessageInfo;
  const shouldRemove =
    !finalResult?.success &&
    finalResult?.error?.includes('用户主动取消任务') &&
    !message.text &&
    !finalResult.outputText;

  if (shouldRemove) {
    messages.splice(currentIndex, 1);
  } else {
    messages.splice(currentIndex, 1, message);
  }

  return {
    messages,
    message: shouldRemove ? undefined : message,
    taskStatus: resolveTerminalTaskStatus(
      finalResult?.success,
      finalResult,
      event,
    ),
    removed: shouldRemove,
    applied: true,
  };
}
