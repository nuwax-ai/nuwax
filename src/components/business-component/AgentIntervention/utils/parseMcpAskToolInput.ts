import type { McpAskUserToolInput } from '../types/mcpAskIntervention';
import { MCP_ASK_SCHEMA_VERSION } from '../types/mcpAskIntervention';

export function parseMcpAskToolInput(raw: unknown): McpAskUserToolInput | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== MCP_ASK_SCHEMA_VERSION) {
    return null;
  }
  const toolName = record.toolName ?? 'nuwax_ask_question';
  if (
    toolName !== 'nuwax_ask_question' &&
    toolName !== 'nuwax_ask_user' &&
    toolName !== 'nuwaclaw_ask_user'
  ) {
    return null;
  }
  if (typeof record.requestId !== 'string' || !record.ui) {
    return null;
  }
  return { ...record, toolName } as unknown as McpAskUserToolInput;
}
