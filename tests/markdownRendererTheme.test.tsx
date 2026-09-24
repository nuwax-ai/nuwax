import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('ds-markdown', async () => {
  const React = await import('react');
  return {
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    ConfigProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    MarkdownCMD: React.forwardRef(
      ({ theme }: { theme: 'light' | 'dark' }, _ref) => {
        void _ref;
        return <div data-testid="markdown-cmd" data-theme={theme} />;
      },
    ),
  };
});
vi.mock('ds-markdown/plugins', () => ({ katexPlugin: {} }));
vi.mock('@/plugins/ds-markdown-mermaid-plugin', () => ({
  default: {},
  mermaidConfig: {},
}));
vi.mock('@/components/MarkdownRenderer/genCustomPlugin', () => ({
  default: () => ({}),
}));
vi.mock('@/components/MarkdownRenderer/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

describe('MarkdownRenderer 主题切换', () => {
  it('回答内容不变时仍将新的明暗主题传给 MarkdownCMD', () => {
    const markdownRef = React.createRef<MarkdownCMDRef>();
    const { rerender } = render(
      <MarkdownRenderer
        id="answer-1"
        markdownRef={markdownRef}
        answer="已完成的回答"
        theme="light"
      />,
    );
    expect(screen.getByTestId('markdown-cmd')).toHaveAttribute(
      'data-theme',
      'light',
    );

    rerender(
      <MarkdownRenderer
        id="answer-1"
        markdownRef={markdownRef}
        answer="已完成的回答"
        theme="dark"
      />,
    );
    expect(screen.getByTestId('markdown-cmd')).toHaveAttribute(
      'data-theme',
      'dark',
    );
  });
});
