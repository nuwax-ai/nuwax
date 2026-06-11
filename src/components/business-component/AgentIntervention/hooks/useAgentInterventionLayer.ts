import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useState } from 'react';
import { useModel } from 'umi';
import type { AgentInterventionChatLayerProps } from '../AgentInterventionChatLayer';
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

const AGENT_MODE_STORAGE_KEY = 'nuwax_agent_mode_cache';

export function useAgentInterventionLayer(
  options: UseAgentInterventionLayerOptions,
): UseAgentInterventionLayerResult {
  const { conversationId, messageList, onSendMessage } = options;
  const [agentMode, setAgentModeState] = useState<AgentMode>(() => {
    try {
      const cached = localStorage.getItem(AGENT_MODE_STORAGE_KEY);
      if (cached === 'yolo' || cached === 'ask') {
        return cached as AgentMode;
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return 'yolo';
  });

  const setAgentMode = useCallback((mode: AgentMode) => {
    setAgentModeState(mode);
    try {
      localStorage.setItem(AGENT_MODE_STORAGE_KEY, mode);
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  const {
    isConversationActive,
    respondAcpPermission,
    respondMcpAsk,
    runStopConversation,
  } = useModel('conversationInfo');

  const cancelActiveConversation = useCallback(async () => {
    if (!isConversationActive || !conversationId) {
      return;
    }
    await runStopConversation(String(conversationId));
  }, [conversationId, isConversationActive, runStopConversation]);

  const handleRespondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      await cancelActiveConversation();
      const resumeMessage = await respondMcpAsk(interaction, payload);
      if (resumeMessage) {
        onSendMessage(resumeMessage);
      }
    },
    [cancelActiveConversation, respondMcpAsk, onSendMessage],
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
