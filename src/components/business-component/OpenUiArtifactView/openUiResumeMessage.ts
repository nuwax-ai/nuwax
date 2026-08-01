import { dict } from '@/services/i18nRuntime';
import type {
  OpenUiAction,
  OpenUiActionArtifact,
} from '@/types/interfaces/openUi';

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const OPEN_UI_ACTION_ID_HTML_COMMENT_RE =
  /\n?<!--nuwax-openui-action-id:[^>]+-->/g;

function normalizeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Date) return value.toISOString();
  if (
    value === undefined ||
    typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    return undefined;
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, seen));
  }
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (BLOCKED_KEYS.has(key)) continue;
    const normalized = normalizeValue(nested, seen);
    if (normalized !== undefined) result[key] = normalized;
  }
  return result;
}

function unwrapControlValue(value: unknown): unknown {
  let current = value;
  const visited = new Set<object>();
  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    !visited.has(current)
  ) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, 'value')) break;
    current = record.value;
  }
  return current;
}

function formatDisplayValue(value: unknown): string {
  const current = unwrapControlValue(value);
  if (current === null) return 'null';
  if (Array.isArray(current)) {
    return current.map(formatDisplayValue).join('、');
  }
  if (current && typeof current === 'object') {
    return Object.entries(current as Record<string, unknown>)
      .map(([key, nested]) => `${key}：${formatDisplayValue(nested)}`)
      .join('，');
  }
  return String(current ?? '');
}

function flattenActionValues(
  values: Record<string, unknown>,
  formName?: string,
): string[] {
  const formValues =
    formName &&
    values[formName] &&
    typeof values[formName] === 'object' &&
    !Array.isArray(values[formName])
      ? (values[formName] as Record<string, unknown>)
      : values;
  const lines: string[] = [];

  const visit = (record: Record<string, unknown>, prefix = '') => {
    Object.entries(record).forEach(([key, rawValue]) => {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const value = unwrapControlValue(rawValue);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length) {
          visit(value as Record<string, unknown>, fieldName);
          return;
        }
      }
      lines.push(`${fieldName}：${formatDisplayValue(value)}`);
    });
  };

  visit(formValues);
  return lines;
}

function normalizeUserPerspective(message: string): string {
  return message
    .replace(/^用户已提交(?=[\s，。！？!]|$)/, '我已提交')
    .replace(/^用户提交(?=[\s，。！？!]|了|$)/, '我提交');
}

/**
 * OpenUI actionId 不再拼入用户消息正文（避免泄露到发送给 LLM 的提示词）。
 * 幂等/关联改由结构化 action 通道 + 客户端 sentActionIds 去重负责。
 * 本函数仍剥离历史/回显消息里可能残留的标记，作为防御。
 */
export function stripOpenUiResumeDisplayArtifacts(
  text: string | undefined,
): string {
  if (!text) return '';
  return text
    .replace(OPEN_UI_ACTION_ID_HTML_COMMENT_RE, '')
    .replace(/\s+$/, '');
}

export function buildOpenUiResumeMessage(
  artifact: OpenUiActionArtifact,
  action: OpenUiAction,
): string {
  const normalizedAction = normalizeValue(
    action,
    new WeakSet(),
  ) as OpenUiAction;
  const summary =
    normalizeUserPerspective(action.humanFriendlyMessage?.trim() || '') ||
    dict('PC.Components.OpenUi.actionSubmitted', artifact.title);
  const fieldLines = flattenActionValues(
    normalizedAction.values,
    normalizedAction.formName,
  );
  return [summary, ...fieldLines].join('\n');
}
