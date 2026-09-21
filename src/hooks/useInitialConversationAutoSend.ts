import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { ConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import { MessageTypeEnum } from '@/types/enums/agent';
import { OpenCloseEnum } from '@/types/enums/space';
import type { SendMessageParams } from '@/types/interfaces/conversationInfo';
import { fetchConversationSnapshot } from '@/utils/conversationTaskStatusSync';
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
  /**
   * V2 runtime 线 session：存在时首条消息直发 runtime store（乐观轮次立即可见，
   * 与渲染同线），缺省（flag 关）回落 V1 onMessageSend（bug 2477：进页自动发送
   * 写 V1 model 列表而面板渲染 V2 store，消息要等 5s 快照轮询捞回才可见）。
   */
  runtimeSession?: ConversationRuntimeSession | null;
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
  runtimeSession,
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
        // 经共享快照入口拉取（bug 2477）：与进页首拉的轮询/详情查询走同一
        // 单飞通道，同瞬间的重复详情请求合并为一发，首条消息更快发出。
        data = (await fetchConversationSnapshot(conversationId)) ?? null;
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

      // V2：直发 runtime store，乐观轮次与面板渲染同线（参数映射对齐 Chat 页
      // runtimeSession.send）；V1（flag 关）：回落 model 线原路径。
      if (runtimeSession) {
        runtimeSession.send({
          conversationId,
          message: routeState?.message || '',
          files: routeState?.files,
          infos: routeState?.infos,
          sandboxId: String(getEffectiveSandboxId(data)),
          currentInfo: data,
          isSuggestEnabled: data?.agent?.openSuggest === OpenCloseEnum.Open,
          skillIds: routeState?.skillIds,
          modelId: routeState?.modelId,
          agentMode: routeState?.agentMode || 'yolo',
        });
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
  }, [
    conversationId,
    getEffectiveSandboxId,
    onMessageSend,
    routeState,
    runtimeSession,
  ]);
};
