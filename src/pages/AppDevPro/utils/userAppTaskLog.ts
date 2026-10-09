import { dict } from '@/services/i18nRuntime';
import {
  UserAppTaskStatusEnum,
  type UserAppBuildServiceStatus,
  type UserAppTaskLogEvent,
  type UserAppTaskServiceProgress,
  type UserAppTaskTerminalStatus,
} from '../type';

/** SSE 事件名，与协议 event 字段一致 */
export const USER_APP_BUILD_SSE_EVENT = {
  BUILDING: 'building',
  LOG: 'log',
  BUILD_OK: 'build_ok',
  BUILD_FAIL: 'build_fail',
  /** 开发环境启动服务中，仅 dev-start / dev-restart */
  SERVICE_STARTING: 'service_starting',
  /** 开发环境单个服务启动成功，仅 dev-start / dev-restart */
  SERVICE_START_OK: 'service_start_ok',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  STREAM_LAGGED: 'stream_lagged',
} as const;

/** 无 service 时的默认分组 key */
export const DEFAULT_TASK_SERVICE_ID = '__default__';

/** 每个服务最多保留的日志行数 */
export const MAX_SERVICE_LOG_LINES = 800;

/**
 * 将事件名归一化为小写。
 *
 * @param raw 原始事件名
 * @returns 小写事件名
 */
export const normalizeTaskStatus = (raw?: string): string =>
  (raw || '').trim().toLowerCase();

/**
 * 是否为 stream_lagged：消费端落后，服务端关流，需带 fromSeq 重连。
 *
 * @param type 事件名
 * @returns 是否为落后关流
 */
export const isStreamLaggedEvent = (type?: string): boolean =>
  normalizeTaskStatus(type) === USER_APP_BUILD_SSE_EVENT.STREAM_LAGGED;

/**
 * 将 SSE event 映射为服务状态。
 * building / build_ok / build_fail 为构建；
 * service_starting / service_start_ok 为开发环境启动（线上不会出现）。
 * log 不改状态。
 *
 * @param eventType SSE event 名
 * @returns 服务状态；非服务级事件返回 null
 */
export const resolveBuildServiceStatus = (
  eventType?: string,
): UserAppBuildServiceStatus | null => {
  const type = normalizeTaskStatus(eventType);
  if (type === USER_APP_BUILD_SSE_EVENT.BUILDING) {
    return 'building';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.BUILD_OK) {
    return 'build_ok';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.BUILD_FAIL) {
    return 'build_fail';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.SERVICE_STARTING) {
    return 'service_starting';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.SERVICE_START_OK) {
    return 'service_start_ok';
  }
  return null;
};

/**
 * 将任务行 status 解析为终态。
 * 只认 UserAppTaskStatusEnum：completed / failed / cancelled。
 * pending、running 以及 SSE 服务态（build_ok 等）不是任务终态。
 *
 * @param status 任务状态
 * @returns 终态或 null
 */
