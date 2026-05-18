import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useMemo } from 'react';
import type { McpAskInteraction } from '../../types';

export interface ActiveMcpAskItem {
  interaction: McpAskInteraction;
  messageId: string;
  messageIndex: number;
}

/**
 * 收集会话中仍需用户处理的 MCP Ask 交互（展示在会话顶部固定栏）
 */
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
