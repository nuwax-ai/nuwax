import type { McpAskRespondPayload } from './mcpAskIntervention';

/**
 * plan 模式功能开关（MCP 外挂式实现，契约见壳仓 docs/20260918-plan-mode-via-mcp.md）：
 * - 传输：agentMode="plan" 随 chat 请求直透壳（云端 String 无校验），不进 ACP 模式状态机；
 * - 审批：壳内 plan MCP server 的 nuwax_plan_submit 挂起 → acpRequestPermission 形状
 *   下发（kind=plan_approval，data 整体透传），应答走既有 permission response API；
 * - 回写：批准后业务档位回写为切 plan 前档位（previousMode），修订保持 plan。
 */
export const PLAN_MODE_ENABLED = true;

/** 计划审批 kind（壳侧合成 permission 请求的自由字符串 kind，云端透传） */
export const PLAN_APPROVAL_KIND = 'plan_approval';

/** 计划审批 optionId 约定（应答载荷仅 optionId，语义壳/前端两侧约定） */
export const PLAN_APPROVAL_OPTION_APPROVE = 'approve';
export const PLAN_APPROVAL_OPTION_REVISE = 'revise';

export type AgentMode = 'ask' | 'yolo' | 'plan';

export type AcpPermissionOptionKind =
  | 'allow_once'
  | 'allow_always'
  | 'reject_once'
  | 'reject_always';

export type AcpToolKind =
  | 'read'
  | 'edit'
  | 'delete'
  | 'move'
  | 'search'
  | 'execute'
  | 'think'
  | 'fetch'
  | 'switch_mode'
  | 'plan_approval'
  | 'other';

export interface AcpPermissionOption {
  optionId: string;
  kind: AcpPermissionOptionKind;
  name: string;
  _meta?: Record<string, unknown> | null;
}

export interface AcpToolCallUpdate {
  toolCallId: string;
  title?: string | null;
  kind?: AcpToolKind | string | null;
  rawInput?: unknown;
  rawOutput?: unknown;
  locations?: Array<{ path: string; line?: number | null }> | null;
  content?: unknown[] | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | string | null;
}

export interface AcpRequestPermissionRequest {
  sessionId: string;
  toolCall: AcpToolCallUpdate;
  options: AcpPermissionOption[];
  _meta?: Record<string, unknown> | null;
}

export interface AcpRequestPermissionResponse {
  outcome:
    | {
        outcome: 'selected';
        optionId: string;
        _meta?: Record<string, unknown> | null;
      }
    | { outcome: 'cancelled' };
  _meta?: Record<string, unknown> | null;
}

export interface AcpPermissionInterventionRequest {
  id: string;
  revision: number;
  kind: 'approval';
  status: 'pending';
  sessionId: string;
  source: 'acp_permission';
  engine: 'claude-code' | 'nuwaxcode' | 'codex';
  protocol: 'acp';
  callbackTarget: {
    kind: 'electron' | 'rcoder';
    targetId: string;
  };
  schemaRef: string;
  acp: {
    method: 'session/request_permission';
    request: AcpRequestPermissionRequest;
  };
  timeoutMs?: number;
  createdAt: number;
}

export interface AcpPermissionInteraction {
  intervention: AcpPermissionInterventionRequest;
  /** 关联的 processing executeId（与 processingList 同源），用于按 executeId 判断审批是否已过期 */
  executeId?: string;
  responseStatus?: 'pending' | 'submitting' | 'submitted' | 'failed';
  selectedOptionId?: string;
  errorMessage?: string;
  triggeredAt?: number;
}

export type AgentInterventionAction = 'submit' | 'cancel' | 'skip' | 'timeout';

/**
 * 权限卡附加响应信息（仅 switch_mode 使用）：修订文本随「否，继续完善计划」
 * 应答一起提交，由响应层转为 resume 聊天消息发给 agent（权限协议线上只传
 * option_id，文本不走该协议）。
 */
export interface AcpPermissionRespondExtras {
  revisionText?: string;
}

export interface AgentInterventionRespondRequest {
  interventionId: string;
  permission_resolve_request?: {
    request_permission_response: {
      outcome:
        | { Selected: { option_id: string } }
        | { Cancelled: Record<string, never> | null };
    };
    session_id: string;
    tool_call_id: string;
    save_rule?: boolean;
  };
  mcp_ask_resolve?: McpAskRespondPayload;
  user_id?: string;
  conversation_id?: number;
}
