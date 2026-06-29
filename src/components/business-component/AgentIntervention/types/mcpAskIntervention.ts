/**
 * MCP Ask v2 契约类型(nuwax.interaction.v2 / nuwax.mcp_ask.v2)。
 * 表单为有序自描述数组 ui.fields[];enum/enumNames 合并为 options,控件/约束/required/initialValue 下沉到字段。
 * 仅支持最新 v2,不兼容旧版本(历史 v1 rawInput 不再渲染)。
 */
export const MCP_ASK_SCHEMA_VERSION = 'nuwax.mcp_ask.v2';
export const INTERACTION_UI_SCHEMA_VERSION = 'nuwax.interaction.v2';

export type McpAskToolName = 'nuwax_ask_question';

export interface InteractionUiStep {
  id: string;
  title: string;
  description?: string;
  /** 本步展示的字段 name 数组,引用 ui.fields 中字段的 name */
  fields: string[];
}

/** v2 字段选项(合并旧 enum + enumNames) */
export interface FieldOption {
  value: string;
  label: string;
}

/** 渲染层(ParsedMcpAskField.options)读取的 UI 配置 */
export interface InteractionUiOptions {
  placeholder?: string;
  allowCustom?: boolean;
  otherValue?: string;
  otherField?: string;
  accept?: string;
  multiple?: boolean;
}

/** v2 单个表单字段(自描述:控件/选项/约束合并进同一对象) */
export interface FormField {
  name: string;
  title: string;
  widget: McpAskFieldWidget;
  description?: string;
  required?: boolean;
  placeholder?: string;
  initialValue?: unknown;
  type?: 'string' | 'integer' | 'number' | 'array';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: FieldOption[];
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  allowCustom?: boolean;
  otherValue?: string;
  otherField?: string;
}

/** v2 交互 UI 定义;数组顺序即渲染顺序,不再有 schema/uiSchema/ui:order */
export interface InteractionUiSchema {
  version: typeof INTERACTION_UI_SCHEMA_VERSION;
  presentation: 'modal' | 'inline' | 'wizard';
  title: string;
  description?: string;
  fields?: FormField[];
  steps?: InteractionUiStep[];
  submitLabel?: string;
  cancelLabel?: string;
  allowSkip?: boolean;
  skipLabel?: string;
  fallback?: {
    text: string;
    webUrl?: string;
    mobileUrl?: string;
  };
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
  business?: Record<string, unknown>;
  timeoutMs?: number;
  priority?: 'normal' | 'high';
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
  /** 关联的 processing executeId（与 processingList 同源），用于按 executeId 判断审批是否已过期 */
  executeId?: string;
  responseStatus?: McpAskResponseStatus;
  formData?: Record<string, unknown>;
  errorMessage?: string;
  triggeredAt?: number;
}

/**
 * JsonSchema 约束视图:parser 从 v2 FormField 重建,
 * 供 McpAskFormField 读取(property.title/minimum/maximum/multipleOf/maxLength/minItems/type)。
 */
export interface JsonSchemaProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
}

export const MCP_ASK_WIDGET_TYPES = [
  'text',
  'textarea',
  'number',
  'radio',
  'checkboxes',
  'select',
  'list',
  'file',
  'radio-with-custom',
] as const;

export type McpAskFieldWidget = (typeof MCP_ASK_WIDGET_TYPES)[number];
