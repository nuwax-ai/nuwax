import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';

export type ProcessingBlockRenderer = (
  beforeText: string,
  processing: ProcessingInfo,
) => string;

export interface ProcessingEventReduction {
  message: MessageInfo;
  processing: ProcessingInfo;
}

/**
 * 归并 PROCESSING 事件的确定性消息投影。
 *
 * markdown 块格式通过 renderer Adapter 注入；Domain Kernel 只拥有 executeId 规范化、
 * processing upsert、思考态结束和消息 Loading 状态规则。
 */
export function reduceProcessingEvent(
  currentMessage: MessageInfo,
  incomingProcessing: ProcessingInfo,
  renderProcessingBlock: ProcessingBlockRenderer,
): ProcessingEventReduction {
  const nestedExecuteId = (
    incomingProcessing.result as { executeId?: string } | null
  )?.executeId;
  const processing =
    !incomingProcessing.executeId && nestedExecuteId
      ? { ...incomingProcessing, executeId: nestedExecuteId }
      : incomingProcessing;

  const processingList = [...(currentMessage.processingList || [])];
  const existingIndex = processingList.findIndex(
    (item) => item.executeId === processing.executeId,
  );
  if (existingIndex > -1) {
    processingList[existingIndex] = processing;
  } else {
    processingList.push(processing);
  }

  return {
    processing,
    message: {
      ...currentMessage,
      text: renderProcessingBlock(currentMessage.text || '', processing),
      thinkingFinished: true,
      status: MessageStatusEnum.Loading,
      processingList,
    },
  };
}
