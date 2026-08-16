import {
  reduceConversationEvent,
  type ConversationEventReducerAdapters,
  type ConversationEventReduction,
} from '@/features/conversation/domain/reduceConversationEvent';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  createEffectDispatcher,
  type ConversationEffectsAdapter,
  type EffectDispatcher,
  type EffectDispatchMode,
} from './effectDispatcher';
import {
  createLiveConnectionController,
  type LiveConnectionController,
} from './liveConnectionController';
import {
  createResumeConnectionController,
  type ResumeConnectionController,
} from './resumeConnectionController';

export interface ConversationRuntimeOptions {
  /** 入口注入的 Effects Adapter（主 Chat 全量 / 隔离 Preview 子集）。 */
  effectsAdapter?: ConversationEffectsAdapter;
  /**
   * effect 分发模式，默认 shadow（迁移期只记录计划 effect，旧路径继续执行）。
   * Phase 5 每片对照一致后切 live，再删除旧路径。
   */
  effectDispatchMode?: EffectDispatchMode;
}

export interface ConversationRuntime {
  readonly liveConnection: LiveConnectionController;
  readonly resumeConnection: ResumeConnectionController;
  readonly effects: EffectDispatcher;
  reduceStreamEvent(
    messages: MessageInfo[],
    ownerMessageId: string,
    event: ConversationChatResponse,
  ): ConversationEventReduction;
  resetStreamProjection(): void;
  getActiveOutputMessageId(): string;
}

/**
 * 会话 Runtime Factory 的第一条纵切。
 *
 * Runtime 隐藏跨事件的 activeOutputMessageId，并与 live/sub 连接所有权、effect 分发
 * 绑定为同一实例状态。React model 仍暂时拥有 messageList 与 effects，后续迁移可在不改变
 * 调用方 Interface 的前提下继续把一致性与 effect Adapter 收入该实例。
 */
export function createConversationRuntime(
  adapters: ConversationEventReducerAdapters,
  options?: ConversationRuntimeOptions,
): ConversationRuntime {
  let activeOutputMessageId = '';
  const liveConnection = createLiveConnectionController();
  const resumeConnection = createResumeConnectionController();
  const effects = createEffectDispatcher({
    adapter: options?.effectsAdapter ?? { dispatch: () => {} },
    mode: options?.effectDispatchMode,
  });

  return {
    liveConnection,
    resumeConnection,
    effects,

    reduceStreamEvent(messages, ownerMessageId, event) {
      const reduction = reduceConversationEvent(
        { messages, activeOutputMessageId },
        ownerMessageId,
        event,
        adapters,
      );
      activeOutputMessageId = reduction.activeOutputMessageId;
      return reduction;
    },

    resetStreamProjection() {
      activeOutputMessageId = '';
    },

    getActiveOutputMessageId() {
      return activeOutputMessageId;
    },
  };
}
