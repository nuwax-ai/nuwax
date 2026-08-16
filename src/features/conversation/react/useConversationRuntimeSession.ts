import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { hydrateMcpAskInteractionsInMessageList } from '@/components/business-component/AgentIntervention';
import { reconcileFinalMessageState } from '@/components/business-component/AgentIntervention/utils/reconcileFinalMessageState';
import {
  applyTerminalTaskStatus,
  createRuntimeLineEffectsAdapter,
  runtimeLineHttp,
} from '@/features/conversation/react/runtimeLineHttp';
import type { ConversationMessageStore } from '@/features/conversation/runtime/conversationMessageStore';
import {
  createConversationRuntimeSession,
  type ConversationRuntimeSession,
} from '@/features/conversation/runtime/createConversationRuntimeSession';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { isConversationRuntimeEnabled } from '@/utils/conversationRuntimeFlag';
import {
  useCallback,
  useEffect,
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
  const conversationInfoRef = useRef<ConversationInfo | null | undefined>(null);
  conversationInfoRef.current = conversationInfo;

  const sessionRef = useRef<ConversationRuntimeSession | null>(null);
  if (enabled && !sessionRef.current) {
    sessionRef.current = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: getCustomBlock,
        reconcileFinalMessage: reconcileFinalMessageState,
      },
      effectsAdapter: createRuntimeLineEffectsAdapter({
        setConversationInfo,
        resources: effectsResources as never,
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
    });
  }
  const session = sessionRef.current;

  // 会话切换：重置绑定层本地会话状态
  useEffect(() => {
    if (!session || conversationId === undefined) {
      return;
    }
    setConversationInfo(null);
    session.store.reset();
    void session.load(conversationId).then((data) => {
      if (data) {
        setConversationInfo(data);
      }
    });
  }, [session, conversationId]);

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

  const emptyList = useRef<MessageInfo[]>([]);
  const messageList = useSyncExternalStore(
    (listener) => (session ? session.store.subscribe(listener) : () => {}),
    () => (session ? session.store.getSnapshot() : emptyList.current),
  );

  const onSendMessage = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      _skillIds?: number[],
      modelId?: number,
      agentMode?: AgentMode,
    ) => {
      if (!session || conversationId === undefined) {
        return;
      }
      session.send({
        conversationId,
        message: messageInfo,
        files: files as never,
        currentInfo: conversationInfoRef.current,
        debug: false,
      });
      void modelId;
      void agentMode;
    },
    [session, conversationId],
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
    isLoadingOtherInterface: false,
    getCurrentConversationId: () =>
      session.getState().currentConversationId as number | null,
    getCurrentConversationRequestId: () => session.getState().currentRequestId,
    disabledConversationActive: () => session.stop(''),
    setMessageList: storeAsDispatch(session.store),
  };

  return { session, messageList, state, conversationProps };
}
