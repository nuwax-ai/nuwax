import { describe, expect, it } from 'vitest';
import {
  getMcpAskComponentInput,
  isMcpAskFailedComponent,
  resolveMcpAskHydratedResponseStatus,
} from './mcpAskExecutedComponent';

describe('mcpAskExecutedComponent', () => {
  // 对齐历史接口：result.data 为 JSON 字符串且表单在 input 字段内时，仍应抽出 Ask schema。
  it('parses JSON-string result.data wrapper and returns nested input', () => {
    const askInput = {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwax.mcp_ask.v2',
      requestId: 'demo_1',
      ui: {
        version: 'nuwax.interaction.v2',
        presentation: 'inline',
        fields: [{ name: 'name', title: '称呼', widget: 'text' }],
      },
    };

    const input = getMcpAskComponentInput({
      status: 'FINISHED',
      result: {
        data: JSON.stringify({
          status: 'pending',
          requestId: 'demo_1',
          message: 'presented',
          input: askInput,
        }),
      },
    });

    expect(input).toMatchObject({ requestId: 'demo_1', ui: askInput.ui });
  });

  it('treats SUCCESS components as pending（是否已回答由后续 resume 消息决定）', () => {
    // component status(SUCCESS/FINISHED)只代表「问」完成,不代表用户已回答;
    // hydrate 默认 pending(交给 reconcile 按 resume 消息判 submitted),让历史最后一条 ASK_QUESTION 能恢复渲染
    expect(
      resolveMcpAskHydratedResponseStatus({
        status: 'SUCCESS',
        result: { success: true },
      }),
    ).toBe('pending');
  });

  it('treats EXECUTING components as pending', () => {
    expect(
      resolveMcpAskHydratedResponseStatus({
        status: 'EXECUTING',
      }),
    ).toBe('pending');
  });

  it('treats FAILED components as failed', () => {
    expect(
      isMcpAskFailedComponent({
        status: 'FAILED',
        result: { success: false },
      }),
    ).toBe(true);
  });
});
