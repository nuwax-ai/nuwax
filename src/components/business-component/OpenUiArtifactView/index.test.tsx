import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OpenUiArtifactView from './index';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
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
  it('uses the frozen iframe runtime for legacy inline artifacts', () => {
    render(<OpenUiArtifactView artifact={baseArtifact} />);
    const frame = screen.getByTitle(baseArtifact.title);
    expect(frame.getAttribute('src')).toContain(
      '/openui-runtime/index.html?nonce=',
    );
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
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
});
