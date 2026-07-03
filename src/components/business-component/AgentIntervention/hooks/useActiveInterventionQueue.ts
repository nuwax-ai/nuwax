import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useMemo } from 'react';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import {
  hasMcpAskResumeMessage,
  sortMessagesByConversationIndex,
} from '../utils/mcpAskResumeMessage';

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
  // `failed` is terminal: once the user has responded, the card closes
  // regardless of whether the API call succeeded, so a failed approval no
  // longer pins the front of the dock and blocks later approvals. The error
  // itself is still surfaced via toast in respondAcpPermission.
  return value === 'pending' || value === 'submitting';
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

function getAcpPermissionInteractions(
  message: MessageInfo,
): AcpPermissionInteraction[] {
  return (message.acpPermissionInteractions ??
    []) as unknown as AcpPermissionInteraction[];
}

export function useActiveInterventionQueue(
  messageList: MessageInfo[],
): InterventionQueueItem[] {
  return useMemo(() => {
    const pendingMap = new Map<string, InterventionQueueItem>();
    const permissionPendingToolCallIds = new Set<string>();
    const permissionPendingAskRequestIds = new Set<string>();
    let fallbackSeq = 0;

    const messages = sortMessagesByConversationIndex(messageList ?? []);

    messages.forEach((message) => {
      getAcpPermissionInteractions(message).forEach((interaction) => {
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

    messages.forEach((message, messageIndex) => {
      const messageId = String(message.id ?? message.index);
      const messageIndexValue = message.index ?? messageIndex;

      getAcpPermissionInteractions(message).forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }

        const sortKey =
          interaction.triggeredAt ??
          interaction.intervention.createdAt ??
          fallbackSeq++;
        pendingMap.set(`acp-${interaction.intervention.id}`, {
          kind: 'acp_permission',
          messageId,
          messageIndex: messageIndexValue,
          interaction,
          sortKey,
        });
      });

      message.mcpAskInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (
          hasMcpAskResumeMessage(messages, interaction, {
            containingMessageIndex: messageIndex,
          })
        ) {
          return;
        }

        if (
          permissionPendingToolCallIds.has(interaction.toolCallId) ||
          permissionPendingAskRequestIds.has(interaction.input.requestId)
        ) {
          return;
        }
        const sortKey = interaction.triggeredAt ?? fallbackSeq++;
        pendingMap.set(`ask-${interaction.input.requestId}`, {
          kind: 'mcp_ask',
          messageId,
          messageIndex: messageIndexValue,
          interaction,
          sortKey,
        });
      });
    });

    return [...pendingMap.values()].sort((a, b) => a.sortKey - b.sortKey);
  }, [messageList]);
}
