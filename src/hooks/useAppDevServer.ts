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
      console.log('🔍 [Server] 处理保活响应:', {
        hasData: !!response?.data,
        hasDevServerUrl: !!response?.data?.devServerUrl,
        projectId: response?.data?.projectId,
        projectIdStr: response?.data?.projectIdStr,
        devServerUrl: response?.data?.devServerUrl,
        fullResponse: response,
      });

      if (response?.data?.devServerUrl) {
        const newDevServerUrl = response.data.devServerUrl;
        const currentDevServerUrl = devServerUrl;

        console.log('🔍 [Server] 预览地址比较:', {
          currentUrl: currentDevServerUrl,
          newUrl: newDevServerUrl,
          isDifferent: newDevServerUrl !== currentDevServerUrl,
          projectId: response.data.projectId,
          projectIdStr: response.data.projectIdStr,
        });

        // 如果返回的URL与当前URL不同，更新预览地址
        if (newDevServerUrl !== currentDevServerUrl) {
          console.log('🔄 [Server] 保活接口返回新的预览地址，正在更新:', {
            oldUrl: currentDevServerUrl,
            newUrl: newDevServerUrl,
            projectId: response.data.projectId,
            projectIdStr: response.data.projectIdStr,
            timestamp: new Date().toISOString(),
          });

          setDevServerUrl(newDevServerUrl);
          onServerStart?.(newDevServerUrl);

          console.log('✅ [Server] 预览地址更新完成');
        } else {
          console.log(
            'ℹ️ [Server] 预览地址未变化，保持当前地址:',
            currentDevServerUrl,
          );
        }
      } else {
        console.log('⚠️ [Server] 保活响应中未包含 devServerUrl:', {
          responseData: response?.data,
          hasData: !!response?.data,
        });
      }
    },
    [devServerUrl, onServerStart],
  );

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
      console.log('✅ [Server] 开发环境启动成功:', {
        projectId: response?.data?.projectId,
        projectIdStr: response?.data?.projectIdStr,
        devServerUrl: response?.data?.devServerUrl,
        prodServerUrl: response?.data?.prodServerUrl,
        fullResponse: response,
      });

      if (response?.data?.devServerUrl) {
        console.log(
          '🔗 [Server] 存储开发服务器URL (startDev):',
          response.data.devServerUrl,
        );
        setDevServerUrl(response.data.devServerUrl);
        setIsRunning(true);
        onServerStart?.(response.data.devServerUrl);
        onServerStatusChange?.(true);

        // 注意：不再在 startServer 中进行保活检查，统一由 startKeepAlive 处理
        console.log('✅ [Server] 服务器启动完成，等待保活轮询启动...');
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
  }, [projectId, onServerStart, onServerStatusChange, handleKeepAliveResponse]);

  /**
   * 启动保活轮询
   */
  const startKeepAlive = useCallback(() => {
    if (!projectId) {
      console.log('⚠️ [Server] 没有项目ID，跳过保活轮询');
      return;
    }

    // 如果已经有保活定时器在运行，先停止
    if (keepAliveTimerRef.current) {
      console.log('🔄 [Server] 停止现有保活轮询，重新启动');
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    // 初始保活请求
    console.log('🚀 [Server] 发送初始保活请求，项目ID:', projectId);
    keepAlive(projectId)
      .then((response) => {
        console.log('💗 [Server] 初始保活成功:', {
          projectId,
          responseCode: response?.code,
          hasData: !!response?.data,
          timestamp: new Date().toISOString(),
        });
        handleKeepAliveResponse(response);
      })
      .catch((error) => {
        console.error('❌ [Server] 初始保活失败:', {
          projectId,
          error: error.message || error,
          timestamp: new Date().toISOString(),
        });
      });

    // 设置定时保活轮询
    keepAliveTimerRef.current = setInterval(() => {
      console.log('⏰ [Server] 执行定时保活轮询，项目ID:', projectId);
      keepAlive(projectId)
        .then((response) => {
          console.log('💗 [Server] 保活轮询成功:', {
            projectId,
            responseCode: response?.code,
            hasData: !!response?.data,
            timestamp: new Date().toISOString(),
          });
          handleKeepAliveResponse(response);
        })
        .catch((error) => {
          console.error('❌ [Server] 保活轮询失败:', {
            projectId,
            error: error.message || error,
            timestamp: new Date().toISOString(),
          });
        });
    }, DEV_SERVER_CONSTANTS.SSE_HEARTBEAT_INTERVAL);

    console.log('💗 [Server] 已启动30秒保活轮询，项目ID:', projectId);
  }, [projectId, handleKeepAliveResponse]);

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      console.log(
        '🛑 [Server] 正在停止保活轮询，定时器ID:',
        keepAliveTimerRef.current,
      );
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
      console.log('✅ [Server] 保活轮询已停止');
    } else {
      console.log('ℹ️ [Server] 保活轮询未运行，无需停止');
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
      console.log('🛑 [Server] 清理保活轮询，projectId:', projectId);
      stopKeepAlive();
    };
  }, [projectId]); // 移除函数依赖，避免重复执行

  /**
   * 组件卸载时清理 - 确保保活轮询被停止
   */
  useEffect(() => {
    return () => {
      console.log('🛑 [Server] 组件卸载，停止保活轮询');
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
