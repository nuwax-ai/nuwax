import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { conversationErrorTerminalLogger } from '@/utils/logger';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

/** 发送后活跃保活窗口（ms）：窗口内置 false 被拒绝，防止 SSE 回流间隙覆盖乐观 true */
const SEND_KEEPALIVE_MS = 3000;

export interface UseConversationActiveStateOptions {
  /** model 的 messageList ref：rAF 重算时取最新列表（随 setMessageList updater 同步写） */
  messageListRef: MutableRefObject<MessageInfo[]>;
  /**
   * rAF 调度去重句柄 ref：由 model 持有——handleClearSideEffect 需要在会话清理时
   * cancelAnimationFrame 掉挂起的重算帧，不能收进本 hook 私有
   */
  messageListRuntimeSyncFrameRef: MutableRefObject<number | null>;
  /** chat model 的 processing 列表同步（rAF 重算时一并派发） */
  handleChatProcessingList: (list: ProcessingInfo[]) => void;
  /** 日志溯源：model 身份（'conversationInfo' 主会话 / 'conversationAgent' 预览 Tab） */
  modelSource: string;
}

/**
 * 会话活跃态状态机（conversationInfo / conversationAgent 两个 model 共用，
 * 与 useConversationTerminalFinalizer 同款收敛模式，避免双份维护漂移）。
 *
 * 职责四件事：
 * 1. **乐观终态 ack**（roundTerminalAckRef，1678881 复现修复）：SSE FINAL_RESULT/
 *    ERROR 一到即封死「派生信号把活跃态顶回 true」的通路——rAF 重算只封上升沿，
 *    下降方向不受限。会话框按钮/队列消费/详情轮询共用 isConversationActive，顶回即
 *    三者齐卡。置位点在 model 侧：sweep（经 finalizer）与 onError 全量收尾；复位点
 *    在 handleClearSideEffect（新发送/用户停止/会话切换三场景共用）。
 * 2. **发送保活**：发送后 3s 内拒绝置 false（lastSendAtRef），消除"发出后长时间
 *    无状态"的空窗；被拦截的置 false 打 active-blocked 留痕（历史静默路径）。
 * 3. **变迁溯源日志**：每次真实翻转打 `[Conv:Status] active-change {source, prev,
 *    next}`，source 区分十个来源；同值 noop 不打（流式中 rAF 高频命中同值）。
 * 4. **rAF 派生重算调度**（syncMessageListRuntimeState）：messageList 提交后合并
 *    重算 processing 派发与活跃态，避免在 setMessageList updater 内更新 chat model。
 */
