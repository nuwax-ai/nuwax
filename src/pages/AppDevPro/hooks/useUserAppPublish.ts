import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { UserAppDbEnvEnum } from '../services/appDb';
import {
  apiUserAppBuild,
  apiUserAppBuildCancel,
  apiUserAppGetById,
  apiUserAppProdDeployable,
  apiUserAppProdStart,
  apiUserAppProdStop,
} from '../services/appDevPro';
import {
  apiUserAppDomainList,
  normalizeUserAppPreviewUrl,
  type UserAppDomainInfo,
} from '../services/appDomain';
import type {
  UserAppDeployFailedStage,
  UserAppDevTaskInfo,
  UserAppInfo,
  UserAppPublishPhase,
  UserAppTaskLogEvent,
  UserAppTaskServiceProgress,
  UserAppTaskTerminalStatus,
} from '../type';
import { pickUserAppEnvDomain } from '../utils/userAppPreviewUrl';
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

const DEPLOYABLE_POLL_INTERVAL_MS = 2000;
const DEPLOYABLE_POLL_TIMEOUT_MS = 10 * 60 * 1000;

export interface UseUserAppPublishOptions {
  /** 应用 ID */
  appId?: number;
  /** 部署成功后回写应用详情（prodDeployed 等，供 Header 显示发布按钮） */
  onProjectInfo?: (info: UserAppInfo) => void;
  /** 部署成功后回写域名列表 */
  onDomainList?: (list: UserAppDomainInfo[]) => void;
}

/**
 * AppDevPro 部署：构建 → SSE → 轮询可部署 → 生产 start。
 * 发布到市场由 Header 发布按钮单独触发，不走本流程。
 *
 * @param options.appId 应用 ID
 * @param options.onProjectInfo 回写应用详情
 * @param options.onDomainList 回写域名列表
 * @returns 部署状态与操作
 */
