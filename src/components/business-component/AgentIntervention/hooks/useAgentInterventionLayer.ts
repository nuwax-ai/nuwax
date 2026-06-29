import { GLOBAL_POLLING_INTERVAL } from '@/constants/home.constants';
import { DefaultSelectedEnum } from '@/types/enums/agent';
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
  /**
   * 是否允许选择 Agent 模式（智能体 allowChooseMode 配置）。仅 === Yes 时启用模式切换：
   * 读写 localStorage 缓存 + storage 同步；否则 agentMode 固定 yolo，不污染/读取全局缓存，
   * 避免没展示模式切换的会话框误用别的会话切换留下的 ask。
   */
  allowChooseMode?: DefaultSelectedEnum | number;
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
    allowChooseMode,
    onSendMessage,
    interventionHandlers,
  } = options;
  // 仅当智能体开启了模式切换(allowChooseMode===Yes)且非预览模式时，才读写/同步 localStorage 缓存；
  // 否则 agentMode 固定 yolo，避免没展示模式切换的会话框误用别的会话切换留下的 ask。
  const agentModeEnabled = allowChooseMode === DefaultSelectedEnum.Yes;
  const skipStorage = !!interventionHandlers || !agentModeEnabled;
  const [agentMode, setAgentModeState] = useState<AgentMode>(() => {
    if (initialAgentMode === 'yolo' || initialAgentMode === 'ask') {
      return initialAgentMode;
    }
    // 未开启模式切换 / 预览模式：仅内存态，固定 yolo，不读写 localStorage
    if (skipStorage) {
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
      if (skipStorage) {
        return;
      }
      try {
        localStorage.setItem(AGENT_MODE_STORAGE_KEY, mode);
      } catch (e) {
        // ignore localStorage errors
      }
    },
    [skipStorage],
  );

  // 用 ref 跟踪最新 agentMode，避免同步 effect 依赖它而频繁重建定时器
  const agentModeRef = useRef(agentMode);
  agentModeRef.current = agentMode;

  // 模式切换已开启：轮询 + storage 事件把 localStorage 的 agentMode 同步到 state，
  // 使恢复中的会话使用最新模式（多标签下 A 切换后 B 能及时同步）。
  // 未开启模式切换 / 预览模式：仅内存态、不读写 localStorage，跳过。
  useEffect(() => {
    if (skipStorage) {
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
  }, [skipStorage]);

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
