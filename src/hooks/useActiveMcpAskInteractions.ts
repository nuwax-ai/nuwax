import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskInteraction } from '@/types/interfaces/mcpAskIntervention';
import { useMemo } from 'react';

export interface ActiveMcpAskItem {
  interaction: McpAskInteraction;
  messageId: string;
  messageIndex: number;
}

export function useActiveMcpAskInteractions(
  messageList: MessageInfo[],
): ActiveMcpAskItem[] {
  return useMemo(() => {
    const items: ActiveMcpAskItem[] = [];
    messageList?.forEach((message) => {
      const messageId = message.id || String(message.index);
      message.mcpAskInteractions?.forEach((interaction) => {
        const status = interaction.responseStatus ?? 'pending';
        if (
          status === 'pending' ||
          status === 'submitting' ||
          status === 'failed'
        ) {
          items.push({
            interaction,
            messageId,
            messageIndex: message.index,
          });
        }
      });
    });
    return items;
  }, [messageList]);
}
