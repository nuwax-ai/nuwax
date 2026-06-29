/**
 * AgentFlow 节点展示文案兜底（名称 / 描述）
 */

import { t } from '@/services/i18nRuntime';

/** 工作流节点：描述为空时用名称，再兜底默认文案 */
export function resolveAgentFlowWorkflowNodeDescription(
  name?: string,
  description?: string,
): string {
  const desc = typeof description === 'string' ? description.trim() : '';
  if (desc) {
    return desc;
  }
  const nodeName = typeof name === 'string' ? name.trim() : '';
  if (nodeName) {
    return nodeName;
  }
  return t('PC.Pages.AntvX6Params.nodeWorkflowDescription');
}
