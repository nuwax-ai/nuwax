import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import {
  apiUserAppBuild,
  apiUserAppBuildCancel,
  apiUserAppProdStart,
} from '../services/appDevPro';
import type {
  UserAppDeployFailedStage,
  UserAppDevTaskInfo,
  UserAppPublishPhase,
  UserAppTaskLogEvent,
  UserAppTaskServiceProgress,
  UserAppTaskTerminalStatus,
} from '../type';
import {
  USER_APP_BUILD_SSE_EVENT,
  getTaskTerminalStatus,
  mergeTaskServiceProgress,
  normalizeTaskStatus,
} from '../utils/userAppTaskLog';
import {
  listenUserAppTaskStream,
  pickUserAppRequestErrorText,
  pickUserAppTaskId,
  unwrapUserAppResponse,
} from '../utils/userAppTaskStream';

export interface UseUserAppPublishOptions {
  /** 应用 ID */
  appId?: number;
  /** SSE 检测到构建失败后恢复 active 任务轮询 */
  onBuildFailed?: () => void;
  /** 构建并部署成功后，打开发布到市场弹窗 */
  onDeployed?: () => void;
}

/**
 * AppDevPro 部署：构建 → SSE 进度 → 生产部署；成功后再由页面打开发布弹窗。
 *
 * @param options.appId 应用 ID
 * @param options.onBuildFailed 构建失败回调
 * @param options.onDeployed 部署成功回调
 * @returns 部署状态与操作
 */
