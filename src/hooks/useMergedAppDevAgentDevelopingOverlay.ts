import { resolveShowDevelopingOverlayDuringAgent } from '@/utils/appDevDevelopingOverlayResolve';
import { useMemo } from 'react';
import { useLocation } from 'umi';

/**
 * 解析 URL 入参并输出传给 ContentViewer 的遮罩控制值。
 */
export function useMergedAppDevAgentDevelopingOverlay() {
  const { search } = useLocation();

  return useMemo(
    () =>
      resolveShowDevelopingOverlayDuringAgent({
        search,
      }),
    [search],
  );
}
