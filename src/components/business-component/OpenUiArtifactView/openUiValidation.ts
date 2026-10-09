import { dict } from '@/services/i18nRuntime';
import { builtInValidators } from '@openuidev/react-lang';

type Validator = (value: unknown, arg?: number | string) => string | undefined;

const CONFIGURED_MARKER = Symbol.for('nuwax.openui.validation.configured');

const validationMessageKeys: Record<string, string> = {
  'This field is required': 'PC.Components.OpenUi.validationRequired',
  'At least one option is required':
    'PC.Components.OpenUi.validationOptionRequired',
  'Please enter a valid email': 'PC.Components.OpenUi.validationEmail',
  'Please enter a valid URL': 'PC.Components.OpenUi.validationUrl',
  'Must be a number': 'PC.Components.OpenUi.validationNumber',
  'Invalid format': 'PC.Components.OpenUi.validationPattern',
};

const isValidDate = (value: unknown): boolean =>
  value instanceof Date && !Number.isNaN(value.getTime());

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isValidDate(value)) return false;
  if (value instanceof Date) return true;
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  if ('value' in record) return isEmptyValue(record.value);
  if ('from' in record || 'to' in record) {
    return !isValidDate(record.from) || !isValidDate(record.to);
  }
  return Object.keys(record).length === 0;
};

const translateValidationMessage = (message: string): string => {
  const exactKey = validationMessageKeys[message];
  if (exactKey) return dict(exactKey);

  const dynamicMessages: Array<[RegExp, string]> = [
    [/^Must be at least (.+) characters$/, 'validationMinLength'],
    [/^Must be no more than (.+) characters$/, 'validationMaxLength'],
    [/^Must be at least (.+)$/, 'validationMin'],
    [/^Must be no more than (.+)$/, 'validationMax'],
  ];
  for (const [pattern, key] of dynamicMessages) {
    const matched = message.match(pattern);
    if (matched?.[1]) return dict(`PC.Components.OpenUi.${key}`, matched[1]);
  }
  return message;
};

const requiredValidator: Validator = (value) => {
  if (isEmptyValue(value)) {
    return dict('PC.Components.OpenUi.validationRequired');
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const values = Object.values(value);
    if (
      values.length > 0 &&
      values.every((item) => typeof item === 'boolean') &&
      !values.some(Boolean)
    ) {
      return dict('PC.Components.OpenUi.validationOptionRequired');
    }
  }
  return undefined;
};

export const configureOpenUiValidation = (): void => {
  const validators = builtInValidators as typeof builtInValidators & {
    [CONFIGURED_MARKER]?: boolean;
  };
  if (validators[CONFIGURED_MARKER]) return;

  const originalValidators = { ...builtInValidators };
  Object.entries(originalValidators).forEach(([name, validator]) => {
    if (name === 'required') return;
    builtInValidators[name] = (value, arg) => {
      const message = validator(value, arg);
      return message ? translateValidationMessage(message) : undefined;
    };
  });
  builtInValidators.required = requiredValidator;
  Object.defineProperty(validators, CONFIGURED_MARKER, { value: true });
};
