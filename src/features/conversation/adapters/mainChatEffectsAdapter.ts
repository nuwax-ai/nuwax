import { EVENT_TYPE } from '@/constants/event.constants';
import type {
  ConversationEffect,
  ConversationEffectsAdapter,
  PagePreviewPayload,
} from '@/features/conversation/runtime/effectDispatcher';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { EditAgentShowType } from '@/types/enums/space';
import type { CardDataInfo } from '@/types/interfaces/cardInfo';
import type {
  CardInfo,
  ConversationChatSuggestParams,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import { emitConversationListTaskStatus } from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

// 判断对象是否为空（与 utils/common 的 isEmptyObject 同语义；内联以避免
// 该模块经 i18nRuntime 引入 umi 传递依赖，破坏非 umi 环境的测试可导入性）
const isEmptyObject = (obj: Record<string, any>) =>
  obj && typeof obj === 'object' && Object.keys(obj).length === 0;

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
  /** 显示扩展页面预览（useModel 'chat' 句柄，经 ref 转发保持最新闭包）。 */
  showPagePreview: (preview: PagePreviewPayload) => void;
  /** 打开远程桌面视图（model 的 openDesktopView，useCallback 空依赖、引用稳定）。 */
  openDesktop: (conversationId: number) => void;
  /** 展示台卡片列表 state 写回。 */
  setCardList: Dispatch<SetStateAction<CardInfo[]>>;
  /** 展示台展开状态写回。 */
  setShowType: Dispatch<SetStateAction<EditAgentShowType>>;
  /** 节流刷新文件树（流式 ToolCall 场景，经 ref 转发保持最新闭包）。 */
  refreshFileListThrottled: (conversationId: number) => void;
  /** 立即刷新文件树（FINAL_RESULT 场景，经 ref 转发保持最新闭包）。 */
  refreshFileListImmediately: (conversationId: number) => Promise<unknown>;
  /** 刷新 Git 源代码管理列表（页面注入 fileView.refreshGitList 的 ref）。 */
  refreshGitListRef: MutableRefObject<(() => void | Promise<void>) | null>;
  /** 打开预览视图（经 ref 转发保持最新闭包）。 */
  openPreviewView: (conversationId: number) => Promise<void> | void;
  /** 任务智能体选中文件写回。 */
  setTaskAgentSelectedFileId: Dispatch<SetStateAction<string>>;
  /** 任务智能体文件选择触发标志写回。 */
  setTaskAgentSelectTrigger: Dispatch<SetStateAction<number | string>>;
  /** 文件树刷新后兜底重拉当前文件正文的触发标志写回。 */
  setFileTreeRefreshTrigger: Dispatch<SetStateAction<number>>;
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
        case 'preview.page.open':
          deps.showPagePreview(effect.preview);
          return;
        case 'preview.link.open':
          window.open(effect.url, '_blank');
          return;
        case 'card.result.apply': {
          const { cardBindConfig, cardData, append } = effect;
          deps.setCardList((cardList) => {
            // 竖向列表
            if (cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST) {
              // 过滤掉空对象, 因为cardData中可能存在空对象
              const source = Array.isArray(cardData) ? cardData : [];
              const _cardData = source.filter((item) => !isEmptyObject(item));
              // 如果卡片列表不为空，则自动展开展示台
              if (_cardData?.length) {
                deps.setShowType(EditAgentShowType.Show_Stand);
              }
              const cardDataList =
                _cardData?.map((item: CardDataInfo) => ({
                  ...item,
                  cardKey: cardBindConfig.cardKey,
                })) || [];
              // 如果是同一次会话请求，则追加，否则更新
              return (
                append ? [...cardList, ...cardDataList] : [...cardDataList]
              ) as CardInfo[];
            }
            // 自动展开展示台
            deps.setShowType(EditAgentShowType.Show_Stand);
            // 单张卡片
            const cardInfo = {
              ...(cardData as unknown as CardDataInfo),
              cardKey: cardBindConfig?.cardKey,
            };
            // 如果是同一次会话请求，则追加，否则更新
            return (
              append ? [...cardList, cardInfo] : [cardInfo]
            ) as CardInfo[];
          });
          return;
        }
        case 'desktop.open':
          deps.openDesktop(effect.conversationId);
          return;
        case 'preview.file.refresh':
          if (effect.mode === 'throttled') {
            deps.refreshFileListThrottled(effect.conversationId);
            return;
          }
          void deps.refreshFileListImmediately(effect.conversationId);
          return;
        case 'taskResult.settle': {
          void (async () => {
            // 1. 立即刷新文件树（后续文件选中/Git 刷新依赖树的新状态）
            await deps.refreshFileListImmediately(effect.conversationId);

            // 2. 开启版本管理时，同步刷新 Git 源代码管理列表
            if (effect.enableVersionControl) {
              void deps.refreshGitListRef.current?.();
            }

            // 3. 有任务结果文件时：打开预览视图并选中该文件
            let selectedFileInTaskResult = false;
            if (effect.taskResult.hasTaskResult && effect.taskResult.file) {
              deps.openPreviewView(effect.conversationId);
              const fileId = effect.taskResult.file
                ?.split(`${effect.conversationId}/`)
                .pop();
              if (fileId) {
                deps.setTaskAgentSelectedFileId(fileId);
                // 每次设置文件ID时更新触发标志，确保即使文件ID相同也能触发文件选择
                deps.setTaskAgentSelectTrigger(Date.now());
                selectedFileInTaskResult = true;
              }
            }

            // 4. 兜底：本次最终输出未携带指向当前打开文件的 task-result file，
            //    发出 trigger 通知页面层在树刷新完成后重拉当前打开文件的正文
            if (!selectedFileInTaskResult) {
              deps.setFileTreeRefreshTrigger(Date.now());
            }
          })();
          return;
        }
      }
    },
  };
}
