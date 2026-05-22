import InterventionDockPanel from '@/components/InterventionDockPanel';
import { useActiveInterventionQueue } from '@/hooks/useActiveInterventionQueue';
import { useAgentInterventionDevMock } from '@/hooks/useAgentInterventionDevMock';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/types/interfaces/acpIntervention';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '@/types/interfaces/mcpAskIntervention';
import type { AcpPermissionMockScenario } from '@/utils/acpPermissionMock';
import type { McpAskQuestionMockScenario } from '@/utils/mcpAskQuestionMock';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AgentInterventionChatLayer.less';

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
