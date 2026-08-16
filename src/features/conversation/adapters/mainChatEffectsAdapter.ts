import { EVENT_TYPE } from '@/constants/event.constants';
import type {
  ConversationEffect,
  ConversationEffectsAdapter,
} from '@/features/conversation/runtime/effectDispatcher';
import type {
  ConversationChatSuggestParams,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import { emitConversationListTaskStatus } from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

export interface MainChatTopicContext {
  isAppSidebarMode: boolean;
  runHistory: (params: {
    agentId: number | string | null;
    limit: number;
  }) => void;
  runHistoryItem: (params: {
    agentId: number | string | null;
    limit: number;
  }) => void;
}

export interface MainChatEffectsAdapterDeps {
  /** 拉取问题建议（model 的 useRequest 句柄，经 ref 转发保持最新闭包）。 */
  fetchSuggest: (params: ConversationChatSuggestParams) => void;
  /** 更新会话主题（model 的 useRequest runAsync 句柄，经 ref 转发保持最新闭包）。 */
  updateTopic: (input: {
    id: number;
    firstMessage: string;
  }) => Promise<RequestResponse<ConversationInfo>>;
  /** 写回会话信息（React setState，稳定引用）。 */
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >;
  /** 「仅更新一次主题」标记（跨 render ref，成功置 false / 失败回滚）。 */
  needUpdateTopicRef: MutableRefObject<boolean>;
  /** 每 render 刷新的上下文读取器（侧栏模式与历史列表句柄，防 stale 闭包）。 */
  getTopicContext: () => MainChatTopicContext;
}

/**
 * 主 Chat 入口的 Effects Adapter：执行 recent/taskStatus、suggest 与 topic 副作用。
 *
 * - 带 context 的 recent.status.patch：发送时的乐观「执行中」标记（新会话入列表），
 *   直接发射事件，不经过终态守卫（EXECUTING 是本路径的目标态）；
 * - 无 context 的 recent.status.patch：终态补丁，经 emitConversationListTaskStatus
 *   的领域守卫（跳过 undefined / EXECUTING，仅终态落列表）；
 * - recent.list.refresh：流结束后刷新侧栏列表；
 * - suggest.fetch：FINAL_RESULT 后按会话配置拉取问题建议；
 * - topic.update：首轮消息后更新会话主题（gate 由调用点判定），成功后写回快照、
 *   刷新侧栏列表/会话历史，失败回滚「仅一次」标记。
 */
export function createMainChatEffectsAdapter(
  deps: MainChatEffectsAdapterDeps,
): ConversationEffectsAdapter {
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
        case 'suggest.fetch':
          deps.fetchSuggest(effect.params);
          return;
        case 'topic.update': {
          // 标记已更新，防止重复调用（与原 updateTopicOnce 语义一致）
          deps.needUpdateTopicRef.current = false;
          void (async () => {
            try {
              const result = await deps.updateTopic({
                id: effect.conversationId,
                firstMessage: effect.firstMessage,
              });

              // 更新会话信息：以发起时的快照为基底合并主题字段（保持原有覆盖语义）
              deps.setConversationInfo({
                ...effect.currentInfo,
                topicUpdated: result.data?.topicUpdated,
                topic: result.data?.topic,
              });

              const { isAppSidebarMode, runHistory, runHistoryItem } =
                deps.getTopicContext();
              if (!isAppSidebarMode) {
                eventBus.emit(EVENT_TYPE.RefreshConversationList, {
                  conversationId: effect.conversationId,
                  reason: 'topic-updated',
                });
              }

              if (isAppSidebarMode) {
                // 应用智能体模式：同步更新当前智能体的会话记录
                runHistory({ agentId: effect.currentInfo.agentId, limit: 8 });
              } else {
                runHistory({ agentId: null, limit: 5 });
                runHistoryItem({
                  agentId: effect.currentInfo.agentId,
                  limit: 20,
                });
              }
            } catch (error) {
              console.error('Failed to update session theme:', error);
              // 更新失败时重置标志，允许下次重试
              deps.needUpdateTopicRef.current = true;
            }
          })();
          return;
        }
      }
    },
  };
}
