import { reconcileFinalMessageState } from '@/components/business-component/AgentIntervention/utils/reconcileFinalMessageState';
import {
  createConversationRuntimeSession,
  type ConversationRuntimeSession,
} from '@/features/conversation/runtime/createConversationRuntimeSession';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import { isConversationRuntimeEnabled } from '@/utils/conversationRuntimeFlag';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * 新线（runtime session）的 React 绑定骨架（双线方案 R4 最小切片）。
 *
 * flag 关闭（默认）时不创建 session、返回 null —— 入口回落旧线，零开销零影响。
 * flag 开启时创建单例 session 并订阅消息仓（useSyncExternalStore）。
 *
 * R4 完整片将扩展：与旧线 chatSessionProps 同形状的 props 产出 + Chat 入口接线。
 */
export interface UseConversationRuntimeSessionResult {
  session: ConversationRuntimeSession;
  messageList: ReturnType<ConversationRuntimeSession['store']['getSnapshot']>;
  /** 会话级派生态（订阅 state 通知驱动重渲染） */
  state: ReturnType<ConversationRuntimeSession['getState']>;
}

export function useConversationRuntimeSession(): UseConversationRuntimeSessionResult | null {
  // flag 在 hook 初始化时读取一次：切换即组件树重建（双线方案 §6 风险控制）
  const [enabled] = useState(() => isConversationRuntimeEnabled());

  const sessionRef = useRef<ConversationRuntimeSession | null>(null);
  if (enabled && !sessionRef.current) {
    sessionRef.current = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: getCustomBlock,
        reconcileFinalMessage: reconcileFinalMessageState,
      },
      effectsAdapter: { dispatch: () => {} }, // R4 完整片接入 mainChat/preview adapter
    });
  }
  const session = sessionRef.current;

  // session 派生状态订阅（消息仓经 useSyncExternalStore，state 经强制重渲染计数）
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

  const emptyList = useRef<
    ReturnType<ConversationRuntimeSession['store']['getSnapshot']>
  >([]);
  const messageList = useSyncExternalStore(
    (listener) => (session ? session.store.subscribe(listener) : () => {}),
    () => (session ? session.store.getSnapshot() : emptyList.current),
  );

  if (!session) {
    return null;
  }
  return { session, messageList, state: session.getState() };
}
