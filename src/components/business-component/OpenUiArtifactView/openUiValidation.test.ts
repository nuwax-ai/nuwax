import { validate } from '@openuidev/react-lang';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { configureOpenUiValidation } from './openUiValidation';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: Array<string | number>) => {
    const messages: Record<string, string> = {
      'PC.Components.OpenUi.validationRequired': '该项为必填项',
      'PC.Components.OpenUi.validationEmail': '请输入有效的邮箱地址',
    };
    return values.reduce(
      (text, value, index) => text.replace(`{${index}}`, String(value)),
      messages[key] || key,
    );
  },
}));

describe('OpenUI validation adapter', () => {
  beforeAll(() => {
    configureOpenUiValidation();
  });

  it('treats a valid Date selected by OpenUI DatePicker as non-empty', () => {
    expect(validate(new Date('2026-07-22'), [{ type: 'required' }])).toBe(
      undefined,
    );
  });

  it('localizes built-in validation errors through Nuwax i18n', () => {
    expect(validate('', [{ type: 'required' }])).toBe('该项为必填项');
    expect(validate('invalid', [{ type: 'email' }])).toBe(
      '请输入有效的邮箱地址',
    );
  });
});
