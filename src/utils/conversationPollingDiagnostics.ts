import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createLogger } from '@/utils/logger';

/** 临时诊断模块：问题定位结束后可连同业务侧调用点整体删除。 */
export const CHAT_POLL_BEFORE_FINAL_LOG = '[DEBUG-chat-poll-before-final]';

const diagnosticsLogger = createLogger(CHAT_POLL_BEFORE_FINAL_LOG);
const isDiagnosticsEnabled =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

type ConversationId = number | string | undefined;
type PollTrigger = 'scheduled-or-ready-refresh' | 'visibility-resume';

interface PollTraceState {
  sequence: number;
  previousResponseAt?: number;
}

const pollTraceState = new Map<string, PollTraceState>();
const localStreamState = new Map<string, boolean>();
const MAX_TRACKED_CONVERSATIONS = 20;

const traceKey = (source: string, conversationId: ConversationId) =>
  `${source}:${String(conversationId ?? 'unknown')}`;

const summarizeMessage = (message: MessageInfo | undefined) =>
  message
    ? {
        id: message.id,
        requestId: message.requestId,
        role: message.role,
        type: message.type,
        status: message.status,
        textLength: (message.text || '').length,
        thinkLength: (message.think || '').length,
      }
    : null;

const getTail = (messageList: MessageInfo[] | undefined | null) =>
  messageList?.[messageList.length - 1];

const summarizeTailIdentityDiff = (
  localList: MessageInfo[] | undefined | null,
  snapshotList: MessageInfo[] | undefined | null,
) => {
  const windowSize = Math.min(
    localList?.length || 0,
    snapshotList?.length || 0,
    4,
  );
  if (!windowSize) return [];

  return Array.from({ length: windowSize }, (_, index) => {
    const offsetFromTail = windowSize - index - 1;
    const local = localList?.[(localList?.length || 0) - offsetFromTail - 1];
    const snapshot =
      snapshotList?.[(snapshotList?.length || 0) - offsetFromTail - 1];
    const sameLogicalMessage =
      local?.role === snapshot?.role &&
      local?.type === snapshot?.type &&
      (local?.text || '') === (snapshot?.text || '') &&
      (local?.think || '') === (snapshot?.think || '');

    return {
      offsetFromTail,
      role: snapshot?.role ?? local?.role,
      localId: local?.id,
      localRequestId: local?.requestId,
      snapshotId: snapshot?.id,
      snapshotRequestId: snapshot?.requestId,
      sameId: local?.id === snapshot?.id,
      snapshotIdMatchesLocalRequestId:
        !!local?.requestId && local.requestId === snapshot?.id,
      sameLogicalMessage,
      identityChangesForSameLogicalMessage:
        sameLogicalMessage && local?.id !== snapshot?.id,
    };
  });
};

const rememberBounded = <T>(map: Map<string, T>, key: string, value: T) => {
  map.delete(key);
  map.set(key, value);
  if (map.size > MAX_TRACKED_CONVERSATIONS) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
};

const writeLogAt = (
  timestamp: number,
  event: string,
  payload: Record<string, unknown>,
) => {
  if (!isDiagnosticsEnabled) return;
  globalThis.queueMicrotask(() => {
    diagnosticsLogger.info(event, {
      at: new Date(timestamp).toISOString(),
      timestamp,
      ...payload,
    });
  });
};

const writeLog = (event: string, payload: Record<string, unknown>) => {
  writeLogAt(Date.now(), event, payload);
};

export const logChatSseBoundary = (
  requestBody: unknown,
  rawResponse: unknown,
) => {
  if (!isDiagnosticsEnabled) return;
  if (!rawResponse || typeof rawResponse !== 'object') return;
  const response = rawResponse as ConversationChatResponse;
  const conversationId =
    requestBody &&
    typeof requestBody === 'object' &&
    'conversationId' in requestBody
      ? (requestBody.conversationId as ConversationId)
      : undefined;
  // sub/其它 SSE 没有 conversationId 请求体，不参与本地 chat 时序诊断。
  if (conversationId === undefined) return;
  const isFinalResult =
    response.eventType === ConversationEventTypeEnum.FINAL_RESULT;
  const isErrorEvent = response.eventType === ConversationEventTypeEnum.ERROR;
  const isMessageBlockFinished =
    response.eventType === ConversationEventTypeEnum.MESSAGE &&
    Boolean(response.data?.finished);

  if (!isFinalResult && !isErrorEvent && !isMessageBlockFinished) return;

  writeLog(
    isFinalResult || isErrorEvent ? 'chat-terminal' : 'message-finished',
    {
      conversationId,
      requestId: response.requestId,
      eventType: response.eventType,
      messageType: response.data?.type,
      finished: Boolean(response.data?.finished),
      completed: response.completed,
      isChatTerminalEvent: isFinalResult || isErrorEvent,
    },
  );
};

