import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createInterventionTriggeredAt } from '@/utils/interventionTrigger';
import { parseMcpAskToolInput } from '@/utils/mcpAskQuestionMock';

export function applyMcpAskToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const nestedEvent = (res as any).data;
  const eventEnvelope =
    nestedEvent?.messageType ||
    nestedEvent?.message_type ||
    nestedEvent?.subType ||
    nestedEvent?.sub_type
      ? nestedEvent
      : res;
  const eventDataForTool =
    ((eventEnvelope as any).data &&
    typeof (eventEnvelope as any).data === 'object'
      ? (eventEnvelope as any).data
      : undefined) ??
    (res as any).data ??
    res;
  const subType =
    (eventEnvelope as any).subType ?? (eventEnvelope as any).sub_type;
  const isToolCallLikeSubType =
    subType === 'tool_call' || subType === 'tool_call_update';
  const isToolCallEvent =
    ((eventEnvelope as any).message_type === 'tool_call' ||
      (eventEnvelope as any).messageType === 'tool_call' ||
      isToolCallLikeSubType) &&
    !!(
      eventDataForTool?.tool_call_id ||
      eventDataForTool?.toolCallId ||
      eventDataForTool?.raw_input ||
      eventDataForTool?.rawInput
    );
  const isProcessingToolCallEvent =
    (res as any).eventType === ConversationEventTypeEnum.PROCESSING &&
    !!(
      eventDataForTool?.executeId ||
      eventDataForTool?.result?.executeId ||
      eventDataForTool?.result?.input
    );

  if (!isToolCallEvent && !isProcessingToolCallEvent) {
    return null;
  }

  const toolCallId =
    eventDataForTool?.tool_call_id ||
    eventDataForTool?.toolCallId ||
    eventDataForTool?.executeId ||
    eventDataForTool?.result?.executeId;
  const rawInput =
    eventDataForTool?.raw_input ??
    eventDataForTool?.rawInput ??
    eventDataForTool?.result?.input;
  const mcpAskInput = parseMcpAskToolInput(rawInput);

  if (!mcpAskInput || !toolCallId) {
    return null;
  }

  const interactions = currentMessage.mcpAskInteractions || [];
  if (
    interactions.some((item) => item.input.requestId === mcpAskInput.requestId)
  ) {
    return null;
  }

  return {
    ...currentMessage,
    mcpAskInteractions: [
      ...interactions,
      {
        input: mcpAskInput,
        toolCallId,
        responseStatus: 'pending',
        triggeredAt: createInterventionTriggeredAt(),
      },
    ],
    status: currentMessage.status || MessageStatusEnum.Loading,
  };
}
