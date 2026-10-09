import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
import { resetDesktopShellPreviewRuntimeForTest } from '@/utils/desktopShellPreview';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToolNodeDetail from './ToolNodeDetail';

vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ data: { antdTheme: 'light' } }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/MarkdownRenderer', () => ({
  PureMarkdownRenderer: ({ children }: { children: string }) => children,
}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const browserNode = (url: string): ConversationProcessNode => ({
  id: 'browser-1',
  kind: 'tool',
  title: 'browser',
  summary: '',
  status: 'finished',
  failed: false,
  processing: {
    result: { input: { url } },
  } as ConversationProcessNode['processing'],
});

describe('ToolNodeDetail URL links', () => {
  const originalBridge = window.NuwaClawBridge;

  afterEach(() => {
    cleanup();
    window.NuwaClawBridge = originalBridge;
    resetDesktopShellPreviewRuntimeForTest();
  });

  it('opens known business pages through the commercial host for modified, middle and keyboard clicks', async () => {
    const openWindow = vi.fn().mockResolvedValue({ success: true });
    (window as any).NuwaClawBridge = {
      host: { getProduct: () => 'nuwax' },
      native: { openWindow },
    };
    const url = `${window.location.origin}/space/1/agent/2`;
    render(<ToolNodeDetail node={browserNode(url)} />);
    const link = screen.getByRole('link', { name: url });

    expect(fireEvent.click(link, { metaKey: true })).toBe(false);
    expect(
      link.dispatchEvent(
        new MouseEvent('auxclick', {
          button: 1,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ).toBe(false);
    expect(fireEvent.click(link)).toBe(false);
    link.focus();
    await userEvent.keyboard('{Enter}');
    expect(openWindow).toHaveBeenCalledTimes(4);
    expect(openWindow).toHaveBeenCalledWith(url);
  });

  it('keeps external links and community-host links on native anchor behavior', () => {
    const openWindow = vi.fn().mockResolvedValue({ success: true });
    (window as any).NuwaClawBridge = {
      host: { getProduct: () => 'nuwaclaw' },
      native: { openWindow },
    };
    const url = `${window.location.origin}/space/1/agent/2`;
    const { rerender } = render(<ToolNodeDetail node={browserNode(url)} />);
    expect(fireEvent.click(screen.getByRole('link', { name: url }))).toBe(true);

    (window as any).NuwaClawBridge = {
      host: { getProduct: () => 'nuwax' },
      native: { openWindow },
    };
    rerender(
      <ToolNodeDetail
        node={browserNode('https://outside.example/space/1/agent/2')}
      />,
    );
    expect(
      fireEvent.click(screen.getByRole('link', { name: /outside.example/ })),
    ).toBe(true);
    expect(openWindow).not.toHaveBeenCalled();
  });
});
