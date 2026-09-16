/**
 * 新线（runtime line）的 HTTP 适配层（双线方案 R4）。
 *
 * services 调用集中于此（umi 环境内运行；session/绑定层不直接 import services，
 * 保持非 umi 测试环境可导入）。同时组装新线的 effects adapter：
 * - recent/list 面：自足（与旧线 eventBus 行为逐字一致）；
 * - suggest/topic 面：services 直调（已知差异：无 useRequest 防抖，双轨对照记录）；
 * - 页面资源面（卡片/桌面/文件树/Git/taskResult）：经 effectsResources 注入，
 *   未注入时静默忽略（与隔离子集语义一致）。
 */
import { EVENT_TYPE } from '@/constants/event.constants';
import type { ConversationEffectsAdapter } from '@/features/conversation/runtime/effectDispatcher';
import {
  apiAgentConversation,
  apiAgentConversationChatStop,
  apiAgentConversationChatSuggest,
  apiAgentConversationMessageList,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  applyTerminalTaskStatus,
  emitConversationListTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

export { applyTerminalTaskStatus };

export const runtimeLineHttp = {
  stopConversation: (conversationId: string) =>
    apiAgentConversationChatStop(conversationId),
  loadConversation: (conversationId: number) =>
    apiAgentConversation(conversationId),
  fetchMessagePage: (conversationId: number, index: number, size: number) =>
    apiAgentConversationMessageList({ conversationId, index, size }),
};

/** 页面资源注入面（缺省项以安全 noop 兜底；见 mainChatEffectsAdapter deps） */
export interface RuntimeLineEffectsResources {
  isAppSidebarMode?: boolean;
  runHistory?: (params: {
    agentId: number | string | null;
    limit: number;
  }) => void;
  runHistoryItem?: (params: {
    agentId: number | string | null;
    limit: number;
  }) => void;
  showPagePreview?: (preview: unknown) => void;
  openDesktop?: (conversationId: number) => void;
  setCardList?: Dispatch<SetStateAction<unknown[]>>;
  setShowType?: Dispatch<SetStateAction<unknown>>;
  refreshFileListThrottled?: (conversationId: number) => void;
  refreshFileListImmediately?: (conversationId: number) => Promise<unknown>;
  refreshGitListRef?: MutableRefObject<(() => void | Promise<void>) | null>;
  openPreviewView?: (conversationId: number) => Promise<void> | void;
  setTaskAgentSelectedFileId?: Dispatch<SetStateAction<string>>;
  setTaskAgentSelectTrigger?: Dispatch<SetStateAction<number | string>>;
  setFileTreeRefreshTrigger?: Dispatch<SetStateAction<number>>;
  /** 建议请求状态写回（仅真正发起 suggest 请求时进入 loading）。 */
  onSuggestLoadingChange?: (
    loading: boolean,
    conversationId: number,
  ) => void;
  /** 建议列表写回（绑定层 setChatSuggestList） */
  onSuggestLoaded?: (list: string[], conversationId: number) => void;
  /** 「正在执行任务」冲突确认（绑定层实现 modalConfirm + 停止） */
  confirmStop?: (conversationId: number) => void;
}

const asyncNoop = async () => {};

/** 建议拉取防抖（对齐旧线 useRequest debounceWait: 300） */
const SUGGEST_DEBOUNCE_MS = 300;

export function createRuntimeLineEffectsAdapter(deps: {
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >;
  resources?: RuntimeLineEffectsResources;
}): ConversationEffectsAdapter {
  const resources = deps.resources ?? {};
  const setConversationInfo = deps.setConversationInfo;
  let suggestDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let suggestRequestVersion = 0;
  /**
   * 「每个会话仅更新一次主题」标记。绑定层实例会跨会话复用，
   * 不能用单个 boolean，否则命名首个会话后会永久拦截后续会话。
   */
  const topicUpdateConversationIds = new Set<number>();

  return {
    dispatch(effect) {
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
        case 'suggest.fetch': {
          // 与旧线对齐：300ms trailing 防抖（连续 FINAL 只发最后一次）
          const conversationId = Number(effect.params.conversationId);
          const requestVersion = ++suggestRequestVersion;
          if (suggestDebounceTimer !== undefined) {
            clearTimeout(suggestDebounceTimer);
          }
          suggestDebounceTimer = setTimeout(() => {
            suggestDebounceTimer = undefined;
            resources.onSuggestLoadingChange?.(true, conversationId);
            void apiAgentConversationChatSuggest(effect.params as never)
              .then((result) => {
                if (requestVersion !== suggestRequestVersion) {
                  return;
                }
                resources.onSuggestLoaded?.(
                  ((result as { data?: string[] })?.data ?? []) as string[],
                  conversationId,
                );
              })
              .catch(() => {
                // 建议拉取失败静默（与旧线 useRequest onError 静默一致）
              })
              .finally(() => {
                if (requestVersion === suggestRequestVersion) {
                  resources.onSuggestLoadingChange?.(false, conversationId);
                }
              });
          }, SUGGEST_DEBOUNCE_MS);
          return;
        }
        case 'conflict.confirmStop':
          resources.confirmStop?.(effect.conversationId);
          return;
        case 'topic.update': {
          if (topicUpdateConversationIds.has(effect.conversationId)) {
            return;
          }
          topicUpdateConversationIds.add(effect.conversationId);
          void apiAgentConversationUpdate({
            id: effect.conversationId,
            firstMessage: effect.firstMessage,
          } as never)
            .then((result) => {
              const snapshot = result?.data as ConversationInfo | undefined;
              setConversationInfo({
                ...effect.currentInfo,
                topicUpdated: snapshot?.topicUpdated as number,
                topic: snapshot?.topic as string,
              });
              if (!resources.isAppSidebarMode) {
                eventBus.emit(EVENT_TYPE.RefreshConversationList, {
                  conversationId: effect.conversationId,
                  reason: 'topic-updated',
                });
              }
              if (resources.isAppSidebarMode) {
                resources.runHistory?.({
                  agentId: effect.currentInfo.agentId,
                  limit: 8,
                });
              } else {
                resources.runHistory?.({ agentId: null, limit: 5 });
                resources.runHistoryItem?.({
                  agentId: effect.currentInfo.agentId,
                  limit: 20,
                });
              }
            })
            .catch((error) => {
              console.error('Failed to update session theme:', error);
              topicUpdateConversationIds.delete(effect.conversationId);
            });
          return;
        }
        case 'preview.page.open':
          resources.showPagePreview?.(effect.preview);
          return;
        case 'preview.link.open':
          window.open(effect.url, '_blank');
          return;
        case 'card.result.apply':
          resources.setCardList?.(effect.cardData as never as unknown[]);
          resources.setShowType?.(2 as never);
          return;
        case 'desktop.open':
          resources.openDesktop?.(effect.conversationId);
          return;
        case 'preview.file.refresh':
          if (effect.mode === 'throttled') {
            resources.refreshFileListThrottled?.(effect.conversationId);
            return;
          }
          void (resources.refreshFileListImmediately ?? asyncNoop)(
            effect.conversationId,
          );
          return;
        case 'taskResult.settle': {
          void (async () => {
            await (resources.refreshFileListImmediately ?? asyncNoop)(
              effect.conversationId,
            );
            if (effect.enableVersionControl) {
              void resources.refreshGitListRef?.current?.();
            }
            let selected = false;
            if (effect.taskResult.hasTaskResult && effect.taskResult.file) {
              resources.openPreviewView?.(effect.conversationId);
              const fileId = effect.taskResult.file
                ?.split(`${effect.conversationId}/`)
                .pop();
              if (fileId) {
                resources.setTaskAgentSelectedFileId?.(fileId);
                resources.setTaskAgentSelectTrigger?.(Date.now());
                selected = true;
              }
            }
            if (!selected) {
              resources.setFileTreeRefreshTrigger?.(Date.now());
            }
          })();
          return;
        }
        default:
          void TaskStatus;
          return;
      }
    },
  };
}
