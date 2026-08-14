import { EVENT_TYPE } from '@/constants/event.constants';
import { GLOBAL_POLLING_INTERVAL } from '@/constants/home.constants';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  emitConversationListTaskStatus,
  fetchConversationSnapshot,
  fetchConversationTaskStatus,
  resolveTaskStatusFromMessageLists,
} from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import {
  conversationPollLogger,
  conversationResumeLogger,
} from '@/utils/logger';
import { useRequest } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

/**
 * 会话流式恢复(sub)编排 Hook（model-agnostic，UnifiedChatSession 专用）
 *
 * 用途：刷新页面 / 新开标签后，重新订阅 EXECUTING 会话的输出流（/api/agent/conversation/chat/sub/:id），
 * 把「执行中的助手消息」重建出来。与 useLoadMoreHistory / useUnifiedChatScroll 同属 UnifiedChatSession
 * 的会话生命周期 hooks 聚合于此。各会话页从自身所属 model（conversationInfo 或 conversationAgent）
 * 注入状态与 action 即可复用；未注入 action 的页面不启用恢复。
 *
 * 轮询时机：仅在【未订阅 sub】时轮询会话状态——一旦续上 sub（执行中），立即停止状态轮询，
 * 由 sub 流接管输出；sub 关闭后才恢复轮询，继续检测会话再次变为 EXECUTING。
 */
export interface UseConversationStreamResumeOptions {
  /** 当前会话 ID */
  conversationId?: number;
  /** 会话任务状态（conversationInfo?.taskStatus） */
  taskStatus?: TaskStatus;
  /** 本地是否正在流式发送（model 的 isConversationActive） */
  isLocallyStreaming?: boolean;
  /** 最新 messageList 快照（用于决定占位：复用末尾半成品 / 追加空白占位） */
  messageList?: MessageInfo[];
  /**
   * 刷新历史并返回最新 messageList（model 的 runAsync 包装）。
   * 多页签/查看中变 EXECUTING 时，先 reload 拿到含最新发送用户消息的列表，再追加 assistant 占位，
   * 避免 sub 续上后少显示用户消息。未提供则用当前 messageList。
   */
  reloadHistoryAsync?: (
    conversationId: number | string,
  ) => Promise<MessageInfo[] | undefined | null>;
  /**
   * taskStatus 可能先变 EXECUTING，user 消息稍后才出现在历史里。
   * 默认开启：订阅 sub 前等待 reload 快照出现可承接的 user，避免 UI 先渲 assistant 流再补 user 导致跳动。
   * 少数纯测试/特殊恢复场景可显式传 false。
   */
  waitForHistoryUserBeforeResume?: boolean;
  /** sub 恢复日志来源：区分左侧开发 Agent 会话、右侧预览 Tab、主调试区等 */
  resumeDebugSource?: string;
  /** 订阅 sub 流（model 的 resumeConversationStream）；未提供则整体不启用恢复 */
  resumeStream?: (
    conversationId: number | string,
    currentList: MessageInfo[],
    onClose?: () => void,
    debugSource?: string,
  ) => void;
  /** 中断 sub 流（model 的 abortResumeStream）；未提供则跳过中断 */
  abortSub?: () => void;
  /** 每次状态轮询拿到的完整会话快照，用于静默同步新增历史消息。 */
  onConversationSnapshot?: (snapshot: ConversationInfo) => void;
  /**
   * 轮询拿到终态 taskStatus 时写回当前会话 model（仅 COMPLETE/FAILED/CANCEL）
   */
  onTerminalTaskStatus?: (status: TaskStatus) => void;
}

/** 本地流式结束后，订阅 sub 的冷却时间(ms)：等 taskStatus 稳定，避免对刚完成的输出重复重放 */
const RESUME_COOLDOWN_AFTER_LOCAL_MS = 5000;
const RESUME_HISTORY_USER_RETRY_DELAYS_MS = [150, 300, 600, 900, 1200, 1800];
/**
 * sub 失败退避：存活不足 MIN_ALIVE 视为「秒关/报错」，按连续失败次数指数退避
 * （BASE 起步、MAX 封顶），切断「sub 被秒关 → onClose → 立即重订阅」的高频循环
 */
