import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { createInterventionTriggeredAt } from './interventionTrigger';
import { parseMcpAskToolInput } from './parseMcpAskToolInput';

function getComponentInput(component: any): unknown {
  return component?.input ?? component?.result?.input;
}

function getComponentToolCallId(component: any): string | undefined {
  const id =
    component?.executeId ??
    component?.result?.executeId ??
    component?.toolCallId ??
    component?.result?.toolCallId;
  return typeof id === 'string' && id ? id : undefined;
}

function isFailedComponent(component: any): boolean {
  const status = String(component?.status ?? component?.result?.status ?? '')
    .toLowerCase()
    .trim();
  return (
    status === 'failed' ||
    status === 'error' ||
    component?.success === false ||
    component?.result?.success === false
  );
}

export function hydrateMcpAskInteractionsFromExecutedComponents(
  message: MessageInfo,
): MessageInfo {
  const componentExecutedList = message.componentExecutedList || [];
  if (!componentExecutedList.length) {
    return message;
  }

  const existing = message.mcpAskInteractions || [];
  const existingRequestIds = new Set(
    existing.map((interaction) => interaction.input.requestId),
  );
  const hydrated: McpAskInteraction[] = [];

  componentExecutedList.forEach((component: any) => {
    if (isFailedComponent(component)) {
      return;
    }

    const input = parseMcpAskToolInput(getComponentInput(component));
    const toolCallId = getComponentToolCallId(component);
    if (!input || !toolCallId || existingRequestIds.has(input.requestId)) {
      return;
    }

    existingRequestIds.add(input.requestId);
    hydrated.push({
      input,
      toolCallId,
      responseStatus: 'pending',
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

export function hydrateMcpAskInteractionsInMessageList(
  messageList: MessageInfo[] = [],
): MessageInfo[] {
  return messageList.map((message) =>
    hydrateMcpAskInteractionsFromExecutedComponents(message),
  );
}
