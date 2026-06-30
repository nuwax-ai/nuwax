/**
 * flowKind 派生 Hooks
 *
 * 对 FlowKindContext 的薄封装，替代各组件中重复的
 * `useFlowKind() === FlowKindEnum.AgentFlow` 派生。
 */

import { useFlowKind } from '@/contexts/FlowKindContext';
import { FlowKindEnum } from '@/types/enums/common';

/**
 * 当前是否为 AgentFlow 模式。
 */
export function useIsAgentFlow(): boolean {
  return useFlowKind() === FlowKindEnum.AgentFlow;
}

/**
 * 当前 flowKind，仅在 AgentFlow 时返回值，否则返回 undefined。
 * 用于需要透传 flowKind 给子组件的场景（如 GraphContainer）。
 */
export function useAgentFlowKind(): FlowKindEnum | undefined {
  const flowKind = useFlowKind();
  return flowKind === FlowKindEnum.AgentFlow ? flowKind : undefined;
}
