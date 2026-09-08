import type {
  UserAppTaskLogEvent,
  UserAppTaskServiceProgress,
  UserAppTaskTerminalStatus,
} from '../type';

const SUCCESS_STATUSES = new Set([
  'succeeded',
  'success',
  'completed',
  'complete',
  'done',
]);
const FAIL_STATUSES = new Set(['failed', 'fail', 'error']);
const CANCEL_STATUSES = new Set(['cancelled', 'canceled']);

/** 无 serviceId 时的默认分组 key */
export const DEFAULT_TASK_SERVICE_ID = '__default__';

/** 每个服务最多保留的日志行数 */
export const MAX_SERVICE_LOG_LINES = 800;

/**
 * 将后端状态归一化为小写。
 *
 * @param raw 原始状态
 * @returns 小写状态
 */
export const normalizeTaskStatus = (raw?: string): string =>
  (raw || '').trim().toLowerCase();

/**
 * 解析任务终态。
 *
 * @param status 原始状态
 * @returns 终态或 null
 */
export const getTaskTerminalStatus = (
  status?: string,
): UserAppTaskTerminalStatus | null => {
  const value = normalizeTaskStatus(status);
  if (SUCCESS_STATUSES.has(value)) {
    return 'succeeded';
  }
  if (FAIL_STATUSES.has(value)) {
    return 'failed';
  }
  if (CANCEL_STATUSES.has(value)) {
    return 'cancelled';
  }
  return null;
};

const clampProgress = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  const percent = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(percent)));
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const pickString = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
};

const pickNumber = (
  record: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
};

/**
 * 将 SSE data 解析为任务日志事件。
 *
 * @param raw JSON 解析后的数据
 * @param sseEvent SSE event 名
 * @returns 事件；心跳或空数据返回 null
 */
export const parseUserAppTaskLogEvent = (
  raw: unknown,
  sseEvent?: string,
): UserAppTaskLogEvent | null => {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text || text === '[DONE]' || text === 'ping' || text === 'heartbeat') {
      return text === '[DONE]' ? { type: 'done', completed: true } : null;
    }
    return {
      type: sseEvent || 'log',
      log: text,
    };
  }

  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const nested = asRecord(record.data);
  const source = nested || record;
  const type =
    pickString(source, ['type', 'event']) ||
    sseEvent ||
    undefined;

  if (type === 'ping' || type === 'heartbeat') {
    return null;
  }

  return {
    ...source,
    seq: pickNumber(source, ['seq', 'sequence', 'fromSeq']),
    serviceId: pickString(source, ['serviceId', 'service_id', 'service']),
    status: pickString(source, ['status', 'state']),
    taskStatus: pickString(source, ['taskStatus', 'task_status', 'taskState']),
    progress: pickNumber(source, ['progress', 'percent', 'percentage']),
    message: pickString(source, ['message']),
    log: pickString(source, ['log', 'line', 'content', 'text', 'output']),
    error: pickString(source, ['error', 'errorMessage', 'errMsg']),
    done: source.done === true,
    completed: source.completed === true,
    type,
  };
};

/**
 * 从事件中提取可展示日志。
 *
 * @param event 任务日志事件
 * @returns 日志文本
 */
export const getTaskLogText = (event: UserAppTaskLogEvent): string => {
  const candidates = [event.log, event.line, event.content, event.text];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item;
    }
  }
  if (event.error?.trim()) {
    return event.error;
  }
  if (event.message?.trim() && !getTaskTerminalStatus(event.message)) {
    return event.message;
  }
  return '';
};

/**
 * 从事件解析任务终态。
 *
 * @param event 任务日志事件
 * @param sseEvent SSE event 名
 * @returns 终态或 null
 */
export const getEventTerminalStatus = (
  event: UserAppTaskLogEvent,
  sseEvent?: string,
): UserAppTaskTerminalStatus | null => {
  const fromTask = getTaskTerminalStatus(event.taskStatus);
  if (fromTask) {
    return fromTask;
  }

  const type = normalizeTaskStatus(event.type || sseEvent);
  const isTaskLevelEvent =
    !event.serviceId ||
    type === 'done' ||
    type === 'complete' ||
    type === 'completed' ||
    type === 'task' ||
    type === 'task_status' ||
    type === 'taskstatus';

  if (!isTaskLevelEvent) {
    return null;
  }

  if (type === 'error' || type === 'fail' || type === 'failed') {
    return 'failed';
  }
  if (type === 'cancelled' || type === 'canceled') {
    return 'cancelled';
  }
  if (
    event.completed === true ||
    event.done === true ||
    type === 'done' ||
    type === 'complete' ||
    type === 'completed' ||
    type === 'success' ||
    type === 'succeeded'
  ) {
    return getTaskTerminalStatus(event.status) || 'succeeded';
  }

  if (!event.serviceId) {
    return getTaskTerminalStatus(event.status);
  }

  return null;
};

/**
 * 将 SSE 事件合并进服务进度列表。
 *
 * @param prev 现有服务列表
 * @param event 新事件
 * @returns 更新后的服务列表
 */
export const mergeTaskServiceProgress = (
  prev: UserAppTaskServiceProgress[],
  event: UserAppTaskLogEvent,
): UserAppTaskServiceProgress[] => {
  const serviceId = event.serviceId?.trim() || DEFAULT_TASK_SERVICE_ID;
  const logText = getTaskLogText(event);
  const progressValue =
    event.progress !== undefined ? clampProgress(event.progress) : undefined;
  const nextStatus = event.status || '';

  if (
    !event.serviceId?.trim() &&
    !logText &&
    progressValue === undefined &&
    !nextStatus
  ) {
    return prev;
  }

  const index = prev.findIndex((item) => item.serviceId === serviceId);
  const current: UserAppTaskServiceProgress =
    index >= 0
      ? prev[index]
      : {
          serviceId,
          progress: 0,
          status: 'running',
          logs: [],
        };

  const logs = logText
    ? [...current.logs, logText].slice(-MAX_SERVICE_LOG_LINES)
    : current.logs;

  const next: UserAppTaskServiceProgress = {
    ...current,
    logs,
    progress:
      progressValue !== undefined
        ? progressValue
        : getTaskTerminalStatus(nextStatus) === 'succeeded'
        ? 100
        : current.progress,
    status: nextStatus || current.status,
  };

  if (index < 0) {
    return [...prev, next];
  }
  const result = [...prev];
  result[index] = next;
  return result;
};

/**
 * 计算整体进度。
 *
 * @param services 服务进度
 * @returns 0-100
 */
export const getOverallTaskProgress = (
  services: UserAppTaskServiceProgress[],
): number => {
  if (!services.length) {
    return 0;
  }
  const total = services.reduce((sum, item) => sum + item.progress, 0);
  return Math.round(total / services.length);
};
