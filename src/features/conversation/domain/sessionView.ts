import { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  selectQueueGate,
  selectSessionActive,
  selectSessionStreamActive,
  shouldShowSessionSuggest,
  shouldShowTaskExecutingWait,
  type QueueGate,
} from './runtimeSelectors';

/**
 * 页面向 Session View 提供的原始状态（Phase 6：调用方不再自行组合这些字段）。
 * 字段与 model / UnifiedChatSession 既有 Props 一一对应，不引入新状态源。
 */
export interface ConversationSessionViewInput {
  /** 当前会话 ID（缺省时不可轮询快照） */
  conversationId?: number;
  /** model 原始流式活跃态（isConversationActive） */
  modelStreamActive?: boolean;
  /** 本地聊天已发起但协议终态尚未到达（isAwaitingChatTerminal） */
  awaitingChatTerminal?: boolean;
  /** sub 恢复订阅中（isResumeSubscribed） */
  resumeSubscribed?: boolean;
  /** 会话任务状态（conversationInfo?.taskStatus） */
  taskStatus?: TaskStatus;
  /** 最新消息列表 */
  messageList?: MessageInfo[] | null;
  /** 队列中是否有待发消息 */
  hasQueuedMessages?: boolean;
  /** 是否有待响应的干预（Ask/ACP） */
  hasPendingIntervention?: boolean;
}

/**
 * 语义化会话视图（方案 §5.6）：页面/队列只消费本视图，禁止再用原始字段
 * 重新推导同一语义。各字段的合同由 tests/conversationSessionView.test.ts 冻结。
 */
export interface ConversationSessionView {
  /**
   * 会话阶段（单一维度，按特定性排序）：
   * resuming（sub 恢复订阅中）> streaming（消息投影流式中）
   * > awaiting-terminal（本地已发送、协议终态未到）> idle。
   * 'sending' 保留给乐观发送窗口（发送后保活期内），当前无独立信号源，暂不产出。
   */
  phase: 'idle' | 'sending' | 'streaming' | 'awaiting-terminal' | 'resuming';
  /** 输入框可立即发送（不忙且无待响应干预） */
  canSendNow: boolean;
  /** 发送应进入队列（流式或任务执行中） */
  shouldEnqueue: boolean;
  /** 状态轮询可发起（无本地流、未等终态、未订阅 sub、会话就位） */
  canPollSnapshot: boolean;
  /** 停止按钮展示（完整活跃态：流式投影或任务执行中） */
  shouldShowStop: boolean;
  /** 「智能体正在执行，请稍等」提示（后端执行中且流式已结束） */
  shouldShowTaskWait: boolean;
  /** 会话建议展示（有消息、队列排空、流式结束） */
  shouldShowSuggest: boolean;
  /** 队列入队/消费门禁（Intervention 只额外阻塞消费） */
  queueGate: QueueGate;
}

export function selectConversationSessionView(
  input: ConversationSessionViewInput,
): ConversationSessionView {
  const {
    conversationId,
    modelStreamActive,
    awaitingChatTerminal,
    resumeSubscribed,
    taskStatus,
    messageList,
    hasQueuedMessages,
    hasPendingIntervention,
  } = input;

  const streamActive = selectSessionStreamActive(
    modelStreamActive,
    messageList,
  );
  const queueGate = selectQueueGate(
    modelStreamActive,
    messageList,
    taskStatus,
    hasPendingIntervention,
  );

  const phase: ConversationSessionView['phase'] = resumeSubscribed
    ? 'resuming'
    : streamActive
    ? 'streaming'
    : awaitingChatTerminal
    ? 'awaiting-terminal'
    : 'idle';

  return {
    phase,
    canSendNow: !queueGate.consumeBlocked,
    shouldEnqueue: queueGate.enqueueBlocked,
    canPollSnapshot:
      !!conversationId &&
      !modelStreamActive &&
      !awaitingChatTerminal &&
      !resumeSubscribed,
    shouldShowStop: selectSessionActive(
      modelStreamActive,
      messageList,
      taskStatus,
    ),
    shouldShowTaskWait: shouldShowTaskExecutingWait(taskStatus, messageList),
    shouldShowSuggest: shouldShowSessionSuggest(
      messageList,
      Boolean(hasQueuedMessages),
      streamActive,
    ),
    queueGate,
  };
}
