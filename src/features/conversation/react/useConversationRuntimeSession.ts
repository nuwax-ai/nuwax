import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  hydrateMcpAskInteractionsInMessageList,
  prependAndHydrateMcpAskMessageList,
  useAgentInterventionHandlers,
} from '@/components/business-component/AgentIntervention';
import { reconcileFinalMessageState } from '@/components/business-component/AgentIntervention/utils/reconcileFinalMessageState';
import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import {
  applyTerminalTaskStatus,
  createRuntimeLineEffectsAdapter,
  runtimeLineHttp,
} from '@/features/conversation/react/runtimeLineHttp';
import {
  createConversationMessageStore,
  type ConversationMessageStore,
} from '@/features/conversation/runtime/conversationMessageStore';
import {
  createConversationRuntimeSession,
  type ConversationRuntimeSession,
} from '@/features/conversation/runtime/createConversationRuntimeSession';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import { dict } from '@/services/i18nRuntime';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { modalConfirm } from '@/utils/ant-custom';
import { isConversationRuntimeEnabled } from '@/utils/conversationRuntimeFlag';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

/** store → React Dispatch 形状适配（AgentIntervention 件以 setMessageList 为 deps） */
const storeAsDispatch = (
  store: ConversationMessageStore,
): React.Dispatch<React.SetStateAction<MessageInfo[]>> =>
  ((action: React.SetStateAction<MessageInfo[]>) => {
    if (typeof action === 'function') {
      store.update(action as (prev: MessageInfo[]) => MessageInfo[]);
    } else {
      store.applyStreamReduction(action);
    }
  }) as never;

/**
 * 新线（runtime session）的 React 绑定（双线方案 R4 完整片）。
 *
 * flag 关闭（默认）时不创建 session、返回 null —— 入口回落旧线，零开销零影响。
 * flag 开启时创建 session 并产出「与旧线 chatSessionProps 会话面同形状」的 props：
 * 入口以对象展开覆盖旧线字段（flag off 时无覆盖，原路径原值）。
 *
 * 页面资源（卡片/桌面/文件树等 state 与函数）按「单份共享」决策仍归页面/旧 model，
 * 经 effectsResources 注入新线 effects adapter；未注入的 effect 类型静默忽略。
 */
export interface RuntimeSessionLineOptions {
  conversationId?: number;
  /** 页面资源注入（effect 执行体所需；见 mainChatEffectsAdapter deps） */
  effectsResources?: Record<string, unknown>;
  /** 滚动 refs（resumeController 滚动跟随） */
  messageViewRef?: { current: HTMLDivElement | null };
  allowAutoScrollRef?: { current: boolean };
  /** 是否同步会话记录（隔离入口传 false：不发乐观列表标记、不更新主题） */
  isSync?: boolean;
}

export interface UseConversationRuntimeSessionResult {
  session: ConversationRuntimeSession;
  messageList: MessageInfo[];
  state: ReturnType<ConversationRuntimeSession['getState']>;
  /** 会话面 props：与旧线 chatSessionProps 对应字段同形状，入口展开覆盖 */
  conversationProps: Record<string, unknown>;
}

