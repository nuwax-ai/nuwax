import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { findCurrentRoundStart } from '@/models/conversationInfoMessageList';
import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  applyTerminalTaskStatus,
  emitConversationListTaskStatus,
  resolveTerminalTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import { createAlwaysLogger } from '@/utils/logger';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useMemo } from 'react';

// always-on：终态收敛/降级是会话卡死类问题的核心生产观测点（每轮会话仅 1-2 条，无噪音）
const conversationTerminalSweepLogger = createAlwaysLogger('[Conv:Terminal]');

export interface UseConversationTerminalFinalizerOptions {
  /** 日志来源：区分主会话 model 与预览 Tab model */
  source: string;
  /** 当前会话信息 ref：防跨会话守卫（旧会话的迟到终态不得误清当前会话的活跃态） */
  conversationInfoRef: MutableRefObject<ConversationInfo | null>;
  /** 发送保活时间戳 ref：清算时置 0 打破「发送后 3s 拒绝置 false」的保活 */
  lastSendAtRef: MutableRefObject<number>;
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >;
  setMessageList: Dispatch<SetStateAction<MessageInfo[]>>;
  /** model 的 messageListRef：随 updater 同步写，保持 rAF 同步等既有读取路径拿到终态列表 */
  messageListRef: MutableRefObject<MessageInfo[]>;
  setIsAwaitingChatTerminal: Dispatch<SetStateAction<boolean>>;
  /** model 的活跃态 setter（经 3s 保活包装的那个） */
  setIsConversationActive: (v: boolean) => void;
}

/**
 * 统一终态清算 hook（conversationInfo / conversationAgent 两个 model 共用）
 *
 * 终态可能从多条路径到达：本地 chat SSE 的 FINAL_RESULT/ERROR、sub 恢复流重放
 * （useResumeStreamHandlers 的 onTerminalEvent）、轮询快照（页面的 onTerminalTaskStatus）。
 * 此前只有 taskStatus 会被写回，而 isAwaitingChatTerminal / isConversationActive /
 * 末条 Loading 消息绑定在「原发送连接」的回调上——连接静默死亡（ERR_NETWORK_CHANGED
 * 的安静变体）后这些回调永不触发，停止按钮常驻、轮询（isPollingReady 含
 * !isAwaitingChatTerminal）永久停摆（1677549 复现：FINAL_RESULT 经 sub 重放落了
 * COMPLETE，页面仍显示会话中）。
 *
 * 返回两个入口，保证终态一旦确认（无论哪条路径）一次性收敛
 * taskStatus + isAwaitingChatTerminal + isConversationActive + 末条消息/processing 残留：
 * - finalizeConversationTerminal(cid, status)：终态枚举入口（轮询/快照路径）
 * - finalizeChatTerminalEvent(cid, res)：SSE 终态事件入口（chat onMessage / sub onMessage）
 *
 * 注意：内部含 setState 调用，禁止在 setMessageList updater 等渲染期回调中调用
 * （model 内 handleChangeMessageList 的 in-updater 分支保持原有 applyTerminalTaskStatus
 * 不变，本 hook 只在事件回调层触发；「任务冲突」型 FINAL_RESULT 解析不出终态枚举，
 * 自动跳过清算，不误清仍在执行的旧任务活跃态）。
 */
