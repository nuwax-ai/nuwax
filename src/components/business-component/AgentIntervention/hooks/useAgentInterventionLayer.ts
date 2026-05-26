import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useState } from 'react';
import { useModel } from 'umi';
import type { AgentInterventionChatLayerProps } from '../components/AgentInterventionChatLayer';
import type { AgentMode } from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';

export interface UseAgentInterventionLayerOptions {
  conversationId?: number | string | null;
  messageList: MessageInfo[];
  onSendMessage: (message: string) => void;
}

export interface AgentModeInputProps {
  agentMode: AgentMode;
  onAgentModeChange: (mode: AgentMode) => void;
  showAgentModeSelector: true;
}

export interface UseAgentInterventionLayerResult {
  agentMode: AgentMode;
  chatLayerProps: Pick<
    AgentInterventionChatLayerProps,
    'messageList' | 'onRespondAcpPermission' | 'onRespondMcpAsk'
  >;
  agentModeInputProps: AgentModeInputProps;
}

export function useAgentInterventionLayer(
  options: UseAgentInterventionLayerOptions,
): UseAgentInterventionLayerResult {
  const { messageList, onSendMessage } = options;
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');

  const { respondAcpPermission, respondMcpAsk } = useModel('conversationInfo');

  const handleRespondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const resumeMessage = await respondMcpAsk(interaction, payload);
      if (resumeMessage) {
        onSendMessage(resumeMessage);
      }
    },
    [respondMcpAsk, onSendMessage],
  );

  return {
    agentMode,
    chatLayerProps: {
      messageList,
      onRespondAcpPermission: respondAcpPermission,
      onRespondMcpAsk: handleRespondMcpAsk,
    },
    agentModeInputProps: {
      agentMode,
      onAgentModeChange: setAgentMode,
      showAgentModeSelector: true,
    },
  };
}
