import TerminalOutputView from '@/components/MarkdownCustomProcess/TerminalOutputView';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// less 映射为「类名即 key」，便于断言 is-preview 等状态类
vi.mock('@/components/MarkdownCustomProcess/index.less', () => ({
  default: new Proxy({}, { get: (_t, key: string) => key }),
}));

const containerClassNameOf = () => {
  const pre = document.querySelector('pre[class*="terminal-output-text"]');
  return pre?.parentElement?.className || '';
};

describe('TerminalOutputView', () => {
  it('preview 模式只保留尾部 6 行', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line-${i}`);
    render(<TerminalOutputView content={lines.join('\n')} mode="preview" />);
    expect(screen.getByText(/line-9/)).toBeInTheDocument();
    expect(screen.queryByText(/line-3/)).not.toBeInTheDocument();
    expect(containerClassNameOf()).toContain('is-preview');
  });

  it('full 模式输出全量文本并去掉尾部空行', () => {
    render(<TerminalOutputView content={'npm ok\n\n'.repeat(1)} mode="full" />);
    expect(screen.getByText('npm ok')).toBeInTheDocument();
    expect(containerClassNameOf()).not.toContain('is-preview');
  });

  it('空内容不渲染', () => {
    const { container } = render(
      <TerminalOutputView content="" mode="preview" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('内容更新时 preview 滚动到底部（最新输出可见）', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line-${i}`);
    const { rerender } = render(
      <TerminalOutputView content={lines.join('\n')} mode="preview" />,
    );
    const pre = screen.getByText(/line-19/).closest('pre')!;
    // jsdom 无布局，scrollTop 直接写读验证自动跟随逻辑挂接
    pre.scrollTop = 0;
    rerender(
      <TerminalOutputView
        content={[...lines, 'line-20'].join('\n')}
        mode="preview"
      />,
    );
    expect(pre.scrollTop).toBe(pre.scrollHeight);
  });

  it('full 模式超长输出截断保留尾部 500 行', () => {
    const lines = Array.from({ length: 600 }, (_, i) => `line-${i}`);
    render(<TerminalOutputView content={lines.join('\n')} mode="full" />);
    const pre = screen.getByText(/line-599/).closest('pre')!;
    const rendered = pre.textContent!.split('\n');
    expect(rendered).toHaveLength(500);
    expect(rendered[0]).toBe('line-100');
    expect(rendered[rendered.length - 1]).toBe('line-599');
  });
});
