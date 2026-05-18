/**
 * Agent 干预能力（ACP 权限审批 + MCP Ask/Question）
 * 业务侧仅通过本模块公开 API 接入，避免侵入 conversationInfo / Chat 实现细节
 */

export * from './types';

export { processInterventionSsePatch } from './sse/process-intervention-sse-patch';

export { useAgentInterventionHandlers } from './hooks/useAgentInterventionHandlers';
export type { UseAgentInterventionHandlersOptions } from './hooks/useAgentInterventionHandlers';

export { default as AgentInterventionChatLayer } from './components/AgentInterventionChatLayer';
export type { AgentInterventionChatLayerProps } from './components/AgentInterventionChatLayer';

export { default as InterventionDockPanel } from './components/InterventionDockPanel';
export type { InterventionDockPanelProps } from './components/InterventionDockPanel';

export { useActiveInterventionQueue } from './hooks/useActiveInterventionQueue';
export type {
  InterventionQueueItem,
  InterventionQueueKind,
} from './hooks/useActiveInterventionQueue';

export { default as AcpPermissionMessageSlot } from './components/AcpPermissionMessageSlot';
export type { AcpPermissionMessageSlotProps } from './components/AcpPermissionMessageSlot';

export { default as AcpPermissionCard } from './acp-permission/components/AcpPermissionCard';
export { default as McpAskQuestionCard } from './mcp-ask/components/McpAskQuestionCard';

export {
  enableAcpMockLocalRespond,
  injectAcpPermissionIntoMessageList,
  type AcpPermissionMockScenario,
} from './acp-permission/mock';

export {
  createMockMcpAskToolCallSseEvent,
  enableMcpAskMockLocalRespond,
  injectMcpAskIntoMessageList,
  type McpAskQuestionMockScenario,
} from './mcp-ask/mock';