export function useConversationTerminalFinalizer(
  options: UseConversationTerminalFinalizerOptions,
) {
  const {
    source,
    conversationInfoRef,
    lastSendAtRef,
    setConversationInfo,
    setMessageList,
    messageListRef,
    setIsAwaitingChatTerminal,
    setIsConversationActive,
  } = options;

  const sweepConversationTerminal = useMemo(() => {
    return (
      conversationId: number | string | undefined,
      taskStatus: TaskStatus | undefined,
      origin?: string,
    ): void => {
      // 非终态不动状态机：undefined / EXECUTING 跳过
      if (
        conversationId === undefined ||
        taskStatus === undefined ||
        taskStatus === TaskStatus.EXECUTING
      ) {
        return;
      }

      conversationTerminalSweepLogger.info('finalize terminal', {
        source,
        origin,
        conversationId,
        taskStatus,
      });

      // 1. taskStatus 终态写回（含幂等/防跨会话守卫，沿用既有入口）
      applyTerminalTaskStatus(setConversationInfo, conversationId, taskStatus);

      // 2. 协议终态已确认：清 awaiting，恢复轮询资格（isPollingReady）
      setIsAwaitingChatTerminal(false);

      // 3. 强制清活跃态：打破「发送后 3s 保活」再落 false——终态已确认，
      //    活跃态必须立即可清（否则 3s 内到达的终态被保活吞掉，1654471 二次卡死成因）
      lastSendAtRef.current = 0;
      setIsConversationActive(false);

      // 4. 末条消息兜底落终态：流式占位（Loading/Incomplete）→ Complete/Error，
      //    残留 EXECUTING 的 processing 块 → FINISHED/FAILED。
      //    正常路径 handleChangeMessageList 已处理时此处为幂等 noop。
      const messageTerminalStatus =
        taskStatus === TaskStatus.FAILED
          ? MessageStatusEnum.Error
          : MessageStatusEnum.Complete;
      const processingTerminalStatus =
        taskStatus === TaskStatus.FAILED
          ? ProcessingEnum.FAILED
          : ProcessingEnum.FINISHED;

      setMessageList((prev) => {
        if (!prev?.length) {
          return prev;
        }
        // 与 isSessionStreamBusy 的检查范围对齐（共享 findCurrentRoundStart）：
        // 当前轮次（最后一条 USER 之后）的所有 assistant 消息的 EXECUTING
        // processing 残留都要收敛，否则任一残留都会让 busy 持续为 true
        // → 活跃态被 rAF 重算顶回 true → 按钮卡「会话中」。
        const lastIndex = prev.length - 1;
        const firstRecent = findCurrentRoundStart(prev);
        const next = prev.slice();
        let changed = false;

        for (let i = lastIndex; i >= firstRecent; i -= 1) {
          const message = next[i];
          const isTail = i === lastIndex;
          const incomplete =
            isTail &&
            (message.status === MessageStatusEnum.Loading ||
              message.status === MessageStatusEnum.Incomplete);
          const processingList = Array.isArray(message.processingList)
            ? message.processingList.map((item) =>
                item.status === ProcessingEnum.EXECUTING
                  ? { ...item, status: processingTerminalStatus }
                  : item,
              )
            : message.processingList;
          const processingChanged = processingList !== message.processingList;
          if (!incomplete && !processingChanged) {
            continue;
          }
          next[i] = {
            ...message,
            thinkingFinished: isTail ? true : message.thinkingFinished,
            status: incomplete ? messageTerminalStatus : message.status,
            processingList,
          };
          changed = true;
        }

        if (!changed) {
          return prev;
        }
        messageListRef.current = next;
        return next;
      });
    };
    // 全部为稳定引用：useState setter / ref / 空依赖 useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 统一终态清算入口（带防跨会话守卫）：终态确认后一次性收敛会话状态机 */
  const finalizeConversationTerminal = useCallback(
    (
      conversationId: number | string | undefined,
      taskStatus: TaskStatus | undefined,
      origin?: string,
    ) => {
      // 旧会话的迟到终态不得误清当前会话的活跃态（conversationInfoRef 未就绪时放行）
      const currentId = conversationInfoRef.current?.id;
      if (
        currentId !== undefined &&
        conversationId !== undefined &&
        String(currentId) !== String(conversationId)
      ) {
        return;
      }
      sweepConversationTerminal(conversationId, taskStatus, origin);
    },
    [sweepConversationTerminal, conversationInfoRef],
  );

  /**
   * SSE 终态事件入口（FINAL_RESULT / ERROR，二者同权）。
   *
   * 协议语义：ERROR 与 FINAL_RESULT 一样是轮次终止态——后端出错时
   * sessionPromptEnd(error) → sink.error → ERROR 事件 + 流必然关闭。到达即完整
   * 清算（ERROR → FAILED；FINAL_RESULT 解析结构化终态，「任务冲突」型解析不出
   * 则自动跳过，不误清仍在执行的旧任务）。
   *
   * 1678724 复盘修正：此前的"ERROR 降级"版本建立在"ERROR 可能在流中到达且流
   * 继续"的推测上——该场景从未被观测到（HAR body 无 ERROR 事件），本案实际
   * 触发源是连接级 onerror（fetch-event-source 错误回调 → model onError 全量
   * 收尾），与事件路径无关。降级反而损害真终止场景的收敛时效，故恢复同权。
   */
  const finalizeChatTerminalEvent = useCallback(
    (
      conversationId: number | string | undefined,
      res: ConversationChatResponse | undefined,
    ) => {
      if (!conversationId || !res) {
        return;
      }
      // 只处理终态事件类型（FINAL_RESULT / ERROR）——其他事件（PROCESSING/
      // MESSAGE/HEART_BEAT 等）一律不进清算。实测 PROCESSING 事件的载荷可能含
      // resolveTerminalTaskStatus 可解析的字段，误触发完整清算后，守卫 B 会把
      // 后续正常 CHAT 分片全部丢弃（1560859 实证：内容丢失）。
      if (
        res.eventType !== ConversationEventTypeEnum.FINAL_RESULT &&
        res.eventType !== ConversationEventTypeEnum.ERROR
      ) {
        return;
      }
      const status =
        res.eventType === ConversationEventTypeEnum.ERROR
          ? TaskStatus.FAILED
          : resolveTerminalTaskStatus(res.data?.success, res.data, res);
      finalizeConversationTerminal(conversationId, status, res.eventType);
    },
    [finalizeConversationTerminal],
  );

  /**
   * 收尾流式占位消息：sub 恢复流中途死亡（网络切换 ERR_NETWORK_CHANGED 等）时，
   * 其占位消息停留 Loading/Incomplete——isSessionStreamBusy 永真 → isConversationActive
   * 被每次重算顶回 true → 详情轮询被 blockedBy: local-stream-active 永久挂住
   * （1560798 复现：该会话全程只有 sub 一条连接，终态永远不达，sweep 无从触发）。
   *
   * - outcome='stopped'（sub 正常关闭/看门狗超时）：占位落 Stopped，taskStatus 不动
   *   （后端可能仍在执行，等详情轮询拿真实状态决定重挂 sub 或落终态）
   * - outcome='error'（sub 网络错误）：与本地 chat 连接的 onError 处置对齐——占位落
   *   Error、taskStatus 落 FAILED 并同步侧栏列表。统一两种连接在同一网络故障下的
   * 页面表现：直接回到可发送态，网络恢复后由轮询/重挂 sub 自动续上（后端若真在
   * 执行，终态到达时 sweep 会纠正 FAILED → 真实终态）。
   */
  const finalizeStreamingPlaceholder = useCallback(
    (
      messageId: string | null | undefined,
      outcome: 'stopped' | 'error' = 'stopped',
    ) => {
      if (!messageId) {
        return;
      }
      const messageTerminalStatus =
        outcome === 'error'
          ? MessageStatusEnum.Error
          : MessageStatusEnum.Stopped;
      setMessageList((prev) => {
        if (!prev?.length) {
          return prev;
        }
        const index = prev.findIndex((item) => item.id === messageId);
        if (index < 0) {
          return prev;
        }
        const target = prev[index];
        const isIncomplete =
          target.status === MessageStatusEnum.Loading ||
          target.status === MessageStatusEnum.Incomplete;
        const processingList = Array.isArray(target.processingList)
          ? target.processingList.map((item) =>
              item.status === ProcessingEnum.EXECUTING
                ? { ...item, status: ProcessingEnum.FAILED }
                : item,
            )
          : target.processingList;
        const processingChanged = processingList !== target.processingList;
        if (!isIncomplete && !processingChanged) {
          return prev;
        }
        const next = prev.slice();
        next[index] = {
          ...target,
          thinkingFinished: true,
          status: isIncomplete ? messageTerminalStatus : target.status,
          processingList,
        };
        messageListRef.current = next;
        return next;
      });
      if (outcome === 'error') {
        // 与 chat onError 对齐：网络错误即终态，落 FAILED 清「执行中/会话中」展示
        const cid = conversationInfoRef.current?.id;
        if (cid !== undefined && cid !== null) {
          applyTerminalTaskStatus(setConversationInfo, cid, TaskStatus.FAILED);
          emitConversationListTaskStatus(cid, TaskStatus.FAILED);
        }
      }
      // 占位收尾后重算活跃态（复用 model 的 rAF 同步模式）：列表不再 busy →
      // active 回落 → 详情轮询恢复，由快照决定重挂 sub 续流或落终态。
      // 流死亡是确定性结束信号，与 onClose 一致先打破 3s 发送保活。
      requestAnimationFrame(() => {
        const busy = isSessionStreamBusy(messageListRef.current);
        conversationTerminalSweepLogger.info(
          'finalize streaming placeholder, re-derive active',
          { source, messageId, outcome, busy },
        );
        lastSendAtRef.current = 0;
        setIsConversationActive(busy);
      });
    },
    // 稳定引用（与 sweep 相同）：useState setter / ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    finalizeConversationTerminal,
    finalizeChatTerminalEvent,
    finalizeStreamingPlaceholder,
  };
}
