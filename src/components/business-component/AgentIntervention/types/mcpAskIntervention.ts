export const MCP_ASK_SCHEMA_VERSION = 'nuwaclaw.mcp_ask.v1';
export const INTERACTION_UI_SCHEMA_VERSION = 'nuwaclaw.interaction.v1';

export type McpAskToolName =
  | 'nuwax_ask_question'
  | 'nuwax_ask_user'
  | 'nuwaclaw_ask_user';

export interface InteractionUiStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
}

export interface InteractionUiOptions {
  allowSkip?: boolean;
  skipLabel?: string;
  allowCustom?: boolean;
  otherValue?: string;
  otherField?: string;
  enumNames?: string[];
  placeholder?: string;
}

export interface InteractionUiSchema {
  version: typeof INTERACTION_UI_SCHEMA_VERSION;
  presentation: 'modal' | 'inline' | 'wizard' | 'table';
  title: string;
  description?: string;
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  steps?: InteractionUiStep[];
  initialValue?: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  skipLabel?: string;
}

export interface McpAskUserToolInput {
  toolName: McpAskToolName;
  schemaVersion: typeof MCP_ASK_SCHEMA_VERSION;
  requestId: string;
  revision: number;
  sessionId: string;
  title: string;
  description?: string;
  ui: InteractionUiSchema;
  timeoutMs?: number;
}

export type McpAskRespondAction = 'submit' | 'cancel' | 'skip' | 'timeout';

export interface McpAskRespondPayload {
  interventionId: string;
  toolCallId?: string;
  revision: number;
  source: 'mcp_ask';
  protocol: 'mcp';
  action: McpAskRespondAction;
  formData?: Record<string, unknown>;
  answeredBy?: {
    kind: 'web' | 'mobile';
    userId?: string;
    clientId?: string;
  };
  answeredAt?: number;
}

export type McpAskResponseStatus =
  | 'pending'
  | 'submitting'
  | 'submitted'
  | 'cancelled'
  | 'skipped'
  | 'failed';

export interface McpAskInteraction {
  input: McpAskUserToolInput;
  toolCallId: string;
  responseStatus?: McpAskResponseStatus;
  formData?: Record<string, unknown>;
  errorMessage?: string;
  triggeredAt?: number;
}

export interface JsonSchemaProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export type McpAskFieldWidget =
  | 'radio'
  | 'checkboxes'
  | 'select'
  | 'text'
  | 'textarea'
  | 'radio-with-custom';