const RESUME_SUB_MIN_ALIVE_MS = 3000;
const RESUME_SUB_FAILURE_BASE_DELAY_MS = 2000;
const RESUME_SUB_FAILURE_MAX_DELAY_MS = 30000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });

const getUserMessageCount = (list: MessageInfo[] | undefined | null): number =>
  (list || []).filter((m) => m.role === AssistantRoleEnum.USER).length;

const hasNewUserMessage = (
  base: MessageInfo[] | undefined | null,
  incoming: MessageInfo[] | undefined | null,
): boolean => getUserMessageCount(incoming) > getUserMessageCount(base);

const getLastMessage = (
  list: MessageInfo[] | undefined | null,
): MessageInfo | undefined => list?.[list.length - 1];

const summarizeMessage = (message: MessageInfo | undefined) =>
  message
    ? {
        id: message.id,
        role: message.role,
        type: message.type,
        status: message.status,
        textLength: (message.text || '').length,
        thinkLength: (message.think || '').length,
      }
    : null;

const summarizeMessageList = (list: MessageInfo[] | undefined | null) => ({
  length: list?.length || 0,
  userCount: getUserMessageCount(list),
  tail: (list || []).slice(-4).map(summarizeMessage),
});

const isIncompleteAssistant = (message: MessageInfo | undefined): boolean =>
  message?.role === AssistantRoleEnum.ASSISTANT &&
  (message.status === MessageStatusEnum.Loading ||
    message.status === MessageStatusEnum.Incomplete);

const hasUserReadyForResume = (
  base: MessageInfo[] | undefined | null,
  incoming: MessageInfo[] | undefined | null,
): boolean => {
  if (hasNewUserMessage(base, incoming)) {
    return true;
  }
  const lastIncoming = getLastMessage(incoming);
  if (lastIncoming?.role === AssistantRoleEnum.USER) {
    return true;
  }
  if (isIncompleteAssistant(lastIncoming)) {
    return true;
  }
  const lastBase = getLastMessage(base);
  return (
    lastBase?.role === AssistantRoleEnum.USER || isIncompleteAssistant(lastBase)
  );
};

