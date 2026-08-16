import { EVENT_TYPE } from '@/constants/event.constants';
import type {
  ConversationEffect,
  ConversationEffectsAdapter,
} from '@/features/conversation/runtime/effectDispatcher';
import { emitConversationListTaskStatus } from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';

/**
 * 主 Chat 入口的 Effects Adapter：执行 recent/taskStatus 全部副作用。
 *
 * - 带 context 的 recent.status.patch：发送时的乐观「执行中」标记（新会话入列表），
 *   直接发射事件，不经过终态守卫（EXECUTING 是本路径的目标态）；
 * - 无 context 的 recent.status.patch：终态补丁，经 emitConversationListTaskStatus
 *   的领域守卫（跳过 undefined / EXECUTING，仅终态落列表）；
 * - recent.list.refresh：流结束后刷新侧栏列表。
 */
export function createMainChatEffectsAdapter(): ConversationEffectsAdapter {
  return {
    dispatch(effect: ConversationEffect) {
      switch (effect.type) {
        case 'recent.status.patch': {
          if (effect.context) {
            eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
              conversationId: effect.conversationId,
              agentId: effect.context.agentId,
              topic: effect.context.topic,
              taskStatus: effect.status,
            });
            return;
          }
          emitConversationListTaskStatus(effect.conversationId, effect.status);
          return;
        }
        case 'recent.list.refresh':
          eventBus.emit(EVENT_TYPE.RefreshConversationList, {
            conversationId: effect.conversationId,
            reason: effect.reason,
          });
          return;
      }
    },
  };
}
