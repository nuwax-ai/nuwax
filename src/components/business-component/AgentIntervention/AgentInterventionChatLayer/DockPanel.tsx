import classNames from 'classnames';
import React, { useCallback } from 'react';
import AcpPermissionCard from '../AcpPermissionCard';
import type { InterventionQueueItem } from '../hooks/useActiveInterventionQueue';
import McpAskQuestionCard from '../McpAskQuestionCard';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import styles from './DockPanel.less';
import dockCardStyles from './intervention-dock-card.module.less';

const STACK_OFFSET_PX = 5;

interface InterventionDockPanelProps {
  items: InterventionQueueItem[];
  onRespondAcpPermission: (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
  ) => void | Promise<void>;
  onRespondMcpAsk: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => void | Promise<void>;
}

function getItemKey(item: InterventionQueueItem): string {
  if (item.kind === 'acp_permission') {
    return `acp-${item.interaction.intervention.id}`;
  }
  return `ask-${item.interaction.input.requestId}`;
}

const DockPanel: React.FC<InterventionDockPanelProps> = ({
  items,
  onRespondAcpPermission,
  onRespondMcpAsk,
}) => {
  const renderCard = useCallback(
    (item: InterventionQueueItem, keyboardShortcutsEnabled: boolean) => {
      const dockShellClassName = dockCardStyles.root;
      if (item.kind === 'acp_permission') {
        return (
          <AcpPermissionCard
            interaction={item.interaction}
            docked
            dockShellClassName={dockShellClassName}
            keyboardShortcutsEnabled={keyboardShortcutsEnabled}
            onRespond={(response) =>
              onRespondAcpPermission(item.interaction, response)
            }
          />
        );
      }
      return (
        <McpAskQuestionCard
          interaction={item.interaction}
          dockShellClassName={dockShellClassName}
          keyboardShortcutsEnabled={keyboardShortcutsEnabled}
          onRespond={(payload) => onRespondMcpAsk(item.interaction, payload)}
        />
      );
    },
    [onRespondAcpPermission, onRespondMcpAsk],
  );

  if (!items.length) {
    return null;
  }

  const stackDepth = items.length;

  if (stackDepth === 1) {
    return (
      <div className={styles.cardSlot} aria-label="Agent intervention">
        {renderCard(items[0], true)}
      </div>
    );
  }

  const offsetTotal = (stackDepth - 1) * STACK_OFFSET_PX;

  // 反转顺序：最新到来的 intervention 在顶层（front，先处理），符合 unshift 到顶的语义
  const reversedItems = [...items].reverse();

  return (
    <div
      className={styles.stackRoot}
      aria-label="Agent interventions"
      style={{
        ['--stack-offset-total' as string]: `${offsetTotal}px`,
      }}
    >
      {stackDepth > 2 ? (
        <span
          className={styles.stackBadge}
          style={{ zIndex: stackDepth + 10 }}
          aria-hidden
        >
          {stackDepth - 1}
        </span>
      ) : null}

      <div className={styles.stack}>
        {reversedItems.map((item, index) => {
          const isFront = index === 0;
          return (
            <div
              key={getItemKey(item)}
              className={classNames(styles.stackLayer, {
                [styles.stackLayerFront]: isFront,
                [styles.stackLayerBack]: !isFront,
              })}
              style={{
                zIndex: stackDepth - index,
                ...(isFront
                  ? undefined
                  : {
                      bottom: index * STACK_OFFSET_PX,
                      transform: `translate(${index * STACK_OFFSET_PX}px, -${
                        index * STACK_OFFSET_PX
                      }px)`,
                    }),
              }}
              aria-hidden={!isFront}
            >
              <div className={styles.cardSlot}>{renderCard(item, isFront)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DockPanel;
