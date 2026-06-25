export type AcpPermissionOptionKind =
  | 'allow_once'
  | 'allow_always'
  | 'reject_once'
  | 'reject_always';

export interface RcoderPermissionToolCall {
  tool_call_id: string;
  kind: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  title: string;
  content: unknown[];
  raw_input: unknown;
  _meta?: Record<string, unknown>;
}

export interface RcoderPermissionOption {
  option_id: string;
  name: string;
  kind: AcpPermissionOptionKind;
  _meta?: Record<string, unknown>;
}

export interface RcoderRequestPermissionRequest {
  session_id: string;
  tool_call: RcoderPermissionToolCall;
  options: RcoderPermissionOption[];
  _meta?: Record<string, unknown>;
}

export interface RcoderPermissionSaveRule {
  suggested_pattern: string;
  rule_type: 'allow' | 'deny';
  tool_name: string;
}

export interface RcoderPermissionProgressData {
  request_permission_request: RcoderRequestPermissionRequest;
  tool_call_id: string;
  save_rule?: RcoderPermissionSaveRule;
  _meta?: Record<string, unknown>;
}

export type RcoderRequestPermissionOutcome =
  | { Selected: { option_id: string } }
  | { Cancelled: Record<string, never> | null };

export interface RcoderRequestPermissionResponse {
  outcome: RcoderRequestPermissionOutcome;
}

export interface RcoderPermissionResolveRequest {
  request_permission_response: RcoderRequestPermissionResponse;
  session_id: string;
  tool_call_id: string;
  save_rule?: boolean;
}

export interface RcoderNotifyResolvedRequest {
  permission_resolve_request: RcoderPermissionResolveRequest;
  user_id?: string;
  project_id?: string;
  pod_id?: string;
  tenant_id?: string;
  space_id?: string;
  isolation_type?: string;
}

export interface RcoderAcpPermissionInteraction {
  id: string;
  permission: RcoderPermissionProgressData;
  responseStatus?: 'pending' | 'submitting' | 'submitted' | 'failed';
  selectedOptionId?: string;
  errorMessage?: string;
}
