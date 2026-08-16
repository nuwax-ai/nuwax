import type {
  ConversationEffect,
  ConversationEffectsAdapter,
} from '@/features/conversation/runtime/effectDispatcher';
import { emitConversationListTaskStatus } from '@/utils/conversationTaskStatusSync';

/**
 * ConversationAgent 隔离入口的 Effects Adapter：只执行隔离允许的 recent/taskStatus 子集。
 *
 * 与主 Chat 的差异（保持既有行为，不是裁剪遗漏）：
 * - 不做发送时的乐观「执行中」标记（隔离面板不驱动侧栏新会话入列表）；
 * - 不做流结束后的列表刷新（由主 Chat 实例负责）。
 * 因此仅消费无 context 的终态补丁，其余 effect 静默忽略。
 */
export function createPreviewEffectsAdapter(): ConversationEffectsAdapter {
  return {
    dispatch(effect: ConversationEffect) {
      if (effect.type !== 'recent.status.patch' || effect.context) {
        return;
      }
      emitConversationListTaskStatus(effect.conversationId, effect.status);
    },
  };
}
