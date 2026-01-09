/**
 * 远程桌面管理 Hook
 * 管理 VNC 远程桌面容器、保活轮询等
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiEnsurePod,
  apiKeepalivePod,
  apiRestartAgent,
  apiRestartPod,
} from '@/services/vncDesktop';
import type { RequestResponse } from '@/types/interfaces/request';
import type { VncDesktopContainerInfo } from '@/types/interfaces/vncDesktop';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { useCallback, useState } from 'react';
import type { VncDesktopReturn } from '../types';

interface UseVncDesktopProps {
  openPreviewChangeState: (mode: 'preview' | 'desktop') => void;
}

export const useVncDesktop = (props: UseVncDesktopProps): VncDesktopReturn => {
  const { openPreviewChangeState } = props;

  // 远程桌面容器信息
  const [vncContainerInfo, setVncContainerInfo] =
    useState<VncDesktopContainerInfo | null>(null);

  // 重启智能体电脑
  const restartVncPod = useCallback(async (cId: number) => {
    return await apiRestartPod(cId);
  }, []);

  // 重启智能体
  const { run: restartAgent, loading: isRestartAgentLoading } = useRequest(
    apiRestartAgent,
    {
      manual: true,
      debounceWait: 500,
      onSuccess: (result: RequestResponse<null>) => {
        const { code } = result;
        if (code === SUCCESS_CODE) {
          message.success('重启智能体成功');
        }
      },
    },
  );

  // 远程桌面容器保活轮询
  const { run: runKeepalivePodPolling, cancel: stopKeepalivePodPolling } =
    useRequest(apiKeepalivePod, {
      manual: true,
      loadingDelay: 30000,
      debounceWait: 5000,
      pollingInterval: 60000,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      onBefore: async (params) => {
        if (document.visibilityState === 'visible' && params[0]) {
          try {
            console.log('[keepalive] 页面可见，调用 apiEnsurePod 确保容器运行');
            await apiEnsurePod(params[0]);
          } catch (error) {
            console.error('[keepalive] apiEnsurePod 失败:', error);
          }
        }
      },
    });

  // 打开远程桌面视图
  const openDesktopView = useCallback(
    async (cId: number) => {
      stopKeepalivePodPolling();
      openPreviewChangeState('desktop');
      try {
        const { code, data } = await apiEnsurePod(cId);
        if (code === SUCCESS_CODE) {
          setVncContainerInfo(data?.container_info);
          runKeepalivePodPolling(cId);
        }
      } catch (error) {
        console.error('打开远程桌面视图失败', error);
      }
    },
    [openPreviewChangeState, runKeepalivePodPolling, stopKeepalivePodPolling],
  );

  return {
    vncContainerInfo,
    setVncContainerInfo,
    openDesktopView,
    restartVncPod,
    restartAgent,
    isRestartAgentLoading,
    runKeepalivePodPolling,
    stopKeepalivePodPolling,
  };
};
