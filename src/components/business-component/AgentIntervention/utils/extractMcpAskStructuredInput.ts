/**
 * 从 PROCESSING ToolCall 的 result.data 文本块中提取 MCP structuredContent.input。
 * MCP 3.3.2+ 在工具返回 JSON 中附带完整 rawInput；平台 SSE 的 result.input 可能仍是 agent 原始参数。
 */
export function extractMcpAskStructuredInputFromResult(
  result?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const data = result?.data;
  if (!Array.isArray(data)) {
    return undefined;
  }

  for (const item of data) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const entry = item as Record<string, unknown>;
    const content = entry.content as Record<string, unknown> | undefined;
    if (content?.type !== 'text' || typeof content.text !== 'string') {
      continue;
    }

    try {
      const parsed = JSON.parse(content.text) as Record<string, unknown>;
      const input = parsed.input;
      if (input && typeof input === 'object' && Object.keys(input).length > 0) {
        return input as Record<string, unknown>;
      }
    } catch {
      // 非 JSON 文本，跳过
    }
  }

  return undefined;
}
