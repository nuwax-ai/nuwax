import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarkdownCustomPlanDoc, { extractPlanDocument } from './index';

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

describe('MarkdownCustomPlanDoc', () => {
  const plan = '# 满江红 PPT 计划\n\n- 第一页封面\n- 第二页全文';

  it('renders plan markdown, title subtitle and plan file path', () => {
    render(
      <MarkdownCustomPlanDoc
        title="Ready to code?"
        plan={plan}
        planFilePath="/Users/x/.claude/plans/user-plan.md"
      />,
    );

    expect(screen.getByText('计划文档')).toBeTruthy();
    expect(screen.getByText('Ready to code?')).toBeTruthy();
    expect(screen.getByTestId('plan-markdown').textContent).toContain(
      '满江红 PPT 计划',
    );
    expect(screen.getByText(/user-plan\.md/)).toBeTruthy();
  });

  it('omits plan file row when path is absent', () => {
    render(<MarkdownCustomPlanDoc plan={plan} />);

    expect(screen.queryByText(/计划文件/)).toBeNull();
  });

  it('toggles collapse on header click', () => {
    render(<MarkdownCustomPlanDoc title="Ready to code?" plan={plan} />);

    expect(screen.getByTestId('plan-markdown')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '计划文档' }));
    expect(screen.queryByTestId('plan-markdown')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '计划文档' }));
    expect(screen.getByTestId('plan-markdown')).toBeTruthy();
  });
});
