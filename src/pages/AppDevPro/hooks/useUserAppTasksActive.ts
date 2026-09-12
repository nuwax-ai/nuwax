import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { useRequest } from 'ahooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUserAppTasksActive } from '../services/appDevPro';
import { UserAppTaskTypeEnum, type UserAppTasksActiveResult } from '../type';

const TASKS_ACTIVE_POLL_INTERVAL = 5000;

/** 是否为开发启动 / 重启任务 */
const isDevStartTask = (taskType?: string) =>
  taskType === UserAppTaskTypeEnum.DevStart ||
  taskType === UserAppTaskTypeEnum.DevRestart;

/**
 * 进入页面后轮询进行中任务与操作可用性。
 * 当开发启动与构建都已允许、且没有进行中任务时停止轮询。
 *
 * @param appId 应用 ID
 * @returns 开发操作 / 构建是否允许、进行中任务，以及是否已拿到首次结果
 */
export function useUserAppTasksActive(appId?: number) {
  /** 开发环境是否允许启动 / 重启；首包前默认允许，避免误锁 */
  const [devActionAllowed, setDevActionAllowed] = useState<boolean>(true);
  /** 是否允许发起构建 */
  const [buildAllowed, setBuildAllowed] = useState<boolean>(true);
  /** 是否已完成至少一次查询，供进页启动等待，避免用默认 true 误启动 */
  const [ready, setReady] = useState<boolean>(false);
  /** 进行中任务，供进页接入已有 stream */
  const [tasks, setTasks] = useState<UserAppTasksActiveResult['tasks']>([]);
  /** 两侧都允许且无进行中任务后停止轮询 */
  const [polling, setPolling] = useState<boolean>(true);
  /** 手动恢复轮询版本号，确保 useRequest 使用最新 pollingInterval 重新执行 */
  const [refreshVersion, setRefreshVersion] = useState<number>(0);
  /** 本地已停止：在服务端 active 追上之前保持允许 start */
  const holdDevIdleRef = useRef(false);

  useEffect(() => {
    setDevActionAllowed(true);
    setBuildAllowed(true);
    setReady(false);
    setTasks([]);
    setPolling(true);
    holdDevIdleRef.current = false;
  }, [appId]);

  useRequest(() => apiUserAppTasksActive(appId as number), {
    ready: !!appId,
    refreshDeps: [appId, refreshVersion],
    pollingInterval: polling ? TASKS_ACTIVE_POLL_INTERVAL : 0,
    pollingWhenHidden: false,
    onSuccess: (result: RequestResponse<UserAppTasksActiveResult>) => {
      if (result?.code === SUCCESS_CODE && result.data) {
        const nextDevAllowed = result.data.devActionAllowed !== false;
        const nextBuildAllowed = result.data.buildAllowed !== false;
        const nextTasks = result.data.tasks || [];
        const hasDevStartTask = nextTasks.some((item) =>
          isDevStartTask(item.taskType),
        );
        if (
          holdDevIdleRef.current &&
          (!nextDevAllowed || hasDevStartTask)
        ) {
          setDevActionAllowed(true);
          setBuildAllowed(nextBuildAllowed);
          setTasks(nextTasks.filter((item) => !isDevStartTask(item.taskType)));
          setPolling(true);
        } else {
          holdDevIdleRef.current = false;
          setDevActionAllowed(nextDevAllowed);
          setBuildAllowed(nextBuildAllowed);
          setTasks(nextTasks);
          if (nextDevAllowed && nextBuildAllowed && nextTasks.length === 0) {
            setPolling(false);
          } else {
            setPolling(true);
          }
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
    if (!appId) {
      return;
    }
    setPolling(true);
    setRefreshVersion((version) => version + 1);
  }, [appId]);

  /**
   * 停止成功后立刻允许再 start。
   * 随后 active 若仍报占用，先忽略，直到服务端也变成空闲。
   */
  const markDevStartIdle = useCallback(() => {
    holdDevIdleRef.current = true;
    setDevActionAllowed(true);
    setTasks((prev) => prev.filter((item) => !isDevStartTask(item.taskType)));
  }, []);

  return {
    devActionAllowed,
    buildAllowed,
    ready,
    tasks,
    refresh,
    markDevStartIdle,
  };
}
