import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AcpPermissionMockScenario } from '../acp-permission/mock';
import { useActiveInterventionQueue } from '../hooks/useActiveInterventionQueue';
import { useAgentInterventionDevMock } from '../hooks/useAgentInterventionDevMock';
import type { McpAskQuestionMockScenario } from '../mcp-ask/mock';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types';
import styles from './AgentInterventionChatLayer.less';
import InterventionDockPanel from './InterventionDockPanel';

export interface AgentInterventionChatLayerProps {
  conversationId?: number | string | null;
  className?: string;
  messageList: MessageInfo[];
  onRespondAcpPermission: (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
  ) => void | Promise<void>;
  onRespondMcpAsk: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => void | Promise<void>;
  injectMockAcpPermission: (
    scenario?: AcpPermissionMockScenario,
    targetMessageId?: string,
  ) => void;
  injectMockMcpAsk: (
    scenario?: McpAskQuestionMockScenario,
    targetMessageId?: string,
  ) => void;
  injectAllInterventionMocks?: () => void;
}

/**
 * Chat 页 Agent 干预 UI：ACP 权限 + MCP Ask 固定于输入框上方，多项时层叠为单窗口
 */
const AgentInterventionChatLayer: React.FC<AgentInterventionChatLayerProps> = ({
  conversationId,
  className,
  messageList,
  onRespondAcpPermission,
  onRespondMcpAsk,
  injectMockAcpPermission,
  injectMockMcpAsk,
  injectAllInterventionMocks,
}) => {
  const [dismissedMcpAskRequestIds, setDismissedMcpAskRequestIds] = useState<
    Set<string>
  >(() => new Set());

  useAgentInterventionDevMock({
    conversationId,
    messageList,
    injectMockAcpPermission,
    injectMockMcpAsk,
    injectAllInterventionMocks,
  });

  const activeQueueItems = useActiveInterventionQueue(messageList);
  const queueItems = useMemo(
    () =>
      activeQueueItems.filter(
        (item) =>
          item.kind !== 'mcp_ask' ||
          !dismissedMcpAskRequestIds.has(item.interaction.input.requestId),
      ),
    [activeQueueItems, dismissedMcpAskRequestIds],
  );

  useEffect(() => {
    if (!dismissedMcpAskRequestIds.size) {
      return;
    }
    const activeRequestIds = new Set(
      activeQueueItems
        .filter((item) => item.kind === 'mcp_ask')
        .map((item) => item.interaction.input.requestId),
    );
    setDismissedMcpAskRequestIds((prev) => {
      const next = new Set(
        [...prev].filter((requestId) => activeRequestIds.has(requestId)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [activeQueueItems, dismissedMcpAskRequestIds]);

  const handleRespondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const requestId = interaction.input.requestId;
      setDismissedMcpAskRequestIds((prev) => new Set(prev).add(requestId));
      try {
        await onRespondMcpAsk(interaction, payload);
      } catch (error) {
        setDismissedMcpAskRequestIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
        console.error('[agentIntervention] Failed to respond MCP ask', error);
      }
    },
    [onRespondMcpAsk],
  );

  if (!queueItems.length) {
    return null;
  }

  return (
    <div
      className={classNames(styles.host, className)}
      data-agent-intervention-dock
    >
      <InterventionDockPanel
        items={queueItems}
        onRespondAcpPermission={onRespondAcpPermission}
        onRespondMcpAsk={handleRespondMcpAsk}
      />
    </div>
  );
};

export default AgentInterventionChatLayer;
