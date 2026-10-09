import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiEnsurePod,
  apiKeepalivePod,
  isEnsurePodThrottledError,
} from '@/services/vncDesktop';
import { useRequest } from 'ahooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UserAppDbEnvEnum } from '../services/appDb';

/** 指定环境容器接入状态 */
export type UserAppEnvPodStatus = 'idle' | 'starting' | 'running' | 'error';

/**
 * ensure 的附加选项。
 * deferRunning 时，接口成功只表示启动请求已受理，容器可能仍在启动。
 */
export interface EnsurePodOptions {
  /**
   * 为 true 时，成功或被限流都不把容器标成运行中，也不在这次请求里保活。
   * 状态保持 starting。保活由页面延迟启动；容器 running 后再调用 confirmContainerRunning。
   */
  deferRunning?: boolean;
  /**
   * 本地已经标成 running 时仍再请求一次 ensure。
   * 数据库探测到容器实际不是 running 时使用。
   */
  reensure?: boolean;
}

/**
 * 按环境启动并保活沙箱容器（ensurePod + keepalive）。
 * 每个 Hook 实例只管理一个环境，终端与数据库在页面层复用同一实例。
 *
 * @param conversationId 会话 ID；未传则不启动
 * @param env 开发 / 线上
 * @returns 容器状态、ensure、确认容器 running 后保活、服务已就绪时仅保活，以及电脑重启后复用已有保活的方法
 */