export const logLocalStreamState = (options: {
  conversationId: ConversationId;
  isActive: boolean;
  taskStatus?: TaskStatus;
  messageList: MessageInfo[];
}) => {
  if (!isDiagnosticsEnabled) return;
  const key = String(options.conversationId ?? 'unknown');
  const previous = localStreamState.get(key);
  rememberBounded(localStreamState, key, options.isActive);
  if (previous !== true || options.isActive) return;

  writeLog('local-stream-ended', {
    conversationId: options.conversationId,
    taskStatus: options.taskStatus,
    localTail: summarizeMessage(getTail(options.messageList)),
  });
};

export const logConversationPollGate = (options: {
  source: string;
  conversationId: ConversationId;
  ready: boolean;
  blockedBy: Array<string | null>;
  isLocallyStreaming: boolean;
  isAwaitingChatTerminal: boolean;
  isResumeSubscribed: boolean;
  taskStatus?: TaskStatus;
  messageList?: MessageInfo[];
}) => {
  if (!isDiagnosticsEnabled) return;
  const { messageList, blockedBy, ...payload } = options;
  writeLog('poll-gate', {
    ...payload,
    blockedBy: blockedBy.filter(Boolean),
    localTail: summarizeMessage(getTail(messageList)),
  });
};

export const traceConversationSnapshotRequest = (options: {
  source: string;
  trigger: PollTrigger;
  conversationId: ConversationId;
  requestGeneration: number;
  currentGeneration: number;
  isLocallyStreaming: boolean;
  isAwaitingChatTerminal: boolean;
  isResumeSubscribed: boolean;
  taskStatus?: TaskStatus;
  messageList?: MessageInfo[];
  request: () => Promise<ConversationInfo | undefined>;
}): Promise<ConversationInfo | undefined> => {
  if (!isDiagnosticsEnabled) return options.request();

  // 先启动真实请求，再整理/输出诊断信息，避免同步 console 改变竞态窗口。
  const requestedAt = Date.now();
  const requestPromise = options.request();
  const key = traceKey(options.source, options.conversationId);
  const state = pollTraceState.get(key) || { sequence: 0 };
  const sequence = state.sequence + 1;
  state.sequence = sequence;
  rememberBounded(pollTraceState, key, state);

  writeLogAt(requestedAt, 'poll-request', {
    source: options.source,
    trigger: options.trigger,
    conversationId: options.conversationId,
    sequence,
    requestGeneration: options.requestGeneration,
    currentGeneration: options.currentGeneration,
    isLocallyStreaming: options.isLocallyStreaming,
    isAwaitingChatTerminal: options.isAwaitingChatTerminal,
    isResumeSubscribed: options.isResumeSubscribed,
    taskStatus: options.taskStatus,
    previousResponseAt: state.previousResponseAt,
    elapsedFromPreviousResponseMs: state.previousResponseAt
      ? requestedAt - state.previousResponseAt
      : null,
    localTail: summarizeMessage(getTail(options.messageList)),
  });

  void requestPromise.then(
    (snapshot) => {
      const respondedAt = Date.now();
      state.previousResponseAt = respondedAt;
      const snapshotTail = getTail(snapshot?.messageList);
      writeLogAt(respondedAt, 'poll-response', {
        source: options.source,
        trigger: options.trigger,
        conversationId: options.conversationId,
        sequence,
        durationMs: respondedAt - requestedAt,
        snapshotTaskStatus: snapshot?.taskStatus,
        snapshotMessageCount: snapshot?.messageList?.length || 0,
        snapshotTail: summarizeMessage(snapshotTail),
        snapshotTailIsUser: snapshotTail?.role === AssistantRoleEnum.USER,
      });
    },
    (error) => {
      const respondedAt = Date.now();
      state.previousResponseAt = respondedAt;
      writeLogAt(respondedAt, 'poll-error', {
        source: options.source,
        trigger: options.trigger,
        conversationId: options.conversationId,
        sequence,
        durationMs: respondedAt - requestedAt,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    },
  );
  return requestPromise;
};

export const logConversationSnapshotConsume = (options: {
  source: string;
  conversationId: ConversationId;
  outcome: string;
  snapshot?: ConversationInfo;
  localMessageList?: MessageInfo[];
  hasSnapshotConsumer?: boolean;
}) => {
  if (!isDiagnosticsEnabled) return;
  const snapshotTail = getTail(options.snapshot?.messageList);
  const identityDiff = summarizeTailIdentityDiff(
    options.localMessageList,
    options.snapshot?.messageList,
  );
  writeLog('poll-consume', {
    source: options.source,
    conversationId: options.conversationId,
    outcome: options.outcome,
    hasSnapshotConsumer: options.hasSnapshotConsumer,
    snapshotTaskStatus: options.snapshot?.taskStatus,
    snapshotTail: summarizeMessage(snapshotTail),
    snapshotTailIsUser: snapshotTail?.role === AssistantRoleEnum.USER,
    localMessageCount: options.localMessageList?.length || 0,
    identityDiff,
    hasIdentityChangeForSameLogicalMessage: identityDiff.some(
      (item) => item.identityChangesForSameLogicalMessage,
    ),
  });
};
