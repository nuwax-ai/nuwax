import { describe, expect, it } from 'vitest';
import type { InteractionUiSchema } from '../types/mcpAskIntervention';
import {
  getInteractionSteps,
  isWizardPresentation,
  parseInteractionFields,
} from './parseMcpAskSchema';

const v2 = (
  overrides: Partial<InteractionUiSchema> = {},
): InteractionUiSchema =>
  ({
    version: 'nuwax.interaction.v2',
    presentation: 'inline',
    title: 'Ask',
    ...overrides,
  } as InteractionUiSchema);

describe('parseInteractionFields (v2)', () => {
  it('maps fields[] in array order with merged options', () => {
    const fields = parseInteractionFields(
      v2({
        fields: [
          { name: 'remark', title: '备注', widget: 'textarea' },
          {
            name: 'choice',
            title: '继续方式',
            widget: 'radio',
            required: true,
            options: [
              { value: 'a', label: '甲' },
              { value: 'b', label: '乙' },
            ],
          },
        ],
      }),
    );

    expect(fields).toMatchObject([
      { name: 'remark', widget: 'textarea', required: false },
      {
        name: 'choice',
        widget: 'radio',
        required: true,
        enumValues: ['a', 'b'],
        enumLabels: ['甲', '乙'],
      },
    ]);
  });

  it('rebuilds JsonSchema constraint view from v2 field', () => {
    const [field] = parseInteractionFields(
      v2({
        fields: [
          {
            name: 'count',
            title: '并发数',
            widget: 'number',
            type: 'integer',
            minimum: 1,
            maximum: 10,
            multipleOf: 2,
          },
        ],
      }),
    );
    expect(field.property).toMatchObject({
      title: '并发数',
      type: 'integer',
      minimum: 1,
      maximum: 10,
      multipleOf: 2,
    });
  });

  it('carries placeholder/accept/multiple into options', () => {
    const [field] = parseInteractionFields(
      v2({
        fields: [
          {
            name: 'screenshot',
            title: '截图',
            widget: 'file',
            accept: 'image/*',
            multiple: true,
            placeholder: '上传图片',
          },
        ],
      }),
    );
    expect(field.options).toMatchObject({
      accept: 'image/*',
      multiple: true,
      placeholder: '上传图片',
    });
  });

  it('falls back unknown widget to text', () => {
    const [field] = parseInteractionFields(
      v2({
        fields: [{ name: 'x', title: 'X', widget: 'bogus' } as never],
      }),
    );
    expect(field.widget).toBe('text');
  });

  it('filters by fieldNames (wizard step) in the given order', () => {
    const fields = parseInteractionFields(
      v2({
        presentation: 'wizard',
        fields: [
          { name: 'a', title: 'A', widget: 'text' },
          { name: 'b', title: 'B', widget: 'text' },
          { name: 'c', title: 'C', widget: 'text' },
        ],
      }),
      ['c', 'a'],
    );
    expect(fields.map((f) => f.name)).toEqual(['c', 'a']);
  });

  it('returns [] when no fields', () => {
    expect(parseInteractionFields(v2())).toEqual([]);
  });
});

describe('getInteractionSteps / isWizardPresentation (v2)', () => {
  it('returns ui.steps when provided', () => {
    const ui = v2({
      presentation: 'wizard',
      fields: [{ name: 'a', title: 'A', widget: 'text' }],
      steps: [{ id: 's1', title: '步骤一', fields: ['a'] }],
    });
    expect(getInteractionSteps(ui)).toMatchObject([
      { id: 's1', fields: ['a'] },
    ]);
    expect(isWizardPresentation(ui)).toBe(true);
  });

  it('builds a default single step from fields[]', () => {
    const ui = v2({
      fields: [
        { name: 'a', title: 'A', widget: 'text' },
        { name: 'b', title: 'B', widget: 'text' },
      ],
    });
    expect(getInteractionSteps(ui)).toMatchObject([
      { id: 'default', fields: ['a', 'b'] },
    ]);
  });

  it('returns [] when no fields and no steps', () => {
    expect(getInteractionSteps(v2())).toEqual([]);
  });
});
