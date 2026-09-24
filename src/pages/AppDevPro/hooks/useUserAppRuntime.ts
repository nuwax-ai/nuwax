import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
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
  /**
   * 会话 ID。
   * 和应用 ID 一起作为运行时隔离键：切换应用或会话时丢弃上一份启动 stream，避免串到新页面。
   */
  conversationId?: number;
  /** 当前环境：开发 / 线上 */
  env: UserAppDbEnvEnum;
  /** 应用详情（线上启动需要最新发布版本） */
  userAppInfo?: UserAppInfo | null;
  /** 启动或重启成功后刷新预览 */
  onReady?: () => void;
  /**
   * 启动或重启成功后、展示预览前，检查预览域名是否可访问。
   * 返回错误文案表示不可访问；返回空字符串表示可以展示。
   * 参数是发起这次启动的环境，探测过程中切换环境时仍按该环境判断是否已停止。
   */
  confirmPreviewReachable?: (env: UserAppDbEnvEnum) => Promise<string>;
  /** 停止成功，立刻切到「服务已停止」。参数是被停止的环境 */
  onStopped?: (env: UserAppDbEnvEnum) => void;
  /** 重启或停止成功后，重新拉取应用详情 */
  onDetailRefresh?: () => void;
}

/** 单个环境的预览运行界面：开发 / 线上各留一份，切换时整份换上 */
interface RuntimeEnvView {
  open: boolean;
  phase: UserAppPublishPhase;
  action: UserAppRuntimeAction;
  services: UserAppTaskServiceProgress[];
  errorMessage: string;
  previewLoadError: string;
  taskId: string;
  cancelLoading: boolean;
  running: boolean;
  stopping: boolean;
  /** 用户确认停止后，该环境不再自动 start */
  stoppedByUser: boolean;
}

const createRuntimeEnvView = (): RuntimeEnvView => ({
  open: false,
  phase: 'idle',
  action: 'start',
  services: [],
  errorMessage: '',
  previewLoadError: '',
  taskId: '',
  cancelLoading: false,
  running: false,
  stopping: false,
  stoppedByUser: false,
});

const createRuntimeEnvViews = (): Record<UserAppDbEnvEnum, RuntimeEnvView> => ({
  [UserAppDbEnvEnum.Dev]: createRuntimeEnvView(),
  [UserAppDbEnvEnum.Prod]: createRuntimeEnvView(),
});

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
 * 开发环境和线上环境各保存一份运行界面（启动中、停止中、日志、错误、是否在跑），
 * 切换环境时换上目标环境自己的界面，进行中的停止也只改被停止的那一侧。
 *
 * @param options.appId 应用 ID
 * @param options.env 当前环境
 * @param options.userAppInfo 应用详情
 * @param options.onReady 启动完成回调
 * @param options.onStopped 停止成功回调，参数为被停止的环境
 * @param options.onDetailRefresh 重启或停止成功后刷新应用详情
 * @returns 当前环境的运行时状态与操作
 */
