import React from 'react';
import type { ActiveMcpAskItem } from '../../hooks/useActiveMcpAskInteractions';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../../types/mcpAskIntervention';
import McpAskQuestionCard from '../McpAskQuestionCard';
import styles from './index.less';

interface McpAskStickyPanelProps {
  items: ActiveMcpAskItem[];
  onRespond?: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => void;
}

const McpAskStickyPanel: React.FC<McpAskStickyPanelProps> = ({
  items,
  onRespond,
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className={styles.panel} role="region" aria-label="Agent question">
      {items.map(({ interaction }) => (
        <McpAskQuestionCard
          key={interaction.input.requestId}
          interaction={interaction}
          onRespond={(payload) => onRespond?.(interaction, payload)}
        />
      ))}
    </div>
  );
};

export default McpAskStickyPanel;
