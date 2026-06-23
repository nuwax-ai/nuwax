import { describe, expect, it } from 'vitest';
import { extractMcpAskStructuredInputFromResult } from './extractMcpAskStructuredInput';

describe('extractMcpAskStructuredInputFromResult', () => {
  it('extracts canonical input from MCP structuredContent text block', () => {
    const input = extractMcpAskStructuredInputFromResult({
      data: [
        {
          type: 'content',
          content: {
            type: 'text',
            text: JSON.stringify({
              status: 'pending',
              requestId: 'weather-plan-confirm-5',
              revision: 1,
              message: 'presented',
              input: {
                toolName: 'nuwax_ask_question',
                schemaVersion: 'nuwax.mcp_ask.v1',
                requestId: 'weather-plan-confirm-5',
                revision: 1,
                sessionId: 'weather-dev',
                title: '确认方案',
                ui: {
                  version: 'nuwax.interaction.v1',
                  presentation: 'modal',
                  title: '确认方案',
                  schema: { type: 'object', properties: {} },
                },
              },
            }),
          },
        },
      ],
    });

    expect(input?.schemaVersion).toBe('nuwax.mcp_ask.v1');
    expect(input?.requestId).toBe('weather-plan-confirm-5');
  });
});
