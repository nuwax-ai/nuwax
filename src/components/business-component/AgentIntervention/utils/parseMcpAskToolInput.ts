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

  // 兜底:agent 按"服务端盖戳"约定省略 schemaVersion/ui.version 时,识别裸 v2。
  // v2 强信号 = 有 ui.fields 且无 v1 的 ui.schema(v1 用 schema,无 fields)。
  if (ui && Array.isArray(ui.fields) && !ui.schema) {
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
  // 版本识别已在 resolveSchemaVersion 完成(含裸 v2 推断);此处只校验 v2 形状。
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
