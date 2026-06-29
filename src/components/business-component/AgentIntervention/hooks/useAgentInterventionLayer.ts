import { GLOBAL_POLLING_INTERVAL } from '@/constants/home.constants';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import type { AgentInterventionChatLayerProps } from '../AgentInterventionChatLayer';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
  AgentMode,
} from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';

/**
 * 隔离会话源（如 ConversationAgent 预览 Tab / conversationAgent model）时注入，
 * 避免干预回执误写入全局 conversationInfo 的 messageList。
 */
export interface AgentInterventionHandlersOverride {
  respondAcpPermission: (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
  ) => void | Promise<void>;
  respondMcpAsk: (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => Promise<string | null | undefined>;
  runStopConversation: (conversationId: string) => Promise<unknown>;
  isConversationActive: boolean;
}

export interface UseAgentInterventionLayerOptions {
  conversationId?: number | string | null;
  messageList: MessageInfo[];
  /** 由上层（如新建项目页）透传的初始 Agent 模式，优先于 localStorage 缓存 */
  initialAgentMode?: AgentMode;
  onSendMessage: (message: string) => void;
  /**
   * 非 conversationInfo 会话源时传入（如 ConversationAgent 预览 Tab），
   * 使 Dock 回执与停止会话作用于正确的 model。
   */
  interventionHandlers?: AgentInterventionHandlersOverride;
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
  const {
    conversationId,
    messageList,
    initialAgentMode,
    onSendMessage,
    interventionHandlers,
  } = options;
  const [agentMode, setAgentModeState] = useState<AgentMode>(() => {
    if (initialAgentMode === 'yolo' || initialAgentMode === 'ask') {
      return initialAgentMode;
    }
    // ConversationAgent 预览调试（interventionHandlers 注入）：仅内存态，不读写 localStorage
    if (interventionHandlers) {
      return 'yolo';
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

  const setAgentMode = useCallback(
    (mode: AgentMode) => {
      setAgentModeState(mode);
      if (interventionHandlers) {
        return;
      }
      try {
        localStorage.setItem(AGENT_MODE_STORAGE_KEY, mode);
      } catch (e) {
        // ignore localStorage errors
      }
    },
    [interventionHandlers],
  );

  // 用 ref 跟踪最新 agentMode，避免同步 effect 依赖它而频繁重建定时器
  const agentModeRef = useRef(agentMode);
  agentModeRef.current = agentMode;

  // 模式切换已开启：轮询 + storage 事件把 localStorage 的 agentMode 同步到 state，
  // 使恢复中的会话使用最新模式（多标签下 A 切换后 B 能及时同步）。
  // 预览模式（interventionHandlers）仅内存态、不读写 localStorage，跳过。
  useEffect(() => {
    if (interventionHandlers) {
      return;
    }
    const syncFromCache = () => {
      try {
        const cached = localStorage.getItem(AGENT_MODE_STORAGE_KEY);
        if (
          (cached === 'yolo' || cached === 'ask') &&
          cached !== agentModeRef.current
        ) {
          // 仅更新 state，不回写缓存，避免与写入方形成循环
          setAgentModeState(cached as AgentMode);
        }
      } catch (e) {
        // ignore localStorage errors
      }
    };
    // 跨标签：storage 事件即时同步
    window.addEventListener('storage', syncFromCache);
    // 同标签兜底：与全局轮询同频定期读
    const timer = window.setInterval(syncFromCache, GLOBAL_POLLING_INTERVAL);
    return () => {
      window.removeEventListener('storage', syncFromCache);
      window.clearInterval(timer);
    };
  }, [interventionHandlers]);

  const conversationInfoModel = useModel('conversationInfo');

  const respondAcpPermission =
    interventionHandlers?.respondAcpPermission ??
    conversationInfoModel.respondAcpPermission;
  const respondMcpAsk =
    interventionHandlers?.respondMcpAsk ?? conversationInfoModel.respondMcpAsk;
  const runStopConversation =
    interventionHandlers?.runStopConversation ??
    conversationInfoModel.runStopConversation;
  const isConversationActive =
    interventionHandlers?.isConversationActive ??
    conversationInfoModel.isConversationActive;

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
