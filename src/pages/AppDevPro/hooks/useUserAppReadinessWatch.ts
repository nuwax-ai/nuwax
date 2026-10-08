import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UserAppDbEnvEnum } from '../services/appDb';
import {
  apiUserAppReadiness,
  isUserAppReadinessAccessible,
  type UserAppReadiness,
} from '../services/appDevPro';
import { shouldResolveContainerRunningWaiter } from '../utils/isUserAppContainerRunning';

/** 就绪探测间隔。页面停留期间一直重复请求，不设次数上限。 */
const READINESS_WATCH_INTERVAL_MS = 3000;

/** 等待方轮询「是否该停」的间隔，避免切环境或停止后还要等下一次接口返回。 */
const READINESS_STOP_WATCH_MS = 400;

/** 开发 / 线上各自保存的最近一次就绪结果 */
export type UserAppReadinessByEnv = Record<
  UserAppDbEnvEnum,
  UserAppReadiness | null
>;

interface ReadinessSlot {
  /** 最近一次成功拿到的探测结果；失败时保留上一次 */
  data: UserAppReadiness | null;
  /** 该环境是否至少结束过一次请求 */
  settled: boolean;
  /** 去掉 checked_at 后的展示指纹，相同则不触发页面重渲染 */
  viewKey: string;
}

type ReadinessWaiter =
  | {
      env: UserAppDbEnvEnum;
      kind: 'settled';
      shouldStop?: () => boolean;
      resolve: (data: UserAppReadiness | null) => void;
    }
  | {
      env: UserAppDbEnvEnum;
      kind: 'ready';
      shouldStop?: () => boolean;
      resolve: (ready: boolean) => void;
    }
  | {
      env: UserAppDbEnvEnum;
      kind: 'container-running';
      shouldStop?: () => boolean;
      /** 开发环境重启电脑：容器 running 之外，顶层 status 还要是 not_deployed */
      requireNotDeployed?: boolean;
      resolve: (running: boolean) => void;
    }
  | {
      env: UserAppDbEnvEnum;
      kind: 'next-poll';
      shouldStop?: () => boolean;
      resolve: (data: UserAppReadiness | null) => void;
    };

const createSlots = (): Record<UserAppDbEnvEnum, ReadinessSlot> => ({
  [UserAppDbEnvEnum.Dev]: { data: null, settled: false, viewKey: '' },
  [UserAppDbEnvEnum.Prod]: { data: null, settled: false, viewKey: '' },
});

const toByEnv = (
  slots: Record<UserAppDbEnvEnum, ReadinessSlot>,
): UserAppReadinessByEnv => ({
  [UserAppDbEnvEnum.Dev]: slots[UserAppDbEnvEnum.Dev].data,
  [UserAppDbEnvEnum.Prod]: slots[UserAppDbEnvEnum.Prod].data,
});

/**
 * 从就绪接口返回值里取出探测结果。
 * 业务码失败视为本次无效；成功但没有 ready 字段视为尚未就绪。
 *
 * @param result 接口原始返回
 * @returns ok 为 false 时调用方应保留上一次结果
 */
const pickReadinessPayload = (
  result: RequestResponse<UserAppReadiness> | UserAppReadiness | undefined,
): { ok: boolean; data: UserAppReadiness | null } => {
  if (!result || typeof result !== 'object') {
    return { ok: false, data: null };
  }
  const hasCode = 'code' in result;
  if (hasCode && result.code !== SUCCESS_CODE) {
    return { ok: false, data: null };
  }
  const payload = (hasCode && 'data' in result ? result.data : result) as
    | UserAppReadiness
    | null
    | undefined;
  if (!payload || typeof payload !== 'object' || !('ready' in payload)) {
    return { ok: true, data: null };
  }
  return { ok: true, data: payload };
};

/** 状态展示用指纹。checked_at 每次都会变，不参与比较。 */
const buildReadinessViewKey = (data: UserAppReadiness | null): string => {
  if (!data) {
    return '';
  }
  return JSON.stringify({
    ready: data.ready,
    status: data.status,
    container: data.container,
    app_stage: data.app_stage,
    serving_release_id: data.serving_release_id,
    proxy: data.proxy,
    services: data.services,
  });
};

