import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useMemo } from 'react';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { hasMcpAskResumeMessage } from '../utils/mcpAskResumeMessage';

export type InterventionQueueKind = 'acp_permission' | 'mcp_ask';

export interface AcpInterventionQueueItem {
  kind: 'acp_permission';
  messageId: string;
  messageIndex: number;
  interaction: AcpPermissionInteraction;
  sortKey: number;
}

export interface McpAskInterventionQueueItem {
  kind: 'mcp_ask';
  messageId: string;
  messageIndex: number;
  interaction: McpAskInteraction;
  sortKey: number;
}

export type InterventionQueueItem =
  | AcpInterventionQueueItem
  | McpAskInterventionQueueItem;

function isActiveResponseStatus(status: string | undefined): boolean {
  const value = status ?? 'pending';
  return value === 'pending' || value === 'submitting' || value === 'failed';
}

function readMcpAskRequestId(rawInput: unknown): string | undefined {
  if (!rawInput || typeof rawInput !== 'object') {
    return undefined;
  }
  const input = rawInput as Record<string, unknown>;
  return typeof input.requestId === 'string' && input.requestId
    ? input.requestId
    : undefined;
}

export function useActiveInterventionQueue(
  messageList: MessageInfo[],
): InterventionQueueItem[] {
  return useMemo(() => {
    const pending: InterventionQueueItem[] = [];
    const permissionPendingToolCallIds = new Set<string>();
    const permissionPendingAskRequestIds = new Set<string>();
    let fallbackSeq = 0;

    const messages = [...(messageList ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );

    messages.forEach((message) => {
      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        const toolCall = interaction.intervention.acp.request.toolCall;
        if (toolCall.toolCallId) {
          permissionPendingToolCallIds.add(toolCall.toolCallId);
        }
        const askRequestId = readMcpAskRequestId(toolCall.rawInput);
        if (askRequestId) {
          permissionPendingAskRequestIds.add(askRequestId);
        }
      });
    });

    messages.forEach((message) => {
      const messageId = String(message.id ?? message.index);
      const messageIndex = message.index ?? 0;

      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        const sortKey =
          interaction.triggeredAt ??
          interaction.intervention.createdAt ??
          fallbackSeq++;
        pending.push({
          kind: 'acp_permission',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });

      message.mcpAskInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (hasMcpAskResumeMessage(messages, interaction)) {
          return;
        }
        if (
          permissionPendingToolCallIds.has(interaction.toolCallId) ||
          permissionPendingAskRequestIds.has(interaction.input.requestId)
        ) {
          return;
        }
        const sortKey = interaction.triggeredAt ?? fallbackSeq++;
        pending.push({
          kind: 'mcp_ask',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });
    });

    return pending.sort((a, b) => a.sortKey - b.sortKey);
  }, [messageList]);
}
