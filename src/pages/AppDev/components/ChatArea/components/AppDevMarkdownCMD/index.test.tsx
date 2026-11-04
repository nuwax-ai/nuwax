import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

const appearance = vi.hoisted(() => ({ mode: 'light' }));
vi.mock('@/features/themes/useAppTheme', () => ({
  useAppTheme: () => appearance,
}));
vi.mock('../../genAppDevPlugin', () => ({ default: () => ({}) }));
vi.mock('@/components/MarkdownRenderer/index.less', () => ({
  default: { 'markdown-container': 'markdown-container' },
}));
vi.mock('@/components/MarkdownRenderer/getMarkdownLocale', () => ({
  getSafeCurrentLang: () => 'zh-CN',
  getMarkdownLocale: () => ({}),
}));
vi.mock('ds-markdown', async () => {
  const React = await import('react');
  return {
    ConfigProvider: ({ children }: any) => children,
    MarkdownCMD: React.forwardRef(({ theme }: any, ref) => {
      const [content, setContent] = React.useState('');
      React.useImperativeHandle(
        ref,
        () => ({
          push: (text: string) => setContent((previous) => previous + text),
        }),
        [],
      );
      return (
        <pre data-testid="stream" data-theme={theme}>
          {content}
        </pre>
      );
    }),
  };
});

import AppDevMarkdownCMD from '.';

describe('AppDev streamed output appearance', () => {
  it('changes theme without replacing the stream and accepts subsequent chunks', () => {
    const ref = createRef<any>();
    const props = { id: 'message', requestId: 'request', ref };
    appearance.mode = 'light';
    const view = render(<AppDevMarkdownCMD {...props} />);
    act(() => ref.current.push('before'));
    const stream = ref.current;
    const element = screen.getByTestId('stream');

    appearance.mode = 'dark';
    view.rerender(<AppDevMarkdownCMD {...props} />);
    expect(screen.getByTestId('stream')).toBe(element);
    expect(element.getAttribute('data-theme')).toBe('dark');
    expect(ref.current).toBe(stream);
    expect(element.textContent).toBe('before');
    act(() => ref.current.push(' after'));
    expect(element.textContent).toBe('before after');

    view.rerender(<AppDevMarkdownCMD {...props} theme="light" />);
    expect(element.getAttribute('data-theme')).toBe('light');
    expect(element.textContent).toBe('before after');
  });
});