export function useUserAppPublish(options: UseUserAppPublishOptions) {
  const { appId, onProjectInfo, onDomainList } = options;

  const [open, setOpen] = useState<boolean>(false);
  const [phase, setPhase] = useState<UserAppPublishPhase>('idle');
  const [services, setServices] = useState<UserAppTaskServiceProgress[]>([]);
  const [startServices, setStartServices] = useState<
    UserAppTaskServiceProgress[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [failedStage, setFailedStage] =
    useState<UserAppDeployFailedStage | null>(null);
  const [taskId, setTaskId] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [stopLoading, setStopLoading] = useState<boolean>(false);
  /** 历史构建包版本侧栏触发的指定 releaseId 部署 */
  const [deployingReleaseId, setDeployingReleaseId] = useState<string>('');
  /** 部署成功后异步拿到的线上 Prod 域名 */
  const [prodAccessUrl, setProdAccessUrl] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const terminalRef = useRef<UserAppTaskTerminalStatus | null>(null);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef<string>('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const startServicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const streamStageRef = useRef<'build' | 'start'>('build');
  const releaseIdRef = useRef<string>('');
  const buildSucceededRef = useRef<boolean>(false);
  const checkPassedRef = useRef<boolean>(false);
  /** 当前进行中的步骤，取消时用于标记错误落点 */
  const activeStageRef = useRef<UserAppDeployFailedStage>('build');

  /**
   * 切换进行中的阶段，并同步 activeStageRef。
   *
   * @param next 下一阶段
   */
  const setPublishPhase = useCallback((next: UserAppPublishPhase) => {
    if (next === 'starting' || next === 'building') {
      activeStageRef.current = 'build';
    } else if (next === 'checkingDeployable') {
      activeStageRef.current = 'check';
    } else if (next === 'deploying') {
      activeStageRef.current = 'deploy';
    }
    setPhase(next);
  }, []);

  /** 取消部署：保留已完成步骤，错误落在当前步骤 */
  const markCancelled = useCallback(() => {
    setFailedStage(activeStageRef.current);
    setPhase('cancelled');
  }, []);

  /** 清空当前发布任务现场（构建/部署日志、错误、taskId、SSE 序号） */
  const resetTaskState = useCallback(() => {
    setServices([]);
    setStartServices([]);
    setErrorMessage('');
    setFailedStage(null);
    setTaskId('');
    setProdAccessUrl('');
    taskIdRef.current = '';
    lastSeqRef.current = undefined;
    terminalRef.current = null;
    cancelledRef.current = false;
    servicesRef.current = [];
    startServicesRef.current = [];
    streamStageRef.current = 'build';
    releaseIdRef.current = '';
    buildSucceededRef.current = false;
    checkPassedRef.current = false;
    activeStageRef.current = 'build';
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
   * SSE 拿到 releaseId 后轮询是否可生产部署，data 为 true 才继续 start。
   */
  const waitUntilProdDeployable = useCallback(async () => {
    if (!appId) {
      throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
    }
    setPublishPhase('checkingDeployable');
    const startedAt = Date.now();
    while (!cancelledRef.current) {
      try {
        const result = await apiUserAppProdDeployable({
          appId,
          releaseId: releaseIdRef.current || undefined,
        });
        const ok =
          result &&
          typeof result === 'object' &&
          'data' in result &&
          (!('code' in result) || result.code === SUCCESS_CODE) &&
          result.data === true;
        if (ok) {
          checkPassedRef.current = true;
          return;
        }
      } catch {
        // 检测接口失败时继续轮询，直到超时或取消
      }
      if (Date.now() - startedAt >= DEPLOYABLE_POLL_TIMEOUT_MS) {
        throw new Error(dict('PC.Pages.AppDevPro.checkDeployableTimeout'));
      }
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, DEPLOYABLE_POLL_INTERVAL_MS);
      });
    }
  }, [appId, setPublishPhase]);

  /**
   * 部署成功后并行刷新应用详情与域名列表。
   * 只回写页面状态、拼 Prod 访问地址；失败不改 phase。
   */
  const refreshAfterDeploy = useCallback(async () => {
    if (!appId) {
      return;
    }
    const [appResult, domainResult] = await Promise.allSettled([
      apiUserAppGetById(appId),
      apiUserAppDomainList(appId),
    ]);

    if (appResult.status === 'fulfilled') {
      const result = appResult.value;
      if (result?.code === SUCCESS_CODE && result.data) {
        onProjectInfo?.(result.data);
      }
    } else {
      console.error(
        '[AppDevPro] Refresh project after deploy failed:',
        appResult.reason,
      );
    }

    if (domainResult.status === 'fulfilled') {
      const result = domainResult.value;
      if (result?.code === SUCCESS_CODE) {
        const list = result.data || [];
        onDomainList?.(list);
        const domain = pickUserAppEnvDomain(UserAppDbEnvEnum.Prod, list);
        setProdAccessUrl(normalizeUserAppPreviewUrl(domain));
      }
    } else {
      console.error(
        '[AppDevPro] Refresh domain list after deploy failed:',
        domainResult.reason,
      );
    }
  }, [appId, onDomainList, onProjectInfo]);

  /**
   * 构建成功后启动生产服务，并监听启动任务 SSE。
   */
  const submitProdStart = useCallback(async () => {
    if (!appId) {
      throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
    }
    setPublishPhase('deploying');
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
    ) as UserAppDevTaskInfo | undefined;

    const currentTaskId = pickUserAppTaskId(task);
    if (currentTaskId) {
      setTaskId(currentTaskId);
      taskIdRef.current = currentTaskId;
    }

    if (cancelledRef.current) {
      if (currentTaskId) {
        await apiUserAppBuildCancel(currentTaskId);
      }
      markCancelled();
      return;
    }

    const immediate = getTaskTerminalStatus(task?.status);
    if (immediate === 'failed') {
      throw new Error(task?.error || dict('PC.Pages.AppDevPro.startFailed'));
    }
    if (immediate === 'cancelled') {
      markCancelled();
      return;
    }

    if (currentTaskId && immediate !== 'succeeded') {
      const streamResult = await listenBuildProgress(
        currentTaskId,
        dict('PC.Pages.AppDevPro.startFailed'),
      );
      if (streamResult === 'cancelled' || cancelledRef.current) {
        markCancelled();
        return;
      }
      if (streamResult === 'failed') {
        throw new Error(dict('PC.Pages.AppDevPro.startFailed'));
      }
    }
  }, [appId, listenBuildProgress, markCancelled, stopStream]);

  /**
   * 历史构建包版本：跳过构建与检测，直接部署指定 releaseId。
   *
   * @param releaseId 构建版本号
   */
  const deployVersion = useCallback(
    async (releaseId: string) => {
      if (!appId) {
        message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
        return;
      }
      if (
        phase === 'starting' ||
        phase === 'building' ||
        phase === 'checkingDeployable' ||
        phase === 'deploying'
      ) {
        setOpen(true);
        return;
      }
      if (!releaseId.trim()) {
        return;
      }

      resetTaskState();
      releaseIdRef.current = releaseId.trim();
      buildSucceededRef.current = true;
      checkPassedRef.current = true;
      setDeployingReleaseId(releaseId.trim());
      setOpen(true);

      try {
        await submitProdStart();
        if (cancelledRef.current) {
          markCancelled();
          return;
        }
        setPhase('success');
        void refreshAfterDeploy();
      } catch (error) {
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          markCancelled();
          return;
        }
        const text = pickUserAppRequestErrorText(
          error,
          dict('PC.Pages.AppDevPro.startFailed'),
        );
        setFailedStage('deploy');
        setErrorMessage(text);
        setPhase('failed');
      } finally {
        setDeployingReleaseId('');
      }
    },
    [
      appId,
      markCancelled,
      phase,
      refreshAfterDeploy,
      resetTaskState,
      submitProdStart,
    ],
  );

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
      phase === 'checkingDeployable' ||
      phase === 'deploying'
    ) {
      setOpen(true);
      return;
    }

    resetTaskState();
    setOpen(true);
    setPublishPhase('starting');

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
        markCancelled();
        return;
      }

      const immediate = getTaskTerminalStatus(task.status);
      if (immediate === 'failed') {
        throw new Error(
          task.error || dict('PC.Pages.AppDevPro.buildStatusFailed'),
        );
      }
      if (immediate === 'cancelled') {
        markCancelled();
        return;
      }

      if (immediate !== 'succeeded') {
        setPublishPhase('building');
        const streamResult = await listenBuildProgress(currentTaskId);
        if (streamResult === 'cancelled' || cancelledRef.current) {
          markCancelled();
          return;
        }
        if (streamResult === 'failed') {
          throw new Error(dict('PC.Pages.AppDevPro.buildStatusFailed'));
        }
      }

      if (cancelledRef.current) {
        markCancelled();
        return;
      }

      if (!releaseIdRef.current) {
        throw new Error(dict('PC.Pages.AppDevPro.buildMissingReleaseId'));
      }

      buildSucceededRef.current = true;
      await waitUntilProdDeployable();
      if (cancelledRef.current) {
        markCancelled();
        return;
      }

      await submitProdStart();

      if (cancelledRef.current) {
        markCancelled();
        return;
      }

      setPhase('success');
      void refreshAfterDeploy();
    } catch (error) {
      if (
        cancelledRef.current ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        markCancelled();
        return;
      }
      const stage: UserAppDeployFailedStage = !buildSucceededRef.current
        ? 'build'
        : !checkPassedRef.current
        ? 'check'
        : 'deploy';
      const fallback =
        stage === 'deploy'
          ? dict('PC.Pages.AppDevPro.startFailed')
          : stage === 'check'
          ? dict('PC.Pages.AppDevPro.checkDeployableFailed')
          : dict('PC.Pages.AppDevPro.buildStatusFailed');
      const text = pickUserAppRequestErrorText(error, fallback);
      setFailedStage(stage);
      setErrorMessage(text);
      setPhase('failed');
    }
  }, [
    appId,
    listenBuildProgress,
    markCancelled,
    refreshAfterDeploy,
    phase,
    resetTaskState,
    setPublishPhase,
    submitProdStart,
    waitUntilProdDeployable,
  ]);

  /**
   * 部署服务阶段停止生产部署（检测可部署已通过，不再走 build cancel）。
   */
  const stopDeploy = useCallback(async () => {
    if (!appId) {
      return;
    }
    setStopLoading(true);
    try {
      cancelledRef.current = true;
      stopStream();
      const result = await apiUserAppProdStop({
        appId,
        releaseId: releaseIdRef.current || undefined,
      });
      if (result && typeof result === 'object' && 'code' in result) {
        if (result.code && result.code !== SUCCESS_CODE) {
          throw new Error(
            result.message || dict('PC.Pages.AppDevPro.stopFailed'),
          );
        }
      }
      markCancelled();
      message.success(dict('PC.Pages.AppDevPro.stopDeploySuccess'));
    } catch (error) {
      console.error('[AppDevPro] Stop deploy failed:', error);
    } finally {
      setStopLoading(false);
    }
  }, [appId, markCancelled, stopStream]);

  /**
   * 取消当前构建任务。
   */
  const cancelTask = useCallback(async () => {
    const currentTaskId = taskIdRef.current || taskId;
    if (!currentTaskId) {
      cancelledRef.current = true;
      stopStream();
      markCancelled();
      setOpen(false);
      return;
    }
    setCancelLoading(true);
    try {
      cancelledRef.current = true;
      await apiUserAppBuildCancel(currentTaskId);
      stopStream();
      markCancelled();
      setOpen(false);
      message.success(dict('PC.Pages.AppDevPro.publishCancelled'));
    } catch (error) {
      console.error('[AppDevPro] Cancel deploying failed:', error);
    } finally {
      setCancelLoading(false);
    }
  }, [markCancelled, stopStream, taskId]);

  /**
   * 关闭进度弹窗（进行中需先取消）。
   */
  const closeModal = useCallback(() => {
    if (
      phase === 'starting' ||
      phase === 'building' ||
      phase === 'checkingDeployable' ||
      phase === 'deploying'
    ) {
      return;
    }
    setOpen(false);
    setPhase('idle');
    resetTaskState();
    stopStream();
  }, [phase, resetTaskState, stopStream]);

  const publishing =
    phase === 'starting' ||
    phase === 'building' ||
    phase === 'checkingDeployable' ||
    phase === 'deploying';

  return {
    open,
    phase,
    services,
    errorMessage,
    failedStage,
    taskId,
    cancelLoading,
    stopLoading,
    publishing,
    startPublish,
    deployVersion,
    deployingReleaseId,
    cancelTask,
    stopDeploy,
    closeModal,
    startServices,
    prodAccessUrl,
  };
}
