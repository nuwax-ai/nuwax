/**
 * AppDev 项目详情 Hook
 * 用于获取和管理项目详情信息
 */

import { getProjectInfo } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import type { ProjectDetailData } from '@/types/interfaces/appDev';
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
  /** 是否有权限访问项目 */
  hasPermission: boolean;
}

/**
 * 项目详情 Hook 返回值接口
 */
export interface UseAppDevProjectInfoReturn {
  /** 项目详情状态 */
  projectInfoState: ProjectInfoState;
  /** 刷新项目详情 */
  refreshProjectInfo: () => Promise<void>;
  /** 检查是否有更新未部署 */
  hasUpdates: boolean;
  /** 是否有权限访问项目 */
  hasPermission: boolean;
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
    hasPermission: false,
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
          hasPermission: true,
        });
      } else {
        if (response?.code === '4030') {
          // 没有权限
          setProjectInfoState((prev) => ({
            ...prev,
            isLoading: false,
            error: dict('PC.Hooks.UseAppDevProjectInfo.noPermission'),
            hasPermission: false,
          }));
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.toString() ||
        dict('PC.Hooks.UseAppDevProjectInfo.fetchProjectFailed');

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
   * 检查是否有更新未部署
   * 根据代码版本和发布版本比较
   */
  const hasUpdates = useMemo(() => {
    if (!projectInfoState.projectInfo) {
      return false;
    }

    const { codeVersion, buildVersion } = projectInfoState.projectInfo;
    if (codeVersion === buildVersion) {
      return false;
    }
    return true;
  }, [
    projectInfoState.projectInfo?.codeVersion,
    projectInfoState.projectInfo?.buildVersion,
  ]);

  // 当项目ID变化时，自动获取项目详情
  useEffect(() => {
    if (projectId) {
      fetchProjectInfo();
    }
  }, [projectId]); // 移除 fetchProjectInfo 依赖，避免重复执行

  return {
    projectInfoState,
    refreshProjectInfo,
    hasUpdates,
    hasPermission: projectInfoState.hasPermission,
  };
};

export default useAppDevProjectInfo;
