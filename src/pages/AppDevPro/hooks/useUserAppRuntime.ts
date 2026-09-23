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
import {
  UserAppTaskTypeEnum,
  type UserAppDevTaskInfo,
  type UserAppInfo,
  type UserAppPublishPhase,
  type UserAppRuntimeAction,
  type UserAppStartDevParams,
  type UserAppTaskLogEvent,
  type UserAppTaskServiceProgress,
} from '../type';
import {
  getTaskTerminalStatus,
  mergeTaskServiceProgress,
} from '../utils/userAppTaskLog';
import {
  listenUserAppTaskStream,
  pickUserAppRequestErrorText,
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
  /**
   * 启动或重启成功后、展示预览前，检查预览域名是否可访问。
   * 返回错误文案表示不可访问；返回空字符串表示可以展示。
   */
  confirmPreviewReachable?: () => Promise<string>;
  /** 停止成功，立刻切到「服务已停止」 */
  onStopped?: () => void;
  /** 重启或停止成功后，重新拉取应用详情 */
  onDetailRefresh?: () => void;
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
 * @param options.onStopped 停止成功回调
 * @param options.onDetailRefresh 重启或停止成功后刷新应用详情
 * @returns 运行时状态与操作
 */
export function useUserAppRuntime(options: UseUserAppRuntimeOptions) {
  const { appId, env, userAppInfo, onReady, onStopped, onDetailRefresh } =
    options;
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onDetailRefreshRef = useRef(onDetailRefresh);
  onDetailRefreshRef.current = onDetailRefresh;
  const confirmPreviewReachableRef = useRef(options.confirmPreviewReachable);
  confirmPreviewReachableRef.current = options.confirmPreviewReachable;

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UserAppPublishPhase>('idle');
  const [action, setAction] = useState<UserAppRuntimeAction>('start');
  const [services, setServices] = useState<UserAppTaskServiceProgress[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  /** 启动接口已成功，但预览域名不可访问。不进入启动失败日志板 */
  const [previewLoadError, setPreviewLoadError] = useState('');
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
  const phaseRef = useRef(phase);
  /**
   * 用户已确认停止。
   * resetTaskState 会清掉 cancelledRef，不能用它挡住停止后仍在进行的域名探测。
   */
  const stoppedByUserRef = useRef(false);
  /** 各环境是否已成功启动过，切换环境时保留，避免重复 start */
  const runningByEnvRef = useRef<Record<UserAppDbEnvEnum, boolean>>({
    [UserAppDbEnvEnum.Dev]: false,
    [UserAppDbEnvEnum.Prod]: false,
  });
  phaseRef.current = phase;

  /** 清空当前任务现场（服务日志、错误、taskId、SSE 序号），不改 phase / running */
  const resetTaskState = useCallback(() => {
    setServices([]);
    setErrorMessage('');
    setPreviewLoadError('');
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

  const setEnvRunning = useCallback((value: boolean) => {
    runningByEnvRef.current[envRef.current] = value;
    setRunning(value);
  }, []);

  /**
   * 启动或重启的任务已成功后，先检查预览域名。
   * 探测返回失败文案时只记录页面加载失败，不进入启动失败日志，也不回调 onReady。
   * 5 次探测都失败时由调用方返回空串，继续 onReady，用 iframe 再加载一次域名。
   *
   * @returns 是否可以展示预览
   */
  const finishPreviewReady = useCallback(async (): Promise<boolean> => {
    if (stoppedByUserRef.current) {
      return false;
    }
    if (cancelledRef.current) {
      setPhase('cancelled');
      return false;
    }
    const confirm = confirmPreviewReachableRef.current;
    if (confirm) {
      const failureText = (await confirm()).trim();
      if (stoppedByUserRef.current) {
        return false;
      }
      if (cancelledRef.current) {
        setPhase('cancelled');
        return false;
      }
      if (failureText) {
        setPreviewLoadError(failureText);
        setErrorMessage('');
        phaseRef.current = 'idle';
        setPhase('idle');
        setEnvRunning(false);
        return false;
      }
    }
    if (stoppedByUserRef.current) {
      return false;
    }
    setPhase('success');
    setEnvRunning(true);
    return true;
  }, [setEnvRunning]);

  const applyEvent = useCallback((event: UserAppTaskLogEvent) => {
    if (typeof event.seq === 'number') {
      lastSeqRef.current = event.seq;
    }
    setServices((prev) => {
      const next = mergeTaskServiceProgress(prev, event);
      servicesRef.current = next;
      return next;
    });
  }, []);

  const listenProgress = useCallback(
    (currentTaskId: string, currentAction: UserAppRuntimeAction) => {
      // 先关掉上一条，避免进页 effect 重入时两条 SSE 并存
      abortRef.current?.abort();
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
      });
    },
    [applyEvent],
  );

  const buildParams = useCallback((): UserAppStartDevParams => {
    const params: UserAppStartDevParams = { appId };
    if (env === UserAppDbEnvEnum.Prod) {
      const versions = userAppInfo?.buildVersions || [];
      const latest =
        versions.find((item) => item.latest) || versions[0] || undefined;
      if (latest?.version) {
        params.releaseId = latest.version;
      }
    }
    return params;
  }, [appId, env, userAppInfo?.buildVersions]);

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
        const versions = userAppInfo?.buildVersions || [];
        if (!versions.length) {
          message.warning(dict('PC.Pages.AppDevPro.prodNeedPublish'));
          return;
        }
      }
      if (phase === 'starting' || phase === 'building') {
        return;
      }

      stoppedByUserRef.current = false;
      resetTaskState();
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

        if (stoppedByUserRef.current) {
          return;
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
          if (stoppedByUserRef.current) {
            return;
          }
          if (streamResult === 'cancelled' || cancelledRef.current) {
            setPhase('cancelled');
            return;
          }
          if (streamResult === 'failed') {
            throw new Error(failedMessage);
          }
        }

        if (stoppedByUserRef.current) {
          return;
        }
        if (cancelledRef.current) {
          setPhase('cancelled');
          return;
        }

        if (nextAction === 'restart') {
          onDetailRefreshRef.current?.();
        }

        const previewReady = await finishPreviewReady();
        if (!previewReady) {
          return;
        }
        message.success(
          nextAction === 'restart'
            ? dict('PC.Pages.AppDevPro.restartSuccess')
            : dict('PC.Pages.AppDevPro.startSuccess'),
        );
        onReadyRef.current?.();
      } catch (error) {
        if (stoppedByUserRef.current) {
          return;
        }
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          setPhase('cancelled');
          return;
        }
        const text = pickUserAppRequestErrorText(error, failedMessage);
        setErrorMessage(text);
        setPhase('failed');
        setEnvRunning(false);
      }
    },
    [
      appId,
      buildParams,
      env,
      finishPreviewReady,
      listenProgress,
      phase,
      resetTaskState,
      setEnvRunning,
      userAppInfo?.buildVersions,
    ],
  );

  const start = useCallback(
    () => runStartOrRestart('start'),
    [runStartOrRestart],
  );

  const restart = useCallback(
    () => runStartOrRestart('restart'),
    [runStartOrRestart],
  );

  /**
   * 接入已有进行中任务的进度流，不再调用 start。
   *
   * @param task tasks/active 返回的进行中任务
   */
  const attachExistingTask = useCallback(
    async (task: UserAppDevTaskInfo) => {
      const currentTaskId = pickUserAppTaskId(task);
      if (!currentTaskId) {
        return;
      }
      // 用 ref 判重：进页 effect 可能在 setPhase 提交前再次调用，
      // 闭包里的 phase 仍是 idle，不能当作「尚未接入」。
      if (taskIdRef.current === currentTaskId) {
        return;
      }
      if (
        phaseRef.current === 'starting' ||
        phaseRef.current === 'building'
      ) {
        return;
      }

      const nextAction: UserAppRuntimeAction =
        task.taskType === UserAppTaskTypeEnum.DevRestart ? 'restart' : 'start';
      const isBuild = task.taskType === UserAppTaskTypeEnum.Build;
      const failedMessage = getFailedMessage(nextAction);

      resetTaskState();
      cancelledRef.current = false;
      setAction(nextAction);
      setTaskId(currentTaskId);
      taskIdRef.current = currentTaskId;
      phaseRef.current = 'starting';
      setPhase('starting');

      try {
        const immediate = getTaskTerminalStatus(task.status);
        if (immediate === 'failed') {
          throw new Error(task.error || failedMessage);
        }
        if (immediate === 'cancelled') {
          setPhase('cancelled');
          return;
        }
        if (immediate === 'succeeded') {
          if (!isBuild) {
            const previewReady = await finishPreviewReady();
            if (previewReady) {
              onReadyRef.current?.();
            }
          } else {
            setPhase('idle');
          }
          return;
        }

        phaseRef.current = 'building';
        setPhase('building');
        const streamResult = await listenProgress(currentTaskId, nextAction);
        if (streamResult === 'cancelled' || cancelledRef.current) {
          setPhase('cancelled');
          return;
        }
        if (streamResult === 'failed') {
          throw new Error(failedMessage);
        }
        if (cancelledRef.current) {
          setPhase('cancelled');
          return;
        }

        if (isBuild) {
          setPhase('success');
          return;
        }
        const previewReady = await finishPreviewReady();
        if (previewReady) {
          onReadyRef.current?.();
        }
      } catch (error) {
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          setPhase('cancelled');
          return;
        }
        const text = error instanceof Error ? error.message : failedMessage;
        setErrorMessage(text);
        setPhase('failed');
        setEnvRunning(false);
      }
    },
    [finishPreviewReady, listenProgress, resetTaskState, setEnvRunning],
  );

  /**
   * 打开预览时：未运行则自动启动。
   */
  const startIfNeeded = useCallback(() => {
    if (stoppedByUserRef.current) {
      return;
    }
    if (phase === 'starting' || phase === 'building') {
      return;
    }
    if (running || runningByEnvRef.current[envRef.current]) {
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
      return false;
    }
    setStopping(true);
    stoppedByUserRef.current = true;
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
          throw new Error(res.message || dict('PC.Pages.AppDevPro.stopFailed'));
        }
      }
      setEnvRunning(false);
      phaseRef.current = 'idle';
      setPhase('idle');
      resetTaskState();
      onDetailRefreshRef.current?.();
      onStoppedRef.current?.();
      message.success(dict('PC.Pages.AppDevPro.stopSuccess'));
      return true;
    } catch (error) {
      stoppedByUserRef.current = false;
      return false;
    } finally {
      setStopping(false);
    }
  }, [appId, buildParams, env, resetTaskState, setEnvRunning, stopStream]);

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

  /**
   * 线上环境可直接用预览地址打开，不走启动接口。
   * 同时收起「页面加载失败」，以便刷新后重新进入加载。
   */
  const markReady = useCallback(() => {
    if (phase === 'starting' || phase === 'building') {
      return;
    }
    setPreviewLoadError('');
    setEnvRunning(true);
    setPhase('success');
  }, [phase, setEnvRunning]);

  /** 收起预览域名检查失败提示，不改变运行状态 */
  const dismissPreviewLoadError = useCallback(() => {
    setPreviewLoadError('');
  }, []);

  const closeModal = useCallback(() => {
    if (phase === 'starting' || phase === 'building') {
      return;
    }
    setOpen(false);
    setPhase('idle');
    resetTaskState();
    stopStream();
  }, [phase, resetTaskState, stopStream]);

  useEffect(() => {
    if (envRef.current === env) {
      return;
    }
    const prevPhase = phaseRef.current;
    const starting = prevPhase === 'starting' || prevPhase === 'building';
    if (starting) {
      cancelledRef.current = true;
      stopStream();
      runningByEnvRef.current[envRef.current] = false;
    }
    envRef.current = env;
    const nextRunning = runningByEnvRef.current[env];
    setRunning(nextRunning);
    setOpen(false);
    if (nextRunning) {
      setPhase('success');
      return;
    }
    setPhase('idle');
    resetTaskState();
  }, [env, resetTaskState, stopStream]);

  const busy = phase === 'starting' || phase === 'building';
  const restarting = busy && action === 'restart';

  return {
    open,
    phase,
    action,
    services,
    errorMessage,
    previewLoadError,
    cancelLoading,
    busy,
    restarting,
    running,
    stopping,
    start,
    restart,
    stop,
    startIfNeeded,
    markReady,
    dismissPreviewLoadError,
    attachExistingTask,
    cancelTask,
    closeModal,
  };
}
