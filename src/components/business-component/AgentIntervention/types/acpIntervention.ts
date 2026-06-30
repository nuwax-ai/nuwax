import type { McpAskRespondPayload } from './mcpAskIntervention';

export type AgentMode = 'ask' | 'yolo';

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
