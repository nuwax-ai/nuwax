import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createInterventionTriggeredAt } from './interventionTrigger';
import { parseMcpAskToolInput } from './parseMcpAskToolInput';
import {
  extractEventData,
  parseSseEventEnvelope,
} from './parseSseEventEnvelope';

export function applyMcpAskToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const envelope = parseSseEventEnvelope(res);
  const eventData = extractEventData(envelope, res);
  const subType = envelope.subType ?? envelope.sub_type;

  const isToolCallLikeSubType =
    subType === 'tool_call' || subType === 'tool_call_update';
  const isToolCallEvent =
    (envelope.message_type === 'tool_call' ||
      envelope.messageType === 'tool_call' ||
      isToolCallLikeSubType) &&
    !!(
      eventData.tool_call_id ||
      eventData.toolCallId ||
      eventData.raw_input ||
      eventData.rawInput
    );
  const isProcessingToolCallEvent =
    res.eventType === ConversationEventTypeEnum.PROCESSING &&
    !!(
      eventData.executeId ||
      (eventData.result as Record<string, unknown> | undefined)?.executeId ||
      (eventData.result as Record<string, unknown> | undefined)?.input
    );

  if (!isToolCallEvent && !isProcessingToolCallEvent) {
    return null;
  }

  const result = eventData.result as Record<string, unknown> | undefined;
  const toolCallId =
    (eventData.tool_call_id as string) ||
    (eventData.toolCallId as string) ||
    (eventData.executeId as string) ||
    (result?.executeId as string);
  const rawInput = eventData.raw_input ?? eventData.rawInput ?? result?.input;
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
