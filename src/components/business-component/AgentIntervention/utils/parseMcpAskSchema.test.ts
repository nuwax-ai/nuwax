import { describe, expect, it } from 'vitest';
import type { InteractionUiSchema } from '../types/mcpAskIntervention';
import {
  parseInteractionFields,
  resolveFieldWidget,
} from './parseMcpAskSchema';

describe('parseInteractionFields', () => {
  it('parses fields from a normal JSON schema', () => {
    const fields = parseInteractionFields({
      version: 'nuwaclaw.interaction.v1',
      presentation: 'wizard',
      title: 'Ask',
      schema: {
        type: 'object',
        required: ['thesisTitle'],
        properties: {
          thesisTitle: { type: 'string', title: '论文题目' },
        },
      },
    } as InteractionUiSchema);

    expect(fields).toMatchObject([
      {
        name: 'thesisTitle',
        required: true,
        widget: 'text',
      },
    ]);
  });

  it('tolerates schema metadata nested under properties', () => {
    const fields = parseInteractionFields(
      {
        version: 'nuwaclaw.interaction.v1',
        presentation: 'wizard',
        title: 'Ask',
        schema: {
          type: 'object',
          properties: {
            thesisTitle: { type: 'string', title: '论文题目' },
            defenseDuration: {
              type: 'string',
              title: '答辩时长',
              enum: ['10分钟', '15分钟'],
            },
            required: ['thesisTitle'],
            uiSchema: {
              defenseDuration: { 'ui:widget': 'radio' },
            },
          },
        },
      } as unknown as InteractionUiSchema,
      ['thesisTitle', 'defenseDuration'],
    );

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      name: 'thesisTitle',
      required: true,
      widget: 'text',
    });
    expect(fields[1]).toMatchObject({
      name: 'defenseDuration',
      required: false,
      widget: 'radio',
      enumValues: ['10分钟', '15分钟'],
    });
  });

  it('tolerates an extra schema wrapper', () => {
    const fields = parseInteractionFields(
      {
        version: 'nuwaclaw.interaction.v1',
        presentation: 'wizard',
        title: 'Ask',
        schema: {
          schema: {
            type: 'object',
            required: ['major'],
            properties: {
              major: { type: 'string', title: '专业方向' },
            },
          },
        },
      } as unknown as InteractionUiSchema,
      ['major'],
    );

    expect(fields).toMatchObject([
      {
        name: 'major',
        required: true,
      },
    ]);
  });
});

describe('resolveFieldWidget', () => {
  it('resolves file widget from ui:widget', () => {
    const widget = resolveFieldWidget(
      'screenshot',
      { type: 'string', format: 'data-url', title: '截图' },
      { screenshot: { 'ui:widget': 'file' } },
    );
    expect(widget).toBe('file');
  });

  it('resolves list widget from ui:widget', () => {
    const widget = resolveFieldWidget(
      'framework',
      { type: 'string', enum: ['react', 'vue', 'angular'], title: '框架' },
      { framework: { 'ui:widget': 'list' } },
    );
    expect(widget).toBe('list');
  });

  it('auto-detects checkboxes for array with enum items', () => {
    const widget = resolveFieldWidget(
      'features',
      {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b', 'c'] },
        title: '功能',
      },
      undefined,
    );
    expect(widget).toBe('checkboxes');
  });

  it('auto-detects radio for enum', () => {
    const widget = resolveFieldWidget(
      'choice',
      { type: 'string', enum: ['a', 'b'], title: '选择' },
      undefined,
    );
    expect(widget).toBe('radio');
  });

  it('resolves number widget from ui:widget', () => {
    const widget = resolveFieldWidget(
      'age',
      { type: 'integer', title: '年龄', minimum: 0 },
      { age: { 'ui:widget': 'number' } },
    );
    expect(widget).toBe('number');
  });

  it('auto-detects number for integer type', () => {
    const widget = resolveFieldWidget(
      'count',
      { type: 'integer', title: '数量' },
      undefined,
    );
    expect(widget).toBe('number');
  });

  it('auto-detects number for number type', () => {
    const widget = resolveFieldWidget(
      'score',
      { type: 'number', title: '分数', minimum: 0, maximum: 100 },
      undefined,
    );
    expect(widget).toBe('number');
  });

  it('auto-detects number for integer union type', () => {
    const widget = resolveFieldWidget(
      'count',
      { type: ['integer', 'null'], title: '数量' },
      undefined,
    );
    expect(widget).toBe('number');
  });
});
