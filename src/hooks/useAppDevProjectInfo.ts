/**
 * AppDev 项目详情 Hook
 * 用于获取和管理项目详情信息
 */

import { getProjectInfo } from '@/services/appDev';
import type {
  ProjectDetailData,
  VersionInfoItem,
} from '@/types/interfaces/appDev';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * 项目详情状态接口
 */
export interface ProjectInfoState {
  /** 项目详情数据 */
  projectInfo: ProjectDetailData | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载错误信息 */
  error: string | null;
  /** 最后更新时间 */
  lastUpdated: Date | null;
}

/**
 * 项目详情 Hook 返回值接口
 */
export interface UseAppDevProjectInfoReturn {
  /** 项目详情状态 */
  projectInfoState: ProjectInfoState;
  /** 刷新项目详情 */
  refreshProjectInfo: () => Promise<void>;
  /** 获取部署状态文本 */
  getDeployStatusText: (buildRunning: number) => string;
  /** 获取部署状态颜色 */
  getDeployStatusColor: (buildRunning: number) => string;
  /** 检查是否有更新未部署 */
  hasUpdates: boolean;
  /** 版本列表 */
  versionList: VersionInfoItem[];
  /** 获取操作类型文本 */
  getActionText: (action: string) => string;
  /** 获取操作类型颜色 */
  getActionColor: (action: string) => string;
  /** 格式化版本时间 */
  formatVersionTime: (time: string) => string;
}

/**
 * AppDev 项目详情 Hook
 * @param projectId 项目ID
 * @returns 项目详情相关状态和方法
 */
export const useAppDevProjectInfo = (
  projectId: string | null,
): UseAppDevProjectInfoReturn => {
  // 项目详情状态
  const [projectInfoState, setProjectInfoState] = useState<ProjectInfoState>({
    projectInfo: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  /**
   * 获取项目详情
   */
  const fetchProjectInfo = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      setProjectInfoState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await getProjectInfo(projectId);

      if (response?.code === '0000' && response?.data) {
        setProjectInfoState({
          projectInfo: response.data,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        const errorMessage = response?.message || '获取项目详情失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.toString() || '获取项目详情时发生未知错误';

      setProjectInfoState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [projectId]);

  /**
   * 刷新项目详情
   */
  const refreshProjectInfo = useCallback(async () => {
    await fetchProjectInfo();
  }, [fetchProjectInfo]);

  /**
   * 获取部署状态文本
   * @param buildRunning 部署状态值
   * @returns 部署状态文本
   */
  const getDeployStatusText = useCallback((buildRunning: number): string => {
    switch (buildRunning) {
      case 1:
        return '已发布';
      case -1:
        return '未发布';
      default:
        return '未知状态';
    }
  }, []);

  /**
   * 获取部署状态颜色
   * @param buildRunning 部署状态值
   * @returns 部署状态颜色
   */
  const getDeployStatusColor = useCallback((buildRunning: number): string => {
    switch (buildRunning) {
      case 1:
        return 'success';
      case -1:
        return 'warning';
      default:
        return 'default';
    }
  }, []);

  /**
   * 检查是否有更新未部署
   * 根据代码版本和发布版本比较
   */
  const hasUpdates = useMemo(() => {
    if (!projectInfoState.projectInfo) {
      return false;
    }

    const { codeVersion, buildVersion } = projectInfoState.projectInfo;
    return codeVersion > buildVersion;
  }, [projectInfoState.projectInfo]);

  /**
   * 版本列表（按版本号降序排列）
   */
  const versionList = useMemo(() => {
    if (!projectInfoState.projectInfo?.versionInfo) {
      return [];
    }

    return [...projectInfoState.projectInfo.versionInfo].sort(
      (a, b) => b.version - a.version,
    );
  }, [projectInfoState.projectInfo]);

  /**
   * 获取操作类型文本
   * @param action 操作类型
   * @returns 操作类型文本
   */
  const getActionText = useCallback((action: string): string => {
    switch (action) {
      case 'chat':
        return 'AI 对话';
      case 'submit_files_update':
        return '文件更新';
      case 'upload_single_file':
        return '上传单文件';
      case 'create_project':
        return '创建项目';
      case 'build':
        return '构建';
      case 'deploy':
        return '部署';
      case 'upload':
        return '上传项目';
      default:
        return '未知操作';
    }
  }, []);

  /**
   * 获取操作类型颜色
   * @param action 操作类型
   * @returns 操作类型颜色
   */
  const getActionColor = useCallback((action: string): string => {
    switch (action) {
      case 'chat':
        return 'blue';
      case 'submit_files_update':
        return 'green';
      case 'build':
        return 'orange';
      case 'deploy':
        return 'purple';
      default:
        return 'default';
    }
  }, []);

  /**
   * 格式化版本时间
   * @param time 时间字符串
   * @returns 格式化后的时间
   */
  const formatVersionTime = useCallback((time: string): string => {
    try {
      const date = new Date(time);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return time;
    }
  }, []);

  // 当项目ID变化时，自动获取项目详情
  useEffect(() => {
    if (projectId) {
      fetchProjectInfo();
    }
  }, [projectId]); // 移除 fetchProjectInfo 依赖，避免重复执行

  return {
    projectInfoState,
    refreshProjectInfo,
    getDeployStatusText,
    getDeployStatusColor,
    hasUpdates,
    versionList,
    getActionText,
    getActionColor,
    formatVersionTime,
  };
};

export default useAppDevProjectInfo;