export function useConversationActiveState({
  messageListRef,
  messageListRuntimeSyncFrameRef,
  handleChatProcessingList,
  modelSource,
}: UseConversationActiveStateOptions) {
  // 会话是否正在进行中（有消息正在流式处理 Loading/Incomplete）
  const [isConversationActive, setIsConversationActiveRaw] =
    useState<boolean>(false);
  // 本地 chat 已发起但协议终态尚未到达。不能用 isConversationActive 代替：
  // 普通 MESSAGE finished=true 可能先让活跃态下降，FINAL_RESULT 仍会稍后到达。
  const [isAwaitingChatTerminal, setIsAwaitingChatTerminal] =
    useState<boolean>(false);
  // 发送后会话活跃保活时间戳
  const lastSendAtRef = useRef(0);
  // 轮次终态 ack（乐观终态）：置位期间 rAF 活跃态重算只封上升沿
  const roundTerminalAckRef = useRef(false);
  // 上次已生效的活跃值：同值 noop 不打日志
  const lastActiveAppliedRef = useRef(false);
  // 上次已生效的 awaiting 值：同值 noop 不打日志
  const lastAwaitingAppliedRef = useRef(false);
  // rising-blocked 日志节流：终态后尾随事件（如流式节奏的迟到 PROCESSING/MESSAGE）
  // 会以事件节奏连续命中拦截，每秒至多记 1 条并携带末条现场，避免刷屏
  const lastRisingBlockedLogAtRef = useRef(0);

  /**
   * awaiting 变迁留痕（`awaiting-change`）：轮询门 isPollingReady 的另一半条件，
   * 卡 true 则详情轮询静默停摆——与 active-change 合起来覆盖轮询门全部两个状态位。
   * 来源归属靠相邻日志（send-optimistic / finalize terminal / sse-on-close /
   * sse-on-error / reset-init 均在强日志上下文中）。同值 noop 不打。
   */
  const setIsAwaitingChatTerminalLogged = useCallback(
    (action: SetStateAction<boolean>) => {
      const next =
        typeof action === 'function'
          ? action(lastAwaitingAppliedRef.current)
          : action;
      if (next !== lastAwaitingAppliedRef.current) {
        conversationErrorTerminalLogger.info('awaiting-change', {
          model: modelSource,
          prev: lastAwaitingAppliedRef.current,
          next,
        });
        lastAwaitingAppliedRef.current = next;
      }
      setIsAwaitingChatTerminal(action);
    },
    [],
  );

  const setIsConversationActive = useCallback(
    (v: boolean, source = 'unknown') => {
      if (!v && Date.now() - lastSendAtRef.current < SEND_KEEPALIVE_MS) {
        // 被发送保活拦截的置 false 也留痕——历史静默路径之一
        conversationErrorTerminalLogger.info('active-blocked', {
          model: modelSource,
          source,
          reason: 'send-keepalive<3s',
          prev: lastActiveAppliedRef.current,
        });
        return;
      }
      if (lastActiveAppliedRef.current === v) {
        return;
      }
      // 会话框「会话中」状态的每次翻转都带来源留痕：定位"哪个变化导致的"
      conversationErrorTerminalLogger.info('active-change', {
        model: modelSource,
        source,
        prev: lastActiveAppliedRef.current,
        next: v,
      });
      lastActiveAppliedRef.current = v;
      setIsConversationActiveRaw(v);
    },
    [],
  );

  /** 根据最近消息是否含 Loading/Incomplete 更新流式活跃状态（rAF 重算入口） */
  const checkConversationActive = useCallback(
    (messages: MessageInfo[]) => {
      // 不做 slice 截断——isSessionStreamBusy 内部用 findCurrentRoundStart
      // 精确到当前轮次边界，预截断会使深轮次前面的 EXECUTING 残留对检查不可见
      const busy = isSessionStreamBusy(messages);
      // 乐观终态 ack：本轮 FINAL_RESULT/ERROR 已到达时，派生信号（末条 Loading/
      // Incomplete 复活）不得再把活跃态顶回 true——只封上升沿，下降方向不受限
      if (busy && roundTerminalAckRef.current) {
        const now = Date.now();
        if (now - lastRisingBlockedLogAtRef.current >= 1000) {
          lastRisingBlockedLogAtRef.current = now;
          const tail = messages[messages.length - 1];
          conversationErrorTerminalLogger.info('active-rising-blocked-by-ack', {
            model: modelSource,
            source: 'raf-recompute',
            // 现场自证：末条是什么状态在被反复写回 busy——常见为终态后尾随
            // PROCESSING 事件把末条写回 Loading（守卫 B 只拦 MESSAGE 分片）
            tailId: tail?.id,
            tailStatus: tail?.status,
            listLength: messages.length,
          });
        }
        return;
      }
      setIsConversationActive(busy, 'raf-recompute');
    },
    [setIsConversationActive],
  );

  /** 直接落 false（onClose/onError/用户停止/resetInit 等收尾路径），source 进日志 */
  const disabledConversationActive = useCallback(
    (source = 'disable') => {
      setIsConversationActive(false, source);
    },
    [setIsConversationActive],
  );

  /**
   * 在消息 state 提交后统一同步派生状态，避免在 setMessageList updater 内
   * 更新 chat model / 会话活跃态而使流式消息被旧快照覆盖。
   */
  const syncMessageListRuntimeState = useCallback(() => {
    if (messageListRuntimeSyncFrameRef.current !== null) {
      return;
    }
    messageListRuntimeSyncFrameRef.current = requestAnimationFrame(() => {
      messageListRuntimeSyncFrameRef.current = null;
      const latestMessageList = messageListRef.current;
      const latestProcessingList = latestMessageList.flatMap((message) =>
        Array.isArray(message.processingList) ? message.processingList : [],
      );
      handleChatProcessingList(latestProcessingList);
      checkConversationActive(latestMessageList);
    });
  }, [checkConversationActive, handleChatProcessingList]);

  return {
    isConversationActive,
    isAwaitingChatTerminal,
    setIsAwaitingChatTerminal: setIsAwaitingChatTerminalLogged as Dispatch<
      SetStateAction<boolean>
    >,
    setIsConversationActive,
    checkConversationActive,
    disabledConversationActive,
    syncMessageListRuntimeState,
    roundTerminalAckRef,
    lastSendAtRef,
  };
}
