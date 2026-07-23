import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { legacyArtifactToOpenUiFile } from '@/utils/openUiArtifact';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OpenUiArtifactView, { OpenUiRuntimeFrame } from './index';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@openuidev/react-lang', () => ({
  Renderer: ({ response }: { response: string }) => (
    <div data-testid="openui-renderer" data-response={response} />
  ),
}));
vi.mock('@openuidev/react-ui/genui-lib', () => ({ openuiLibrary: {} }));
vi.mock('@openuidev/react-ui', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
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
    source: 'root = TextContent("Ready", "large-heavy")',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  bindings: { tools: [] },
  fallback: { markdown: 'Deployment is ready.' },
  createdAt: '2026-07-21T08:00:00.000Z',
  expiresAt: '2099-07-21T09:00:00.000Z',
};

describe('OpenUiArtifactView', () => {
  it('uses the original Renderer for legacy inline artifacts', () => {
    const { container } = render(
      <OpenUiArtifactView artifact={baseArtifact} />,
    );
    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
    expect(
      container.querySelector('[data-openui-render-mode="renderer"]'),
    ).toHaveAttribute('data-openui-theme', 'light');
  });

  it('uses tool input with the original Renderer for file-reference inline artifacts', () => {
    const reference: OpenUiArtifact = {
      type: 'nuwax.openui-ref',
      schemaVersion: 'nuwax.openui-ref/v1',
      artifactId: baseArtifact.artifactId,
      path: `data/${baseArtifact.artifactId}.openui.json`,
      title: baseArtifact.title,
      presentation: baseArtifact.presentation,
      digest: baseArtifact.document.digest,
      operation: 'created',
    };
    render(
      <OpenUiArtifactView
        artifact={reference}
        inlineInput={{
          schemaVersion: 'nuwax.openui/v1',
          title: baseArtifact.title,
          presentation: baseArtifact.presentation,
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source: baseArtifact.document.source,
          },
          bindings: { tools: [] },
          fallback: baseArtifact.fallback,
        }}
      />,
    );
    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
  });

  it('uses tool input when the transport omitted the artifact reference', () => {
    render(
      <OpenUiArtifactView
        inlineArtifactId="call-inline"
        inlineInput={{
          schemaVersion: 'nuwax.openui/v1',
          title: baseArtifact.title,
          presentation: baseArtifact.presentation,
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source: baseArtifact.document.source,
          },
          bindings: { tools: [] },
          fallback: baseArtifact.fallback,
        }}
      />,
    );

    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
  });

  it('opens sidecar artifacts through the host preview callback', () => {
    const onOpenSidecar = vi.fn();
    const sidecar = {
      ...baseArtifact,
      presentation: { mode: 'sidecar' as const, autoOpen: false },
    };
    render(
      <OpenUiArtifactView artifact={sidecar} onOpenSidecar={onOpenSidecar} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenSidecar).toHaveBeenCalledWith(sidecar);
  });

  it('always loads the iframe Runtime with the light theme', () => {
    const { container } = render(
      <OpenUiRuntimeFrame
        artifact={legacyArtifactToOpenUiFile(baseArtifact)}
      />,
    );
    const frame = container.querySelector('iframe');
    expect(frame?.contentWindow).toBeTruthy();
    const postMessage = vi.spyOn(frame!.contentWindow!, 'postMessage');

    fireEvent.load(frame!);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPENUI_LOAD', theme: 'light' }),
      '*',
    );
  });
});
