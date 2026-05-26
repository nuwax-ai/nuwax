import { describe, expect, it } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { buildMcpAskResumeMessage } from './mcpAskResumeMessage';

const baseInteraction: McpAskInteraction = {
  toolCallId: 'tc-1',
  input: {
    toolName: 'nuwax_ask_question',
    schemaVersion: 'nuwaclaw.mcp_ask.v1',
    requestId: 'ask-1',
    revision: 1,
    sessionId: 'session-1',
    title: '请选择继续方式',
    ui: {
      version: 'nuwaclaw.interaction.v1',
      presentation: 'inline',
      title: '请选择继续方式',
      schema: {
        type: 'object',
        properties: {
          choice: {
            type: 'string',
            title: '选项',
            enum: ['deploy', 'test', 'cancel'],
          },
          notes: {
            type: 'string',
            title: '补充说明',
          },
          checks: {
            type: 'array',
            title: '检查项',
            items: {
              type: 'string',
              enum: ['lint', 'unit'],
            },
          },
        },
        required: ['choice'],
      },
      uiSchema: {
        choice: {
          'ui:widget': 'radio',
          'ui:options': {
            enumNames: ['直接部署', '先跑测试', '取消任务'],
          },
        },
        checks: {
          'ui:widget': 'checkboxes',
          'ui:options': {
            enumNames: ['代码检查', '单元测试'],
          },
        },
      },
    },
  },
};

describe('buildMcpAskResumeMessage', () => {
  it('formats submitted answers as user-friendly label value lines', () => {
    const message = buildMcpAskResumeMessage(baseInteraction, {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: {
        choice: 'test',
        notes: '先跑关键链路',
        checks: ['lint', 'unit'],
      },
    });

    expect(message).toBe(
      [
        '我已填写「请选择继续方式」，表单内容如下：',
        '',
        '选项：先跑测试',
        '补充说明：先跑关键链路',
        '检查项：代码检查、单元测试',
      ].join('\n'),
    );
    expect(message).not.toContain('```json');
    expect(message).not.toContain('"choice"');
  });

  it('keeps unknown fields readable without JSON blocks', () => {
    const message = buildMcpAskResumeMessage(baseInteraction, {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: {
        confirmed: true,
        extra: { owner: 'alice', retry: 2 },
      },
    });

    expect(message).toContain('confirmed：是');
    expect(message).toContain('extra：owner: alice，retry: 2');
    expect(message).not.toContain('```json');
  });

  it('uses custom radio input as the field value', () => {
    const message = buildMcpAskResumeMessage(
      {
        ...baseInteraction,
        input: {
          ...baseInteraction.input,
          ui: {
            ...baseInteraction.input.ui,
            schema: {
              type: 'object',
              properties: {
                choice: {
                  type: 'string',
                  title: '选项',
                  enum: ['deploy', 'test'],
                },
              },
            },
            uiSchema: {
              choice: {
                'ui:widget': 'radio-with-custom',
                'ui:options': {
                  enumNames: ['直接部署', '先跑测试'],
                  otherField: 'choiceOther',
                },
              },
            },
          },
        },
      },
      {
        interventionId: 'ask-1',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          choice: '__custom__',
          choiceOther: '先发灰度环境',
        },
      },
    );

    expect(message).toContain('选项：先发灰度环境');
    expect(message).not.toContain('__custom__');
    expect(message).not.toContain('choiceOther');
  });
});
