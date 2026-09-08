import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UserAppDbEnvEnum } from '../services/appDb';
import {
  apiUserAppBuildCancel,
  apiUserAppProdRestart,
  apiUserAppProdStart,
  apiUserAppProdStop,
  apiUserAppRestartDev,
  apiUserAppStartDev,
  apiUserAppStopDev,
} from '../services/appDevPro';
import type {
  UserAppDevTaskInfo,
  UserAppInfo,
  UserAppPublishPhase,
  UserAppRuntimeAction,
  UserAppStartDevParams,
  UserAppTaskLogEvent,
  UserAppTaskServiceProgress,
} from '../type';
import {
  getOverallTaskProgress,
  getTaskTerminalStatus,
  mergeTaskServiceProgress,
} from '../utils/userAppTaskLog';
import {
  listenUserAppTaskStream,
  pickUserAppTaskId,
  unwrapUserAppResponse,
} from '../utils/userAppTaskStream';

export interface UseUserAppRuntimeOptions {
  /** 应用 ID */
  appId?: number;
  /** 当前环境：开发 / 线上 */
  env: UserAppDbEnvEnum;
  /** 应用详情（线上启动需要最新发布版本） */
  userAppInfo?: UserAppInfo | null;
  /** 启动或重启成功后刷新预览 */
  onReady?: () => void;
}

const getFailedMessage = (action: UserAppRuntimeAction): string => {
  if (action === 'restart') {
    return dict('PC.Pages.AppDevPro.restartFailed');
  }
  if (action === 'stop') {
    return dict('PC.Pages.AppDevPro.stopFailed');
  }
  return dict('PC.Pages.AppDevPro.startFailed');
};

/**
 * 应用预览运行时：按环境调用开发 / 线上的启动、重启、停止，启动类任务走 SSE 进度。
 *
 * @param options.appId 应用 ID
 * @param options.env 当前环境
 * @param options.userAppInfo 应用详情
 * @param options.onReady 启动完成回调
 * @returns 运行时状态与操作
 */
