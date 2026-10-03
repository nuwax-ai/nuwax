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
 * 按环境启动并保活沙箱容器（ensurePod + keepalive）。
 * 每个 Hook 实例只管理一个环境，终端与数据库在页面层复用同一实例。
 *
 * @param conversationId 会话 ID；未传则不启动
 * @param env 开发 / 线上
 * @returns 容器状态、ensure、仅保活，以及电脑重启后复用已有保活的方法
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
   * 已 running 直接成功；启动中则等待同一次请求；
   * 失败后不会自动再打，传入 force 才重试（打开终端 / 用户点重试）。
   */
  const ensure = useCallback(
    async (force = false): Promise<boolean> => {
      if (!mountedRef.current || !enabled || !conversationId) {
        return false;
      }
      if (statusRef.current === 'running') {
        return true;
      }
      if (inflightPromiseRef.current) {
        return inflightPromiseRef.current;
      }
      if (!force && statusRef.current === 'error') {
        return false;
      }

      const generation = generationRef.current;
      const request = (async (): Promise<boolean> => {
        statusRef.current = 'starting';
        setStatus('starting');
        try {
          const { code } = await apiEnsurePod(conversationId, env);
          if (generation !== generationRef.current) {
            return false;
          }
          if (code === SUCCESS_CODE) {
            statusRef.current = 'running';
            setStatus('running');
            beginKeepalivePolling(conversationId);
            return true;
          }
          statusRef.current = 'error';
          setStatus('error');
          return false;
        } catch (error) {
          if (generation !== generationRef.current) {
            return false;
          }
          if (isEnsurePodThrottledError(error)) {
            statusRef.current = 'running';
            setStatus('running');
            beginKeepalivePolling(conversationId);
            return true;
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
   * 电脑重启成功后接上保活。
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

  return { status, ensure, keepAlive, touchKeepAlive };
}
