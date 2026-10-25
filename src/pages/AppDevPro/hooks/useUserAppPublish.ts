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
  apiUserAppReadiness,
  apiUserAppTasksActive,
  UserAppContainerStatusEnum,
  type UserAppReadiness,
} from '../services/appDevPro';
import {
  apiUserAppDomainList,
  normalizeUserAppPreviewUrl,
  type UserAppDomainInfo,
} from '../services/appDomain';
import {
  UserAppTaskTypeEnum,
  type UserAppDeployFailedStage,
  type UserAppDevTaskInfo,
  type UserAppInfo,
  type UserAppPublishPhase,
  type UserAppTaskLogEvent,
  type UserAppTaskServiceProgress,
  type UserAppTaskTerminalStatus,
} from '../type';
import { pollUserAppReadiness } from '../utils/previewHealthCheck';
import { pickUserAppEnvDomain } from '../utils/userAppPreviewUrl';
import {
  getTaskTerminalStatus,
  mergeTaskServiceProgress,
  normalizeTaskStatus,
  USER_APP_BUILD_SSE_EVENT,
} from '../utils/userAppTaskLog';
import {
  listenUserAppTaskStream,
  pickUserAppRequestErrorText,
  pickUserAppTaskId,
  unwrapUserAppResponse,
} from '../utils/userAppTaskStream';

const DEPLOYABLE_POLL_INTERVAL_MS = 2000;
const DEPLOYABLE_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * 跳过 prod/start、等待他处部署完成时的就绪探测次数。
 * 3s × 20 ≈ 60s：比常规 5 次长，覆盖容器仍处于启动 / 重启的阶段。
 */
const SKIPPED_START_READINESS_MAX_ATTEMPTS = 20;

/**
 * 线上容器处于这些状态时，部署正在启动 / 重启过程中，
 * 部署服务阶段无需再调 prod/start，直接等就绪即可。
 * running 不在此列：可能仍在服务上一个 release，必须显式 start 才会切换版本。
 */
