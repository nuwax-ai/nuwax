import { GLOBAL_POLLING_INTERVAL } from '@/constants/home.constants';
import { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fetchConversationTaskStatus } from '@/utils/conversationTaskStatusSync';
import { useRequest } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

/**
 * 会话流式恢复(sub)编排 Hook（model-agnostic，UnifiedChatSession 专用）
 *
 * 用途：刷新页面 / 新开标签后，重新订阅 EXECUTING 会话的输出流（/api/agent/conversation/chat/sub/:id），
 * 把「执行中的助手消息」重建出来。与 useLoadMoreHistory / useUnifiedChatScroll 同属 UnifiedChatSession
 * 的会话生命周期 hooks 聚合于此。各会话页从自身所属 model（conversationInfo 或 conversationAgent）
 * 注入状态与 action 即可复用；未注入 action 的页面（如隔离会话源）不启用恢复。
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
  /** 订阅 sub 流（model 的 resumeConversationStream）；未提供则整体不启用恢复 */
  resumeStream?: (
    conversationId: number | string,
    currentList: MessageInfo[],
    onClose?: () => void,
  ) => void;
  /** 中断 sub 流（model 的 abortResumeStream）；未提供则跳过中断 */
  abortSub?: () => void;
}

/** 本地流式结束后，订阅 sub 的冷却时间(ms)：等 taskStatus 稳定，避免对刚完成的输出重复重放 */
const RESUME_COOLDOWN_AFTER_LOCAL_MS = 5000;

export function useConversationStreamResume(
  options: UseConversationStreamResumeOptions,
): void {
  const {
    conversationId,
    taskStatus,
    isLocallyStreaming,
    messageList,
    resumeStream,
    abortSub,
  } = options;

  // sub 是否已订阅（开/闭之间）。ref 用于回调闭包安全读取；state 用于驱动 ready 重算
  const isResumeSubscribedRef = useRef(false);
  const [isResumeSubscribed, setIsResumeSubscribed] = useState(false);
  // 用 ref 保存最新值，避免轮询 onSuccess 闭包过期
  const latestRef = useRef({ taskStatus, isLocallyStreaming, messageList });
  latestRef.current = { taskStatus, isLocallyStreaming, messageList };

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
  const subscribe = (id: number | string) => {
    if (!resumeStream) return; // 未注入 action（页面未启用恢复）
    if (isResumeSubscribedRef.current) return; // 防重复订阅
    if (latestRef.current.isLocallyStreaming) return; // live 正在驱动输出，不重复订阅
    // 同一会话内，本地流式刚结束的冷却窗口内不订阅（等待 taskStatus 稳定后再由轮询决定）
    const ended = localStreamEndedAtRef.current;
    if (
      ended.convId === id &&
      Date.now() - ended.at < RESUME_COOLDOWN_AFTER_LOCAL_MS
    ) {
      return;
    }
    resumeStream(id, latestRef.current.messageList || [], () => {
      // sub 自动断开(end_turn/completed/超时)或被 abort 时回调
      isResumeSubscribedRef.current = false;
      setIsResumeSubscribed(false);
      // sub 关闭后恢复状态轮询，以便检测会话再次变为 EXECUTING
      pollingControlsRef.current.start();
    });
    isResumeSubscribedRef.current = true;
    setIsResumeSubscribed(true);
    // 已续上 sub：立即停止状态轮询（执行中由 sub 流接管，不该再查状态）
    pollingControlsRef.current.stop();
  };

  // 轮询会话状态：仅标签可见时触发(pollingWhenHidden:false)，复用全局轮询方案。
  // ready 含 !isResumeSubscribed：续上 sub 后不再轮询（subscribe 的 stopPolling 作立即兜底）。
  const { run, cancel } = useRequest(
    () =>
      conversationId
        ? fetchConversationTaskStatus(conversationId)
        : Promise.resolve(undefined),
    {
      pollingInterval: GLOBAL_POLLING_INTERVAL,
      // 屏幕不可见时暂停定时任务（多窗口/多标签仅可见者轮询）
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      ready: !!conversationId && !isLocallyStreaming && !isResumeSubscribed,
      refreshDeps: [conversationId, isLocallyStreaming, isResumeSubscribed],
      onSuccess: (status) => {
        if (!conversationId) return;
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
            subscribe(conversationId);
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
  pollingControlsRef.current.start = run;
  pollingControlsRef.current.stop = cancel;

  // 切换会话：先重置订阅状态。必须在 entry effect 之前执行，否则 entry subscribe 后会被这里覆盖。
  // cleanup 里 abortSub 触发的 onClose 有 ~500ms 延迟，这里立即重置 state，避免新会话卡在「不轮询」。
  useEffect(() => {
    isResumeSubscribedRef.current = false;
    setIsResumeSubscribed(false);
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

  // 离开 / 切换会话：清除轮询 + 中断 sub（约束：退出会话页必须清除轮询）
  useEffect(() => {
    return () => {
      cancel();
      if (abortSub) {
        abortSub();
      }
      isResumeSubscribedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
}