export function useUserAppRuntime(options: UseUserAppRuntimeOptions) {
  const { appId, env, userAppInfo, onReady } = options;

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UserAppPublishPhase>('idle');
  const [action, setAction] = useState<UserAppRuntimeAction>('start');
  const [services, setServices] = useState<UserAppTaskServiceProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [taskId, setTaskId] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const envRef = useRef(env);

  const resetProgress = useCallback(() => {
    setServices([]);
    setOverallProgress(0);
    setErrorMessage('');
    setTaskId('');
    taskIdRef.current = '';
    lastSeqRef.current = undefined;
    cancelledRef.current = false;
    servicesRef.current = [];
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const applyEvent = useCallback((event: UserAppTaskLogEvent) => {
    if (typeof event.seq === 'number') {
      lastSeqRef.current = event.seq;
    }
    setServices((prev) => {
      const next = mergeTaskServiceProgress(prev, event);
      servicesRef.current = next;
      setOverallProgress(getOverallTaskProgress(next));
      return next;
    });
  }, []);

  const listenProgress = useCallback(
    (currentTaskId: string, currentAction: UserAppRuntimeAction) => {
      const controller = new AbortController();
      abortRef.current = controller;
      return listenUserAppTaskStream({
        taskId: currentTaskId,
        fromSeq: lastSeqRef.current,
        abortController: controller,
        isCancelled: () => cancelledRef.current,
        onEvent: applyEvent,
        getServices: () => servicesRef.current,
        failedMessage: getFailedMessage(currentAction),
        streamClosedMessage: dict('PC.Pages.AppDevPro.publishStreamClosed'),
      }).then((status) => {
        if (status === 'succeeded') {
          setOverallProgress(100);
        }
        return status;
      });
    },
    [applyEvent],
  );

  const buildParams = useCallback((): UserAppStartDevParams => {
    const params: UserAppStartDevParams = { appId };
    if (env === UserAppDbEnvEnum.Prod) {
      const versions = userAppInfo?.publishVersions || [];
      const latest =
        versions.find((item) => item.latest) || versions[0] || undefined;
      if (latest?.version) {
        params.releaseId = latest.version;
      }
    }
    return params;
  }, [appId, env, userAppInfo?.publishVersions]);

  /**
   * 执行启动或重启：调环境对应接口，有 taskId 则拉 SSE。
   *
   * @param nextAction start 或 restart
   */
  const runStartOrRestart = useCallback(
    async (nextAction: UserAppRuntimeAction) => {
      if (!appId) {
        message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
        return;
      }
      if (env === UserAppDbEnvEnum.Prod) {
        const versions = userAppInfo?.publishVersions || [];
        if (!versions.length) {
          message.warning(dict('PC.Pages.AppDevPro.prodNeedPublish'));
          return;
        }
      }
      if (phase === 'starting' || phase === 'building') {
        return;
      }

      resetProgress();
      setAction(nextAction);
      setPhase('starting');

      const failedMessage = getFailedMessage(nextAction);

      try {
        const params = buildParams();
        const isProd = env === UserAppDbEnvEnum.Prod;
        const requestApi =
          nextAction === 'restart'
            ? isProd
              ? apiUserAppProdRestart
              : apiUserAppRestartDev
            : isProd
            ? apiUserAppProdStart
            : apiUserAppStartDev;

        const task = unwrapUserAppResponse(
          await requestApi(params),
          failedMessage,
        ) as UserAppDevTaskInfo;

        const currentTaskId = pickUserAppTaskId(task);
        if (currentTaskId) {
          setTaskId(currentTaskId);
          taskIdRef.current = currentTaskId;
        }

        if (cancelledRef.current) {
          if (currentTaskId) {
            await apiUserAppBuildCancel(currentTaskId);
          }
          setPhase('cancelled');
          return;
        }

        const immediate = getTaskTerminalStatus(task?.status);
        if (immediate === 'failed') {
          throw new Error(task?.error || failedMessage);
        }
        if (immediate === 'cancelled') {
          setPhase('cancelled');
          return;
        }

        if (currentTaskId && immediate !== 'succeeded') {
          setPhase('building');
          const streamResult = await listenProgress(currentTaskId, nextAction);
          if (streamResult === 'cancelled' || cancelledRef.current) {
            setPhase('cancelled');
            return;
          }
          if (streamResult === 'failed') {
            throw new Error(failedMessage);
          }
        }

        if (cancelledRef.current) {
          setPhase('cancelled');
          return;
        }

        setPhase('success');
        setOverallProgress(100);
        setRunning(true);
        message.success(
          nextAction === 'restart'
            ? dict('PC.Pages.AppDevPro.restartSuccess')
            : dict('PC.Pages.AppDevPro.startSuccess'),
        );
        onReady?.();
      } catch (error) {
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          setPhase('cancelled');
          return;
        }
        const text =
          error instanceof Error ? error.message : failedMessage;
        setErrorMessage(text);
        setPhase('failed');
        setRunning(false);
      }
    },
    [
      appId,
      buildParams,
      env,
      listenProgress,
      onReady,
      phase,
      resetProgress,
      userAppInfo?.publishVersions,
    ],
  );

  const start = useCallback(() => runStartOrRestart('start'), [runStartOrRestart]);

  const restart = useCallback(
    () => runStartOrRestart('restart'),
    [runStartOrRestart],
  );

  /**
   * 打开预览时：未运行则自动启动。
   */
  const startIfNeeded = useCallback(() => {
    if (phase === 'starting' || phase === 'building') {
      return;
    }
    if (running) {
      return;
    }
    void start();
  }, [phase, running, start]);

  /**
   * 停止当前环境服务。
   */
  const stop = useCallback(async () => {
    if (!appId) {
      message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
      return;
    }
    setStopping(true);
    cancelledRef.current = true;
    stopStream();
    try {
      const params = buildParams();
      const result =
        env === UserAppDbEnvEnum.Prod
          ? await apiUserAppProdStop(params)
          : await apiUserAppStopDev(params);
      if (result && typeof result === 'object' && 'code' in result) {
        const res = result as RequestResponse<null>;
        if (res.code && res.code !== SUCCESS_CODE) {
          throw new Error(
            res.message || dict('PC.Pages.AppDevPro.stopFailed'),
          );
        }
      }
      setRunning(false);
      setPhase('idle');
      resetProgress();
      message.success(dict('PC.Pages.AppDevPro.stopSuccess'));
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : dict('PC.Pages.AppDevPro.stopFailed');
      message.error(text);
    } finally {
      setStopping(false);
    }
  }, [appId, buildParams, env, resetProgress, stopStream]);

  // 取消当前启动 / 重启任务
  const cancelTask = useCallback(async () => {
    const currentTaskId = taskIdRef.current || taskId;
    if (!currentTaskId) {
      cancelledRef.current = true;
      stopStream();
      setPhase('cancelled');
      return;
    }
    setCancelLoading(true);
    try {
      cancelledRef.current = true;
      await apiUserAppBuildCancel(currentTaskId);
      stopStream();
      setPhase('cancelled');
      message.success(dict('PC.Pages.AppDevPro.startCancelled'));
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : dict('PC.Pages.AppDevPro.startFailed');
      message.error(text);
    } finally {
      setCancelLoading(false);
    }
  }, [stopStream, taskId]);

  const closeModal = useCallback(() => {
    if (phase === 'starting' || phase === 'building') {
      return;
    }
    setOpen(false);
    setPhase('idle');
    resetProgress();
    stopStream();
  }, [phase, resetProgress, stopStream]);

  useEffect(() => {
    if (envRef.current === env) {
      return;
    }
    envRef.current = env;
    cancelledRef.current = true;
    stopStream();
    setRunning(false);
    setOpen(false);
    setPhase('idle');
    resetProgress();
  }, [env, resetProgress, stopStream]);

  const busy = phase === 'starting' || phase === 'building';

  return {
    open,
    phase,
    action,
    services,
    overallProgress,
    errorMessage,
    cancelLoading,
    busy,
    running,
    stopping,
    start,
    restart,
    stop,
    startIfNeeded,
    cancelTask,
    closeModal,
  };
}
