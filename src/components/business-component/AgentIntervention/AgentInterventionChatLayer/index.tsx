import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { mcpAskResolutionKey } from '@/utils/mcpAskResolution';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useActiveInterventionQueue } from '../hooks/useActiveInterventionQueue';
import { useInterventionDialogFocus } from '../hooks/useInterventionDialogFocus';
import type {
  AcpPermissionInteraction,
  AcpPermissionRespondExtras,
  AcpRequestPermissionResponse,
} from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import styles from './AgentInterventionChatLayer.less';
import DockPanel from './DockPanel';

export interface AgentInterventionChatLayerProps {
  className?: string;
  conversationId?: number | string | null;
  messageList: MessageInfo[];
  onRespondAcpPermission: (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
    extras?: AcpPermissionRespondExtras,
  ) => void | Promise<void>;
  onRespondMcpAsk: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => void | Promise<void>;
}

const AgentInterventionChatLayer: React.FC<AgentInterventionChatLayerProps> = ({
  className,
  conversationId,
  messageList,
  onRespondAcpPermission,
  onRespondMcpAsk,
}) => {
  const [dismissedMcpAskRequestIds, setDismissedMcpAskRequestIds] = useState<
    Set<string>
  >(() => new Set());

  const inFlight = useRef(new Set<string>());
  const responseKey = useCallback(
    (interaction: McpAskInteraction) =>
      JSON.stringify([conversationId, mcpAskResolutionKey(interaction)]),
    [conversationId],
  );

  const activeQueueItems = useActiveInterventionQueue(messageList);
  const queueItems = useMemo(
    () =>
      activeQueueItems.filter(
        (item) =>
          item.kind !== 'mcp_ask' ||
          !dismissedMcpAskRequestIds.has(responseKey(item.interaction)),
      ),
    [activeQueueItems, dismissedMcpAskRequestIds, responseKey],
  );

  const handleRespondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const requestId = responseKey(interaction);
      if (inFlight.current.has(requestId)) return;
      inFlight.current.add(requestId);
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
      } finally {
        inFlight.current.delete(requestId);
      }
    },
    [onRespondMcpAsk, responseKey],
  );

  // 遮罩对话框的焦点管理：有干预时聚焦入内 + Tab 循环 + 关闭还原（hook 须无条件调用）
  const dialogFocus = useInterventionDialogFocus(queueItems.length > 0);

  if (!queueItems.length) {
    return null;
  }

  return (
    <div
      className={classNames(styles.host, className)}
      data-agent-intervention-dock
      role="dialog"
      aria-modal="true"
      aria-label={t('PC.Components.AgentInterventionChatLayer.dialogLabel')}
      tabIndex={-1}
      ref={dialogFocus.containerRef}
      onKeyDown={dialogFocus.handleKeyDown}
    >
      <DockPanel
        items={queueItems}
        onRespondAcpPermission={onRespondAcpPermission}
        onRespondMcpAsk={handleRespondMcpAsk}
      />
    </div>
  );
};

export default AgentInterventionChatLayer;
