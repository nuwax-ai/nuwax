/**
 * 重启开发服务器 Hook
 * 封装了完整的重启流程，通过参数控制是否切换标签页
 */

import { message } from 'antd';
import { useCallback } from 'react';
import { useModel } from 'umi';

interface UseRestartDevServerProps {
  projectId: string;
  server: {
    restartServer: (shouldSwitchTab?: boolean) => Promise<{
      success: boolean;
      message?: string;
      devServerUrl?: string;
    }>;
  };
  setActiveTab?: (tab: 'preview' | 'code') => void;
  previewRef?: React.RefObject<{ refresh: () => void }>;
  devLogsRefresh: () => void;
}

interface UseRestartDevServerReturn {
  restartDevServer: (params?: {
    shouldSwitchTab?: boolean;
    delayBeforeRefresh?: number;
    showMessage?: boolean;
  }) => Promise<{ success: boolean; message?: string; devServerUrl?: string }>;
}

/**
 * 重启开发服务器 Hook
 * @param props Hook 参数
 * @returns 重启方法
 */
export const useRestartDevServer = ({
  projectId,
  server,
  setActiveTab,
  previewRef,
  devLogsRefresh,
}: UseRestartDevServerProps): UseRestartDevServerReturn => {
  // 使用 model 统一管理状态
  const autoErrorHandlingModelInstance = useModel('autoErrorHandling');
  /**
   * 重启开发服务器方法
   * @param params 重启参数
   * @returns Promise<{success: boolean, message?: string, devServerUrl?: string}> 重启结果
   */
  const restartDevServer = useCallback(
    async (params?: {
      shouldSwitchTab?: boolean; // 是否切换到预览标签页（默认 true）
      delayBeforeRefresh?: number; // 刷新预览前的延迟时间（毫秒，默认 500）
      showMessage?: boolean; // 是否显示消息提示（默认 true）
    }) => {
      const {
        shouldSwitchTab = true, // 默认切换到预览标签页
        delayBeforeRefresh = 500, // 默认延迟 500ms
        showMessage = true, // 默认显示消息
      } = params || {};

      if (!projectId) {
        const errorMessage = '项目ID不存在或无效，无法重启服务';
        if (showMessage) {
          message.error(errorMessage);
        }
        return { success: false, message: errorMessage };
      }
      let finalResult;
      // 暂停 自动错误处理
      autoErrorHandlingModelInstance.setAutoHandlingEnabled(false);

      try {
        // 根据 shouldSwitchTab 参数决定是否切换到预览标签页
        if (shouldSwitchTab && setActiveTab) {
          setActiveTab('preview');
          // 等待标签页切换完成
          await new Promise((resolve) => setTimeout(resolve, 100)); //eslint-disable-line no-promise-executor-return
        }

        // 调用服务器重启方法，传递 shouldSwitchTab 参数
        const result = await server.restartServer(shouldSwitchTab);

        // 如果成功，延迟刷新预览
        if (result.success && previewRef?.current) {
          setTimeout(() => {
            previewRef.current?.refresh();
          }, delayBeforeRefresh);
        }

        // 显示结果消息
        if (showMessage) {
          if (result.success) {
            // 成功时不显示消息，避免干扰用户体验
          } else if (result.message) {
            message.error(result.message);
          }
        }

        finalResult = result;
      } catch (error: any) {
        const errorMessage = error?.message || '重启开发服务器失败';
        if (showMessage) {
          message.error(errorMessage);
        }
        finalResult = { success: false, message: errorMessage };
      } finally {
        // 拉取最新的日志 刷新日志
        devLogsRefresh();

        // 恢复 自动错误处理
        autoErrorHandlingModelInstance.setAutoHandlingEnabled(true);
      }
      return finalResult;
    },
    [projectId, server, setActiveTab, previewRef],
  );

  return {
    restartDevServer,
  };
};
