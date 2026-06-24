import type { McpAskUserToolInput } from '../types/mcpAskIntervention';
import {
  INTERACTION_UI_SCHEMA_VERSION,
  MCP_ASK_SCHEMA_VERSION,
} from '../types/mcpAskIntervention';

/**
 * agent / 平台 SSE 常漏写 schemaVersion;若 ui.version 合法则推断 ask schema 版本。
 * 仅支持最新 v2,不兼容旧版本(非 v2 输入返回 null,不渲染)。
 */
function resolveSchemaVersion(record: Record<string, unknown>): string | null {
  if (
    typeof record.schemaVersion === 'string' &&
    record.schemaVersion === MCP_ASK_SCHEMA_VERSION
  ) {
    return record.schemaVersion;
  }

  const ui = record.ui as Record<string, unknown> | undefined;
  if (
    typeof ui?.version === 'string' &&
    ui.version === INTERACTION_UI_SCHEMA_VERSION
  ) {
    return MCP_ASK_SCHEMA_VERSION;
  }

  return null;
}

export function parseMcpAskToolInput(raw: unknown): McpAskUserToolInput | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const schemaVersion = resolveSchemaVersion(record);
  if (!schemaVersion) {
    return null;
  }
  if ((record.toolName ?? 'nuwax_ask_question') !== 'nuwax_ask_question') {
    return null;
  }
  if (typeof record.requestId !== 'string' || !record.ui) {
    return null;
  }
  const ui = record.ui as Record<string, unknown>;
  if (
    typeof ui.version !== 'string' ||
    ui.version !== INTERACTION_UI_SCHEMA_VERSION
  ) {
    return null;
  }
  // v2:表单定义为 fields[](inline/modal)或 steps[](wizard)
  const hasFields = Array.isArray(ui.fields) && ui.fields.length > 0;
  const hasSteps = Array.isArray(ui.steps) && ui.steps.length > 0;
  if (!hasFields && !hasSteps) {
    return null;
  }
  return {
    ...record,
    schemaVersion,
    toolName: 'nuwax_ask_question',
  } as unknown as McpAskUserToolInput;
}
