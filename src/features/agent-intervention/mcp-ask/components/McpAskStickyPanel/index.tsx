import React from 'react';
import type { McpAskInteraction, McpAskRespondPayload } from '../../../types';
import type { ActiveMcpAskItem } from '../../hooks/useActiveMcpAskInteractions';
import McpAskQuestionCard from '../McpAskQuestionCard';
import styles from './index.less';

interface McpAskStickyPanelProps {
  items: ActiveMcpAskItem[];
  onRespond?: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => void;
}

/**
 * 会话顶部固定的 MCP Ask/Question 卡片区域
 */
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
