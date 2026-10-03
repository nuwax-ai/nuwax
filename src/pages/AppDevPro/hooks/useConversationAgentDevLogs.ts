/**
 * AppDevPro 应用日志轮询 Hook
 * 打开日志 Tab 且当前环境容器 running、应用 ready 时轮询日志来源；
 * 开发 / 线上分开请求、分开缓存。来源列表由 AppDevPro 自己的面板渲染。
 */

import useHostVisibility from '@/hooks/useHostVisibility';
import { UserAppDbEnvEnum } from '@/pages/AppDevPro/services/appDb';
import {
  apiUserAppLogsSourcesQuery,
  type UserAppReadiness,
} from '@/pages/AppDevPro/services/appDevPro';
import {
  UserAppStageEnum,
  type UserAppLogSourceItem,
} from '@/pages/AppDevPro/type';
import { canPollUserAppLogs } from '@/pages/AppDevPro/utils/isUserAppContainerRunning';
import { normalizeUserAppLogSources } from '@/pages/AppDevPro/utils/normalizeUserAppLogSources';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 沙盒日志 Hook 的配置选项
 */
interface UseConversationAgentDevLogsOptions {
  /** 轮询间隔（毫秒），默认 5000ms */
  pollInterval?: number;
  /** 每次拉取尾部行数，默认 1000 */
  tailLines?: number;
  /** 是否启用轮询，默认 false（由页面在日志 Tab 激活时设为 true） */
  enabled?: boolean;
  /** 当前查看的环境：开发 / 线上分开拉日志、分开缓存 */
  env?: UserAppDbEnvEnum;
  /** 当前环境的就绪探测结果；容器 running 且应用 ready 才真正开轮询 */
  readiness?: UserAppReadiness | null;
}

/**
 * 沙盒日志 Hook 的返回值
 */
interface UseConversationAgentDevLogsReturn {
  /** 当前环境的日志来源列表 */
  sources: UserAppLogSourceItem[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 清空当前环境的来源缓存 */
  clearLogs: () => void;
  /** 手动刷新来源（清空后重新拉取） */
  refreshLogs: () => Promise<void>;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 开始轮询 */
  startPolling: () => void;
}

const createEmptySourcesByEnv = (): Record<
  UserAppDbEnvEnum,
  UserAppLogSourceItem[]
> => ({
  [UserAppDbEnvEnum.Dev]: [],
  [UserAppDbEnvEnum.Prod]: [],
});

/**
 * AppDevPro 应用日志管理 Hook
 * @param appId 应用 ID
 * @param options 轮询与拉取配置
 * @returns 日志状态与操作方法
 */
export const useConversationAgentDevLogs = (
  appId?: number,
  options: UseConversationAgentDevLogsOptions = {},
): UseConversationAgentDevLogsReturn => {
  const {
    pollInterval = 5000,
    enabled = false,
    env = UserAppDbEnvEnum.Dev,
    readiness = null,
  } = options;
  const hostVisible = useHostVisibility();
  const canPoll = canPollUserAppLogs(readiness);
  const queryEnabledRef = useRef(false);
  queryEnabledRef.current = enabled && hostVisible && !!appId && canPoll;

  const [sourcesByEnv, setSourcesByEnv] = useState(createEmptySourcesByEnv);
  const sources = sourcesByEnv[env];
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const appIdRef = useRef(appId);
  const envRef = useRef(env);
  appIdRef.current = appId;
  envRef.current = env;

  const updateSources = useCallback(
    (targetEnv: UserAppDbEnvEnum, nextSources: UserAppLogSourceItem[]) => {
      setSourcesByEnv((prev) => ({ ...prev, [targetEnv]: nextSources }));
    },
    [],
  );

  /**
   * 轮询日志来源。仅当前环境容器 running 且应用 ready 时真正请求；开发 / 线上分开。
   */
  const devLogsPolling = useRequest(
    () => {
      const currentAppId = appIdRef.current;
      const currentEnv = envRef.current;
      if (!currentAppId || !queryEnabledRef.current) {
        return Promise.resolve({ env: currentEnv, result: undefined });
      }

      return apiUserAppLogsSourcesQuery({
        appId: currentAppId,
        env:
          currentEnv === UserAppDbEnvEnum.Prod
            ? UserAppStageEnum.Prod
            : UserAppStageEnum.Dev,
      }).then((result) => ({
        // umi useRequest 默认 formatResult 只取 data，来源列表必须放在 data 里
        data: {
          env: currentEnv,
          sources: normalizeUserAppLogSources(result),
        },
      }));
    },
    {
      manual: true,
      loading: false,
      pollingInterval: pollInterval,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      throwOnError: false,
      onSuccess: (payload?: {
        env?: UserAppDbEnvEnum;
        sources?: UserAppLogSourceItem[];
        data?: {
          env?: UserAppDbEnvEnum;
          sources?: UserAppLogSourceItem[];
        };
      }) => {
        const packed = payload?.sources ? payload : payload?.data;
        if (!packed?.env || packed.env !== envRef.current) {
          return;
        }
        updateSources(packed.env, packed.sources || []);
      },
      onError: () => {
        // 静默失败，common.ts 已配置为静默请求
      },
    },
  );

  const devLogsPollingRef = useRef(devLogsPolling);
  devLogsPollingRef.current = devLogsPolling;
  /** 轮询是否至少执行过一次，cancel 前需判断避免 umi 警告 */
  const hasExecutedRef = useRef<boolean>(false);

  /** 停止轮询并取消 useRequest 定时任务 */
  const stopPolling = useCallback(() => {
    if (devLogsPollingRef.current && hasExecutedRef.current) {
      try {
        devLogsPollingRef.current.cancel();
      } catch (error) {
        console.debug('Failed to cancel polling:', error);
      }
    }
    setIsPolling(false);
  }, []);

  /** 启动轮询（立即执行一次并进入定时循环） */
  const startPolling = useCallback(() => {
    if (!queryEnabledRef.current) return;
    devLogsPollingRef.current.run();
    hasExecutedRef.current = true;
    setIsPolling(true);
  }, []);

  /** 清空当前环境的来源缓存 */
  const clearLogs = useCallback(() => {
    updateSources(envRef.current, []);
  }, [updateSources]);

  /** 清空后手动触发一次拉取 */
  const refreshLogs = useCallback(async () => {
    if (!appIdRef.current || !queryEnabledRef.current) {
      return;
    }

    clearLogs();
    hasExecutedRef.current = true;
    devLogsPollingRef.current.run();
  }, [clearLogs]);

  /** 日志 Tab 打开、环境就绪且可见时自动启停轮询；切换环境时按该环境重新判断 */
  useEffect(() => {
    if (enabled && appId && hostVisible && canPoll) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, appId, env, hostVisible, canPoll, startPolling, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    sources,
    isLoading: devLogsPolling.loading,
    isPolling,
    clearLogs,
    refreshLogs,
    stopPolling,
    startPolling,
  };
};
