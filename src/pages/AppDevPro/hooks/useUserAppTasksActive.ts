import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { useRequest } from 'ahooks';
import { useCallback, useEffect, useState } from 'react';
import { apiUserAppTasksActive } from '../services/appDevPro';
import type { UserAppTasksActiveResult } from '../type';

const TASKS_ACTIVE_POLL_INTERVAL = 5000;

/**
 * 进入页面后轮询进行中任务与操作可用性。
 * 当开发启动与构建都已允许、且没有进行中任务时停止轮询。
 *
 * @param appId 应用 ID
 * @returns 开发操作 / 构建是否允许、进行中任务，以及是否已拿到首次结果
 */
export function useUserAppTasksActive(appId?: number) {
  /** 开发环境是否允许启动 / 重启；首包前默认允许，避免误锁 */
  const [devActionAllowed, setDevActionAllowed] = useState(true);
  /** 是否允许发起构建 */
  const [buildAllowed, setBuildAllowed] = useState(true);
  /** 是否已完成至少一次查询，供进页启动等待，避免用默认 true 误启动 */
  const [ready, setReady] = useState(false);
  /** 进行中任务，供进页接入已有 stream */
  const [tasks, setTasks] = useState<UserAppTasksActiveResult['tasks']>([]);
  /** 两侧都允许且无进行中任务后停止轮询 */
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    setDevActionAllowed(true);
    setBuildAllowed(true);
    setReady(false);
    setTasks([]);
    setPolling(true);
  }, [appId]);

  const { run } = useRequest(() => apiUserAppTasksActive(appId as number), {
    ready: !!appId,
    refreshDeps: [appId],
    pollingInterval: polling ? TASKS_ACTIVE_POLL_INTERVAL : 0,
    pollingWhenHidden: false,
    onSuccess: (result: RequestResponse<UserAppTasksActiveResult>) => {
      if (result?.code === SUCCESS_CODE && result.data) {
        const nextDevAllowed = result.data.devActionAllowed !== false;
        const nextBuildAllowed = result.data.buildAllowed !== false;
        setDevActionAllowed(nextDevAllowed);
        setBuildAllowed(nextBuildAllowed);
        const nextTasks = result.data.tasks || [];
        setTasks(nextTasks);
        // 两侧都允许且没有进行中任务时才停轮询，避免 build 任务进行中按钮状态卡住
        if (nextDevAllowed && nextBuildAllowed && nextTasks.length === 0) {
          setPolling(false);
        } else {
          setPolling(true);
        }
      }
      setReady(true);
    },
    onError: () => {
      setReady(true);
    },
  });

  /** 手动刷新并恢复轮询（取消构建后同步状态） */
  const refresh = useCallback(() => {
    setPolling(true);
    if (appId) {
      void run();
    }
  }, [appId, run]);

  return {
    devActionAllowed,
    buildAllowed,
    ready,
    tasks,
    refresh,
  };
}
