import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { createInterventionTriggeredAt } from './interventionTrigger';
import {
  getMcpAskComponentInput,
  getMcpAskComponentToolCallId,
  isMcpAskFailedComponent,
  resolveMcpAskHydratedResponseStatus,
  type McpAskExecutedComponent,
} from './mcpAskExecutedComponent';
import { parseMcpAskToolInput } from './parseMcpAskToolInput';
import { reconcileMcpAskHydratedMessageList } from './reconcileMcpAskHydratedStatus';

export function hydrateMcpAskInteractionsFromExecutedComponents(
  message: MessageInfo,
): MessageInfo {
  const componentExecutedList = (message.componentExecutedList ||
    []) as McpAskExecutedComponent[];
  if (!componentExecutedList.length) {
    return message;
  }

  const existing = message.mcpAskInteractions || [];
  const existingRequestIds = new Set(
    existing.map((interaction) => interaction.input.requestId),
  );
  const hydrated: McpAskInteraction[] = [];

  componentExecutedList.forEach((component) => {
    if (isMcpAskFailedComponent(component)) {
      return;
    }

    const input = parseMcpAskToolInput(getMcpAskComponentInput(component));
    const toolCallId = getMcpAskComponentToolCallId(component);
    if (!input || !toolCallId || existingRequestIds.has(input.requestId)) {
      return;
    }

    existingRequestIds.add(input.requestId);
    hydrated.push({
      input,
      toolCallId,
      responseStatus: resolveMcpAskHydratedResponseStatus(component),
      triggeredAt: createInterventionTriggeredAt(),
    });
  });

  if (!hydrated.length) {
    return message;
  }

  return {
    ...message,
    mcpAskInteractions: [...existing, ...hydrated],
  };
}

/**
 * 从历史 componentExecutedList 重建 MCP Ask 交互，并结合完整会话上下文推断是否已回复。
 */
export function hydrateMcpAskInteractionsInMessageList(
  messageList: MessageInfo[] = [],
  contextMessageList: MessageInfo[] = messageList,
): MessageInfo[] {
  const hydratedList = messageList.map((message) =>
    hydrateMcpAskInteractionsFromExecutedComponents(message),
  );

  return reconcileMcpAskHydratedMessageList(hydratedList, contextMessageList);
}

/**
 * 加载更多历史消息：前置合并后在完整上下文中 hydrate。
 */
export function prependAndHydrateMcpAskMessageList(
  olderMessages: MessageInfo[],
  currentMessageList: MessageInfo[],
): MessageInfo[] {
  const merged = [...olderMessages, ...currentMessageList];
  return hydrateMcpAskInteractionsInMessageList(merged, merged);
}