export function useUserAppRuntime(options: UseUserAppRuntimeOptions) {
  const { appId, conversationId, env, userAppInfo, onReady, onStopped } =
    options;
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onDetailRefreshRef = useRef(options.onDetailRefresh);
  onDetailRefreshRef.current = options.onDetailRefresh;
  const confirmPreviewReachableRef = useRef(options.confirmPreviewReachable);
  confirmPreviewReachableRef.current = options.confirmPreviewReachable;
  const userAppInfoRef = useRef(userAppInfo);
  userAppInfoRef.current = userAppInfo;

  const viewsRef = useRef<Record<UserAppDbEnvEnum, RuntimeEnvView>>(
    createRuntimeEnvViews(),
  );
  const [view, setView] = useState<RuntimeEnvView>(createRuntimeEnvView);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);
  const envRef = useRef(env);
  const phaseRef = useRef<UserAppPublishPhase>('idle');
  /**
   * 启动 / 重启代际。切换环境放弃进行中的启动时递增，
   * 旧任务回写发现代际变化就丢弃，不能写进另一侧环境。
   */
  const runTokenRef = useRef(0);
  /**
   * 应用 + 会话隔离。切换后递增，进行中的 start / stream 回写发现代际变化就丢弃，
   * 不能把上一应用的启动日志写进新会话。
   */
  const sessionRef = useRef(0);
  const sessionKey = `${appId ?? ''}:${conversationId ?? ''}`;
  const boundSessionKeyRef = useRef(sessionKey);
  /** 当前已套用到界面上的环境。和 env 不一致时，在渲染里换成目标环境自己的界面 */
  const [boundEnv, setBoundEnv] = useState(env);

  /**
   * 把界面改动写进指定环境。
   * 只有正在看的环境才更新页面；另一侧只改自己的存档。
   */
  const commit = useCallback(
    (
      actionEnv: UserAppDbEnvEnum,
      patch:
        | Partial<RuntimeEnvView>
        | ((prev: RuntimeEnvView) => RuntimeEnvView),
    ) => {
      const prev = viewsRef.current[actionEnv];
      const next =
        typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      viewsRef.current[actionEnv] = next;
      if (envRef.current !== actionEnv) {
        return;
      }
      phaseRef.current = next.phase;
      servicesRef.current = next.services;
      taskIdRef.current = next.taskId;
      setView(next);
    },
    [],
  );

  if (boundSessionKeyRef.current !== sessionKey) {
    boundSessionKeyRef.current = sessionKey;
    sessionRef.current += 1;
    runTokenRef.current += 1;
    cancelledRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    taskIdRef.current = '';
    lastSeqRef.current = undefined;
    servicesRef.current = [];
    phaseRef.current = 'idle';
    envRef.current = env;
    if (boundEnv !== env) {
      setBoundEnv(env);
    }
    viewsRef.current = createRuntimeEnvViews();
    setView(createRuntimeEnvView());
  } else if (boundEnv !== env) {
    const prevEnv = boundEnv;
    const prevView = viewsRef.current[prevEnv];
    const starting =
      prevView.phase === 'starting' || prevView.phase === 'building';
    // 离开时放弃该环境未完成的启动，避免日志写到另一侧；停止中的请求继续，只留在原环境
    if (starting) {
      runTokenRef.current += 1;
      cancelledRef.current = true;
      abortRef.current?.abort();
      abortRef.current = null;
      viewsRef.current[prevEnv] = {
        ...prevView,
        running: false,
        phase: 'idle',
        services: [],
        errorMessage: '',
        previewLoadError: '',
        taskId: '',
        cancelLoading: false,
        open: false,
      };
    }
    setBoundEnv(env);
    envRef.current = env;
    const nextView = viewsRef.current[env];
    phaseRef.current = nextView.phase;
    servicesRef.current = nextView.services;
    taskIdRef.current = nextView.taskId;
    lastSeqRef.current = undefined;
    cancelledRef.current = false;
    setView(nextView);
  } else {
    phaseRef.current = view.phase;
    servicesRef.current = view.services;
    taskIdRef.current = view.taskId;
    envRef.current = env;
  }

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const buildParams = useCallback(
    (actionEnv: UserAppDbEnvEnum): UserAppStartDevParams => {
      const params: UserAppStartDevParams = { appId };
      if (actionEnv === UserAppDbEnvEnum.Prod) {
        const versions = userAppInfoRef.current?.buildVersions || [];
        const latest =
          versions.find((item) => item.latest) || versions[0] || undefined;
        if (latest?.version) {
          params.releaseId = latest.version;
        }
      }
      return params;
    },
    [appId],
  );

  const clearTaskFields = useCallback(
    (actionEnv: UserAppDbEnvEnum) => {
      if (envRef.current === actionEnv) {
        lastSeqRef.current = undefined;
        cancelledRef.current = false;
      }
      commit(actionEnv, (prev) => ({
        ...prev,
        services: [],
        errorMessage: '',
        previewLoadError: '',
        taskId: '',
      }));
    },
    [commit],
  );

  /**
   * 启动或重启的任务已成功后，先检查预览域名。
   * 探测返回失败文案时只记录页面加载失败，不进入启动失败日志，也不回调 onReady。
   * 5 次探测都失败时由调用方返回空串，继续 onReady，用 iframe 再加载一次域名。
   *
   * @returns 是否可以展示预览
   */
  const finishPreviewReady = useCallback(
    async (
      actionEnv: UserAppDbEnvEnum,
      session: number,
      token: number,
    ): Promise<boolean> => {
      const still = () =>
        sessionRef.current === session && runTokenRef.current === token;
      const stopped = () => viewsRef.current[actionEnv].stoppedByUser;
      if (!still() || stopped()) {
        return false;
      }
      if (cancelledRef.current) {
        commit(actionEnv, { phase: 'cancelled' });
        return false;
      }
      const confirm = confirmPreviewReachableRef.current;
      if (confirm) {
        const failureText = (await confirm(actionEnv)).trim();
        if (!still() || stopped()) {
          return false;
        }
        if (cancelledRef.current) {
          commit(actionEnv, { phase: 'cancelled' });
          return false;
        }
        if (failureText) {
          commit(actionEnv, {
            previewLoadError: failureText,
            errorMessage: '',
            phase: 'idle',
            running: false,
          });
          return false;
        }
      }
      if (!still() || stopped()) {
        return false;
      }
      commit(actionEnv, { phase: 'success', running: true });
      return true;
    },
    [commit],
  );

  const listenProgress = useCallback(
    (
      currentTaskId: string,
      currentAction: UserAppRuntimeAction,
      actionEnv: UserAppDbEnvEnum,
      session: number,
      token: number,
    ) => {
      const still = () =>
        sessionRef.current === session && runTokenRef.current === token;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      return listenUserAppTaskStream({
        taskId: currentTaskId,
        fromSeq: lastSeqRef.current,
        abortController: controller,
        isCancelled: () =>
          cancelledRef.current ||
          !still() ||
          viewsRef.current[actionEnv].stoppedByUser,
        onEvent: (event) => {
          if (!still() || viewsRef.current[actionEnv].stoppedByUser) {
            return;
          }
          if (typeof event.seq === 'number') {
            lastSeqRef.current = event.seq;
          }
          commit(actionEnv, (prev) => ({
            ...prev,
            services: mergeTaskServiceProgress(prev.services, event),
          }));
        },
        getServices: () => viewsRef.current[actionEnv].services,
        failedMessage: getFailedMessage(currentAction),
        streamClosedMessage: dict('PC.Pages.AppDevPro.publishStreamClosed'),
      });
    },
    [commit],
  );

  /**
   * 执行启动或重启：调环境对应接口，有 taskId 则拉 SSE。
   * 只回写发起时的环境，切换走之后不再改当前正在看的另一侧。
   *
   * @param nextAction start 或 restart
   * @param targetEnv 发起操作时的环境；不传则用当前环境
   */
  const runStartOrRestart = useCallback(
    async (nextAction: UserAppRuntimeAction, targetEnv?: UserAppDbEnvEnum) => {
      const actionEnv = targetEnv ?? envRef.current;
      if (envRef.current !== actionEnv) {
        return;
      }
      if (!appId) {
        message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
        return;
      }
      if (actionEnv === UserAppDbEnvEnum.Prod) {
        const versions = userAppInfoRef.current?.buildVersions || [];
        if (!versions.length) {
          message.warning(dict('PC.Pages.AppDevPro.prodNeedPublish'));
          return;
        }
      }
      const currentView = viewsRef.current[actionEnv];
      if (
        currentView.stopping ||
        currentView.phase === 'starting' ||
        currentView.phase === 'building'
      ) {
        return;
      }

      const session = sessionRef.current;
      const token = ++runTokenRef.current;
      const still = () =>
        sessionRef.current === session && runTokenRef.current === token;
      const stopped = () => viewsRef.current[actionEnv].stoppedByUser;

      clearTaskFields(actionEnv);
      commit(actionEnv, {
        stoppedByUser: false,
        action: nextAction,
        phase: 'starting',
      });

      const failedMessage = getFailedMessage(nextAction);

      try {
        const params = buildParams(actionEnv);
        const isProd = actionEnv === UserAppDbEnvEnum.Prod;
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
        if (!still() || stopped()) {
          return;
        }

        const currentTaskId = pickUserAppTaskId(task);
        if (currentTaskId) {
          commit(actionEnv, { taskId: currentTaskId });
        }

        if (cancelledRef.current) {
          if (currentTaskId) {
            await apiUserAppBuildCancel(currentTaskId);
          }
          if (!still() || stopped()) {
            return;
          }
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }

        const immediate = getTaskTerminalStatus(task?.status);
        if (immediate === 'failed') {
          throw new Error(task?.error || failedMessage);
        }
        if (immediate === 'cancelled') {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }

        if (currentTaskId && immediate !== 'succeeded') {
          commit(actionEnv, { phase: 'building' });
          const streamResult = await listenProgress(
            currentTaskId,
            nextAction,
            actionEnv,
            session,
            token,
          );
          if (!still() || stopped()) {
            return;
          }
          if (streamResult === 'cancelled' || cancelledRef.current) {
            commit(actionEnv, { phase: 'cancelled' });
            return;
          }
          if (streamResult === 'failed') {
            throw new Error(failedMessage);
          }
        }

        if (!still() || stopped()) {
          return;
        }
        if (cancelledRef.current) {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }

        if (nextAction === 'restart') {
          onDetailRefreshRef.current?.();
        }

        const previewReady = await finishPreviewReady(
          actionEnv,
          session,
          token,
        );
        if (!still() || !previewReady) {
          return;
        }
        if (envRef.current === actionEnv) {
          message.success(
            nextAction === 'restart'
              ? dict('PC.Pages.AppDevPro.restartSuccess')
              : dict('PC.Pages.AppDevPro.startSuccess'),
          );
          onReadyRef.current?.();
        }
      } catch (error) {
        if (!still() || stopped()) {
          return;
        }
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }
        const text = pickUserAppRequestErrorText(error, failedMessage);
        commit(actionEnv, {
          errorMessage: text,
          phase: 'failed',
          running: false,
        });
      }
    },
    [
      appId,
      buildParams,
      clearTaskFields,
      commit,
      finishPreviewReady,
      listenProgress,
    ],
  );

  const start = useCallback(
    (targetEnv?: UserAppDbEnvEnum) => runStartOrRestart('start', targetEnv),
    [runStartOrRestart],
  );

  const restart = useCallback(
    (targetEnv?: UserAppDbEnvEnum) => runStartOrRestart('restart', targetEnv),
    [runStartOrRestart],
  );

  /**
   * 接入已有进行中任务的进度流，不再调用 start。
   *
   * @param task tasks/active 返回的进行中任务
   * @param targetEnv 任务所属环境；不传则用当前环境
   */
  const attachExistingTask = useCallback(
    async (task: UserAppDevTaskInfo, targetEnv?: UserAppDbEnvEnum) => {
      const actionEnv = targetEnv ?? envRef.current;
      if (envRef.current !== actionEnv) {
        return;
      }
      const currentTaskId = pickUserAppTaskId(task);
      if (!currentTaskId) {
        return;
      }
      if (taskIdRef.current === currentTaskId) {
        return;
      }
      if (phaseRef.current === 'starting' || phaseRef.current === 'building') {
        return;
      }

      const nextAction: UserAppRuntimeAction =
        task.taskType === UserAppTaskTypeEnum.DevRestart ? 'restart' : 'start';
      const isBuild = task.taskType === UserAppTaskTypeEnum.Build;
      const failedMessage = getFailedMessage(nextAction);
      const session = sessionRef.current;
      const token = ++runTokenRef.current;
      const still = () =>
        sessionRef.current === session && runTokenRef.current === token;

      clearTaskFields(actionEnv);
      cancelledRef.current = false;
      commit(actionEnv, {
        action: nextAction,
        taskId: currentTaskId,
        phase: 'starting',
        stoppedByUser: false,
      });

      try {
        const immediate = getTaskTerminalStatus(task.status);
        if (immediate === 'failed') {
          throw new Error(task.error || failedMessage);
        }
        if (immediate === 'cancelled') {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }
        if (immediate === 'succeeded') {
          if (!isBuild) {
            const previewReady = await finishPreviewReady(
              actionEnv,
              session,
              token,
            );
            if (still() && previewReady && envRef.current === actionEnv) {
              onReadyRef.current?.();
            }
          } else if (still()) {
            commit(actionEnv, { phase: 'idle' });
          }
          return;
        }

        commit(actionEnv, { phase: 'building' });
        const streamResult = await listenProgress(
          currentTaskId,
          nextAction,
          actionEnv,
          session,
          token,
        );
        if (!still()) {
          return;
        }
        if (streamResult === 'cancelled' || cancelledRef.current) {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }
        if (streamResult === 'failed') {
          throw new Error(failedMessage);
        }
        if (cancelledRef.current) {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }

        if (isBuild) {
          commit(actionEnv, { phase: 'success' });
          return;
        }
        const previewReady = await finishPreviewReady(
          actionEnv,
          session,
          token,
        );
        if (still() && previewReady && envRef.current === actionEnv) {
          onReadyRef.current?.();
        }
      } catch (error) {
        if (!still()) {
          return;
        }
        if (
          cancelledRef.current ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          commit(actionEnv, { phase: 'cancelled' });
          return;
        }
        const text = error instanceof Error ? error.message : failedMessage;
        commit(actionEnv, {
          errorMessage: text,
          phase: 'failed',
          running: false,
        });
      }
    },
    [clearTaskFields, commit, finishPreviewReady, listenProgress],
  );

  /**
   * 打开预览时：未运行则自动启动。只处理当前正在看的环境。
   *
   * @param targetEnv 期望启动的环境；与当前环境不一致时不启动
   */
  const startIfNeeded = useCallback(
    (targetEnv?: UserAppDbEnvEnum) => {
      const actionEnv = targetEnv ?? envRef.current;
      if (envRef.current !== actionEnv) {
        return;
      }
      const current = viewsRef.current[actionEnv];
      if (current.stoppedByUser || current.stopping) {
        return;
      }
      if (current.phase === 'starting' || current.phase === 'building') {
        return;
      }
      if (current.running) {
        return;
      }
      void runStartOrRestart('start', actionEnv);
    },
    [runStartOrRestart],
  );

  /**
   * 停止指定环境的服务。未传时停止当前环境。
   * 停止过程只改该环境的「停止中」，切换到另一侧时不跟着显示停止中。
   *
   * @param targetEnv 要停止的环境
   * @returns 是否停止成功
   */
  const stop = useCallback(
    async (targetEnv?: UserAppDbEnvEnum) => {
      const actionEnv = targetEnv ?? envRef.current;
      if (!appId) {
        message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
        return false;
      }
      const session = sessionRef.current;
      commit(actionEnv, { stopping: true, stoppedByUser: true });
      if (envRef.current === actionEnv) {
        cancelledRef.current = true;
        stopStream();
      }
      try {
        const params = buildParams(actionEnv);
        const result =
          actionEnv === UserAppDbEnvEnum.Prod
            ? await apiUserAppProdStop(params)
            : await apiUserAppStopDev(params);
        if (sessionRef.current !== session) {
          return false;
        }
        if (result && typeof result === 'object' && 'code' in result) {
          const res = result as RequestResponse<null>;
          if (res.code && res.code !== SUCCESS_CODE) {
            throw new Error(
              res.message || dict('PC.Pages.AppDevPro.stopFailed'),
            );
          }
        }
        commit(actionEnv, {
          stopping: false,
          running: false,
          phase: 'idle',
          services: [],
          errorMessage: '',
          previewLoadError: '',
          taskId: '',
          cancelLoading: false,
          open: false,
          stoppedByUser: true,
        });
        if (envRef.current === actionEnv) {
          cancelledRef.current = false;
          lastSeqRef.current = undefined;
        }
        onDetailRefreshRef.current?.();
        onStoppedRef.current?.(actionEnv);
        if (envRef.current === actionEnv) {
          message.success(dict('PC.Pages.AppDevPro.stopSuccess'));
        }
        return true;
      } catch {
        if (sessionRef.current === session) {
          commit(actionEnv, { stopping: false, stoppedByUser: false });
        }
        return false;
      }
    },
    [appId, buildParams, commit, stopStream],
  );

  /** 取消当前环境正在进行的启动 / 重启任务 */
  const cancelTask = useCallback(async () => {
    const actionEnv = envRef.current;
    const session = sessionRef.current;
    const currentTaskId =
      taskIdRef.current || viewsRef.current[actionEnv].taskId;
    if (!currentTaskId) {
      cancelledRef.current = true;
      stopStream();
      commit(actionEnv, { phase: 'cancelled' });
      return;
    }
    commit(actionEnv, { cancelLoading: true });
    try {
      cancelledRef.current = true;
      await apiUserAppBuildCancel(currentTaskId);
      if (sessionRef.current !== session || envRef.current !== actionEnv) {
        commit(actionEnv, { cancelLoading: false, phase: 'cancelled' });
        return;
      }
      stopStream();
      commit(actionEnv, { cancelLoading: false, phase: 'cancelled' });
      message.success(dict('PC.Pages.AppDevPro.startCancelled'));
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : dict('PC.Pages.AppDevPro.startFailed');
      if (sessionRef.current === session && envRef.current === actionEnv) {
        message.error(text);
      }
      commit(actionEnv, { cancelLoading: false });
    }
  }, [commit, stopStream]);

  /**
   * 当前环境可直接用预览地址打开，不走启动接口。
   * 同时收起「页面加载失败」，以便刷新后重新进入加载。
   * 用户已停止或正在停止的环境不会被标成运行中。
   *
   * @param targetEnv 要标成可预览的环境；不传则用当前环境
   */
  const markReady = useCallback(
    (targetEnv?: UserAppDbEnvEnum) => {
      const actionEnv = targetEnv ?? envRef.current;
      const current = viewsRef.current[actionEnv];
      if (current.phase === 'starting' || current.phase === 'building') {
        return;
      }
      if (current.stoppedByUser || current.stopping) {
        return;
      }
      commit(actionEnv, {
        previewLoadError: '',
        running: true,
        phase: 'success',
      });
    },
    [commit],
  );

  /** 收起当前环境的预览域名检查失败提示，不改变运行状态 */
  const dismissPreviewLoadError = useCallback(() => {
    commit(envRef.current, { previewLoadError: '' });
  }, [commit]);

  const closeModal = useCallback(() => {
    const actionEnv = envRef.current;
    const current = viewsRef.current[actionEnv];
    if (current.phase === 'starting' || current.phase === 'building') {
      return;
    }
    stopStream();
    commit(actionEnv, { open: false, phase: 'idle' });
    clearTaskFields(actionEnv);
  }, [clearTaskFields, commit, stopStream]);

  const busy = view.phase === 'starting' || view.phase === 'building';
  const restarting = busy && view.action === 'restart';

  return {
    open: view.open,
    phase: view.phase,
    action: view.action,
    services: view.services,
    errorMessage: view.errorMessage,
    previewLoadError: view.previewLoadError,
    cancelLoading: view.cancelLoading,
    busy,
    restarting,
    running: view.running,
    stopping: view.stopping,
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
