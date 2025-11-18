/**
 * AppDev 开发服务器管理相关 Hook
 */

import { DEV_SERVER_CONSTANTS } from '@/constants/appDevConstants';
import { keepAlive, restartDev, startDev } from '@/services/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';

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
  // 【核心修改】从路由 URL 中获取最新的 projectId
  const params = useParams();
  const urlProjectId = params.projectId as string | undefined;

  const [isStarting, setIsStarting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverErrorCode, setServerErrorCode] = useState<string | null>(null); // 新增：服务器错误码状态

  const hasStartedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  // 用于存储当前保活对应的 projectId，确保回调使用最新的 projectId
  const currentKeepAliveProjectIdRef = useRef<string | null>(null);
  // 【关键】存储 URL 中的最新 projectId，供回调访问
  const latestProjectIdRef = useRef<string | undefined>(urlProjectId);

  // 【关键】同步更新 latestProjectIdRef，确保回调始终能访问到 URL 中最新的 projectId
  useEffect(() => {
    latestProjectIdRef.current = urlProjectId;
  }, [urlProjectId]);

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

  // 使用 ref 存储回调函数，避免依赖项变化导致 useRequest 重新创建
  const onServerStartRef = useRef(onServerStart);
  const onServerStatusChangeRef = useRef(onServerStatusChange);
  const devServerUrlRef = useRef(devServerUrl);

  // 同步更新 ref
  useEffect(() => {
    onServerStartRef.current = onServerStart;
    onServerStatusChangeRef.current = onServerStatusChange;
    devServerUrlRef.current = devServerUrl;
  }, [onServerStart, onServerStatusChange, devServerUrl]);

  /**
   * 处理保活响应，更新预览地址
   * 根据实际接口返回格式: RequestResponse<KeepAliveResponseData>
   * 使用 ref 访问最新值，避免依赖项变化
   *
   * 注意：useRequest 的 onSuccess 可能传入 data 或完整的 response
   * 需要兼容两种情况：
   * 1. 传入完整的 response 对象 (RequestResponse<KeepAliveResponseData>)
   * 2. 传入 data 对象 (KeepAliveResponseData)
   */
  const handleKeepAliveResponse = useCallback((responseOrData: any) => {
    // 检查 projectId 是否已经变化，如果变化了就不处理这个响应
    const currentProjectId = latestProjectIdRef.current;
    if (currentKeepAliveProjectIdRef.current !== currentProjectId) {
      return;
    }

    // 判断传入的是完整的 response 还是 data
    // 如果有 code 或 success 字段，说明是完整的 response
    // 否则可能是 data 对象
    const isFullResponse =
      responseOrData?.code !== undefined ||
      responseOrData?.success !== undefined;
    const response = isFullResponse
      ? responseOrData
      : { data: responseOrData, code: '0000', success: true };
    const data = isFullResponse ? responseOrData?.data : responseOrData;

    // 调试日志：打印返回数据格式
    // console.log('[useAppDevServer] keepAlive response:', {
    //   isFullResponse,
    //   code: response?.code,
    //   success: response?.success,
    //   message: response?.message,
    //   hasData: !!data,
    //   devServerUrl: data?.devServerUrl,
    //   fullResponse: responseOrData,
    // });

    // 检查接口返回状态码 - 兼容 code === '0000' 或 success === true
    const isSuccess = response?.code === '0000' || response?.success === true;

    if (!isSuccess) {
      // 【关键变更】接口返回非成功状态码，设置错误信息和错误码
      const errorMessage = response?.message || '保活请求失败';
      const errorCode = response?.code || 'KEEPALIVE_ERROR';
      // console.warn('[useAppDevServer] keepAlive failed:', {
      //   code: errorCode,
      //   message: errorMessage,
      //   fullResponse: responseOrData,
      // });
      setServerMessage(errorMessage);
      setServerErrorCode(errorCode);
      setIsRunning(false);
      onServerStatusChangeRef.current?.(false);
      // 不设置 isStarting 或 isRestarting，避免显示 loading
      return;
    }

    // 清除之前的错误信息和错误码
    setServerMessage(null);
    setServerErrorCode(null);
    setIsRunning(true);
    onServerStatusChangeRef.current?.(true);

    // 处理返回数据 - 兼容不同的数据结构
    const devServerUrl = data?.devServerUrl;
    if (devServerUrl) {
      const newDevServerUrl = devServerUrl;
      const currentDevServerUrl = devServerUrlRef.current;

      // 如果返回的URL与当前URL不同，更新预览地址
      if (newDevServerUrl !== currentDevServerUrl) {
        // console.log('[useAppDevServer] devServerUrl updated:', {
        //   old: currentDevServerUrl,
        //   new: newDevServerUrl,
        // });
        setDevServerUrl(newDevServerUrl);
        devServerUrlRef.current = newDevServerUrl;
        onServerStartRef.current?.(newDevServerUrl);
      }
    } else {
      // 如果没有 devServerUrl，但请求成功，可能是首次请求或服务器未启动
      // console.log('[useAppDevServer] keepAlive success but no devServerUrl');
    }
  }, []); // 空依赖数组，使用 ref 访问最新值

  /**
   * 使用 umi useRequest 实现 keepalive 轮询
   * 与 useEventPolling.ts 的 batch 接入方案一致
   * 注意：useRequest 的 onSuccess 回调接收的是完整的 response 对象（包含 code, success, message, data）
   */
  const keepAlivePolling = useRequest(
    () => {
      const currentProjectId = latestProjectIdRef.current;
      if (!currentProjectId) {
        return Promise.resolve({ code: 'NO_PROJECT_ID' });
      }
      return keepAlive(currentProjectId);
    },
    {
      manual: true, // 手动控制，不自动执行
      loading: false, // 不显示 loading 状态
      pollingInterval: DEV_SERVER_CONSTANTS.SSE_HEARTBEAT_INTERVAL, // 轮询间隔
      pollingWhenHidden: false, // 在屏幕不可见时，暂时暂停定时任务
      pollingErrorRetryCount: -1, // 轮询错误重试次数，-1 表示无限次
      throwOnError: false, // 不抛出错误，在 onError 中处理
      onSuccess: (data: any, params: any, response: any) => {
        // useRequest 的 onSuccess 回调参数：
        // - data: response.data (即 KeepAliveResponseData)
        // - params: 请求参数
        // - response: 完整的响应对象 (RequestResponse<KeepAliveResponseData>)
        // 我们需要使用完整的 response 对象
        handleKeepAliveResponse(response || data);
      },
      onError: () => {
        // 错误处理，不显示错误提示（已在 common.ts 中配置为静默请求）
        // console.error('[useAppDevServer] keepAlive error:', error);
      },
    },
  );

  // 使用 ref 存储 keepAlivePolling，避免依赖项变化
  const keepAlivePollingRef = useRef(keepAlivePolling);
  keepAlivePollingRef.current = keepAlivePolling;

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    // 取消 umi useRequest 的轮询
    keepAlivePollingRef.current.cancel();
    // 清除当前保活对应的 projectId
    currentKeepAliveProjectIdRef.current = null;
  }, []); // 空依赖数组，使用 ref 访问最新值

  /**
   * 启动保活轮询
   */
  const startKeepAlive = useCallback(() => {
    // 【关键】使用 latestProjectIdRef 获取最新的 projectId
    const currentProjectId = latestProjectIdRef.current;

    if (!currentProjectId) {
      return;
    }

    // 更新当前保活对应的 projectId
    currentKeepAliveProjectIdRef.current = currentProjectId;

    // 启动 umi useRequest 轮询
    keepAlivePollingRef.current.run();
  }, []); // 空依赖数组，使用 ref 访问最新值

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
  }, [
    projectId,
    handleServerResponse,
    onServerStatusChange,
    onServerStart,
    startKeepAlive,
  ]);

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
    setServerErrorCode(null);
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
      });
    }

    // 清理函数：当 projectId 变化或组件卸载时停止保活
    return () => {
      stopKeepAlive();
    };
  }, [projectId]); // 【核心修复】移除函数依赖，避免重复执行

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
