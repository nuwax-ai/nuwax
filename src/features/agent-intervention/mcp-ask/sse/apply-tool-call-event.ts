import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createInterventionTriggeredAt } from '../../utils/intervention-trigger';
import { parseMcpAskToolInput } from '../mock';

/**
 * 解析 MCP Ask tool_call SSE，返回补丁后的消息；无匹配则返回 null
 */
export function applyMcpAskToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const eventDataForTool = (res as any).data ?? res;
  const isToolCallEvent =
    ((res as any).message_type === 'tool_call' ||
      (res as any).messageType === 'tool_call') &&
    !!(eventDataForTool?.tool_call_id || eventDataForTool?.toolCallId);

  if (!isToolCallEvent) {
    return null;
  }

  const toolCallId =
    eventDataForTool?.tool_call_id || eventDataForTool?.toolCallId;
  const rawInput = eventDataForTool?.raw_input ?? eventDataForTool?.rawInput;
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
