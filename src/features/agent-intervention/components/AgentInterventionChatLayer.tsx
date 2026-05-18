import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React from 'react';
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
  useAgentInterventionDevMock({
    conversationId,
    messageList,
    injectMockAcpPermission,
    injectMockMcpAsk,
    injectAllInterventionMocks,
  });

  const queueItems = useActiveInterventionQueue(messageList);

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
        onRespondMcpAsk={onRespondMcpAsk}
      />
    </div>
  );
};

export default AgentInterventionChatLayer;
