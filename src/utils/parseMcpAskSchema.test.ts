import type { InteractionUiSchema } from '@/types/interfaces/mcpAskIntervention';
import { describe, expect, it } from 'vitest';
import { parseInteractionFields } from './parseMcpAskSchema';

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