/**
 * 页面停留期间持续请求 /api/userapp/readiness。
 * 只探测当前选中的环境，开发 / 线上不会同时请求。
 * 结果仍按环境分开保存，切走后另一侧的上次结果留着，不会被覆盖。
 * 当前环境已经真正就绪（status 为 ready 且 ready 为 true）后停止轮询。
 * 若仍有人在等计算容器 running（例如重启智能体电脑后要再 restart 应用），即使业务已就绪也继续探测。
 * watchNonce 变化时重新开始，用于用户重启应用、停止应用或重启智能体电脑之后。
 *
 * @param appId 应用 ID
 * @param env 当前选中的环境
 * @param enabled 页面是否处于激活态
 * @param watchNonce 重新开始探测的版本号
 * @returns 分环境的就绪结果，以及等待首包 / 一直等到可访问的方法
 */
export function useUserAppReadinessWatch(
  appId: number | undefined,
  env: UserAppDbEnvEnum,
  enabled = true,
  watchNonce = 0,
) {
  const slotsRef = useRef<Record<UserAppDbEnvEnum, ReadinessSlot>>(
    createSlots(),
  );
  const [readinessByEnv, setReadinessByEnv] = useState<UserAppReadinessByEnv>(
    () => toByEnv(slotsRef.current),
  );
  const readinessByEnvRef = useRef(readinessByEnv);
  readinessByEnvRef.current = readinessByEnv;
  const waitersRef = useRef<ReadinessWaiter[]>([]);
  const stopWatchRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const boundAppIdRef = useRef(appId);
  const watchNonceRef = useRef(watchNonce);
  /**
   * 重新打一轮当前探测。不走 watchNonce，避免把「等状态离开就绪」的暂停打开。
   * ensure 成功后用来丢掉已经发出、可能还停在旧容器状态上的那一次请求。
   */
  const [pollEpoch, setPollEpoch] = useState(0);
  const pollEpochRef = useRef(0);
  const continuePolling = useCallback(() => {
    pollEpochRef.current += 1;
    setPollEpoch(pollEpochRef.current);
  }, []);
  /**
   * 用户刚触发重启 / 停止时，当前结果可能还是上一次的 ready。
   * 为 true 时先等到状态离开就绪，再允许下一次就绪停掉轮询。
   */
  const holdReadyStopRef = useRef(false);

  const clearStopWatch = useCallback(() => {
    if (stopWatchRef.current === null) {
      return;
    }
    window.clearInterval(stopWatchRef.current);
    stopWatchRef.current = null;
  }, []);

  const notifyWaiters = useCallback(
    (env?: UserAppDbEnvEnum, source: 'poll' | 'tick' = 'tick') => {
      if (waitersRef.current.length === 0) {
        clearStopWatch();
        return;
      }
      waitersRef.current = waitersRef.current.filter((waiter) => {
        if (env !== undefined && waiter.env !== env) {
          return true;
        }
        if (waiter.shouldStop?.()) {
          // 结束等待，返回结果
          if (waiter.kind === 'settled' || waiter.kind === 'next-poll') {
            waiter.resolve(null);
          } else {
            waiter.resolve(false);
          }
          return false;
        }
        const slot = slotsRef.current[waiter.env];
        if (waiter.kind === 'settled' && slot.settled) {
          waiter.resolve(slot.data);
          return false;
        }
        if (
          waiter.kind === 'ready' &&
          isUserAppReadinessAccessible(slot.data)
        ) {
          waiter.resolve(true);
          return false;
        }
        if (
          waiter.kind === 'container-running' &&
          shouldResolveContainerRunningWaiter(source, slot.data, {
            requireNotDeployed: waiter.requireNotDeployed,
          })
        ) {
          waiter.resolve(true);
          return false;
        }
        if (waiter.kind === 'next-poll' && source === 'poll') {
          waiter.resolve(slot.data);
          return false;
        }
        return true;
      });
      if (waitersRef.current.length === 0) {
        clearStopWatch();
      }
    },
    [clearStopWatch],
  );

  const ensureStopWatch = useCallback(() => {
    if (stopWatchRef.current !== null) {
      return;
    }
    stopWatchRef.current = window.setInterval(() => {
      notifyWaiters();
    }, READINESS_STOP_WATCH_MS);
  }, [notifyWaiters]);

  const resetSlots = useCallback(() => {
    const next = createSlots();
    slotsRef.current = next;
    const empty = toByEnv(next);
    readinessByEnvRef.current = empty;
    setReadinessByEnv(empty);
    waitersRef.current.splice(0).forEach((waiter) => {
      if (waiter.kind === 'settled' || waiter.kind === 'next-poll') {
        waiter.resolve(null);
      } else {
        waiter.resolve(false);
      }
    });
    clearStopWatch();
  }, [clearStopWatch]);

  if (boundAppIdRef.current !== appId) {
    boundAppIdRef.current = appId;
    generationRef.current += 1;
    resetSlots();
  }

  const commitSlot = useCallback(
    (env: UserAppDbEnvEnum, data: UserAppReadiness | null) => {
      const viewKey = buildReadinessViewKey(data);
      const prev = slotsRef.current[env];
      slotsRef.current = {
        ...slotsRef.current,
        [env]: { data, settled: true, viewKey },
      };
      const next = toByEnv(slotsRef.current);
      readinessByEnvRef.current = next;
      if (prev.viewKey !== viewKey) {
        setReadinessByEnv(next);
      }
      notifyWaiters(env, 'poll');
    },
    [notifyWaiters],
  );

  const markSettled = useCallback(
    (env: UserAppDbEnvEnum) => {
      const prev = slotsRef.current[env];
      if (!prev.settled) {
        slotsRef.current = {
          ...slotsRef.current,
          [env]: { ...prev, settled: true },
        };
      }
      notifyWaiters(env);
    },
    [notifyWaiters],
  );

  useEffect(() => {
    const nonceChanged = watchNonceRef.current !== watchNonce;
    watchNonceRef.current = watchNonce;
    if (!nonceChanged) {
      holdReadyStopRef.current = false;
      return;
    }
    holdReadyStopRef.current = isUserAppReadinessAccessible(
      slotsRef.current[env].data,
    );
  }, [env, watchNonce]);

  useEffect(() => {
    if (!enabled || !appId) {
      return;
    }
    const generation = generationRef.current;
    const requestAppId = appId;
    let cancelled = false;
    const timers = new Set<number>();

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, ms);
        timers.add(timer);
      });

    const hasContainerRunningWaiter = (targetEnv: UserAppDbEnvEnum) =>
      waitersRef.current.some(
        (waiter) =>
          waiter.env === targetEnv && waiter.kind === 'container-running',
      );

    const watchEnv = async (targetEnv: UserAppDbEnvEnum) => {
      if (
        !holdReadyStopRef.current &&
        isUserAppReadinessAccessible(slotsRef.current[targetEnv].data) &&
        !hasContainerRunningWaiter(targetEnv)
      ) {
        return;
      }
      while (!cancelled && generationRef.current === generation) {
        // 头部切到另一环境后，这边只为等容器 running 才顺带打。等完就停，避免一直双份轮询。
        if (targetEnv !== env && !hasContainerRunningWaiter(targetEnv)) {
          return;
        }
        const epoch = pollEpochRef.current;
        try {
          const result = await apiUserAppReadiness(requestAppId, targetEnv);
          if (
            cancelled ||
            generationRef.current !== generation ||
            epoch !== pollEpochRef.current
          ) {
            return;
          }
          const picked = pickReadinessPayload(result);
          if (picked.ok) {
            commitSlot(targetEnv, picked.data);
            if (isUserAppReadinessAccessible(picked.data)) {
              if (
                !holdReadyStopRef.current &&
                !hasContainerRunningWaiter(targetEnv)
              ) {
                return;
              }
            } else {
              holdReadyStopRef.current = false;
            }
          } else {
            markSettled(targetEnv);
          }
        } catch {
          if (
            cancelled ||
            generationRef.current !== generation ||
            epoch !== pollEpochRef.current
          ) {
            return;
          }
          markSettled(targetEnv);
        }
        if (
          cancelled ||
          generationRef.current !== generation ||
          epoch !== pollEpochRef.current
        ) {
          return;
        }
        if (targetEnv !== env && !hasContainerRunningWaiter(targetEnv)) {
          return;
        }
        await delay(READINESS_WATCH_INTERVAL_MS);
      }
    };

    const targets = new Set<UserAppDbEnvEnum>([env]);
    waitersRef.current.forEach((waiter) => {
      if (waiter.kind === 'container-running') {
        targets.add(waiter.env);
      }
    });
    targets.forEach((targetEnv) => {
      void watchEnv(targetEnv);
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
      timers.clear();
    };
  }, [appId, commitSlot, enabled, env, markSettled, pollEpoch, watchNonce]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      clearStopWatch();
    },
    [clearStopWatch],
  );

  /**
   * 等到该环境至少完成一次探测。
   * 已经有结果时立刻返回，不额外再打一次接口。
   *
   * @param env 要等待的环境
   * @param shouldStop 返回 true 时结束等待，结果为 null
   * @returns 该环境当前保存的探测结果；尚未就绪或被打断时可能为 null
   */
  const waitForSettled = useCallback(
    (env: UserAppDbEnvEnum, shouldStop?: () => boolean) => {
      if (shouldStop?.()) {
        return Promise.resolve<UserAppReadiness | null>(null);
      }
      const slot = slotsRef.current[env];
      if (slot.settled) {
        return Promise.resolve(slot.data);
      }
      return new Promise<UserAppReadiness | null>((resolve) => {
        waitersRef.current.push({
          env,
          kind: 'settled',
          shouldStop,
          resolve,
        });
        ensureStopWatch();
      });
    },
    [ensureStopWatch],
  );

  /**
   * 一直等到该环境 ready 为 true。
   * 探测本身在后台持续进行；这里只挂起调用方，直到可访问或 shouldStop。
   *
   * @param env 要等待的环境
   * @param shouldStop 返回 true 时结束等待
   * @returns 是否已经可访问
   */
  const waitUntilReady = useCallback(
    (env: UserAppDbEnvEnum, shouldStop?: () => boolean) => {
      if (shouldStop?.()) {
        return Promise.resolve(false);
      }
      if (isUserAppReadinessAccessible(slotsRef.current[env].data)) {
        return Promise.resolve(true);
      }
      return new Promise<boolean>((resolve) => {
        waitersRef.current.push({
          env,
          kind: 'ready',
          shouldStop,
          resolve,
        });
        ensureStopWatch();
      });
    },
    [ensureStopWatch],
  );

  /**
   * 等到下一次 readiness 回包。
   * 不采用当前槽位，定时巡检也不算，避免把重启前的状态当成新结果。
   *
   * @param env 要等待的环境
   * @param shouldStop 返回 true 时结束等待，结果为 null
   * @returns 这一次探测结果；被打断时为 null
   */
  const waitForNextPoll = useCallback(
    (env: UserAppDbEnvEnum, shouldStop?: () => boolean) => {
      if (shouldStop?.()) {
        return Promise.resolve<UserAppReadiness | null>(null);
      }
      return new Promise<UserAppReadiness | null>((resolve) => {
        waitersRef.current.push({
          env,
          kind: 'next-poll',
          shouldStop,
          resolve,
        });
        ensureStopWatch();
      });
    },
    [ensureStopWatch],
  );

  /**
   * 等到计算容器 status 为 running。
   * 默认不采用当前槽位，只认之后的探测回包（电脑重启后缓存可能仍是旧的 running）。
   * 手动重启应用时可 acceptCached：当前探测已是 running 就立刻放行。
   * requireNotDeployed 时还要顶层 status 为 not_deployed，才结束等待。
   *
   * @param env 要等待的环境
   * @param shouldStop 返回 true 时结束等待
   * @param options.acceptCached 是否采信当前已保存的探测结果
   * @param options.requireNotDeployed 是否同时要求顶层 status 为 not_deployed
   * @returns 容器是否已在运行，且在要求未部署时 status 已是 not_deployed
   */
  const waitUntilContainerRunning = useCallback(
    (
      env: UserAppDbEnvEnum,
      shouldStop?: () => boolean,
      options?: { acceptCached?: boolean; requireNotDeployed?: boolean },
    ) => {
      if (shouldStop?.()) {
        return Promise.resolve(false);
      }
      if (
        options?.acceptCached &&
        shouldResolveContainerRunningWaiter(
          'poll',
          slotsRef.current[env].data,
          {
            requireNotDeployed: options.requireNotDeployed,
          },
        )
      ) {
        return Promise.resolve(true);
      }
      return new Promise<boolean>((resolve) => {
        waitersRef.current.push({
          env,
          kind: 'container-running',
          shouldStop,
          requireNotDeployed: options?.requireNotDeployed,
          resolve,
        });
        ensureStopWatch();
      });
    },
    [ensureStopWatch],
  );

  return {
    readinessByEnv,
    readinessByEnvRef,
    waitForSettled,
    waitUntilReady,
    waitUntilContainerRunning,
    waitForNextPoll,
    continuePolling,
  };
}
