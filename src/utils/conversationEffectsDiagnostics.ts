import type {
  ConversationEffect,
  EffectDispatchMode,
} from '@/features/conversation/runtime/effectDispatcher';
import { createLogger } from '@/utils/logger';

const conversationEffectsLogger = createLogger('[ConversationEffects]');

const summarizeEffect = (effect: ConversationEffect) => {
  if (effect.type === 'recent.status.patch') {
    return {
      type: effect.type,
      conversationId: effect.conversationId,
      status: effect.status,
      hasContext: !!effect.context,
    };
  }
  if (effect.type === 'suggest.fetch') {
    // 诊断不保存用户正文（§9.1），只记录定位字段
    return {
      type: effect.type,
      conversationId: effect.params?.conversationId,
      messageLength: (effect.params?.message || '').length,
    };
  }
  if (effect.type === 'topic.update') {
    return {
      type: effect.type,
      conversationId: effect.conversationId,
      firstMessageLength: (effect.firstMessage || '').length,
      topicUpdated: effect.currentInfo?.topicUpdated,
    };
  }
  return {
    type: effect.type,
    conversationId: effect.conversationId,
    reason: effect.reason,
  };
};

/**
 * Phase 5 迁移期诊断：shadow observation 下记录计划 effect，供线上与测试对照
 * 旧路径实际副作用（eventBus 发射）。对照一致切 live 后，本模块随旧路径一并清理。
 */
export function logConversationEffectDispatch(entry: {
  mode: EffectDispatchMode;
  effect: ConversationEffect;
}): void {
  if (entry.mode !== 'shadow') {
    return;
  }
  conversationEffectsLogger.info('plan', {
    mode: entry.mode,
    ...summarizeEffect(entry.effect),
  });
}
