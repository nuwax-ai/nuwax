import type { TaskStatus } from '@/types/enums/agent';
import type { CardDataInfo } from '@/types/interfaces/cardInfo';
import type {
  ConversationChatSuggestParams,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import { logConversationEffectDispatch } from '@/utils/conversationEffectsDiagnostics';

/** PROCESSING Page 组件的预览载荷（调用点构造，Adapter 透传给页面预览）。 */
export interface PagePreviewPayload {
  uri?: string;
  params: Record<string, unknown>;
  executeId: string;
  method?: string;
  request_id?: string | number;
  data_type?: string;
}

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
    }
  | {
      type: 'topic.update';
      conversationId: number;
      firstMessage: string;
      /** 发起时的会话信息快照：成功后以此快照为基底合并主题字段（保持原有覆盖语义）。 */
      currentInfo: ConversationInfo;
    }
  | {
      type: 'preview.page.open';
      preview: PagePreviewPayload;
    }
  | {
      type: 'preview.link.open';
      url: string;
    }
  | {
      type: 'card.result.apply';
      cardBindConfig: {
        bindCardStyle?: string | number;
        cardKey?: string;
      };
      /** SSE 原始载荷：LIST 为数组、单卡为对象（运行时形状宽松，Adapter 负责归一） */
      cardData: CardDataInfo[] | Record<string, unknown>;
      /** 同一次会话请求则追加，否则替换（调用点以 requestId 判定） */
      append: boolean;
    }
  | {
      type: 'desktop.open';
      conversationId: number;
    }
  | {
      type: 'preview.file.refresh';
      conversationId: number;
      /** throttled：流式 ToolCall 的节流刷新；immediate：FINAL_RESULT 后的立即刷新 */
      mode: 'throttled' | 'immediate';
    }
  | {
      type: 'conflict.confirmStop';
      conversationId: number;
    }
  | {
      /**
       * TaskAgent FINAL_RESULT 后处理（保序组合体）：立即刷新文件树 → 按需刷新 Git →
       * task-result 文件选中并打开预览 → 未命中时发兜底正文重拉 trigger。
       * 时序上依赖树刷新完成，故不拆分为独立 effect（方案 §5.5 清单的工程化取舍）。
       */
      type: 'taskResult.settle';
      conversationId: number;
      taskResult: { hasTaskResult: boolean; file?: string };
      enableVersionControl: boolean;
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
