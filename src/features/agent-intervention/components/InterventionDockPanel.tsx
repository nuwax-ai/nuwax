import classNames from 'classnames';
import React, { useCallback } from 'react';
import AcpPermissionCard from '../acp-permission/components/AcpPermissionCard';
import type { InterventionQueueItem } from '../hooks/useActiveInterventionQueue';
import McpAskQuestionCard from '../mcp-ask/components/McpAskQuestionCard';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types';
import dockCardStyles from './intervention-dock-card.module.less';
import styles from './InterventionDockPanel.less';

/** 每层后方卡片相对前一张向右上偏移（px） */
const STACK_OFFSET_PX = 5;

export interface InterventionDockPanelProps {
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

/**
 * 会话输入框上方固定区：多干预底边对齐、完全重叠，z-index 分层，后方卡片右上 5px 阶梯露出
 */
const InterventionDockPanel: React.FC<InterventionDockPanelProps> = ({
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

  return (
    <div
      className={styles.stackRoot}
      aria-label="Agent interventions"
      style={{
        ['--stack-offset-total' as string]: `${offsetTotal}px`,
      }}
    >
      <span
        className={styles.stackBadge}
        style={{ zIndex: stackDepth + 10 }}
        aria-hidden
      >
        {stackDepth}
      </span>

      <div className={styles.stack}>
        {items.map((item, index) => {
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

export default InterventionDockPanel;
