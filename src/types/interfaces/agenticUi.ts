export type AgenticUiSurfaceStatus =
  | 'pending'
  | 'streaming'
  | 'ready'
  | 'error';

export type AgenticUiSurfaceMode = 'replace' | 'append' | 'patch';

export interface AgenticUiPatchOperation {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: unknown;
}

export interface AgenticUiSurface {
  schemaVersion: 'nuwax.agentic-ui.v1';
  surfaceId: string;
  status: AgenticUiSurfaceStatus;
  mode: AgenticUiSurfaceMode;
  root?: AgenticUiNode;
  patches?: AgenticUiPatchOperation[];
  metadata?: {
    requestId?: string;
    conversationId?: number;
    toolCallId?: string;
    mcpServerId?: string;
    source?: string;
    validationErrors?: string[];
  };
}

export interface AgenticUiNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: AgenticUiNode[];
}

export interface AgenticUiActionPayload {
  type: 'agentic_ui_action';
  surfaceId: string;
  actionId: string;
  nodeId?: string;
  payload?: Record<string, unknown>;
}

export interface AgenticUiValidationResult {
  surface: AgenticUiSurface | null;
  error?: string;
}

export interface AgenticUiDraft {
  id: string;
  title: string;
  surface: AgenticUiSurface;
  createdAt: number;
  updatedAt: number;
}

export interface AgenticUiActionLog {
  id: string;
  surfaceId: string;
  actionId: string;
  nodeId?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
}
