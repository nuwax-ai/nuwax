/**
 * Flow service —— Workflow / AgentFlow 的统一前端入口
 *
 * 当前现状：
 *   Workflow 与 AgentFlow 共享后端 `/api/workflow/*`。
 *   本模块薄壳代理，把 endpoint 前缀集中在一处管理；
 *   未来后端分叉为 `/api/agent-flow/*` 时，只改本文件即可。
 *
 * 用法：
 *   import workflowService from '@/services/workflow';
 *   import { useFlowApiPrefix, flowApiPrefix } from '@/services/flow';
 *   const prefix = useFlowApiPrefix();           // 从 FlowKindContext 自动取
 *   const url = `${prefix}/test/execute`;
 *
 * 注意：本模块只负责 **endpoint 路由**，不重新封装 workflow.ts 的方法签名 ——
 *   一旦 AgentFlow 后端真的分叉，这里会演化为完整的 service 类，但目前不引入新抽象。
 */

import { useFlowKind } from '@/contexts/FlowKindContext';
import { FlowKindEnum } from '@/types/enums/common';

/**
 * Workflow API 公共前缀
 *
 * @internal 后端联调阶段如需切换 AgentFlow 端点，只改此映射
 */
const FLOW_API_PREFIX: Record<FlowKindEnum, string> = {
  [FlowKindEnum.Workflow]: '/api/workflow',
  [FlowKindEnum.AgentFlow]: '/api/workflow', // 现阶段共用；后端就绪后改为 '/api/agent-flow'
};

/**
 * 取指定 flowKind 的 API 前缀（纯函数）
 */
export function flowApiPrefix(flowKind: FlowKindEnum): string {
  return FLOW_API_PREFIX[flowKind];
}

/**
 * React hook：从 FlowKindContext 自动取 API 前缀
 */
export function useFlowApiPrefix(): string {
  return flowApiPrefix(useFlowKind());
}

/**
 * 给请求体附加 flowKind 字段，便于后端联调阶段在共用端点下区分
 *
 * @example
 *   request(url, { data: withFlowKind(payload, FlowKindEnum.AgentFlow) })
 */
export function withFlowKind<T extends Record<string, unknown>>(
  payload: T,
  flowKind: FlowKindEnum,
): T & { flowKind: FlowKindEnum } {
  return { ...payload, flowKind };
}