export const getTaskTerminalStatus = (
  status?: UserAppTaskStatusEnum | string,
): UserAppTaskTerminalStatus | null => {
  const value = normalizeTaskStatus(status);
  if (value === UserAppTaskStatusEnum.Completed) {
    return 'succeeded';
  }
  if (value === UserAppTaskStatusEnum.Failed) {
    return 'failed';
  }
  if (value === UserAppTaskStatusEnum.Cancelled) {
    return 'cancelled';
  }
  return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const pickString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const pickNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (
    typeof value === 'string' &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return undefined;
};

/**
 * 将 SSE data 解析为任务日志事件。
 *
 * @param raw JSON 解析后的数据
 * @param sseEvent SSE event 名
 * @returns 事件；空数据返回 null
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
    if (!text) {
      return null;
    }
    return {
      type: sseEvent || USER_APP_BUILD_SSE_EVENT.LOG,
      log: text,
    };
  }

  const source = asRecord(raw);
  if (!source) {
    return null;
  }

  const type = pickString(source, 'event') || sseEvent || undefined;

  return {
    ...source,
    seq: pickNumber(source, 'seq'),
    serviceId: pickString(source, 'service'),
    log: pickString(source, 'line'),
    error: pickString(source, 'error'),
    skipped: pickNumber(source, 'skipped'),
    type,
  };
};

/**
 * 从事件中提取可展示日志。
 * log 用 line；build_fail 用 error；
 * 开发环境 service_starting / service_start_ok 生成本地文案。
 *
 * @param event 任务日志事件
 * @returns 日志文本
 */
export const getTaskLogText = (event: UserAppTaskLogEvent): string => {
  const type = normalizeTaskStatus(event.type);
  if (type === USER_APP_BUILD_SSE_EVENT.LOG) {
    const line = event.log || event.line;
    return typeof line === 'string' && line.trim() ? line : '';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.BUILD_FAIL && event.error?.trim()) {
    return event.error;
  }
  const serviceName = String(event.serviceId || event.service || '').trim();
  if (type === USER_APP_BUILD_SSE_EVENT.SERVICE_STARTING) {
    return serviceName
      ? dict('PC.Pages.AppDevPro.serviceStarting', serviceName)
      : dict('PC.Pages.AppDevPro.startingService');
  }
  if (type === USER_APP_BUILD_SSE_EVENT.SERVICE_START_OK) {
    return serviceName
      ? dict('PC.Pages.AppDevPro.serviceStartOk', serviceName)
      : dict('PC.Pages.AppDevPro.startSuccess');
  }
  return '';
};

/**
 * 从事件解析任务终态。
 * completed → 成功；failed → 失败；cancelled → 取消。
 * building / log / build_ok / build_fail / service_starting / service_start_ok /
 * stream_lagged 不是任务终态。
 *
 * @param event 任务日志事件
 * @param sseEvent SSE event 名
 * @returns 终态或 null
 */
export const getEventTerminalStatus = (
  event: UserAppTaskLogEvent,
  sseEvent?: string,
): UserAppTaskTerminalStatus | null => {
  const type = normalizeTaskStatus(event.type || sseEvent);
  if (type === USER_APP_BUILD_SSE_EVENT.COMPLETED) {
    return 'succeeded';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.FAILED) {
    return 'failed';
  }
  if (type === USER_APP_BUILD_SSE_EVENT.CANCELLED) {
    return 'cancelled';
  }
  return null;
};

const appendLog = (logs: string[], line?: string): string[] => {
  if (!line?.trim()) {
    return logs;
  }
  return [...logs, line].slice(-MAX_SERVICE_LOG_LINES);
};

/**
 * 任务失败时，仍在进行中的服务记为失败。
 *
 * @param prev 现有服务列表
 * @param error 失败原因
 * @returns 更新后的列表
 */
const markBuildingServicesFailed = (
  prev: UserAppTaskServiceProgress[],
  error?: string,
): UserAppTaskServiceProgress[] =>
  prev.map((item) => {
    if (
      item.status !== USER_APP_BUILD_SSE_EVENT.BUILDING &&
      item.status !== USER_APP_BUILD_SSE_EVENT.SERVICE_STARTING
    ) {
      return item;
    }
    return {
      ...item,
      status: USER_APP_BUILD_SSE_EVENT.BUILD_FAIL,
      logs: appendLog(item.logs, error),
    };
  });

/**
 * 任务成功时，补齐仍在进行中的服务终态。
 *
 * @param prev 现有服务列表
 * @returns 更新后的列表
 */
const markBuildingServicesSucceeded = (
  prev: UserAppTaskServiceProgress[],
): UserAppTaskServiceProgress[] =>
  prev.map((item) => {
    if (item.status === USER_APP_BUILD_SSE_EVENT.BUILDING) {
      return {
        ...item,
        status: USER_APP_BUILD_SSE_EVENT.BUILD_OK,
      };
    }
    if (item.status === USER_APP_BUILD_SSE_EVENT.SERVICE_STARTING) {
      return {
        ...item,
        status: USER_APP_BUILD_SSE_EVENT.SERVICE_START_OK,
      };
    }
    return item;
  });

/**
 * 将 SSE 事件合并进服务进度列表。
 * building 开始构建；log 按行追加；build_ok / build_fail 结束该服务构建；
 * service_starting / service_start_ok 为开发环境启动服务（线上不会出现）；
 * completed / failed / cancelled / stream_lagged 为任务级，不新建服务。
 *
 * @param prev 现有服务列表
 * @param event 新事件
 * @returns 更新后的服务列表
 */
export const mergeTaskServiceProgress = (
  prev: UserAppTaskServiceProgress[],
  event: UserAppTaskLogEvent,
): UserAppTaskServiceProgress[] => {
  const type = normalizeTaskStatus(event.type);

  if (type === USER_APP_BUILD_SSE_EVENT.COMPLETED) {
    return markBuildingServicesSucceeded(prev);
  }
  if (type === USER_APP_BUILD_SSE_EVENT.FAILED) {
    return markBuildingServicesFailed(prev, event.error);
  }
  if (
    type === USER_APP_BUILD_SSE_EVENT.CANCELLED ||
    type === USER_APP_BUILD_SSE_EVENT.STREAM_LAGGED
  ) {
    return prev;
  }

  const serviceIdRaw = event.serviceId?.trim();
  const nextStatus = resolveBuildServiceStatus(event.type) || '';
  const logText = getTaskLogText(event);

  if (!serviceIdRaw && !logText && !nextStatus) {
    return prev;
  }

  const serviceId = serviceIdRaw || DEFAULT_TASK_SERVICE_ID;
  const index = prev.findIndex((item) => item.serviceId === serviceId);
  if (index >= 0 && !logText && !nextStatus) {
    return prev;
  }

  const current: UserAppTaskServiceProgress =
    index >= 0
      ? prev[index]
      : {
          serviceId,
          status: nextStatus || USER_APP_BUILD_SSE_EVENT.BUILDING,
          logs: [],
        };

  const resolvedStatus = nextStatus || current.status;
  const next: UserAppTaskServiceProgress = {
    ...current,
    logs: appendLog(current.logs, logText),
    status: resolvedStatus,
  };

  if (index < 0) {
    return [...prev, next];
  }
  const result = [...prev];
  result[index] = next;
  return result;
};
