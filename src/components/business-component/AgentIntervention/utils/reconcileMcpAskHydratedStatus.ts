import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import {
  hasMcpAskResumeMessage,
  sortMessagesByConversationIndex,
} from './mcpAskResumeMessage';

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
  containingMessageIndex?: number,
): MessageInfo {
  const interactions = message.mcpAskInteractions;
  if (!interactions?.length) {
    return message;
  }

  const resolvedContainingMessageIndex =
    containingMessageIndex ??
    contextMessageList.findIndex(
      (item) => item.id === message.id || item.index === message.index,
    );

  let changed = false;
  const nextInteractions = interactions.map((interaction) => {
    if (!isAwaitingUserResponse(interaction.responseStatus)) {
      return interaction;
    }
    if (
      !hasMcpAskResumeMessage(contextMessageList, interaction, {
        containingMessageIndex:
          resolvedContainingMessageIndex >= 0
            ? resolvedContainingMessageIndex
            : undefined,
      })
    ) {
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
  const sortedContext = sortMessagesByConversationIndex(contextMessageList);
  return messageList.map((message) => {
    const containingMessageIndex = sortedContext.findIndex(
      (item) => item.id === message.id || item.index === message.index,
    );
    return reconcileMessageMcpAskHydratedStatus(
      message,
      sortedContext,
      containingMessageIndex >= 0 ? containingMessageIndex : undefined,
    );
  });
}
