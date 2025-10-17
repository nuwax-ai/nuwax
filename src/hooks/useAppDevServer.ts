/**
 * AppDev 开发服务器管理相关 Hook
 */

import { DEV_SERVER_CONSTANTS } from '@/constants/appDevConstants';
import { keepAlive, startDev } from '@/services/appDev';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAppDevServerProps {
  projectId: string;
  onServerStart?: (devServerUrl: string) => void;
  onServerStatusChange?: (isRunning: boolean) => void;
}

interface UseAppDevServerReturn {
  isStarting: boolean;
  startError: string | null;
  devServerUrl: string | null;
  isRunning: boolean;
  startServer: () => Promise<void>;
  resetServer: () => void;
  stopKeepAlive: () => void;
}

export const useAppDevServer = ({
  projectId,
  onServerStart,
  onServerStatusChange,
}: UseAppDevServerProps): UseAppDevServerReturn => {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const hasStartedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 处理保活响应，更新预览地址
   * 根据实际接口返回格式: { projectId, projectIdStr, devServerUrl }
   */
  const handleKeepAliveResponse = useCallback(
    (response: any) => {
      if (response?.data?.devServerUrl) {
        const newDevServerUrl = response.data.devServerUrl;
        const currentDevServerUrl = devServerUrl;

        // 如果返回的URL与当前URL不同，更新预览地址
        if (newDevServerUrl !== currentDevServerUrl) {
          setDevServerUrl(newDevServerUrl);
          onServerStart?.(newDevServerUrl);
        } else {
        }
      } else {
      }
    },
    [devServerUrl, onServerStart],
  );

  /**
   * 启动开发环境
   */
  const startServer = useCallback(async () => {
    if (!projectId) {
      return;
    }

    if (lastProjectIdRef.current !== projectId) {
      hasStartedRef.current = false;
      lastProjectIdRef.current = projectId;
    }

    if (hasStartedRef.current) {
      return;
    }

    try {
      hasStartedRef.current = true;
      setIsStarting(true);
      setStartError(null);

      const response = await startDev(projectId);

      if (response?.data?.devServerUrl) {
        setDevServerUrl(response.data.devServerUrl);
        setIsRunning(true);
        onServerStart?.(response.data.devServerUrl);
        onServerStatusChange?.(true);

        // 注意：不再在 startServer 中进行保活检查，统一由 startKeepAlive 处理
      }
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : '启动开发环境失败',
      );
      hasStartedRef.current = false;
      onServerStatusChange?.(false);
    } finally {
      setIsStarting(false);
    }
  }, [projectId, onServerStart, onServerStatusChange, handleKeepAliveResponse]);

  /**
   * 启动保活轮询
   */
  const startKeepAlive = useCallback(() => {
    if (!projectId) {
      return;
    }

    // 如果已经有保活定时器在运行，先停止
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    // 初始保活请求

    keepAlive(projectId)
      .then((response) => {
        handleKeepAliveResponse(response);
      })
      .catch(() => {});

    // 设置定时保活轮询
    keepAliveTimerRef.current = setInterval(() => {
      keepAlive(projectId)
        .then((response) => {
          handleKeepAliveResponse(response);
        })
        .catch(() => {});
    }, DEV_SERVER_CONSTANTS.SSE_HEARTBEAT_INTERVAL);
  }, [projectId, handleKeepAliveResponse]);

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    } else {
    }
  }, []);

  /**
   * 重置服务器状态
   */
  const resetServer = useCallback(() => {
    setDevServerUrl(null);
    setIsRunning(false);
    hasStartedRef.current = false;
    onServerStatusChange?.(false);
  }, [onServerStatusChange]);

  /**
   * 在项目ID变化时自动启动服务器（异步执行，不阻塞页面渲染）
   */
  useEffect(() => {
    if (projectId) {
      // 异步启动服务器，不阻塞页面渲染
      Promise.resolve().then(() => {
        startServer();
        // 启动保活轮询
        startKeepAlive();
      });
    }

    // 清理函数：当 projectId 变化或组件卸载时停止保活
    return () => {
      stopKeepAlive();
    };
  }, [projectId]); // 移除函数依赖，避免重复执行

  /**
   * 组件卸载时清理 - 确保保活轮询被停止
   */
  useEffect(() => {
    return () => {
      stopKeepAlive();
    };
  }, []); // 空依赖数组，只在组件卸载时执行

  return {
    isStarting,
    startError,
    devServerUrl,
    isRunning,
    startServer,
    resetServer,
    stopKeepAlive,
  };
};
