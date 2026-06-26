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
  /** 由上层（如新建项目页）透传的初始 Agent 模式，优先于 localStorage 缓存 */
  initialAgentMode?: AgentMode;
  onSendMessage: (message: string) => void;
}

export interface AgentModeInputProps {
  agentMode: AgentMode;
  onAgentModeChange: (mode: AgentMode) => void;
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
  const { conversationId, messageList, initialAgentMode, onSendMessage } =
    options;
  const [agentMode, setAgentModeState] = useState<AgentMode>(() => {
    // 优先使用透传的初始模式，其次 localStorage 缓存，最后兜底 yolo
    if (initialAgentMode === 'yolo' || initialAgentMode === 'ask') {
      return initialAgentMode;
    }
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
    },
  };
}