export function useConversationStreamResume(
  options: UseConversationStreamResumeOptions,
): void {
  const {
    conversationId,
    taskStatus,
    isLocallyStreaming,
    messageList,
    reloadHistoryAsync,
    waitForHistoryUserBeforeResume,
    resumeDebugSource,
    resumeStream,
    abortSub,
    onConversationSnapshot,
    onTerminalTaskStatus,
  } = options;

  const onTerminalTaskStatusRef = useRef(onTerminalTaskStatus);
  onTerminalTaskStatusRef.current = onTerminalTaskStatus;
  const onConversationSnapshotRef = useRef(onConversationSnapshot);
  onConversationSnapshotRef.current = onConversationSnapshot;
  const debugSource = resumeDebugSource || 'unified-chat-session';

  // sub 是否已订阅（开/闭之间）。ref 用于回调闭包安全读取；state 用于驱动 ready 重算
  const isResumeSubscribedRef = useRef(false);
  const [isResumeSubscribed, setIsResumeSubscribed] = useState(false);
  // 用 ref 保存最新值，避免轮询 onSuccess / subscribe 异步回调闭包过期
  // conversationId 一并放入：subscribe 的 await 与 sub onClose 都是异步，需要回调执行时
  // 能读到「当前会话」以判断本次回调是否仍属于同一会话（防跨会话覆盖/误杀）
  const latestRef = useRef({
    conversationId,
    taskStatus,
    isLocallyStreaming,
    messageList,
  });
  latestRef.current = {
    conversationId,
    taskStatus,
    isLocallyStreaming,
    messageList,
  };
  // 轮询代际：本地开始发送时递增。已在途的旧轮询回包必须整段丢弃，
  // 避免旧快照覆盖新发送消息，或误触发 sub 恢复。
  const pollGenerationRef = useRef(0);
  const requestGenerationRef = useRef(0);
  const prevLocallyStreamingForPollRef = useRef(!!isLocallyStreaming);
  if (isLocallyStreaming && !prevLocallyStreamingForPollRef.current) {
    pollGenerationRef.current += 1;
  }
  prevLocallyStreamingForPollRef.current = !!isLocallyStreaming;

  // 轮询启停句柄：subscribe 在 useRequest 之前定义、需要调用其 run/cancel，
  // 用 ref 解耦前向引用（subscribe 调用 pollingControlsRef.current.stop/start，
  // useRequest 在下方把 run/cancel 赋给它）。
  const pollingControlsRef = useRef<{
    start: () => void;
    stop: () => void;
  }>({ start: () => {}, stop: () => {} });

  // 记录最近一次本地流式结束的 {会话, 时间}：冷却仅对同一会话生效，切换会话不继承，
  // 避免离开一个刚发完消息的会话、进入另一个 EXECUTING 会话时被误抑制。
  const localStreamEndedAtRef = useRef<{
    convId: number | string | undefined;
    at: number;
  }>({ convId: undefined, at: 0 });

  // sub 失败退避状态：subOpenedAt 记录本次打开时间，failure 记录连续失败次数与最近失败时间。
  // 仅当前会话的 onClose 会计数（跨会话延迟关闭不污染），切换会话时重置。
  const subOpenedAtRef = useRef(0);
  const subFailureRef = useRef<{ count: number; lastAt: number }>({
    count: 0,
    lastAt: 0,
  });
  const prevLocallyStreamingRef = useRef(false);
  useEffect(() => {
    if (prevLocallyStreamingRef.current && !isLocallyStreaming) {
      localStreamEndedAtRef.current = {
        convId: conversationId,
        at: Date.now(),
      };
    }
    prevLocallyStreamingRef.current = !!isLocallyStreaming;
  }, [isLocallyStreaming, conversationId]);

  // 订阅 sub 流。续上后立即 stopPolling（同步，不等 ready 异步生效）；
  // sub onClose 时 startPolling 恢复，继续检测会话再次变为 EXECUTING。
  const subscribe = async (
    id: number | string,
    polledMessageList?: MessageInfo[],
  ) => {
    if (!resumeStream) return; // 未注入 action（页面未启用恢复）
    if (isResumeSubscribedRef.current) return; // 防重复订阅
    if (latestRef.current.isLocallyStreaming) return; // live 正在驱动输出，不重复订阅
    // 同一会话内，本地流式刚结束的冷却窗口内不订阅（等待 taskStatus 稳定后再由轮询决定）
    const ended = localStreamEndedAtRef.current;
    if (
      ended.convId === id &&
      Date.now() - ended.at < RESUME_COOLDOWN_AFTER_LOCAL_MS
    ) {
      conversationResumeLogger.info('skip: local stream cooldown', {
        source: debugSource,
        conversationId: id,
        cooldownMs: Date.now() - ended.at,
      });
      return;
    }
    // sub 失败退避：秒关/报错后按连续失败次数指数退避，窗口内跳过。
    // 注意必须在「标记订阅 + 停轮询」之前 return，让轮询按 5s 节奏自然兜底重试。
    const failure = subFailureRef.current;
    if (failure.count > 0) {
      const backoffMs = Math.min(
        RESUME_SUB_FAILURE_BASE_DELAY_MS * 2 ** (failure.count - 1),
        RESUME_SUB_FAILURE_MAX_DELAY_MS,
      );
      const elapsedMs = Date.now() - failure.lastAt;
      if (elapsedMs < backoffMs) {
        conversationResumeLogger.info('skip: sub failure backoff', {
          source: debugSource,
          conversationId: id,
          failureCount: failure.count,
          backoffMs,
          elapsedMs,
        });
        return;
      }
    }
    // 先标记订阅 + 停轮询（reload 期间防重入，执行中不轮询）
    isResumeSubscribedRef.current = true;
    setIsResumeSubscribed(true);
    pollingControlsRef.current.stop();

    // 触发事件将对应的会话在列表中标记为“执行中”
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: id,
      taskStatus: TaskStatus.EXECUTING,
    });

    // 多页签/查看中变 EXECUTING：优先复用检测到执行态的轮询快照；没有快照时再 reload，
    // 确保 messageList 含最新发送的用户消息后，由 sub 流继续重建 assistant 输出。
    let list = polledMessageList?.length
      ? polledMessageList
      : latestRef.current.messageList || [];
    // 轮询已经返回完整快照时直接复用，避免订阅 sub 前再次查询同一个会话接口。
    // 没有轮询快照的入口（如首次进入 EXECUTING 会话）仍保留原有 reload 与落库等待。
    if (polledMessageList === undefined && reloadHistoryAsync) {
      try {
        const reloaded = await reloadHistoryAsync(id);
        conversationResumeLogger.info('reload before sub:done', {
          source: debugSource,
          conversationId: id,
          base: summarizeMessageList(latestRef.current.messageList),
          reloaded: summarizeMessageList(reloaded),
          userReady: hasUserReadyForResume(
            latestRef.current.messageList,
            reloaded,
          ),
        });
        if (reloaded && reloaded.length) {
          list = reloaded;
        }
        const shouldWaitForHistoryUser = waitForHistoryUserBeforeResume ?? true;
        if (
          shouldWaitForHistoryUser &&
          !hasUserReadyForResume(latestRef.current.messageList, reloaded)
        ) {
          for (const delayMs of RESUME_HISTORY_USER_RETRY_DELAYS_MS) {
            await sleep(delayMs);
            if (
              latestRef.current.conversationId !== id ||
              latestRef.current.isLocallyStreaming ||
              !isResumeSubscribedRef.current
            ) {
              break;
            }
            const retryList = await reloadHistoryAsync(id);
            if (retryList && retryList.length) {
              list = retryList;
            }
            if (
              hasUserReadyForResume(latestRef.current.messageList, retryList)
            ) {
              break;
            }
          }
          if (!hasUserReadyForResume(latestRef.current.messageList, list)) {
            conversationResumeLogger.info(
              'skip sub: history user not ready after retries',
              {
                source: debugSource,
                conversationId: id,
                base: summarizeMessageList(latestRef.current.messageList),
                finalList: summarizeMessageList(list),
              },
            );
            isResumeSubscribedRef.current = false;
            setIsResumeSubscribed(false);
            pollingControlsRef.current.start();
            return;
          }
        }
      } catch (e) {
        console.error('[useConversationStreamResume] reloadHistory failed:', e);
      }
    }

    // await 期间可能已切会话、本地开始流式，或切会话 effect 已重置订阅标记。
    // 此时再调 resumeStream 会用旧 id 触发 model 级共享 abortResumeStream，误杀新会话 sub。
    // 放弃本次订阅并回滚乐观标记，由当前会话自身的轮询/订阅逻辑接管。
    if (
      latestRef.current.conversationId !== id ||
      latestRef.current.isLocallyStreaming ||
      !isResumeSubscribedRef.current
    ) {
      conversationResumeLogger.info('skip sub: stale after reload', {
        source: debugSource,
        conversationId: id,
        latestConversationId: latestRef.current.conversationId,
        isLocallyStreaming: latestRef.current.isLocallyStreaming,
        isResumeSubscribed: isResumeSubscribedRef.current,
      });
      isResumeSubscribedRef.current = false;
      setIsResumeSubscribed(false);
      return;
    }

    conversationResumeLogger.info('resume sub:start', {
      source: debugSource,
      conversationId: id,
      list: summarizeMessageList(list),
    });
    // 记录本次 sub 打开时间：onClose 时按存活时长区分「秒关（失败）」与「长连接后正常关闭」。
    // 同步 onClose 路径（如 reload 快照已是持久化完整 assistant，未真正建立连接）aliveMs≈0，
    // 同样计入失败退避，正好切断该路径的同步重订阅循环。
    subOpenedAtRef.current = Date.now();
    resumeStream(
      id,
      list,
      async () => {
        // sub 自动断开(end_turn/completed/超时)或被 abort 时回调
        isResumeSubscribedRef.current = false;
        setIsResumeSubscribed(false);
        // 过期 sub 的延迟关闭（切会话后 cleanup 触发 abort 后回调）：
        // 不再回写状态，否则 reloadHistoryAsync(旧id) 与 RefreshConversationList 会覆盖/干扰新会话。
        if (latestRef.current.conversationId !== id) {
          return;
        }
        // 失败退避计数（仅当前会话）：存活不足阈值视为秒关/报错，累计退避；长连接后关闭则重置
        const aliveMs = Date.now() - subOpenedAtRef.current;
        if (aliveMs < RESUME_SUB_MIN_ALIVE_MS) {
          subFailureRef.current = {
            count: subFailureRef.current.count + 1,
            lastAt: Date.now(),
          };
          conversationResumeLogger.info('sub short-lived, backoff escalated', {
            source: debugSource,
            conversationId: id,
            aliveMs,
            failureCount: subFailureRef.current.count,
          });
        } else if (subFailureRef.current.count > 0) {
          subFailureRef.current = { count: 0, lastAt: 0 };
        }
        // sub 关闭后从本地 messageList 的 finalResult 解析终态（FINAL_RESULT 已落本地）；
        // 不再 reload 历史——reload 会整体覆盖 messageList，正是会话结束闪烁的来源。
        const resolvedFromMessages = resolveTaskStatusFromMessageLists(
          latestRef.current.messageList,
        );
        if (resolvedFromMessages) {
          onTerminalTaskStatusRef.current?.(resolvedFromMessages);
          // 终态已确认：同步补偿「最近使用/会话记录」列表（本地补丁）
          emitConversationListTaskStatus(id, resolvedFromMessages);
        } else {
          try {
            const terminalStatus = await fetchConversationTaskStatus(id);
            if (
              terminalStatus !== undefined &&
              terminalStatus !== TaskStatus.EXECUTING
            ) {
              onTerminalTaskStatusRef.current?.(terminalStatus);
              // 终态已确认：同步补偿「最近使用/会话记录」列表（本地补丁）
              emitConversationListTaskStatus(id, terminalStatus);
            }
          } catch (e) {
            console.error(
              '[useConversationStreamResume] sync terminal taskStatus failed:',
              e,
            );
          }
        }

        // 终态同步完成后再恢复轮询，避免 EXECUTING 期间误重订阅 sub
        pollingControlsRef.current.start();

        // 发送事件，刷新会话列表以清除“执行中”标记，使其消失
        eventBus.emit(EVENT_TYPE.RefreshConversationList, {
          conversationId: id,
          reason: 'stream-closed',
        });
      },
      debugSource,
    );
  };

  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  // 轮询会话状态：仅标签可见时触发(pollingWhenHidden:false)，复用全局轮询方案。
  // ready 含 !isResumeSubscribed：续上 sub 后不再轮询（subscribe 的 stopPolling 作立即兜底）。
  const { run, cancel } = useRequest(
    () => {
      requestGenerationRef.current = pollGenerationRef.current;
      return conversationId
        ? fetchConversationSnapshot(conversationId)
        : Promise.resolve(undefined);
    },
    {
      pollingInterval: GLOBAL_POLLING_INTERVAL,
      // 屏幕不可见时暂停定时任务（多窗口/多标签仅可见者轮询）
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      // resumeStream 未注入则整体不启用：不轮询、不订阅
      ready:
        !!conversationId &&
        !isLocallyStreaming &&
        !isResumeSubscribed &&
        !!resumeStream,
      refreshDeps: [
        conversationId,
        isLocallyStreaming,
        isResumeSubscribed,
        resumeStream,
      ],
      onSuccess: (snapshot) => {
        if (!conversationId) return;
        // ready/cancel 只能阻止后续轮询，已在途请求仍可能返回。
        // 发送后代际已变化，或当前正由 live chat 驱动时，旧结果不允许产生任何副作用。
        if (
          requestGenerationRef.current !== pollGenerationRef.current ||
          latestRef.current.isLocallyStreaming
        ) {
          conversationPollLogger.info('discard stale snapshot', {
            conversationId,
            requestGeneration: requestGenerationRef.current,
            currentGeneration: pollGenerationRef.current,
            isLocallyStreaming: latestRef.current.isLocallyStreaming,
            snapshotTaskStatus: snapshot?.taskStatus,
          });
          return;
        }
        if (snapshot && latestRef.current.conversationId === conversationId) {
          onConversationSnapshotRef.current?.(snapshot);
        }
        const status = snapshot?.taskStatus;
        // 防跨会话写回；同值终态跳过，避免每轮轮询触发下游 reload 闪烁
        if (
          status !== undefined &&
          status !== TaskStatus.EXECUTING &&
          latestRef.current.taskStatus !== status &&
          latestRef.current.conversationId === conversationId
        ) {
          onTerminalTaskStatusRef.current?.(status);
        }
        // 轮询补偿侧栏列表：会话已执行完毕(终态)时，把终态同步到「最近使用/会话记录」。
        // 不依赖本地 taskStatus 是否已变化——列表可能在本轮轮询之间被重新拉取，且后端
        // 尚未落库终态(仍返回 EXECUTING)，因此每次观察到终态都补发一次，由列表处理器
        // 幂等合并（无变化时返回原引用，不产生无谓重渲染）。
        if (
          status !== undefined &&
          status !== TaskStatus.EXECUTING &&
          latestRef.current.conversationId === conversationId
        ) {
          emitConversationListTaskStatus(conversationId, status);
        }
        if (status === TaskStatus.EXECUTING) {
          if (latestRef.current.isLocallyStreaming) {
            // 本地正在发送：中断 sub，由 live 驱动输出
            if (isResumeSubscribedRef.current && abortSub) {
              abortSub();
              isResumeSubscribedRef.current = false;
              setIsResumeSubscribed(false);
            }
            return;
          }
          if (!isResumeSubscribedRef.current) {
            // 同一会话内，本地流式刚结束的冷却窗口内跳过，等 taskStatus 稳定后再决定
            const ended = localStreamEndedAtRef.current;
            if (
              ended.convId === conversationId &&
              Date.now() - ended.at < RESUME_COOLDOWN_AFTER_LOCAL_MS
            ) {
              return;
            }
            const polledMessageList = snapshot?.messageList;
            // 详情状态可能先于本轮用户消息落库。快照尚未就绪时保持正常轮询，
            // 不立即发起多次历史重载；下一轮快照就绪后再建立 sub。
            if (
              Array.isArray(polledMessageList) &&
              !hasUserReadyForResume(
                latestRef.current.messageList,
                polledMessageList,
              )
            ) {
              return;
            }
            subscribe(conversationId, polledMessageList);
          }
        } else if (isResumeSubscribedRef.current && abortSub) {
          // 非 EXECUTING：任务已结束，兜底中断 sub（end_turn 自动断开应已触发）
          abortSub();
          isResumeSubscribedRef.current = false;
          setIsResumeSubscribed(false);
        }
      },
    },
  );
  // 把 run/cancel 注入 pollingControlsRef，供 subscribe / onClose 调用
  pollingControlsRef.current.start = () => {
    conversationPollLogger.info(
      'resume',
      latestRef.current.conversationId,
      latestRef.current.taskStatus,
    );
    run();
  };
  pollingControlsRef.current.stop = () => {
    conversationPollLogger.info(
      'stop',
      latestRef.current.conversationId,
      latestRef.current.taskStatus,
    );
    cancel();
  };

  // 本地发送开始时立即暂停并取消轮询；ready 的重算需要等渲染完成，
  // 这里主动 cancel，避免该窗口继续发出下一轮请求。
  useEffect(() => {
    if (isLocallyStreaming) {
      conversationPollLogger.info('cancel polling: local send started', {
        conversationId,
        pollGeneration: pollGenerationRef.current,
        inFlightRequestGeneration: requestGenerationRef.current,
      });
      cancel();
    }
  }, [isLocallyStreaming, cancel, conversationId]);

  // 切换会话：先重置订阅状态。必须在 entry effect 之前执行，否则 entry subscribe 后会被这里覆盖。
  // cleanup 里 abortSub 触发的 onClose 有 ~500ms 延迟，这里立即重置 state，避免新会话卡在「不轮询」。
  useEffect(() => {
    isResumeSubscribedRef.current = false;
    setIsResumeSubscribed(false);
    // 退避状态不跨会话继承：新会话的失败计数从零开始
    subFailureRef.current = { count: 0, lastAt: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 进入会话 / taskStatus 到达 EXECUTING：尝试订阅（subscribe 内部防重入 & 冷却保护 & stopPolling）。
  // 不把 isLocallyStreaming 放入依赖，避免「本地发送结束」瞬间触发订阅；
  // 该窗口由冷却时间 + 轮询兜底覆盖。
  useEffect(() => {
    if (!conversationId) return;
    if (
      taskStatus === TaskStatus.EXECUTING &&
      !latestRef.current.isLocallyStreaming
    ) {
      subscribe(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, taskStatus]);

  // 切回可见页签时检查是否有任务在执行；同值终态不写回，避免无变化时触发下游 reload 闪烁
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        conversationId &&
        !isLocallyStreaming &&
        !isResumeSubscribedRef.current &&
        resumeStream
      ) {
        const requestGeneration = pollGenerationRef.current;
        fetchConversationSnapshot(conversationId).then((snapshot) => {
          // fetch in-flight 期间可能已切换会话或开始本地发送，
          // 在任何写回/sub 恢复前丢弃 stale 结果。
          if (
            latestRef.current.conversationId !== conversationId ||
            requestGeneration !== pollGenerationRef.current ||
            latestRef.current.isLocallyStreaming
          ) {
            conversationPollLogger.info('discard stale visibility snapshot', {
              conversationId,
              requestGeneration,
              currentGeneration: pollGenerationRef.current,
              latestConversationId: latestRef.current.conversationId,
              isLocallyStreaming: latestRef.current.isLocallyStreaming,
              snapshotTaskStatus: snapshot?.taskStatus,
            });
            return;
          }
          if (snapshot) {
            onConversationSnapshotRef.current?.(snapshot);
          }
          const status = snapshot?.taskStatus;
          if (
            status !== undefined &&
            status !== TaskStatus.EXECUTING &&
            latestRef.current.taskStatus !== status
          ) {
            onTerminalTaskStatusRef.current?.(status);
          }
          // 可见性恢复后同样补偿侧栏列表：观察到终态即同步「最近使用/会话记录」
          if (status !== undefined && status !== TaskStatus.EXECUTING) {
            emitConversationListTaskStatus(conversationId, status);
          }
          if (status === TaskStatus.EXECUTING) {
            const polledMessageList = snapshot?.messageList;
            if (
              Array.isArray(polledMessageList) &&
              !hasUserReadyForResume(
                latestRef.current.messageList,
                polledMessageList,
              )
            ) {
              return;
            }
            subscribeRef.current(conversationId, polledMessageList);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversationId, isLocallyStreaming, resumeStream]);

  // 离开 / 切换会话：清除轮询 + 中断 sub（约束：退出会话页必须清除轮询）
  useEffect(() => {
    return () => {
      pollingControlsRef.current.stop();
      if (abortSub) {
        abortSub();
      }
      isResumeSubscribedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
}
