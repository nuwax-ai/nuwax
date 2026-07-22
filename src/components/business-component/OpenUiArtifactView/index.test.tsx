import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OpenUiArtifactView from './index';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const baseArtifact: OpenUiArtifact = {
  type: 'nuwax.openui',
  schemaVersion: 'nuwax.openui/v1',
  artifactId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Deployment summary',
  presentation: { mode: 'inline', autoOpen: false },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source:
      'root = Stack([title, status])\ntitle = TextContent("Deployment", "large-heavy")\nstatus = Callout("success", "Ready", "Deployment completed successfully.")',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  bindings: { tools: [] },
  fallback: { markdown: 'Deployment is ready.' },
  createdAt: '2026-07-21T08:00:00.000Z',
  expiresAt: '2099-07-21T09:00:00.000Z',
};

describe('OpenUiArtifactView', () => {
  it('renders inline content with the Renderer by default', async () => {
    render(<OpenUiArtifactView artifact={baseArtifact} />);

    await waitFor(() => {
      expect(screen.getByText('Deployment')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
    expect(
      document.querySelector('[data-openui-render-mode="renderer"]'),
    ).toBeInTheDocument();
  });

  it('supports the conversation-scoped Runtime iframe for inline content', async () => {
    const runtimeUrl = `/computer/desktop/2336/openui/pages/${baseArtifact.artifactId}`;
    render(
      <OpenUiArtifactView
        artifact={baseArtifact}
        runtimeUrl={runtimeUrl}
        inlineRenderMode="iframe"
      />,
    );

    const frame = screen.getByTitle(baseArtifact.title) as HTMLIFrameElement;
    expect(frame).toHaveAttribute('src', runtimeUrl);
    expect(
      screen.getByText('PC.Components.OpenUi.loading'),
    ).toBeInTheDocument();

    fireEvent(
      window,
      new MessageEvent('message', {
        origin: window.location.origin,
        source: frame.contentWindow,
        data: {
          type: 'OPENUI_READY',
          protocolVersion: 'nuwax.openui-page/v1',
          artifactId: baseArtifact.artifactId,
        },
      }),
    );
    await waitFor(() => {
      expect(
        screen.queryByText('PC.Components.OpenUi.loading'),
      ).not.toBeInTheDocument();
    });
  });

  it('opens a sidecar artifact from the existing tool body', () => {
    const onOpenSidecar = vi.fn();
    const sidecarArtifact: OpenUiArtifact = {
      ...baseArtifact,
      presentation: { mode: 'sidecar', autoOpen: false },
      page: {
        url: 'http://127.0.0.1:8787/openui/pages/550e8400-e29b-41d4-a716-446655440000',
        expiresAt: baseArtifact.expiresAt,
        sandboxProfile: 'openui-sidecar-v1',
      },
    };

    render(
      <OpenUiArtifactView
        artifact={sidecarArtifact}
        runtimeUrl={`/computer/desktop/2336/openui/pages/${sidecarArtifact.artifactId}`}
        onOpenSidecar={onOpenSidecar}
      />,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(onOpenSidecar).toHaveBeenCalledWith(sidecarArtifact);
  });
});
