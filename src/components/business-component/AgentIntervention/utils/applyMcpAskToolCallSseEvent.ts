import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { extractMcpAskStructuredInputFromResult } from './extractMcpAskStructuredInput';
import { createInterventionTriggeredAt } from './interventionTrigger';
import { parseMcpAskToolInput } from './parseMcpAskToolInput';
import {
  extractEventData,
  parseSseEventEnvelope,
} from './parseSseEventEnvelope';

function readRawInput(
  eventData: Record<string, unknown>,
  result?: Record<string, unknown>,
) {
  const ext =
    eventData.ext && typeof eventData.ext === 'object'
      ? (eventData.ext as Record<string, unknown>)
      : {};
  // 优先选择非空对象，避免后端把 `result.input` 设为 `{}` 时误匹配空对象，
  // 导致 `parseMcpAskToolInput` 解析失败。
  const nonEmpty = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && Object.keys(value).length > 0
      ? (value as Record<string, unknown>)
      : undefined;
  return (
    nonEmpty(extractMcpAskStructuredInputFromResult(result)) ??
    nonEmpty(eventData.raw_input) ??
    nonEmpty(eventData.rawInput) ??
    nonEmpty(ext.raw_input) ??
    nonEmpty(ext.rawInput) ??
    nonEmpty(result?.input) ??
    nonEmpty((result?.ext as Record<string, unknown> | undefined)?.raw_input) ??
    nonEmpty((result?.ext as Record<string, unknown> | undefined)?.rawInput) ??
    (result?.input as Record<string, unknown> | undefined)
  );
}

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
      eventData.rawInput ||
      ((eventData.ext as Record<string, unknown> | undefined)?.raw_input ??
        (eventData.ext as Record<string, unknown> | undefined)?.rawInput)
    );
  const isProcessingToolCallEvent =
    res.eventType === ConversationEventTypeEnum.PROCESSING &&
    !!(
      eventData.executeId ||
      (eventData.result as Record<string, unknown> | undefined)?.executeId ||
      (eventData.result as Record<string, unknown> | undefined)?.input
    );

  // 识别 subEventType=ASK_QUESTION 的 PROCESSING 事件。
  // 此类事件的 result.executeId 和 result.input 均为 null，
  // MCP Ask 数据在 result.data 中（含 schemaVersion、ui、requestId）。
  const isAskQuestionEvent =
    res.eventType === ConversationEventTypeEnum.PROCESSING &&
    envelope.subEventType === 'ASK_QUESTION';

  if (!isToolCallEvent && !isProcessingToolCallEvent && !isAskQuestionEvent) {
    return null;
  }

  const result = eventData.result as Record<string, unknown> | undefined;

  // ASK_QUESTION 事件：MCP Ask 数据直接在 result.data 中，
  // 不遵循 ToolCall 的 result.input 结构。
  let rawInput: Record<string, unknown> | undefined;
  let toolCallId: string | undefined;

  if (isAskQuestionEvent && result) {
    const resultData = result.data as Record<string, unknown> | undefined;
    if (resultData && typeof resultData === 'object') {
      rawInput = resultData;
      toolCallId =
        (resultData.requestId as string) ||
        (eventData.executeId as string) ||
        (result.executeId as string);
    }
  }

  if (!rawInput) {
    rawInput = readRawInput(eventData, result);
  }
  if (!toolCallId) {
    toolCallId =
      (eventData.tool_call_id as string) ||
      (eventData.toolCallId as string) ||
      (eventData.executeId as string) ||
      (result?.executeId as string);
  }

  const executeId =
    (eventData.executeId as string) ||
    (result?.executeId as string) ||
    undefined;

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
        executeId,
        responseStatus: 'pending',
        triggeredAt: createInterventionTriggeredAt(),
      },
    ],
    status: MessageStatusEnum.Loading,
  };
}
