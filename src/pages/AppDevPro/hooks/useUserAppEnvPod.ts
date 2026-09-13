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
 * 按环境按需启动并保活沙箱容器（ensurePod + keepalive）。
 * 开发环境进页已预启动；线上环境在打开数据库 / 终端时再调用 ensure。
 *
 * @param conversationId 会话 ID；未传则不启动
 * @param env 开发 / 线上
 * @returns 容器状态与 ensure 方法
 */
export function useUserAppEnvPod(
  conversationId: number | undefined,
  env: UserAppDbEnvEnum,
) {
  const [status, setStatus] = useState<UserAppEnvPodStatus>('idle');
  const statusRef = useRef(status);
  statusRef.current = status;
  const inFlightRef = useRef(false);
  const envRef = useRef(env);
  envRef.current = env;

  const { run: runKeepalive, cancel: stopKeepalive } = useRequest(
    (cId: number) => apiKeepalivePod(cId, envRef.current),
    {
      manual: true,
      pollingInterval: 60000,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
    },
  );

  useEffect(() => {
    return () => {
      stopKeepalive();
    };
  }, [conversationId, env, stopKeepalive]);

  /**
   * 接入指定环境容器。
   * 失败后不会自动再打；传入 force 才重试（用户点重试按钮）。
   */
  const ensure = useCallback(async (force = false): Promise<boolean> => {
    if (!conversationId || inFlightRef.current) {
      return statusRef.current === 'running';
    }
    if (statusRef.current === 'running') {
      return true;
    }
    if (!force && statusRef.current === 'error') {
      return false;
    }

    inFlightRef.current = true;
    setStatus('starting');
    try {
      const { code } = await apiEnsurePod(conversationId, env);
      if (code === SUCCESS_CODE) {
        setStatus('running');
        runKeepalive(conversationId);
        return true;
      }
      setStatus('error');
      return false;
    } catch (error) {
      if (isEnsurePodThrottledError(error)) {
        setStatus('running');
        runKeepalive(conversationId);
        return true;
      }
      console.error('[useUserAppEnvPod] ensurePod failed:', error);
      setStatus('error');
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [conversationId, env, runKeepalive]);

  return { status, ensure };
}
