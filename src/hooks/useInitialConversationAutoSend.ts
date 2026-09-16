import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { apiAgentConversation } from '@/services/agentConfig';
import { MessageTypeEnum } from '@/types/enums/agent';
import type { SendMessageParams } from '@/types/interfaces/conversationInfo';
import { useEffect, useRef } from 'react';

export interface InitialConversationState {
  message?: string;
  files?: SendMessageParams['files'];
  infos?: SendMessageParams['infos'];
  skillIds?: number[];
  modelId?: number;
  agentMode?: AgentMode;
}

interface UseInitialConversationAutoSendParams {
  conversationId?: number;
  routeState?: InitialConversationState | null;
  getEffectiveSandboxId: (conversationInfo?: unknown) => string | number;
  onMessageSend: (params: SendMessageParams) => void;
}

const hasInitialPayload = (state?: InitialConversationState | null) =>
  Boolean(
    state &&
      (state.message?.trim() || state.files?.length || state.skillIds?.length),
  );

/**
 * 开发详情进页时消费路由透传的首条消息。
 *
 * 详情查询不复用 conversationInfo model 的防抖 runAsync：进页查询与
 * 自动发送并发时，被防抖取消的 Promise 不会 resolve，会使首条消息挂起。
 */
export const useInitialConversationAutoSend = ({
  conversationId,
  routeState,
  getEffectiveSandboxId,
  onMessageSend,
}: UseInitialConversationAutoSendParams) => {
  const autoSentConversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !conversationId ||
      autoSentConversationIdRef.current === conversationId ||
      !hasInitialPayload(routeState)
    ) {
      return;
    }

    // 请求前占位，防止 effect 重跑时并发查询后重复发送。
    autoSentConversationIdRef.current = conversationId;

    void (async () => {
      let data = null;
      try {
        const result = await apiAgentConversation(conversationId);
        data = result.data;
      } catch (error) {
        console.error('Failed to query conversation before auto-send', error);
      }

      const messageList = data?.messageList || [];
      const canSend =
        messageList.length === 0 ||
        (messageList.length === 1 &&
          messageList[0].messageType === MessageTypeEnum.ASSISTANT);
      if (!canSend) {
        return;
      }

      onMessageSend({
        id: conversationId,
        messageInfo: routeState?.message || '',
        files: routeState?.files,
        infos: routeState?.infos || [],
        sandboxId: String(getEffectiveSandboxId(data)),
        skillIds: routeState?.skillIds,
        modelId: routeState?.modelId,
        agentMode: routeState?.agentMode || 'yolo',
        data,
      });
    })();
  }, [conversationId, getEffectiveSandboxId, onMessageSend, routeState]);
};
