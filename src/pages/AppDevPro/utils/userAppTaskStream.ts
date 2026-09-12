import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getUserAppTaskLogsStreamUrl } from '../services/appDevPro';
import {
  UserAppTaskTypeEnum,
  type UserAppDevTaskInfo,
  type UserAppTaskLogEvent,
  type UserAppTaskServiceProgress,
  type UserAppTaskTerminalStatus,
} from '../type';
import {
  getEventTerminalStatus,
  getTaskTerminalStatus,
  isStreamLaggedEvent,
  parseUserAppTaskLogEvent,
} from './userAppTaskLog';

export interface ListenUserAppTaskStreamOptions {
  /** 任务 ID */
  taskId: string;
  /** 断点序号 */
  fromSeq?: number;
  /** 中止控制器 */
  abortController: AbortController;
  /** 是否已由用户取消 */
  isCancelled: () => boolean;
  /** 收到 SSE 事件 */
  onEvent: (event: UserAppTaskLogEvent) => void;
  /** 读取当前服务进度（连接断开时推断终态） */
  getServices: () => UserAppTaskServiceProgress[];
  /** 失败默认文案 */
  failedMessage: string;
  /** 连接断开默认文案 */
  streamClosedMessage: string;
}

/**
 * 解开 umi request 可能返回的 RequestResponse 或裸 data。
 *
 * @param result 接口结果
 * @param fallbackMessage 失败文案
 * @returns 业务数据
 */
export const unwrapUserAppResponse = <T>(
  result: RequestResponse<T> | T | undefined,
  fallbackMessage: string,
): T => {
  if (result && typeof result === 'object' && 'code' in (result as object)) {
    const res = result as RequestResponse<T>;
    if (res.code !== SUCCESS_CODE) {
      throw new Error(res.message || fallbackMessage);
    }
    if (res.data === undefined || res.data === null) {
      throw new Error(res.message || fallbackMessage);
    }
    return res.data;
  }
  if (result === undefined || result === null) {
    throw new Error(fallbackMessage);
  }
  return result as T;
};

/**
 * 从请求异常中取出可展示文案。
 * skipErrorHandler 后可能是 Error、业务体或 axios 响应。
 *
 * @param error 捕获到的异常
 * @param fallback 兜底文案
 * @returns 错误文案
 */
export const pickUserAppRequestErrorText = (
  error: unknown,
  fallback: string,
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    const record = error as {
      info?: { message?: string };
      message?: string;
      response?: { data?: { message?: string } };
    };
    const fromInfo = record.info?.message?.trim();
    if (fromInfo) {
      return fromInfo;
    }
    const fromBody = record.response?.data?.message?.trim();
    if (fromBody) {
      return fromBody;
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
  }
  return fallback;
};

/**
 * 从启动 / 构建接口结果中取出 taskId。
 *
 * @param data 任务行或 taskId 字符串
 * @returns taskId
 */
export const pickUserAppTaskId = (
  data: UserAppDevTaskInfo | string | null | undefined,
): string => {
  if (!data) {
    return '';
  }
  if (typeof data === 'string') {
    return data;
  }
  return data.taskId || '';
};

const TASK_TYPE_RANK: Record<string, number> = {
  [UserAppTaskTypeEnum.DevStart]: 0,
  [UserAppTaskTypeEnum.DevRestart]: 1,
  [UserAppTaskTypeEnum.Build]: 2,
};

/**
 * 从进行中任务里选出应接入进度流的一条。
 * 优先开发启动 / 重启，其次构建；同类型取更新时间更近的。
 *
 * @param tasks 进行中任务
 * @returns 任务行；没有可监听任务时为 null
 */
export const pickActiveUserAppTask = (
  tasks?: UserAppDevTaskInfo[] | null,
): UserAppDevTaskInfo | null => {
  const list = (tasks || []).filter((item) => item?.taskId);
  if (!list.length) {
    return null;
  }
  return [...list].sort((left, right) => {
    const rankDiff =
      (TASK_TYPE_RANK[left.taskType] ?? 9) -
      (TASK_TYPE_RANK[right.taskType] ?? 9);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return String(right.modified || right.created || '').localeCompare(
      String(left.modified || left.created || ''),
    );
  })[0];
};

