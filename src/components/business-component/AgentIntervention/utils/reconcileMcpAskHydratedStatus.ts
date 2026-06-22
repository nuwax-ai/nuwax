import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { hasMcpAskResumeMessage } from './mcpAskResumeMessage';

function isAwaitingUserResponse(
  status: McpAskInteraction['responseStatus'] | undefined,
): boolean {
  const value = status ?? 'pending';
  return value === 'pending' || value === 'submitting';
}

/**
 * 将仍为 pending 的 hydrated 交互与完整会话上下文对齐：
 * 若已存在 resume 用户消息，则标记为 submitted，避免 dock 误弹。
 */
export function reconcileMessageMcpAskHydratedStatus(
  message: MessageInfo,
  contextMessageList: MessageInfo[],
): MessageInfo {
  const interactions = message.mcpAskInteractions;
  if (!interactions?.length) {
    return message;
  }

  let changed = false;
  const nextInteractions = interactions.map((interaction) => {
    if (!isAwaitingUserResponse(interaction.responseStatus)) {
      return interaction;
    }
    if (!hasMcpAskResumeMessage(contextMessageList, interaction)) {
      return interaction;
    }
    changed = true;
    return {
      ...interaction,
      responseStatus: 'submitted' as const,
    };
  });

  if (!changed) {
    return message;
  }

  return {
    ...message,
    mcpAskInteractions: nextInteractions,
  };
}

export function reconcileMcpAskHydratedMessageList(
  messageList: MessageInfo[],
  contextMessageList: MessageInfo[] = messageList,
): MessageInfo[] {
  return messageList.map((message) =>
    reconcileMessageMcpAskHydratedStatus(message, contextMessageList),
  );
}
