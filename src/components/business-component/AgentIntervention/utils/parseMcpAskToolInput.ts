import type { McpAskUserToolInput } from '../types/mcpAskIntervention';
import {
  INTERACTION_UI_SCHEMA_VERSION,
  INTERACTION_UI_SCHEMA_VERSION_ALIASES,
  MCP_ASK_SCHEMA_VERSION,
  MCP_ASK_SCHEMA_VERSION_ALIASES,
} from '../types/mcpAskIntervention';

const acceptedAskSchemaVersions = new Set([
  MCP_ASK_SCHEMA_VERSION,
  ...MCP_ASK_SCHEMA_VERSION_ALIASES,
]);

const acceptedUiSchemaVersions = new Set([
  INTERACTION_UI_SCHEMA_VERSION,
  ...INTERACTION_UI_SCHEMA_VERSION_ALIASES,
]);

/**
 * agent / 平台 SSE 常漏写 schemaVersion；若 ui.version 合法则推断 ask schema 版本。
 */
function resolveSchemaVersion(record: Record<string, unknown>): string | null {
  if (
    typeof record.schemaVersion === 'string' &&
    acceptedAskSchemaVersions.has(record.schemaVersion)
  ) {
    return record.schemaVersion;
  }

  const ui = record.ui as Record<string, unknown> | undefined;
  if (
    typeof ui?.version === 'string' &&
    acceptedUiSchemaVersions.has(ui.version)
  ) {
    return ui.version === 'nuwax.interaction.v1'
      ? 'nuwax.mcp_ask.v1'
      : MCP_ASK_SCHEMA_VERSION;
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
    !acceptedUiSchemaVersions.has(ui.version)
  ) {
    return null;
  }
  return {
    ...record,
    schemaVersion,
    toolName: 'nuwax_ask_question',
  } as unknown as McpAskUserToolInput;
}
