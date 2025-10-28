/**
 * AppDev 简化的 projectId 获取 Hook
 * 使用 UmiJS 的 useParams 获取路由参数
 */

import { useMemo } from 'react';
import { useLocation, useParams } from 'umi';

/**
 * AppDev ProjectId Hook
 * 使用 UmiJS 的 useParams 获取 projectId，支持路由参数和查询参数
 */
export const useAppDevProjectId = () => {
  const params = useParams();
  const location = useLocation();

  /**
   * 从路由参数和查询参数获取 projectId
   */
  const projectId = useMemo(() => {
    // 优先从路由参数获取 projectId
    if (params.projectId) {
      console.log(
        '✅ [AppDevProjectId] 从路由参数获取 projectId:',
        params.projectId,
      );
      return params.projectId;
    }

    // 如果路由参数中没有，尝试从查询参数获取（向后兼容）
    const urlParams = new URLSearchParams(location.search);
    const queryProjectId = urlParams.get('projectId');

    if (queryProjectId) {
      console.log(
        '✅ [AppDevProjectId] 从查询参数获取 projectId:',
        queryProjectId,
      );
      return queryProjectId;
    }

    console.warn('⚠️ [AppDevProjectId] 没有找到有效的 projectId');
    return null;
  }, [params.projectId, location.search]);

  /**
   * 验证 projectId 是否有效
   */
  const hasValidProjectId = Boolean(projectId);

  return {
    projectId,
    hasValidProjectId,
  };
};

export default useAppDevProjectId;
