import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';

export type ProcessingBlockRenderer = (
  beforeText: string,
  processing: ProcessingInfo,
) => string;

/** 收口 text 中未闭合思考标签（思考被工具调用超越时调用）；缺省不写入标签。 */
export type ThinkBlockFinalizer = (
  text: string,
  roundContent: string,
) => string;

const silentThinkFinalizer: ThinkBlockFinalizer = (text) => text;

/** 工具归属随当前会话消息保存，兼容实时 processing 与历史执行结果。 */
export const findProcessingOwnerIndex = (
  messages: MessageInfo[],
  processing: ProcessingInfo,
): number => {
  const executeId = processing.executeId || processing.result?.executeId;
  return executeId
    ? messages.findIndex(
        (message) =>
          message.role === AssistantRoleEnum.ASSISTANT &&
          (message.processingList?.some(
            (item) =>
              item.executeId === executeId ||
              item.result?.executeId === executeId,
          ) ||
            message.componentExecutedList?.some(
              (item) => item.executeId === executeId,
            )),
      )
    : -1;
};

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
  closeThinkBlock: ThinkBlockFinalizer = silentThinkFinalizer,
): ProcessingEventReduction {
  const nestedExecuteId = (
    incomingProcessing.result as { executeId?: string } | null
  )?.executeId;
  const normalized =
    !incomingProcessing.executeId && nestedExecuteId
      ? { ...incomingProcessing, executeId: nestedExecuteId }
      : incomingProcessing;

  const processingList = [...(currentMessage.processingList || [])];
  const existingIndex = processingList.findIndex(
    (item) => item.executeId === normalized.executeId,
  );
  const previous = processingList[existingIndex];
  const processing = previous
    ? ({
        ...previous,
        ...Object.fromEntries(
          Object.entries(normalized).filter(([, value]) => value !== undefined),
        ),
        result: normalized.result
          ? { ...previous.result, ...normalized.result }
          : previous.result,
      } as ProcessingInfo)
    : normalized;
  if (existingIndex > -1) {
    processingList[existingIndex] = processing;
  } else {
    processingList.push(processing);
  }

  return {
    processing,
    message: {
      ...currentMessage,
      // 工具调用出现即超越当前思考轮：先收口思考标签，再追加工具调用标签
      text: renderProcessingBlock(
        closeThinkBlock(
          currentMessage.text || '',
          currentMessage.thinkBlocks?.[currentMessage.thinkBlocks.length - 1] ||
            '',
        ),
        processing,
      ),
      thinkingFinished: true,
      status: MessageStatusEnum.Loading,
      processingList,
    },
  };
}
