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
import { readSkillAskQuestion } from './skillAskQuestion';

const inputKey = (input: McpAskInteraction['input']) =>
  JSON.stringify([input.requestId, input.revision ?? 1]);

export function hydrateMcpAskInteractionsFromExecutedComponents(
  message: MessageInfo,
): MessageInfo {
  const componentExecutedList = (message.componentExecutedList ||
    []) as McpAskExecutedComponent[];
  const existing = message.mcpAskInteractions || [];
  const existingRequestIds = new Set(
    existing.map((interaction) => inputKey(interaction.input)),
  );
  const hydrated: McpAskInteraction[] = [];

  componentExecutedList.forEach((component) => {
    if (isMcpAskFailedComponent(component)) {
      return;
    }

    const input = parseMcpAskToolInput(getMcpAskComponentInput(component));
    const toolCallId = getMcpAskComponentToolCallId(component, input);
    if (!input || !toolCallId || existingRequestIds.has(inputKey(input))) {
      return;
    }

    existingRequestIds.add(inputKey(input));
    hydrated.push({
      input,
      toolCallId,
      responseStatus: resolveMcpAskHydratedResponseStatus(component),
      triggeredAt: createInterventionTriggeredAt(),
    });
  });

  const skill = readSkillAskQuestion(message);
  skill.inputs.forEach((input) => {
    const key = inputKey(input);
    if (existingRequestIds.has(key)) return;
    existingRequestIds.add(key);
    hydrated.push({
      input,
      toolCallId: `skill-ask:${encodeURIComponent(input.requestId)}:${input.revision}`,
      responseStatus: 'pending',
      triggeredAt: createInterventionTriggeredAt(),
    });
  });

  if (!hydrated.length && !skill.inputs.length) {
    return message;
  }

  return {
    ...message,
    ...(skill.inputs.length
      ? {
          text: skill.text,
          ...(message.finalResult
            ? { finalResult: { ...message.finalResult, outputText: skill.outputText } }
            : {}),
        }
      : {}),
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

  // 回执匹配依赖完整上下文中同标题 Ask 的数量与顺序。不能把未 hydrate 的
  // 原始历史传入，否则旧表单的「我已填写…」会误匹配到最新的同标题 Ask。
  const hydratedContext = contextMessageList.map((message) =>
    hydrateMcpAskInteractionsFromExecutedComponents(message),
  );

  return reconcileMcpAskHydratedMessageList(hydratedList, hydratedContext);
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