const PROD_SERVICE_STARTING_CONTAINER_STATUSES = new Set<string>([
  UserAppContainerStatusEnum.Starting,
  UserAppContainerStatusEnum.Restarting,
]);

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
  /** 部署成功后线上环境是否已就绪。未就绪时仍展示域名，并在域名下提示稍后再试 */
  const [prodReady, setProdReady] = useState<boolean>(true);
  /** 本次部署跳过 prod/start（他处已发起部署）。为 true 时不展示「停止部署」 */
  const [startSkipped, setStartSkipped] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const terminalRef = useRef<UserAppTaskTerminalStatus | null>(null);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef<string>('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const startServicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const streamStageRef = useRef<'build' | 'start'>('build');
  const releaseIdRef = useRef<string>('');
  /** 与 startSkipped 同步的即时值，供就绪轮询读取 */
  const startSkippedRef = useRef<boolean>(false);
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
    } else if (next === 'deploying' || next === 'checkingReadiness') {
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
    setProdReady(true);
    setStartSkipped(false);
    startSkippedRef.current = false;
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
   * 生产部署接口成功后，轮询线上环境是否可访问。
   * 用户停止部署时结束，不进入成功态。
   * 跳过 prod/start 时容器可能仍在启动 / 重启，探测次数放宽到 60s 量级。
   * 轮询到上限仍未就绪时不抛错，交给调用方继续展示部署成功，并标记未就绪。
   * @returns 线上环境是否已就绪
   */
  const waitUntilProdReady = useCallback(async () => {
    if (!appId) {
      throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
    }
    setPublishPhase('checkingReadiness');
    return pollUserAppReadiness(
      appId,
      UserAppDbEnvEnum.Prod,
      () => cancelledRef.current,
      startSkippedRef.current
        ? { maxAttempts: SKIPPED_START_READINESS_MAX_ATTEMPTS }
        : undefined,
    );
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
   * 探测线上环境，判断容器是否正在启动 / 重启（部署已在进行）。
   * running 不算：线上可能仍在服务旧 release，需显式 start 才会切版本。
   * 探测失败、业务码非成功或回包没有 container 字段时返回 false，
   * 调用方按原逻辑调用 prod/start，避免因探测异常漏掉启动。
   *
   * @returns 是否可以跳过 prod/start
   */
  const isProdServiceStarting = useCallback(async (): Promise<boolean> => {
    if (!appId) {
      return false;
    }
    try {
      const result = await apiUserAppReadiness(appId, UserAppDbEnvEnum.Prod);
      const codeOk =
        !result ||
        typeof result !== 'object' ||
        !('code' in result) ||
        result.code === SUCCESS_CODE;
      if (!codeOk) {
        return false;
      }
      const payload = (
        result && typeof result === 'object' && 'data' in result
          ? result.data
          : result
      ) as UserAppReadiness | undefined;
      const containerStatus = payload?.container?.status;
      return (
        !!containerStatus &&
        PROD_SERVICE_STARTING_CONTAINER_STATUSES.has(containerStatus)
      );
    } catch {
      // 探测自身失败不影响部署，继续走 prod/start
      return false;
    }
  }, [appId]);

  /**
   * 构建成功后启动生产服务，并监听启动任务 SSE。
   *
   * @param options.skipIfServiceStarting 为 true 时先探测线上容器：
   * 正在启动 / 重启说明部署已在进行（可能来自其他页签），跳过 prod/start。
   * running 仍需显式 start 切版本；历史版本部署不传该参数，始终显式 start。
   */
  const submitProdStart = useCallback(
    async (options?: { skipIfServiceStarting?: boolean }) => {
      if (!appId) {
        throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
      }
      setPublishPhase('deploying');
      stopStream();
      lastSeqRef.current = undefined;
      streamStageRef.current = 'start';
      startServicesRef.current = [];
      setStartServices([]);

      if (options?.skipIfServiceStarting) {
        const serviceStarting = await isProdServiceStarting();
        if (cancelledRef.current) {
          markCancelled();
          return;
        }
        if (serviceStarting) {
          // 部署由他处发起，本页签不再调用 prod/stop，隐藏停止入口
          startSkippedRef.current = true;
          setStartSkipped(true);
          return;
        }
      }

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
    },
    [
      appId,
      isProdServiceStarting,
      listenBuildProgress,
      markCancelled,
      setPublishPhase,
      stopStream,
    ],
  );

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
        phase === 'deploying' ||
        phase === 'checkingReadiness'
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
        // 指定历史版本要切换线上版本，始终显式调用 prod/start
        await submitProdStart();
        if (cancelledRef.current) {
          markCancelled();
          return;
        }
        const ready = await waitUntilProdReady();
        if (cancelledRef.current) {
          markCancelled();
          return;
        }
        setProdReady(ready);
        await refreshAfterDeploy();
        setPhase('success');
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
      waitUntilProdReady,
    ],
  );

  /**
   * 关闭刚打开、尚未进入构建的部署弹窗。
   * 用于 tasks/active 判定当前不能构建时直接回到页面。
   */
  const abortPublishBeforeBuild = useCallback(() => {
    setOpen(false);
    setPhase('idle');
  }, []);

  /**
   * 点击部署：先打开部署弹窗，查 tasks/active。
   * buildAllowed 为 true 时创建构建任务。
   * 为 false 且已有带 taskId 的 build 任务时，跳过构建接口，直接接该任务的日志流并继续部署。
   * 部署服务前先探测线上容器，正在启动 / 重启则不再调 prod/start，
   * 避免多页签并发或承接他处构建任务时重复发起部署；
   * running 始终显式 prod/start，避免新版本没切到线上。
   * 没有可接入的构建任务时提示并关闭弹窗。
   *
   * @returns 是否已进入构建。false 表示未开始构建，调用方需恢复 tasks/active 轮询
   */
  const startPublish = useCallback(async (): Promise<boolean> => {
    if (!appId) {
      message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
      return false;
    }
    if (
      phase === 'starting' ||
      phase === 'building' ||
      phase === 'checkingDeployable' ||
      phase === 'deploying' ||
      phase === 'checkingReadiness'
    ) {
      setOpen(true);
      return true;
    }

    resetTaskState();
    setOpen(true);
    setPublishPhase('starting');

    /** buildAllowed 为 false 时，active 里可直接接入的进行中构建任务 */
    let existingBuildTask: UserAppDevTaskInfo | null = null;
    try {
      const active = unwrapUserAppResponse(
        await apiUserAppTasksActive(appId),
        dict('PC.Pages.AppDevPro.buildNotAllowed'),
      );
      if (cancelledRef.current) {
        markCancelled();
        return true;
      }
      if (active?.buildAllowed !== true) {
        existingBuildTask =
          (active?.tasks || []).find(
            (item) =>
              item.taskType === UserAppTaskTypeEnum.Build && !!item.taskId,
          ) ?? null;
        if (!existingBuildTask) {
          message.warning(dict('PC.Pages.AppDevPro.buildNotAllowed'));
          abortPublishBeforeBuild();
          return false;
        }
      }
    } catch (error) {
      if (cancelledRef.current) {
        markCancelled();
        return true;
      }
      // 业务失败已由全局 errorHandler 提示，这里只退出部署弹窗
      console.error('[AppDevPro] Check buildAllowed failed:', error);
      abortPublishBeforeBuild();
      return false;
    }

    try {
      const task =
        existingBuildTask ??
        (unwrapUserAppResponse(
          await apiUserAppBuild({ appId }),
          dict('PC.Pages.AppDevPro.buildStatusFailed'),
        ) as UserAppDevTaskInfo);

      const currentTaskId = pickUserAppTaskId(task);
      if (!currentTaskId) {
        throw new Error(dict('PC.Pages.AppDevPro.buildStatusFailed'));
      }
      setTaskId(currentTaskId);
      taskIdRef.current = currentTaskId;

      if (cancelledRef.current) {
        await apiUserAppBuildCancel(currentTaskId);
        markCancelled();
        return true;
      }

      const immediate = getTaskTerminalStatus(task.status);
      if (immediate === 'failed') {
        throw new Error(
          task.error || dict('PC.Pages.AppDevPro.buildStatusFailed'),
        );
      }
      if (immediate === 'cancelled') {
        markCancelled();
        return true;
      }

      if (immediate !== 'succeeded') {
        setPublishPhase('building');
        const streamResult = await listenBuildProgress(currentTaskId);
        if (streamResult === 'cancelled' || cancelledRef.current) {
          markCancelled();
          return true;
        }
        if (streamResult === 'failed') {
          throw new Error(dict('PC.Pages.AppDevPro.buildStatusFailed'));
        }
      }

      if (cancelledRef.current) {
        markCancelled();
        return true;
      }

      if (!releaseIdRef.current) {
        throw new Error(dict('PC.Pages.AppDevPro.buildMissingReleaseId'));
      }

      buildSucceededRef.current = true;
      await waitUntilProdDeployable();
      if (cancelledRef.current) {
        markCancelled();
        return true;
      }

      // 线上容器可能已在启动 / 重启（其他页签或他处发起的部署），先探测再决定是否调用 prod/start
      await submitProdStart({ skipIfServiceStarting: true });

      if (cancelledRef.current) {
        markCancelled();
        return true;
      }

      const ready = await waitUntilProdReady();
      if (cancelledRef.current) {
        markCancelled();
        return true;
      }

      setProdReady(ready);
      await refreshAfterDeploy();
      setPhase('success');
    } catch (error) {
      if (
        cancelledRef.current ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        markCancelled();
        return true;
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
    return true;
  }, [
    abortPublishBeforeBuild,
    appId,
    listenBuildProgress,
    markCancelled,
    refreshAfterDeploy,
    phase,
    resetTaskState,
    setPublishPhase,
    submitProdStart,
    waitUntilProdDeployable,
    waitUntilProdReady,
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
   * 跳过 prod/start 时部署由他处发起：只收起弹窗，后台继续等就绪，
   * 页面预览由自身的 readiness 轮询恢复，不打断也不重置本次流程。
   */
  const closeModal = useCallback(() => {
    if (startSkippedRef.current) {
      setOpen(false);
      return;
    }
    if (
      phase === 'starting' ||
      phase === 'building' ||
      phase === 'checkingDeployable' ||
      phase === 'deploying' ||
      phase === 'checkingReadiness'
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
    phase === 'deploying' ||
    phase === 'checkingReadiness';

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
    prodReady,
    /** 本次部署跳过了 prod/start，弹窗据此隐藏「停止部署」 */
    startSkipped,
  };
}
