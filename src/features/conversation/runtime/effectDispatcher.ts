import type { TaskStatus } from '@/types/enums/agent';
import type {
  ConversationChatSuggestParams,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import { logConversationEffectDispatch } from '@/utils/conversationEffectsDiagnostics';

/**
 * Phase 5 第一片（recent/taskStatus）的 effect 描述子集。
 * 后续片（topic/suggest、page/card/desktop、file/Git、perf）继续在此联合类型上扩展。
 */
export type ConversationEffect =
  | {
      type: 'recent.status.patch';
      conversationId: number | string;
      status: TaskStatus;
      /**
       * 发送时的乐观标记携带的列表上下文（新会话首次入列表需要 agentId/topic）。
       * 无 context 的终态补丁走 emitConversationListTaskStatus 的领域守卫。
       */
      context?: {
        agentId?: ConversationInfo['agentId'];
        topic?: ConversationInfo['topic'];
      };
    }
  | {
      type: 'recent.list.refresh';
      conversationId: number | string;
      reason: string;
    }
  | {
      type: 'suggest.fetch';
      params: ConversationChatSuggestParams;
    };

/** 入口注入的副作用执行器：主 Chat 全量执行，隔离 Preview 执行允许子集。 */
export interface ConversationEffectsAdapter {
  dispatch(effect: ConversationEffect): void;
}

/**
 * shadow：迁移期观察模式——旧路径继续执行副作用，本 dispatcher 只记录计划 effect
 * 并输出诊断日志，供测试与线上对照；对照一致后切 live 并删除旧路径。
 */
export type EffectDispatchMode = 'shadow' | 'live';

export interface EffectDispatcher extends ConversationEffectsAdapter {
  readonly mode: EffectDispatchMode;
  /** 已分发的计划 effect（shadow 记录未执行的计划；live 记录已执行） */
  getJournal(): ConversationEffect[];
  clearJournal(): void;
}

export interface CreateEffectDispatcherOptions {
  adapter: ConversationEffectsAdapter;
  mode?: EffectDispatchMode;
  /**
   * live 模式下仍只记录不执行的类型名单（Phase 5 每片独立走 shadow→live：
   * 已切 live 的类型不受影响，新迁移类型在名单内继续 shadow 对照）。
   */
  shadowEffectTypes?: ConversationEffect['type'][];
}

export function createEffectDispatcher(
  options: CreateEffectDispatcherOptions,
): EffectDispatcher {
  const mode: EffectDispatchMode = options.mode ?? 'shadow';
  const journal: ConversationEffect[] = [];
  const isShadowed = (effect: ConversationEffect) =>
    mode === 'shadow' ||
    (options.shadowEffectTypes?.includes(effect.type) ?? false);

  return {
    mode,

    dispatch(effect) {
      journal.push(effect);
      const shadowed = isShadowed(effect);
      logConversationEffectDispatch({
        mode: shadowed ? 'shadow' : 'live',
        effect,
      });
      if (!shadowed) {
        options.adapter.dispatch(effect);
      }
    },

    getJournal: () => [...journal],

    clearJournal() {
      journal.length = 0;
    },
  };
}
