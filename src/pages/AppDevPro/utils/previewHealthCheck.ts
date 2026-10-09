import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiUserAppDbReadiness,
  UserAppDbEnvEnum,
  type UserAppDbReadiness,
} from '../services/appDb';
import {
  apiUserAppReadiness,
  UserAppReadinessStatusEnum,
  type UserAppReadiness,
} from '../services/appDevPro';
import { canConnectUserAppDatabase } from './isUserAppContainerRunning';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** 就绪接口两次探测之间的间隔（毫秒） */
const READINESS_POLL_INTERVAL_MS = 3000;

/** 就绪接口最多探测次数。到上限仍未就绪时结束，不继续等待。 */
const READINESS_POLL_MAX_ATTEMPTS = 5;

/**
 * 启动成功后轮询应用就绪接口。
 * 某一次 ready 为 true 立刻结束；否则继续，直到达到次数上限或调用方要求停止。
 * 到上限仍未就绪时返回 false，由调用方继续后续流程，不在这里一直等待。
 *
 * @param appId 应用 ID
 * @param env 发起启动的环境
 * @param shouldStop 返回 true 时停止等待
 * @returns 应用已就绪
 */
export const pollUserAppReadiness = async (
  appId: number,
  env: UserAppDbEnvEnum,
  shouldStop?: () => boolean,
): Promise<boolean> => {
  if (!appId) {
    return false;
  }

  for (let attempt = 0; attempt < READINESS_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (shouldStop?.()) {
      return false;
    }
    try {
      const result = await apiUserAppReadiness(appId, env);
      const payload = (
        result && typeof result === 'object' && 'data' in result
          ? result.data
          : result
      ) as UserAppReadiness | undefined;
      const codeOk =
        !result ||
        typeof result !== 'object' ||
        !('code' in result) ||
        result.code === SUCCESS_CODE;
      if (codeOk && payload?.ready === true) {
        return true;
      }
    } catch {
      // 单次失败继续等下一次，直到就绪、达到上限或调用方要求停止
    }
    if (shouldStop?.() || attempt >= READINESS_POLL_MAX_ATTEMPTS - 1) {
      return false;
    }
    await sleep(READINESS_POLL_INTERVAL_MS);
  }

  return false;
};
/** 数据库就绪轮询的一次结果，供页面展示当前状态 */
export interface UserAppDbReadinessSnapshot {
  /** 本次请求失败，或业务码不是成功 */
  requestFailed: boolean;
  /** 已识别的就绪状态；请求失败时为空 */
  status: UserAppReadinessStatusEnum | null;
  /** 服务端 ready 字段 */
  ready: boolean;
  /** 服务端说明 */
  message: string | null;
  /**
   * dbx 返回的容器状态。
   * 请求失败或没有 container 字段时为 null，调用方只继续轮询，不因此启动容器。
   */
  containerStatus: string | null;
}

/** 数据库就绪轮询参数 */
export interface PollUserAppDbReadinessOptions {
  /** 返回 true 时停止等待，例如面板已离开 */
  shouldStop?: () => boolean;
  /** 每一次探测结束后回调，用于刷新状态文案 */
  onProgress?: (snapshot: UserAppDbReadinessSnapshot) => void;
}

const DB_READINESS_STATUS_SET = new Set<string>(
  Object.values(UserAppReadinessStatusEnum),
);

/**
 * 把 dbx 返回的 status 收成已知枚举。无法识别时记为未知。
 *
 * @param value 接口 status 字段
 * @returns 已知状态；空字符串返回 null
 */
const parseDbReadinessStatus = (
  value: string | null | undefined,
): UserAppReadinessStatusEnum | null => {
  if (!value) {
    return null;
  }
  if (DB_READINESS_STATUS_SET.has(value)) {
    return value as UserAppReadinessStatusEnum;
  }
  return UserAppReadinessStatusEnum.Unknown;
};

/**
 * 数据库 status 为 ready 且 ready 为 true 才允许连接。不看容器字段。
 *
 * @param payload 就绪接口数据
 * @param status 已解析的状态
 * @returns 是否可以连接
 */
const isDatabaseReady = (
  payload: UserAppDbReadiness | undefined,
  status: UserAppReadinessStatusEnum | null,
): boolean =>
  canConnectUserAppDatabase({
    status,
    ready: payload?.ready === true,
  });

/**
 * 进入数据库前轮询 dbx 就绪接口。
 * status 为 ready 且 ready 为 true 就结束。未满足时继续下一轮。
 *
 * @param appId 应用 ID
 * @param env 当前数据库环境
 * @param options 停止条件和进度回调
 * @returns 数据库已就绪
 */
export const pollUserAppDbReadiness = async (
  appId: number,
  env: UserAppDbEnvEnum,
  options?: PollUserAppDbReadinessOptions,
): Promise<boolean> => {
  if (!appId) {
    return false;
  }

  const shouldStop = options?.shouldStop;
  const onProgress = options?.onProgress;

  while (!shouldStop?.()) {
    let snapshot: UserAppDbReadinessSnapshot = {
      requestFailed: true,
      status: null,
      ready: false,
      message: null,
      containerStatus: null,
    };
    let ready = false;
    try {
      const result = await apiUserAppDbReadiness(appId, env);
      const payload = (
        result && typeof result === 'object' && 'data' in result
          ? result.data
          : result
      ) as UserAppDbReadiness | undefined;
      const codeOk =
        !result ||
        typeof result !== 'object' ||
        !('code' in result) ||
        result.code === SUCCESS_CODE;
      if (codeOk && payload) {
        const status = parseDbReadinessStatus(payload.status);
        ready = isDatabaseReady(payload, status);
        snapshot = {
          requestFailed: false,
          status,
          ready: payload.ready === true,
          message: payload.message ?? null,
          containerStatus: payload.container?.status ?? null,
        };
      }
    } catch {
      snapshot = {
        requestFailed: true,
        status: null,
        ready: false,
        message: null,
        containerStatus: null,
      };
    }

    if (shouldStop?.()) {
      return false;
    }
    onProgress?.(snapshot);
    if (ready) {
      return true;
    }
    await sleep(READINESS_POLL_INTERVAL_MS);
  }

  return false;
};