export function useUserAppEnvPod(
  conversationId: number | undefined,
  env: UserAppDbEnvEnum,
  enabled = true,
) {
  const [status, setStatus] = useState<UserAppEnvPodStatus>('idle');
  const statusRef = useRef(status);
  statusRef.current = status;
  /** 进行中的 ensure，并发调用共用同一结果，避免第二次直接当失败 */
  const inflightPromiseRef = useRef<Promise<boolean> | null>(null);
  /** 会话 / 环境切换后忽略过期 ensure 回写 */
  const generationRef = useRef(0);
  const mountedRef = useRef(false);
  const envRef = useRef(env);
  envRef.current = env;
  /** 60 秒保活轮询是否已经在跑，避免电脑重启后再 run 一遍把间隔重置掉 */
  const keepalivePollingRef = useRef(false);

  const { run: runKeepalive, cancel: stopKeepalive } = useRequest(
    (cId: number) => apiKeepalivePod(cId, envRef.current),
    {
      manual: true,
      pollingInterval: 60000,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
    },
  );

  const beginKeepalivePolling = useCallback(
    (cId: number) => {
      keepalivePollingRef.current = true;
      runKeepalive(cId);
    },
    [runKeepalive],
  );

  useEffect(() => {
    mountedRef.current = true;
    generationRef.current += 1;
    inflightPromiseRef.current = null;
    keepalivePollingRef.current = false;
    statusRef.current = 'idle';
    setStatus('idle');
    stopKeepalive();
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      inflightPromiseRef.current = null;
      keepalivePollingRef.current = false;
      stopKeepalive();
    };
    // 仅会话 / 环境变化时重置；stopKeepalive 引用变化不得清掉失败态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, env, enabled]);

  /**
   * 接入指定环境容器。
   * 已 running 直接成功；reensure 时本地虽是 running 仍再请求一次。
   * 启动中则等待同一次请求；
   * 失败后不会自动再打，传入 force 才重试（打开终端 / 用户点重试）。
   * 默认在接口成功后就把容器视为运行中并开始保活。
   * deferRunning 时接口成功只表示请求已受理，容器是否 running 要另等 readiness。
   *
   * @param force 失败后是否允许再打一次
   * @param options.deferRunning 成功后保持 starting，不保活
   * @param options.reensure 本地已是 running 时仍再请求一次
   * @returns 请求是否受理成功。deferRunning 时不表示容器已经 running
   */
  const ensure = useCallback(
    async (force = false, options?: EnsurePodOptions): Promise<boolean> => {
      if (!mountedRef.current || !enabled || !conversationId) {
        return false;
      }
      if (statusRef.current === 'running' && options?.reensure !== true) {
        return true;
      }
      if (inflightPromiseRef.current) {
        return inflightPromiseRef.current;
      }
      if (!force && statusRef.current === 'error') {
        return false;
      }

      const generation = generationRef.current;
      const deferRunning = options?.deferRunning === true;
      const request = (async (): Promise<boolean> => {
        statusRef.current = 'starting';
        setStatus('starting');
        const acceptWithoutRunning = () => {
          statusRef.current = 'starting';
          setStatus('starting');
          return true;
        };
        const markRunningAndKeepAlive = () => {
          statusRef.current = 'running';
          setStatus('running');
          beginKeepalivePolling(conversationId);
          return true;
        };
        try {
          const { code } = await apiEnsurePod(conversationId, env);
          if (generation !== generationRef.current) {
            return false;
          }
          if (code === SUCCESS_CODE) {
            return deferRunning
              ? acceptWithoutRunning()
              : markRunningAndKeepAlive();
          }
          statusRef.current = 'error';
          setStatus('error');
          return false;
        } catch (error) {
          if (generation !== generationRef.current) {
            return false;
          }
          if (isEnsurePodThrottledError(error)) {
            return deferRunning
              ? acceptWithoutRunning()
              : markRunningAndKeepAlive();
          }
          console.error('[useUserAppEnvPod] ensurePod failed:', error);
          statusRef.current = 'error';
          setStatus('error');
          return false;
        }
      })();

      inflightPromiseRef.current = request;
      try {
        return await request;
      } finally {
        if (inflightPromiseRef.current === request) {
          inflightPromiseRef.current = null;
        }
      }
    },
    [conversationId, enabled, env, beginKeepalivePolling],
  );

  /**
   * ensure 已受理、容器还在启动时先开始保活，避免后端因没有心跳把容器收掉。
   * 不改变 starting 状态，文件列表和 Git 仍要等容器被确认 running。
   * 保活已经在跑时不重新启动。
   */
  const keepAliveWhileStarting = useCallback(() => {
    if (!mountedRef.current || !enabled || !conversationId) {
      return;
    }
    if (keepalivePollingRef.current || statusRef.current === 'error') {
      return;
    }
    beginKeepalivePolling(conversationId);
  }, [beginKeepalivePolling, conversationId, enabled]);

  /**
   * readiness 确认 container.status 为 running 之后，才把容器标成运行中。
   * 保活若已提前开始，这里不再重新 run，60 秒间隔保持不变。
   */
  const confirmContainerRunning = useCallback(() => {
    if (!mountedRef.current || !enabled || !conversationId) {
      return;
    }
    if (statusRef.current === 'running' && keepalivePollingRef.current) {
      return;
    }
    statusRef.current = 'running';
    setStatus('running');
    if (!keepalivePollingRef.current) {
      beginKeepalivePolling(conversationId);
    }
  }, [beginKeepalivePolling, conversationId, enabled]);

  /**
   * 服务已经就绪时不调用 ensure，只把容器视为运行中并继续保活。
   * 已经在保活时不重复启动。
   */
  const keepAlive = useCallback(() => {
    if (!mountedRef.current || !enabled || !conversationId) {
      return;
    }
    if (
      statusRef.current === 'running' ||
      statusRef.current === 'starting' ||
      inflightPromiseRef.current
    ) {
      return;
    }
    statusRef.current = 'running';
    setStatus('running');
    beginKeepalivePolling(conversationId);
  }, [beginKeepalivePolling, conversationId, enabled]);

  /**
   * 电脑重启后、readiness 确认容器 running 时接上保活。
   * 轮询还在跑：只补打一次 keepalive，不重新 run，60 秒间隔保持不变。
   * 还没开始：按 keepAlive 启动轮询。
   */
  const touchKeepAlive = useCallback(() => {
    if (!mountedRef.current || !enabled || !conversationId) {
      return;
    }
    if (keepalivePollingRef.current) {
      void apiKeepalivePod(conversationId, envRef.current);
      return;
    }
    if (statusRef.current === 'starting' || inflightPromiseRef.current) {
      return;
    }
    statusRef.current = 'running';
    setStatus('running');
    beginKeepalivePolling(conversationId);
  }, [beginKeepalivePolling, conversationId, enabled]);

  return {
    status,
    ensure,
    keepAliveWhileStarting,
    confirmContainerRunning,
    keepAlive,
    touchKeepAlive,
  };
}
