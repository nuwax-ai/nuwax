import { useEffect } from 'react';

/**
 * 将工作流 refreshGraphData 注册给外部（如 AgentFlowCanvas ref），
 * 供记忆变量变更等场景主动触发重新拉取。
 */
export function useRegisterWorkflowRefresh(
  refreshGraphData: () => Promise<void>,
  onRefreshReady?: (refresh: () => Promise<void>) => void,
) {
  useEffect(() => {
    onRefreshReady?.(refreshGraphData);
  }, [onRefreshReady, refreshGraphData]);
}