/**
 * 监听任务进度 SSE，直到成功 / 失败 / 取消。
 *
 * @param options 监听配置
 * @returns 任务终态
 */
export const listenUserAppTaskStream = (
  options: ListenUserAppTaskStreamOptions,
): Promise<UserAppTaskTerminalStatus> => {
  const {
    taskId,
    fromSeq,
    abortController,
    isCancelled,
    onEvent,
    getServices,
    failedMessage,
    streamClosedMessage,
  } = options;

  return new Promise<UserAppTaskTerminalStatus>((resolve, reject) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    let settled = false;
    let lastSeq = fromSeq;
    let lagged = false;
    let connectionId = 0;
    const maxLagReconnect = 8;

    const finish = (status: UserAppTaskTerminalStatus, error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
      if (status === 'succeeded') {
        resolve(status);
        return;
      }
      if (error) {
        reject(error);
        return;
      }
      resolve(status);
    };

    const inferClosedStatus = () => {
      const list = getServices();
      if (
        list.length > 0 &&
        list.every((item) => getTaskTerminalStatus(item.status) === 'succeeded')
      ) {
        finish('succeeded');
        return;
      }
      if (
        list.some((item) => getTaskTerminalStatus(item.status) === 'failed')
      ) {
        finish('failed', new Error(failedMessage));
        return;
      }
      finish('failed', new Error(streamClosedMessage));
    };

    const startConnection = (lagReconnectCount = 0) => {
      const myId = ++connectionId;
      lagged = false;
      const inner = new AbortController();
      if (abortController.signal.aborted) {
        finish('cancelled');
        return;
      }
      abortController.signal.addEventListener('abort', () => inner.abort(), {
        once: true,
      });

      const reconnectAfterLag = (): boolean => {
        if (myId !== connectionId || settled || !lagged) {
          return false;
        }
        lagged = false;
        if (lagReconnectCount >= maxLagReconnect) {
          finish('failed', new Error(streamClosedMessage));
          return true;
        }
        startConnection(lagReconnectCount + 1);
        return true;
      };

      void fetchEventSource(getUserAppTaskLogsStreamUrl(taskId, lastSeq), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: inner.signal,
        openWhenHidden: true,
        onmessage: (msg) => {
          if (isCancelled() || abortController.signal.aborted) {
            finish('cancelled');
            return;
          }
          if (!msg.data) {
            return;
          }
          let parsed: unknown = msg.data;
          try {
            parsed = JSON.parse(msg.data);
          } catch {
            parsed = msg.data;
          }
          const event = parseUserAppTaskLogEvent(parsed, msg.event);
          if (!event) {
            return;
          }
          if (event.seq === undefined && msg.id) {
            const seqFromId = Number(msg.id);
            if (Number.isFinite(seqFromId)) {
              event.seq = seqFromId;
            }
          }
          if (typeof event.seq === 'number') {
            lastSeq = event.seq;
          }
          if (isStreamLaggedEvent(event.type || msg.event)) {
            lagged = true;
            return;
          }
          onEvent(event);
          const terminal = getEventTerminalStatus(event, msg.event);
          if (terminal) {
            finish(
              terminal,
              terminal === 'failed'
                ? new Error(event.error || failedMessage)
                : undefined,
            );
          }
        },
        onclose: () => {
          if (myId !== connectionId) {
            return;
          }
          if (settled || isCancelled() || abortController.signal.aborted) {
            if (!settled) {
              finish('cancelled');
            }
            return;
          }
          if (reconnectAfterLag()) {
            return;
          }
          inferClosedStatus();
        },
        onerror: (error) => {
          if (isCancelled() || abortController.signal.aborted) {
            finish('cancelled');
            throw error;
          }
          if (lagged) {
            throw error;
          }
          finish(
            'failed',
            error instanceof Error ? error : new Error(failedMessage),
          );
          throw error;
        },
      }).catch((error: unknown) => {
        if (myId !== connectionId) {
          return;
        }
        if (settled || isCancelled() || abortController.signal.aborted) {
          if (!settled) {
            finish('cancelled');
          }
          return;
        }
        if (reconnectAfterLag()) {
          return;
        }
        finish(
          'failed',
          error instanceof Error ? error : new Error(failedMessage),
        );
      });
    };

    startConnection();
  });
};
