import { GLOBAL_POLLING_INTERVAL } from '@/constants/home.constants';
import { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fetchConversationTaskStatus } from '@/utils/conversationTaskStatusSync';
import { useRequest } from 'ahooks';
import { useEffect, useRef } from 'react';

/**
 * 会话流式恢复(sub)编排 Hook（model-agnostic，UnifiedChatSession 专用）
 *
 * 用途：刷新页面 / 新开标签后，重新订阅 EXECUTING 会话的输出流（/api/agent/conversation/chat/sub/:id），
 * 把「执行中的助手消息」重建出来。与 useLoadMoreHistory / useUnifiedChatScroll 同属 UnifiedChatSession
 * 的会话生命周期 hooks 聚合于此。各会话页从自身所属 model（conversationInfo 或 conversationAgent）
 * 注入状态与 action 即可复用；未注入 action 的页面（如隔离会话源）不启用恢复。
 *
 * 状态机：
 * - 进入会话(conversationId 变化)：taskStatus 随历史一同到达；若 EXECUTING 且非本地流式 → 订阅。
 * - 轮询(仅标签可见 pollingWhenHidden:false)：
 *     EXECUTING + 非本地流式 + 未订阅 → 刷历史 → 订阅；
 *     EXECUTING + 本地流式 → 中断 sub（live 正在驱动输出）；
 *     非 EXECUTING + 已订阅 → 兜底中断 sub。
 * - 本地发送：onMessageSend → handleClearSideEffect → abortResumeStream，立即中断 sub，避免双流。
 * - 离开/切会话：stopPolling + abortSub（约束：退出会话页必须清除轮询）。
 *
 * 防重复订阅：subscribe 以 !isResumeSubscribedRef 为前置条件，sub 的 onClose 会将其置回 false。
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

  // sub 是否已订阅（开/闭之间）
  const isResumeSubscribedRef = useRef(false);
  // 用 ref 保存最新值，避免轮询 onSuccess 闭包过期
  const latestRef = useRef({ taskStatus, isLocallyStreaming, messageList });
  latestRef.current = { taskStatus, isLocallyStreaming, messageList };

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
    });
    isResumeSubscribedRef.current = true;
  };

  // 轮询会话状态：仅标签可见时触发(pollingWhenHidden:false)，复用全局轮询方案
  const { cancel: stopPolling } = useRequest(
    () =>
      conversationId
        ? fetchConversationTaskStatus(conversationId)
        : Promise.resolve(undefined),
    {
      pollingInterval: GLOBAL_POLLING_INTERVAL,
      // 屏幕不可见时暂停定时任务（多窗口/多标签仅可见者轮询）
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      // 在会话页且非本地流式时【持续】轮询：会话结束后也要轮询，以便检测会话再次变为 EXECUTING
      // （定时任务/其它入口触发同一会话）并自动恢复流式订阅。离开页面时由 cleanup 停止轮询。
      ready: !!conversationId && !isLocallyStreaming,
      refreshDeps: [conversationId, isLocallyStreaming],
      onSuccess: (status) => {
        if (!conversationId) return;
        if (status === TaskStatus.EXECUTING) {
          if (latestRef.current.isLocallyStreaming) {
            // 本地正在发送：中断 sub，由 live 驱动输出
            if (isResumeSubscribedRef.current && abortSub) {
              abortSub();
              isResumeSubscribedRef.current = false;
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
            // 直接用当前 messageList 订阅：进入页面时历史已加载；「查看中变 EXECUTING」时
            // messageList 本就是当前显示的最新列表，无需再 reload——runQueryConversation 是
            // ahooks `run`(返回 void) 且防抖 300ms，await 它不会等，反而会在事后冲掉刚追加的占位
            subscribe(conversationId);
          }
        } else if (isResumeSubscribedRef.current && abortSub) {
          // 非 EXECUTING：任务已结束，兜底中断 sub（end_turn 自动断开应已触发）
          abortSub();
          isResumeSubscribedRef.current = false;
        }
      },
    },
  );

  // 进入会话 / taskStatus 到达 EXECUTING：尝试订阅（subscribe 内部防重入 & 冷却保护）。
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
      stopPolling();
      if (abortSub) {
        abortSub();
      }
      isResumeSubscribedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
}
