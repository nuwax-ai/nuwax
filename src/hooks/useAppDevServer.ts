/**
 * AppDev 开发服务器管理相关 Hook
 */

import { DEV_SERVER_CONSTANTS } from '@/constants/appDevConstants';
import { keepAlive, restartDev, startDev } from '@/services/appDev';
import { createDevLogger } from '@/utils/devLogger';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

// 模块级日志工具实例，避免在业务代码中重复创建
const keepAliveLogger = createDevLogger('keepAlive');

interface UseAppDevServerProps {
  projectId: string;

  onServerStart?: (devServerUrl: string) => void;
  onServerStatusChange?: (isRunning: boolean) => void;
}

interface UseAppDevServerReturn {
  isStarting: boolean;
  isRestarting: boolean;
  devServerUrl: string | null;
  isRunning: boolean;
  serverMessage: string | null;
  serverErrorCode: string | null; // 新增：服务器错误码
  startServer: () => Promise<
    { success: boolean; message?: string; devServerUrl?: string } | undefined
  >;
  restartServer: (
    shouldSwitchTab?: boolean,
  ) => Promise<{ success: boolean; message?: string; devServerUrl?: string }>;
  resetServer: () => void;
  stopKeepAlive: () => void;
}

export const useAppDevServer = ({
  projectId,
  onServerStart,
  onServerStatusChange,
}: UseAppDevServerProps): UseAppDevServerReturn => {
  const [isStarting, setIsStarting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverErrorCode, setServerErrorCode] = useState<string | null>(null); // 新增：服务器错误码状态

  const hasStartedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 用于存储当前保活对应的 projectId，确保定时器回调使用最新的 projectId
  const currentKeepAliveProjectIdRef = useRef<string | null>(null);

  /**
   * 统一的服务器状态处理函数
   * @param response API响应
   * @param operation 操作类型
   * @param shouldShowMessage 是否显示消息提示
   * @returns 处理结果
   */
  const handleServerResponse = useCallback(
    (
      response: any,
      operation: 'start' | 'restart',
      shouldShowMessage: boolean = false,
    ) => {
      const isSuccess = response?.code === '0000' || response?.success;
      const serverUrl = response?.data?.devServerUrl;

      if (isSuccess && serverUrl) {
        // 成功情况
        // 注意：不在这里设置 devServerUrl，让调用方决定何时设置
        setIsRunning(true);
        onServerStatusChange?.(true);

        // 成功时清除服务器消息和错误码，避免显示错误状态
        setServerMessage(null);
        setServerErrorCode(null);

        const successMessage =
          response?.message ||
          (operation === 'start' ? '开发环境启动成功' : '开发服务器重启成功');

        let messageText = '';
        if (shouldShowMessage) {
          messageText = successMessage;
          // message.success(messageText);
        }

        return {
          success: true,
          devServerUrl: serverUrl,
          message: messageText || successMessage,
        };
      } else {
        // 失败情况
        setIsRunning(false);
        onServerStatusChange?.(false);

        // 更新服务器消息和错误码
        const errorMessage =
          response?.message ||
          `${
            operation === 'start' ? '启动开发环境失败' : '重启开发服务器失败'
          }`;
        const errorCode = response?.code || 'UNKNOWN_ERROR';
        setServerMessage(errorMessage);
        setServerErrorCode(errorCode);

        let errorMsg = '';
        if (shouldShowMessage) {
          errorMsg = errorMessage;
          // message.error(errorMsg);
        }

        return {
          success: false,
          message: errorMsg || errorMessage,
        };
      }
    },
    [onServerStart, onServerStatusChange],
  );

  /**
   * 处理保活响应，更新预览地址
   * 根据实际接口返回格式: { projectId, projectIdStr, devServerUrl }
   */
  const handleKeepAliveResponse = useCallback(
    (response: any) => {
      // 检查接口返回状态码
      if (response?.code !== '0000') {
        // 【关键变更】接口返回非 0000 状态码，设置错误信息和错误码
        const errorMessage = response?.message || '错误信息';
        const errorCode = response?.code || 'KEEPALIVE_ERROR';
        setServerMessage(errorMessage);
        setServerErrorCode(errorCode);
        setIsRunning(false);
        onServerStatusChange?.(false);
        // 不设置 isStarting 或 isRestarting，避免显示 loading
        return;
      }

      // 清除之前的错误信息和错误码
      setServerMessage(null);
      setServerErrorCode(null);
      setIsRunning(true);
      onServerStatusChange?.(true);

      if (response?.data?.devServerUrl) {
        const newDevServerUrl = response.data.devServerUrl;
        const currentDevServerUrl = devServerUrl;

        // 如果返回的URL与当前URL不同，更新预览地址
        if (newDevServerUrl !== currentDevServerUrl) {
          setDevServerUrl(newDevServerUrl);
          onServerStart?.(newDevServerUrl);
        }
      }
    },
    [devServerUrl, onServerStart, onServerStatusChange],
  );

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

    // 更新当前保活对应的 projectId
    const currentProjectId = projectId;
    currentKeepAliveProjectIdRef.current = currentProjectId;

    // 初始保活请求
    keepAlive(currentProjectId)
      .then((response) => {
        // 检查 projectId 是否已经变化，如果变化了就不处理这个响应
        if (currentKeepAliveProjectIdRef.current === currentProjectId) {
          handleKeepAliveResponse(response);
        }
      })
      .catch(() => {});

    // 设置定时保活轮询
    // 使用 currentKeepAliveProjectIdRef.current 而不是闭包中的 projectId
    // 这样即使 projectId 变化，定时器回调也会使用最新的 projectId
    keepAliveTimerRef.current = setInterval(() => {
      const activeProjectId = currentKeepAliveProjectIdRef.current;
      // 如果 projectId 已经被清除或变化，停止定时器
      if (!activeProjectId) {
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
          keepAliveTimerRef.current = null;
        }
        return;
      }
      keepAlive(activeProjectId)
        .then((response) => {
          // 再次检查 projectId 是否还是当前的，避免处理过期的响应
          if (currentKeepAliveProjectIdRef.current === activeProjectId) {
            handleKeepAliveResponse(response);
          }
        })
        .catch(() => {});
    }, DEV_SERVER_CONSTANTS.SSE_HEARTBEAT_INTERVAL);

    // 输出日志（仅在开发模式）
    keepAliveLogger.mark(`启动保活轮询-${currentProjectId}`);
    keepAliveLogger.info(
      `启动保活轮询-${currentProjectId}`,
      new Date().toLocaleString(),
    );
  }, [projectId, handleKeepAliveResponse]);

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    const currentProjectId = currentKeepAliveProjectIdRef.current;

    // 输出日志（仅在开发模式）
    keepAliveLogger.info(
      `调用停止保活轮询-${currentProjectId || 'null'}`,
      new Date().toLocaleString(),
      keepAliveTimerRef.current,
    );

    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);

      // 输出日志（仅在开发模式）
      keepAliveLogger.mark(`停止保活轮询-${currentProjectId || 'null'}`);

      keepAliveTimerRef.current = null;
      // 清除当前保活对应的 projectId
      currentKeepAliveProjectIdRef.current = null;

      // 输出日志（仅在开发模式）
      keepAliveLogger.info(
        `完成停止保活轮询-${currentProjectId || 'null'}`,
        new Date().toLocaleString(),
      );

      if (currentProjectId) {
        keepAliveLogger.measure(
          'measure',
          `启动保活轮询-${currentProjectId}`,
          `停止保活轮询-${currentProjectId}`,
        );
        const duration = keepAliveLogger.getMeasureDuration('measure');
        keepAliveLogger.info(`total time: ${duration || 0}s`);
      }
    }
  }, []);

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
      setServerMessage(null); // 清除之前的错误消息
      setServerErrorCode(null); // 清除之前的错误码

      // 调用 start-dev 接口
      const response = await startDev(projectId);

      // 处理响应
      const result = handleServerResponse(response, 'start', false);

      // 如果启动成功，设置服务器URL
      if (result.success && result.devServerUrl) {
        setDevServerUrl(result.devServerUrl);
        onServerStart?.(result.devServerUrl);
      } else {
        // 启动失败，设置错误消息（已在 handleServerResponse 中设置）
        // 不需要额外操作
      }

      // 重置启动状态
      setIsStarting(false);

      // 【关键变更】无论成功失败，都启动 keepalive 轮询
      startKeepAlive();

      return result;
    } catch (error: any) {
      setIsStarting(false);
      setIsRunning(false);
      setServerMessage(error?.message || '启动开发环境失败');
      setServerErrorCode(error?.code || 'START_ERROR');
      onServerStatusChange?.(false);

      // 即使异常也启动 keepalive 轮询
      startKeepAlive();
    }
  }, [projectId, handleServerResponse, onServerStatusChange, startKeepAlive]);

  /**
   * 重启开发服务器
   * @param shouldSwitchTab 是否切换到预览标签页（手动点击为 true，Agent 触发为 false）
   * @returns Promise<{success: boolean, message?: string, devServerUrl?: string}>
   */
  const restartServer = useCallback(
    async (shouldSwitchTab: boolean = false) => {
      if (!projectId) {
        if (shouldSwitchTab) {
          message.error('项目ID不存在或无效，无法重启服务');
        }
        return { success: false, message: '项目ID不存在或无效' };
      }
      let finalResult;

      try {
        // 【关键变更1】暂停 keepalive 轮询
        stopKeepAlive();

        // 【关键变更2】设置重启状态，清空 devServerUrl 和错误消息
        setIsRestarting(true);
        setDevServerUrl(null);
        setServerMessage(null);
        setServerErrorCode(null);

        // 调用重启接口
        const response = await restartDev(projectId);

        // 使用统一的处理函数
        const result = handleServerResponse(
          response,
          'restart',
          shouldSwitchTab,
        );

        // 如果重启成功，设置新的服务器URL
        if (result.success && result.devServerUrl) {
          setDevServerUrl(result.devServerUrl);
          onServerStart?.(result.devServerUrl);
        } else {
          // 重启失败，错误消息已在 handleServerResponse 中设置
          // serverMessage 会被 Preview 组件显示
        }

        // 重置重启状态
        setIsRestarting(false);

        // 【关键变更3】恢复 keepalive 轮询
        startKeepAlive();

        finalResult = result;
      } catch (error: any) {
        setIsRestarting(false);
        setIsRunning(false);

        const errorMessage = error?.message || '重启开发服务器失败';
        const errorCode = error?.code || 'RESTART_ERROR';
        setServerMessage(errorMessage);
        setServerErrorCode(errorCode);
        onServerStatusChange?.(false);

        // 【关键变更4】即使异常也要恢复 keepalive 轮询
        startKeepAlive();

        finalResult = { success: false, message: errorMessage };
      }
      return finalResult;
    },
    [
      projectId,
      handleServerResponse,
      onServerStatusChange,
      onServerStart,
      stopKeepAlive,
      startKeepAlive,
    ],
  );

  /**
   * 重置服务器状态
   */
  const resetServer = useCallback(() => {
    setDevServerUrl(null);
    setIsRunning(false);
    setIsStarting(false);
    setIsRestarting(false);
    setServerMessage(null);
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
        startServer(); // startServer 内部会调用 startKeepAlive
        // 【删除】startKeepAlive(); // 移除这行
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
    isRestarting,
    devServerUrl,
    isRunning,
    serverMessage,
    serverErrorCode, // 新增：暴露服务器错误码
    startServer,
    restartServer,
    resetServer,
    stopKeepAlive,
  };
};
