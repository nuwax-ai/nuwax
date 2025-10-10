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

export const useAppDevServer = ({
  projectId,
  onServerStart,
  onServerStatusChange,
}: UseAppDevServerProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const hasStartedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 启动开发环境
   */
  const startServer = useCallback(async () => {
    if (!projectId) {
      console.warn('⚠️ [Server] 没有项目ID，跳过开发环境启动');
      return;
    }

    if (lastProjectIdRef.current !== projectId) {
      console.log('🔄 [Server] 项目ID发生变化，重置启动状态', {
        oldProjectId: lastProjectIdRef.current,
        newProjectId: projectId,
      });
      hasStartedRef.current = false;
      lastProjectIdRef.current = projectId;
    }

    if (hasStartedRef.current) {
      console.log('⚠️ [Server] 开发环境已经启动过，跳过重复启动');
      return;
    }

    try {
      hasStartedRef.current = true;
      setIsStarting(true);
      setStartError(null);
      console.log('🚀 [Server] 正在启动开发环境...', { projectId });

      const response = await startDev(projectId);
      console.log('✅ [Server] 开发环境启动成功:', response);

      if (response?.data?.devServerUrl) {
        console.log(
          '🔗 [Server] 存储开发服务器URL:',
          response.data.devServerUrl,
        );
        setDevServerUrl(response.data.devServerUrl);
        setIsRunning(true);
        onServerStart?.(response.data.devServerUrl);
        onServerStatusChange?.(true);
      }
    } catch (error) {
      console.error('❌ [Server] 开发环境启动失败:', error);
      setStartError(
        error instanceof Error ? error.message : '启动开发环境失败',
      );
      hasStartedRef.current = false;
      onServerStatusChange?.(false);
    } finally {
      setIsStarting(false);
    }
  }, [projectId, onServerStart, onServerStatusChange]);

  /**
   * 启动保活轮询
   */
  const startKeepAlive = useCallback(() => {
    if (!projectId) {
      console.log('⚠️ [Server] 没有项目ID，跳过保活轮询');
      return;
    }

    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
    }

    keepAlive(projectId).catch((error) => {
      console.error('❌ [Server] 初始保活失败:', error);
    });

    keepAliveTimerRef.current = setInterval(() => {
      keepAlive(projectId).catch((error) => {
        console.error('❌ [Server] 保活轮询失败:', error);
      });
    }, DEV_SERVER_CONSTANTS.SSE_HEARTBEAT_INTERVAL);

    console.log('💗 [Server] 已启动30秒保活轮询，项目ID:', projectId);
  }, [projectId]);

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
      console.log('🛑 [Server] 已停止保活轮询');
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
   * 在项目ID变化时自动启动服务器
   */
  useEffect(() => {
    if (projectId) {
      startServer();
      startKeepAlive();
    }

    return () => {
      stopKeepAlive();
    };
  }, [projectId, startServer, startKeepAlive, stopKeepAlive]);

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      stopKeepAlive();
    };
  }, [stopKeepAlive]);

  return {
    isStarting,
    startError,
    devServerUrl,
    isRunning,
    startServer,
    resetServer,
  };
};
