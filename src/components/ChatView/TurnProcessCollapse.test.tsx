import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TurnProcessCollapse from './TurnProcessCollapse';

let density: 'compact' | 'normal' | 'detailed' = 'normal';

vi.mock('@/hooks/useConversationDensity', () => ({
  useConversationDensity: () => ({ density }),
}));
vi.mock('@/hooks/useMarkdownRender', () => ({
  default: () => ({
    markdownRef: { current: null },
    messageIdRef: { current: 'process-markdown' },
  }),
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({ answer }: { answer: string }) => (
    <div data-testid="process-markdown">{answer}</div>
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) =>
    ({
      'PC.Components.MarkdownRenderer.executedProcesses': '工具调用',
      'PC.Components.MarkdownRenderer.executionProcess': '执行过程',
      'PC.Components.TurnProcess.messages': '条消息',
      'PC.Components.TurnProcess.worked': '已工作',
      'PC.Components.TurnProcess.seconds': '秒',
      'PC.Components.TurnProcess.minutes': '分',
    }[key] || key),
}));
vi.mock('./turnProcessCollapse.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

describe('TurnProcessCollapse', () => {
  beforeEach(() => {
    density = 'normal';
  });

  it('normal 终态默认收起，标题展示工具、消息和耗时，支持键盘原生 button 交互', () => {
    render(
      <TurnProcessCollapse
        id="turn-1"
        markdown="过程正文"
        isTerminal
        metrics={{
          toolCallCount: 3,
          messageCount: 2,
          startedAt: 1000,
          endedAt: 62000,
        }}
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('3 工具调用 · 2 条消息 · 已工作 1分 1秒');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('detailed 默认展开，compact 即使运行中也默认收起', () => {
    density = 'detailed';
    const { unmount } = render(
      <TurnProcessCollapse
        id="turn-detailed"
        markdown="过程"
        isTerminal
        metrics={{ toolCallCount: 0, messageCount: 1 }}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    unmount();

    density = 'compact';
    render(
      <TurnProcessCollapse
        id="turn-compact"
        markdown="过程"
        isTerminal={false}
        metrics={{ toolCallCount: 0, messageCount: 1 }}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
