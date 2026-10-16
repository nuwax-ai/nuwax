import { describe, expect, it, vi } from 'vitest';
import { extractPlanDocument } from './index';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => {
    const dict: Record<string, string> = {
      'PC.Components.MarkdownCustomPlanDoc.title': '计划文档',
      'PC.Components.MarkdownCustomPlanDoc.planFile': '计划文件',
    };
    return dict[key] ?? key;
  },
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_: any, key: string) => String(key) }),
}));

vi.mock('ds-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="plan-markdown">{children}</div>
  ),
}));

vi.mock('ds-markdown/plugins', () => ({ katexPlugin: {} }));

describe('extractPlanDocument', () => {
  const plan = '# 计划\n\n1. 步骤一';

  it('extracts from result.kind + input as rawInput shape', () => {
    expect(
      extractPlanDocument({
        kind: 'switch_mode',
        input: { plan, planFilePath: '/tmp/plan.md' },
      }),
    ).toEqual({ plan, planFilePath: '/tmp/plan.md' });
  });

  it('extracts from input { kind, rawInput } wrapper shape', () => {
    expect(
      extractPlanDocument({
        input: {
          kind: 'switch_mode',
          rawInput: { plan, planFilePath: '/a/b.md' },
        },
      }),
    ).toEqual({ plan, planFilePath: '/a/b.md' });
  });

  it('extracts from bare rawInput with kind on input only', () => {
    expect(
      extractPlanDocument({ input: { kind: 'switch_mode', plan } }),
    ).toEqual({ plan, planFilePath: undefined });
  });

  it('returns null for non switch_mode kinds', () => {
    expect(
      extractPlanDocument({ kind: 'edit', input: { file_path: '/x' } }),
    ).toBeNull();
    expect(
      extractPlanDocument({ input: { kind: 'execute', rawInput: {} } }),
    ).toBeNull();
  });

  it('returns null for missing/blank plan or non-object input', () => {
    expect(extractPlanDocument({ kind: 'switch_mode', input: {} })).toBeNull();
    expect(
      extractPlanDocument({ kind: 'switch_mode', input: { plan: '   ' } }),
    ).toBeNull();
    expect(extractPlanDocument(null)).toBeNull();
    expect(extractPlanDocument('text')).toBeNull();
  });
});
