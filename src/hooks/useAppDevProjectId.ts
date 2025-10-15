/**
 * AppDev 简化的 projectId 获取 Hook
 * 仅从 URL 参数获取 projectId
 */

import { getProjectIdFromUrl } from '@/models/appDev';
import { useMemo } from 'react';

/**
 * AppDev ProjectId Hook
 * 直接从 URL 参数获取 projectId，简洁高效
 */
export const useAppDevProjectId = () => {
  /**
   * 从 URL 获取 projectId
   */
  const projectId = useMemo(() => {
    const urlProjectId = getProjectIdFromUrl();
    const trimmedProjectId = urlProjectId?.trim();

    if (
      !trimmedProjectId ||
      trimmedProjectId === '' ||
      trimmedProjectId === 'null' ||
      trimmedProjectId === 'undefined'
    ) {
      console.warn('⚠️ [AppDevProjectId] URL 中没有有效的 projectId');
      return null;
    }

    console.log(
      '✅ [AppDevProjectId] 从 URL 获取 projectId:',
      trimmedProjectId,
    );
    return trimmedProjectId;
  }, []); // 依赖为空，URL 参数变化时页面会重新加载

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
