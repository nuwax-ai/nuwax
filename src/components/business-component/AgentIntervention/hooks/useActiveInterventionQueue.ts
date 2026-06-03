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

function isActiveAcpInteraction(
  interaction: AcpPermissionInteraction,
): boolean {
  const status = interaction.responseStatus ?? 'pending';
  return status === 'pending' || status === 'submitting' || status === 'failed';
}

function isActiveMcpAskInteraction(interaction: McpAskInteraction): boolean {
  const status = interaction.responseStatus ?? 'pending';
  return status === 'pending' || status === 'submitting' || status === 'failed';
}

export function useActiveInterventionQueue(
  messageList: MessageInfo[],
): InterventionQueueItem[] {
  return useMemo(() => {
    const pending: InterventionQueueItem[] = [];
    let fallbackSeq = 0;

    const messages = [...(messageList ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );

    messages.forEach((message) => {
      const messageId = String(message.id ?? message.index);
      const messageIndex = message.index ?? 0;

      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveAcpInteraction(interaction)) {
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
        if (!isActiveMcpAskInteraction(interaction)) {
          return;
        }
        if (hasMcpAskResumeMessage(messages, interaction)) {
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
