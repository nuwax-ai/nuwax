import { dict } from '@/services/i18nRuntime';
import type { OpenUiAction, OpenUiFile } from '@/types/interfaces/openUi';

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

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

export function buildOpenUiResumeMessage(
  artifact: OpenUiFile,
  action: OpenUiAction,
): string {
  const normalizedAction = normalizeValue(
    action,
    new WeakSet(),
  ) as OpenUiAction;
  const summary = dict('PC.Components.OpenUi.actionSubmitted', artifact.title);
  return `${summary}\n\n\`\`\`json\n${JSON.stringify(
    normalizedAction,
    null,
    2,
  )}\n\`\`\`\n\n<!--nuwax-openui-action-id:${action.actionId}-->`;
}
