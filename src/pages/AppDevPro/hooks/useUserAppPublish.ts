import { dict } from '@/services/i18nRuntime';
import { apiPublishApply } from '@/services/publish';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  OnlyTemplateEnum,
} from '@/types/enums/agent';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { apiUserAppBuild, apiUserAppBuildCancel } from '../services/appDevPro';
import type {
  UserAppDevTaskInfo,
  UserAppPublishPhase,
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

export interface UseUserAppPublishOptions {
  /** 应用 ID */
  appId?: number;
  /** 当前空间 ID，提交发布申请时写入发布项 */
  spaceId?: number;
  /** 发布申请提交成功后刷新详情 */
  onPublished?: () => void;
}

/**
 * AppDevPro 发布：构建 → SSE 进度 → 提交发布申请。
 *
 * @param options.appId 应用 ID
 * @param options.spaceId 空间 ID
 * @param options.onPublished 发布成功回调
 * @returns 发布状态与操作
 */
export function useUserAppPublish(options: UseUserAppPublishOptions) {
  const { appId, spaceId, onPublished } = options;

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UserAppPublishPhase>('idle');
  const [services, setServices] = useState<UserAppTaskServiceProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [taskId, setTaskId] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const terminalRef = useRef<UserAppTaskTerminalStatus | null>(null);
  const lastSeqRef = useRef<number | undefined>(undefined);
  const taskIdRef = useRef('');
  const servicesRef = useRef<UserAppTaskServiceProgress[]>([]);

  const resetProgress = useCallback(() => {
    setServices([]);
    setOverallProgress(0);
    setErrorMessage('');
    setTaskId('');
    taskIdRef.current = '';
    lastSeqRef.current = undefined;
    terminalRef.current = null;
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

  /**
   * 监听构建任务 SSE，直到任务成功 / 失败 / 取消。
   *
   * @param currentTaskId 任务 ID
   */
  const listenBuildProgress = useCallback(
    (currentTaskId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      return listenUserAppTaskStream({
        taskId: currentTaskId,
        fromSeq: lastSeqRef.current,
        abortController: controller,
        isCancelled: () => cancelledRef.current,
        onEvent: applyEvent,
        getServices: () => servicesRef.current,
        failedMessage: dict('PC.Pages.AppDevPro.publishFailed'),
        streamClosedMessage: dict('PC.Pages.AppDevPro.publishStreamClosed'),
      }).then((status) => {
        if (status === 'succeeded') {
          setOverallProgress(100);
        }
        terminalRef.current = status;
        return status;
      });
    },
    [applyEvent],
  );

  /**
   * 构建成功后提交发布申请。
   */
  const submitPublishApply = useCallback(async () => {
    if (!appId) {
      throw new Error(dict('PC.Pages.AppDevPro.publishNoApp'));
    }
    setPhase('applying');
    setOverallProgress(98);
    const result = await apiPublishApply({
      targetType: AgentComponentTypeEnum.UserApp,
      targetId: appId,
      items: [
        {
          scope: PluginPublishScopeEnum.Space,
          spaceId: spaceId || undefined,
          allowCopy: AllowCopyEnum.No,
          onlyTemplate: OnlyTemplateEnum.No,
        },
      ],
    });
    unwrapUserAppResponse(
      result,
      dict('PC.Components.PublishComponentModal.publishSubmitted'),
    );
    setPhase('success');
    setOverallProgress(100);
    message.success(
      dict('PC.Components.PublishComponentModal.publishSubmitted'),
    );
    onPublished?.();
  }, [appId, onPublished, spaceId]);

  /**
   * 点击发布：创建构建任务，监听进度，成功后提交发布申请。
   */
  const startPublish = useCallback(async () => {
    if (!appId) {
      message.warning(dict('PC.Pages.AppDevPro.publishNoApp'));
      return;
    }
    if (phase === 'starting' || phase === 'building' || phase === 'applying') {
      setOpen(true);
      return;
    }

    resetProgress();
    setOpen(true);
    setPhase('starting');

    try {
      const task = unwrapUserAppResponse(
        await apiUserAppBuild({ appId }),
        dict('PC.Pages.AppDevPro.publishFailed'),
      ) as UserAppDevTaskInfo;

      const currentTaskId = pickUserAppTaskId(task);
      if (!currentTaskId) {
        throw new Error(dict('PC.Pages.AppDevPro.publishFailed'));
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
        throw new Error(task.error || dict('PC.Pages.AppDevPro.publishFailed'));
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
          throw new Error(dict('PC.Pages.AppDevPro.publishFailed'));
        }
      }

      if (cancelledRef.current) {
        setPhase('cancelled');
        return;
      }

      await submitPublishApply();
    } catch (error) {
      if (
        cancelledRef.current ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        setPhase('cancelled');
        return;
      }
      const text =
        error instanceof Error
          ? error.message
          : dict('PC.Pages.AppDevPro.publishFailed');
      setErrorMessage(text);
      setPhase('failed');
    }
  }, [appId, listenBuildProgress, phase, resetProgress, submitPublishApply]);

  /**
   * 取消当前构建任务。
   */
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
      message.success(dict('PC.Pages.AppDevPro.publishCancelled'));
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : dict('PC.Pages.AppDevPro.publishFailed');
      message.error(text);
    } finally {
      setCancelLoading(false);
    }
  }, [stopStream, taskId]);

  /**
   * 关闭进度弹窗（进行中需先取消）。
   */
  const closeModal = useCallback(() => {
    if (phase === 'starting' || phase === 'building' || phase === 'applying') {
      return;
    }
    setOpen(false);
    setPhase('idle');
    resetProgress();
    stopStream();
  }, [phase, resetProgress, stopStream]);

  const publishing =
    phase === 'starting' || phase === 'building' || phase === 'applying';

  return {
    open,
    phase,
    services,
    overallProgress,
    errorMessage,
    taskId,
    cancelLoading,
    publishing,
    startPublish,
    cancelTask,
    closeModal,
  };
}
