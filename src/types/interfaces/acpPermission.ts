export type AcpPermissionOptionKind =
  | 'allow_once'
  | 'allow_always'
  | 'reject_once'
  | 'reject_always';

export interface RcoderPermissionToolCall {
  toolCallId: string;
  kind: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  title: string;
  content: unknown[];
  rawInput: any;
  _meta?: Record<string, unknown>;
}

export interface RcoderPermissionOption {
  optionId: string;
  name: string;
  kind: AcpPermissionOptionKind;
  _meta?: Record<string, unknown>;
}

export interface RcoderRequestPermissionRequest {
  sessionId: string;
  toolCall: RcoderPermissionToolCall;
  options: RcoderPermissionOption[];
  _meta?: Record<string, unknown>;
}

export interface RcoderRequestPermissionResponse {
  outcome: {
    outcome: 'selected' | 'cancelled';
    optionId?: string;
  };
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
  intervention: {
    id: string;
    revision: number;
    kind: string;
    status: string;
    sessionId: string;
    source: string;
    engine: string;
    protocol: string;
    callbackTarget: {
      kind: string;
      targetId: string;
    };
    acp: {
      method: string;
      request: RcoderRequestPermissionRequest;
    };
    createdAt: number;
  };
  responseStatus?: 'pending' | 'submitting' | 'submitted' | 'failed';
  selectedOptionId?: string;
  errorMessage?: string;
}