export function useUserAppPublish(options: UseUserAppPublishOptions) {
  const { appId, onBuildFailed, onDeployed } = options;

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UserAppPublishPhase>('idle');
  const [services, setServices] = useState<UserAppTaskServiceProgress[]>([]);
  const [startServices, setStartServices] = useState<
    UserAppTaskServiceProgress[]
  >([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedStage, setFailedStage] =
    useState<UserAppDeployFailedStage | null>(null);
  const [taskId, setTaskId] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const terminalRef = useRef<UserAppTaskTerminalStatus | null>(null);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const startServicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const streamStageRef = useRef<'build' | 'start'>('build');
  const releaseIdRef = useRef('');
  const buildSucceededRef = useRef(false);

  /** 清空当前发布任务现场（构建/部署日志、错误、taskId、SSE 序号） */
  const resetTaskState = useCallback(() => {
    setServices([]);
    setStartServices([]);
    setErrorMessage('');
    setFailedStage(null);
    setTaskId('');
    taskIdRef.current = '';
    lastSeqRef.current = undefined;
    terminalRef.current = null;
    cancelledRef.current = false;
    servicesRef.current = [];
    startServicesRef.current = [];
    streamStageRef.current = 'build';
    releaseIdRef.current = '';
    buildSucceededRef.current = false;
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const applyEvent = useCallback((event: UserAppTaskLogEvent) => {
    if (typeof event.seq === 'number') {
      lastSeqRef.current = event.seq;
    }
    if (
      normalizeTaskStatus(event.type) === USER_APP_BUILD_SSE_EVENT.COMPLETED
    ) {
      const releaseId = event.release_id;
      if (typeof releaseId === 'string' && releaseId.trim()) {
        releaseIdRef.current = releaseId.trim();
      }
    }
    if (streamStageRef.current === 'start') {
      setStartServices((prev) => {
        const next = mergeTaskServiceProgress(prev, event);
        startServicesRef.current = next;
        return next;
      });
      return;
    }
    setServices((prev) => {
      const next = mergeTaskServiceProgress(prev, event);
      servicesRef.current = next;
      return next;
    });
  }, []);

  /**
   * 监听任务 SSE，直到成功 / 失败 / 取消。
   *
   * @param currentTaskId 任务 ID
   * @param failedMessage 失败文案
   */
  const listenBuildProgress = useCallback(
    (currentTaskId: string, failedMessage?: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      return listenUserAppTaskStream({
        taskId: currentTaskId,
        fromSeq: lastSeqRef.current,
        abortController: controller,
        isCancelled: () => cancelledRef.current,
        onEvent: applyEvent,
        getServices: () =>
          streamStageRef.current === 'start'
            ? startServicesRef.current
            : servicesRef.current,
        failedMessage:
          failedMessage || dict('PC.Pages.AppDevPro.buildStatusFailed'),
        streamClosedMessage: dict('PC.Pages.AppDevPro.publishStreamClosed'),
      }).then((status) => {
        terminalRef.current = status;
        return status;
      });
    },
    [applyEvent],
  );

  /**
   * 构建成功后启动生产服务，并监听启动任务 SSE。
   */
  const submitProdStart = useCallback(async () => {
    if (!appId) {
      throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
    }
    setPhase('deploying');
    stopStream();
    lastSeqRef.current = undefined;
    streamStageRef.current = 'start';
    startServicesRef.current = [];
    setStartServices([]);

    const task = unwrapUserAppResponse(
      await apiUserAppProdStart({
        appId,
        releaseId: releaseIdRef.current || undefined,
      }),
      dict('PC.Pages.AppDevPro.startFailed'),
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

    const immediate = getTaskTerminalStatus(task.status);
    if (immediate === 'failed') {
      throw new Error(task.error || dict('PC.Pages.AppDevPro.startFailed'));
    }
    if (immediate === 'cancelled') {
      setPhase('cancelled');
      return;
    }

    if (currentTaskId && immediate !== 'succeeded') {
      const streamResult = await listenBuildProgress(
        currentTaskId,
        dict('PC.Pages.AppDevPro.startFailed'),
      );
      if (streamResult === 'cancelled' || cancelledRef.current) {
        setPhase('cancelled');
        return;
      }
      if (streamResult === 'failed') {
        throw new Error(dict('PC.Pages.AppDevPro.startFailed'));
      }
    }
  }, [appId, listenBuildProgress, stopStream]);

  /**
   * 点击部署：创建构建任务，监听进度，成功后调用生产部署。
   */
  const startPublish = useCallback(async () => {
    if (!appId) {
      message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
      return;
    }
    if (
      phase === 'starting' ||
      phase === 'building' ||
      phase === 'deploying' ||
      phase === 'applying'
    ) {
      setOpen(true);
      return;
    }

    resetTaskState();
    setOpen(true);
    setPhase('starting');

    try {
      const task = unwrapUserAppResponse(
        await apiUserAppBuild({ appId }),
        dict('PC.Pages.AppDevPro.buildStatusFailed'),
      ) as UserAppDevTaskInfo;

      const currentTaskId = pickUserAppTaskId(task);
      if (!currentTaskId) {
        throw new Error(dict('PC.Pages.AppDevPro.buildStatusFailed'));
      }
      setTaskId(currentTaskId);
      taskIdRef.current = currentTaskId;

      if (cancelledRef.current) {
        await apiUserAppBuildCancel(currentTaskId);
        setPhase('cancelled');
        return;
      }

      const immediate = getTaskTerminalStatus(task.status);
      if (immediate === 'failed') {
        throw new Error(
          task.error || dict('PC.Pages.AppDevPro.buildStatusFailed'),
        );
      }
      if (immediate === 'cancelled') {
        setPhase('cancelled');
        return;
      }

      if (immediate !== 'succeeded') {
        setPhase('building');
        const streamResult = await listenBuildProgress(currentTaskId);
        if (streamResult === 'cancelled' || cancelledRef.current) {
          setPhase('cancelled');
          return;
        }
        if (streamResult === 'failed') {
          throw new Error(dict('PC.Pages.AppDevPro.buildStatusFailed'));
        }
      }

      if (cancelledRef.current) {
        setPhase('cancelled');
        return;
      }

      buildSucceededRef.current = true;
      await submitProdStart();

      if (cancelledRef.current) {
        setPhase('cancelled');
        return;
      }

      setPhase('applying');
      onDeployed?.();
    } catch (error) {
      if (
        cancelledRef.current ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        setPhase('cancelled');
        return;
      }
      const stage: UserAppDeployFailedStage = buildSucceededRef.current
        ? 'deploy'
        : 'build';
      const fallback =
        stage === 'deploy'
          ? dict('PC.Pages.AppDevPro.startFailed')
          : dict('PC.Pages.AppDevPro.buildStatusFailed');
      const text = pickUserAppRequestErrorText(error, fallback);
      setFailedStage(stage);
      setErrorMessage(text);
      setPhase('failed');
      if (stage === 'build' && taskIdRef.current) {
        onBuildFailed?.();
      }
    }
  }, [
    appId,
    listenBuildProgress,
    onBuildFailed,
    onDeployed,
    phase,
    resetTaskState,
    submitProdStart,
  ]);

  /**
   * 取消当前构建任务。
   */
  const cancelTask = useCallback(async () => {
    const currentTaskId = taskIdRef.current || taskId;
    if (!currentTaskId) {
      cancelledRef.current = true;
      stopStream();
      setPhase('cancelled');
      setOpen(false);
      return;
    }
    setCancelLoading(true);
    try {
      cancelledRef.current = true;
      await apiUserAppBuildCancel(currentTaskId);
      stopStream();
      setPhase('cancelled');
      setOpen(false);
      message.success(dict('PC.Pages.AppDevPro.publishCancelled'));
    } catch (error) {
      console.error('[AppDevPro] Cancel deploying failed:', error);
    } finally {
      setCancelLoading(false);
    }
  }, [stopStream, taskId]);

  /**
   * 发布到市场成功。
   */
  const completeApply = useCallback(() => {
    setPhase('success');
  }, []);

  /**
   * 关闭进度弹窗（进行中需先取消）。
   */
  const closeModal = useCallback(() => {
    if (phase === 'starting' || phase === 'building' || phase === 'deploying') {
      return;
    }
    setOpen(false);
    setPhase('idle');
    resetTaskState();
    stopStream();
  }, [phase, resetTaskState, stopStream]);

  const publishing =
    phase === 'starting' || phase === 'building' || phase === 'deploying';

  return {
    open,
    phase,
    services,
    errorMessage,
    failedStage,
    taskId,
    cancelLoading,
    publishing,
    startPublish,
    completeApply,
    cancelTask,
    closeModal,
    startServices,
  };
}