export function useConversationRuntimeSession(
  options: RuntimeSessionLineOptions = {},
): UseConversationRuntimeSessionResult | null {
  // flag 在 hook 初始化时读取一次：切换即组件树重建（双线方案 §6 风险控制）
  const [enabled] = useState(() => isConversationRuntimeEnabled());
  const {
    conversationId,
    effectsResources,
    messageViewRef,
    allowAutoScrollRef,
  } = options;

  // ---- 绑定层本地会话状态（新线不写旧 model） ----
  const [conversationInfo, setConversationInfo] = useState<
    ConversationInfo | null | undefined
  >(null);
  const [loadingStopConversation, setLoadingStopConversation] = useState(false);
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [isMoreMessage, setIsMoreMessage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const conversationInfoRef = useRef<ConversationInfo | null | undefined>(null);
  conversationInfoRef.current = conversationInfo;
  /** 会话是否开启建议（对齐旧线 isSuggest：agent.openSuggest === Open） */
  const isSuggestEnabledRef = useRef(false);
  isSuggestEnabledRef.current =
    (conversationInfo as never as { agent?: { openSuggest?: number } })?.agent
      ?.openSuggest === 1;

  const sessionRef = useRef<ConversationRuntimeSession | null>(null);
  if (enabled && !sessionRef.current) {
    sessionRef.current = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: getCustomBlock,
        reconcileFinalMessage: reconcileFinalMessageState,
      },
      effectsAdapter: createRuntimeLineEffectsAdapter({
        setConversationInfo,
        resources: {
          ...(effectsResources as never as Record<string, unknown>),
          onSuggestLoaded: (list: string[]) => {
            setLoadingSuggest(false);
            setChatSuggestList(list);
          },
          confirmStop: (conversationId: number) => {
            // 对齐旧线「正在执行任务」冲突确认：确认后停止本会话
            modalConfirm(
              dict('PC.Models.ConversationInfo.taskConflictTitle'),
              dict('PC.Models.ConversationInfo.taskConflictContent'),
              () => {
                sessionRef.current?.stop(conversationId);
                return new Promise((resolve) => {
                  setTimeout(resolve, 2000);
                });
              },
            );
          },
        } as never,
      }),
      stopRequest: async (id) => {
        setLoadingStopConversation(true);
        try {
          return await runtimeLineHttp.stopConversation(String(id));
        } finally {
          setLoadingStopConversation(false);
        }
      },
      loadRequest: (id) => runtimeLineHttp.loadConversation(id),
      applyTaskStatus: (conversationId, status) => {
        applyTerminalTaskStatus(setConversationInfo, conversationId, status);
      },
    });
  }
  const session = sessionRef.current;

  // 会话切换：重置绑定层本地会话状态
  useEffect(() => {
    if (!session || conversationId === undefined) {
      return;
    }
    setConversationInfo(null);
    setChatSuggestList([]);
    session.store.reset();
    void session.load(conversationId).then((data) => {
      if (data) {
        setConversationInfo(data);
      }
      // 有历史则允许首次上滑确认（对齐旧线：len > 0 → isMoreMessage = true）
      setIsMoreMessage((data?.messageList?.length ?? 0) > 0);
      // 会话加载后置底（对齐旧线 load 后强制置底；rAF 连续 800ms）
      const startTime = Date.now();
      const forceScrollToBottom = () => {
        const element = messageViewRef?.current;
        if (element) {
          element.scrollTo({ top: element.scrollHeight, behavior: 'instant' });
        }
        if (Date.now() - startTime < 800) {
          requestAnimationFrame(forceScrollToBottom);
        }
      };
      requestAnimationFrame(forceScrollToBottom);
    });
  }, [session, conversationId, messageViewRef]);

  // 滚动 refs 注入
  useEffect(() => {
    if (session && messageViewRef && allowAutoScrollRef) {
      session.setViewRefs(messageViewRef, allowAutoScrollRef);
    }
  }, [session, messageViewRef, allowAutoScrollRef]);

  // session 派生状态订阅
  const [, bumpVersion] = useState(0);
  useEffect(() => {
    if (!session) {
      return;
    }
    return session.subscribeState({
      onStateChanged: () => {
        bumpVersion((version) => version + 1);
      },
    });
  }, [session]);

  // 干预回执（Ask/ACP）：写入走新线 store（flag off 时落到空 store，无副作用）
  const fallbackStoreRef = useRef<ConversationMessageStore | null>(null);
  if (!fallbackStoreRef.current) {
    fallbackStoreRef.current = createConversationMessageStore();
  }
  const interventionStore = session?.store ?? fallbackStoreRef.current;
  const interventionSetMessageList = useMemo(
    () => storeAsDispatch(interventionStore),
    [interventionStore],
  );
  const { respondAcpPermission, respondMcpAsk } = useAgentInterventionHandlers({
    setMessageList: interventionSetMessageList,
    conversationId,
  });

  const emptyList = useRef<MessageInfo[]>([]);
  const messageList = useSyncExternalStore(
    (listener) => (session ? session.store.subscribe(listener) : () => {}),
    () => (session ? session.store.getSnapshot() : emptyList.current),
  );

  const onSendMessage = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      skillIds?: number[],
      modelId?: number,
      agentMode?: AgentMode,
    ) => {
      if (!session || conversationId === undefined) {
        return;
      }
      const isSync = options.isSync !== false;
      // 建议拉取置 loading（结果经 effect 写回；对齐旧线 loadingSuggest）
      setLoadingSuggest(true);
      session.send({
        conversationId,
        message: messageInfo,
        files: files as never,
        currentInfo: conversationInfoRef.current,
        debug: false,
        isSuggestEnabled: isSuggestEnabledRef.current,
        topicGate: { isSync },
        skillIds,
        modelId,
        agentMode,
      });
    },
    [session, conversationId, options.isSync],
  );

  const onLoadMoreMessage = useCallback(
    async (targetConversationId: number) => {
      if (!session || loadingMore || !isMoreMessage) {
        return;
      }
      const list = session.store.getSnapshot();
      if (!list.length) {
        return;
      }
      const currentIndex = (list[0] as { index?: number }).index || 0;
      setLoadingMore(true);
      try {
        const result = await runtimeLineHttp.fetchMessagePage(
          targetConversationId,
          currentIndex,
          MESSAGE_PAGE_SIZE,
        );
        const page = (result?.data ?? []) as MessageInfo[];
        if (page.length) {
          session.store.prependFromHistory(
            prependAndHydrateMcpAskMessageList(page, []),
          );
          setIsMoreMessage(page.length >= MESSAGE_PAGE_SIZE);
        } else {
          setIsMoreMessage(false);
        }
      } catch (error) {
        console.error('[runtimeLine] load more failed:', error);
      } finally {
        setLoadingMore(false);
      }
    },
    [session, loadingMore, isMoreMessage],
  );

  const runStopConversation = useCallback(
    async (id: string) => {
      session?.stop(id);
    },
    [session],
  );

  const onReloadConversationHistoryAsync = useCallback(
    async (reloadId: number) => {
      if (!session) {
        return undefined;
      }
      const data = await session.load(reloadId);
      if (data) {
        setConversationInfo(data);
      }
      return data?.messageList;
    },
    [session],
  );

  const onConversationSnapshot = useCallback(
    (snapshot: ConversationInfo) => {
      if (!session || !snapshot) {
        return;
      }
      const hydrated = hydrateMcpAskInteractionsInMessageList(
        snapshot.messageList || [],
      );
      session.applySnapshot(snapshot.id, hydrated);
    },
    [session],
  );

  const onTerminalTaskStatus = useCallback(
    (status: never) => {
      if (!session) {
        return;
      }
      const current = session.getState().currentConversationId;
      if (current === null) {
        return;
      }
      applyTerminalTaskStatus(setConversationInfo, current, status);
    },
    [session],
  );

  if (!session) {
    return null;
  }

  const state = session.getState();
  const taskExecuting = conversationInfo?.taskStatus === 'EXECUTING';

  const conversationProps: Record<string, unknown> = {
    messageList,
    // 完整活跃（本地流式 || 后台执行中）：与旧线入口合成规则一致
    isConversationActive: state.isConversationActive || taskExecuting,
    isLocallyStreaming: state.isConversationActive,
    isAwaitingChatTerminal: state.isAwaitingChatTerminal,
    onSendMessage,
    runStopConversation,
    loadingStopConversation,
    onResumeConversationStream: session.resumeConversationStream.bind(session),
    onAbortResumeStream: session.abortResumeStream.bind(session),
    onReloadConversationHistoryAsync,
    onConversationSnapshot,
    onTerminalTaskStatus,
    conversationInfo,
    chatSuggestList,
    loadingSuggest,
    isMoreMessage,
    loadingMore,
    onLoadMoreMessage,
    interventionHandlers: { respondAcpPermission, respondMcpAsk },
    isLoadingOtherInterface: false,
    getCurrentConversationId: () =>
      session.getState().currentConversationId as number | null,
    getCurrentConversationRequestId: () => session.getState().currentRequestId,
    disabledConversationActive: () => session.stop(''),
    setMessageList: storeAsDispatch(session.store),
  };

  return { session, messageList, state, conversationProps };
}
