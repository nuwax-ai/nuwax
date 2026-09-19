import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 重依赖 mock 照 tests/conversation/toolNodeDetailComponent.test.tsx 模板:
// umi / MarkdownRenderer 传递依赖会拉进 esbuild,vitest 环境必崩,须替换。
vi.mock('umi', () => ({
  useModel: () => ({}),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({ answer }: { answer: string }) => (
    <div data-testid="markdown-renderer">{answer}</div>
  ),
  PureMarkdownRenderer: ({ children }: { children: string }) => (
    <div data-testid="pure-markdown">{children}</div>
  ),
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

const SUMMARY_TEXT = 'Wait — but there is a subtlety: getToolNodePresentation';

const buildReasoningNode = (status: 'running' | 'finished') =>
  ({
    id: `think-${status}`,
    kind: 'reasoning',
    title: '',
    summary: SUMMARY_TEXT,
    thinkText: `${SUMMARY_TEXT}\n第二行展开全文`,
    status,
    failed: false,
  } as any);

describe('V2 思考行运行中 ticker', () => {
  it('运行中:标题切「正在思考」词条,摘要渲染为点分隔的贴尾滚动视口', () => {
    render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={buildReasoningNode('running')}
      />,
    );

    const row = screen.getByRole('button');
    expect(row.textContent).toContain(
      'PC.Components.ConversationRendererV2.nodeTitleReasoningRunning',
    );
    const ticker = document.querySelector(
      '[data-testid="v2-node-summary-ticker"]',
    );
    expect(ticker).not.toBeNull();
    // 视口放全量思考文本(换行摊平成一行),贴尾滚动才能持续追到最新追加的文字,
    // 而非停在冻结的首行摘要上
    expect(ticker?.querySelector('.node-summary-ticker-text')).not.toBeNull();
    expect(ticker?.textContent).toContain('getToolNodePresentation');
    expect(ticker?.textContent).toContain('第二行展开全文');
    expect(row.querySelector('.node-dot')).not.toBeNull();
  });

  it('结束态:回「思考」静态摘要行,不再渲染 ticker 与点分隔', () => {
    render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={buildReasoningNode('finished')}
      />,
    );

    const row = screen.getByRole('button');
    expect(row.textContent).toContain(
      'PC.Components.ConversationRendererV2.nodeTitleReasoning',
    );
    expect(row.textContent).not.toContain('nodeTitleReasoningRunning');
    expect(
      document.querySelector('[data-testid="v2-node-summary-ticker"]'),
    ).toBeNull();
    // 静态摘要回退为首行,不再含后续行
    expect(row.textContent).toContain('getToolNodePresentation');
    expect(row.textContent).not.toContain('第二行展开全文');
  });
});
