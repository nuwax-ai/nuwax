import { describe, expect, it } from 'vitest';
import {
  buildOpenUiTunnelPageUrl,
  extractOpenUiArtifact,
  isTrustedOpenUiSidecarUrl,
  resolveOpenUiRenderState,
} from './openUiArtifact';

const artifact = {
  type: 'nuwax.openui',
  schemaVersion: 'nuwax.openui/v1',
  artifactId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Build summary',
  presentation: { mode: 'inline', autoOpen: false },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'root = Text("Ready")',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  bindings: { tools: [] },
  fallback: { markdown: 'Ready' },
  createdAt: '2026-07-21T08:00:00.000Z',
  expiresAt: '2099-07-21T09:00:00.000Z',
} as const;

describe('extractOpenUiArtifact', () => {
  it('finds structured content inside ACP/MCP wrapper shapes', () => {
    expect(
      extractOpenUiArtifact({
        result: { output: { structuredContent: artifact } },
      }),
    ).toMatchObject({ artifactId: artifact.artifactId });
  });

  it('finds structured content preserved in a rawOutput JSON string', () => {
    expect(
      extractOpenUiArtifact({
        content: [{ type: 'text', text: 'OpenUI artifact ready.' }],
        rawOutput: JSON.stringify({ structuredContent: artifact }),
      }),
    ).toMatchObject({ artifactId: artifact.artifactId });
  });

  it('finds an artifact encoded in a text content block', () => {
    expect(
      extractOpenUiArtifact([
        {
          type: 'content',
          content: { type: 'text', text: JSON.stringify(artifact) },
        },
      ]),
    ).toMatchObject({ artifactId: artifact.artifactId });
  });

  it('does not loop on cyclic event data', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(extractOpenUiArtifact(cyclic)).toBeNull();
  });
});

describe('OpenUI sidecar policy', () => {
  it('only trusts the artifact-specific loopback HTTP page', () => {
    expect(
      isTrustedOpenUiSidecarUrl(
        `http://127.0.0.1:8787/openui/pages/${artifact.artifactId}`,
        artifact.artifactId,
      ),
    ).toBe(true);
    expect(
      isTrustedOpenUiSidecarUrl(
        `http://localhost:8787/openui/pages/${artifact.artifactId}`,
        artifact.artifactId,
      ),
    ).toBe(true);
    expect(
      isTrustedOpenUiSidecarUrl(
        `https://example.com/openui/pages/${artifact.artifactId}`,
        artifact.artifactId,
      ),
    ).toBe(false);
    expect(
      isTrustedOpenUiSidecarUrl(
        'http://127.0.0.1:8787/admin',
        artifact.artifactId,
      ),
    ).toBe(false);
    expect(
      isTrustedOpenUiSidecarUrl(
        `http://127.0.0.1:8787/openui/pages/${artifact.artifactId}?token=1`,
        artifact.artifactId,
      ),
    ).toBe(false);
  });

  it('rejects expired artifacts before rendering', () => {
    expect(
      resolveOpenUiRenderState({
        ...artifact,
        expiresAt: '2020-01-01T00:00:00.000Z',
      }).status,
    ).toBe('expired');
  });

  it('rejects a sidecar whose page lease has expired', () => {
    expect(
      resolveOpenUiRenderState({
        ...artifact,
        presentation: { mode: 'sidecar', autoOpen: true },
        page: {
          url: `http://127.0.0.1:8787/openui/pages/${artifact.artifactId}`,
          expiresAt: '2020-01-01T00:00:00.000Z',
          sandboxProfile: 'openui-sidecar-v1',
        },
      }).status,
    ).toBe('expired');
  });
});

describe('OpenUI lanproxy runtime URL', () => {
  it('builds a same-origin page path scoped to the conversation', () => {
    expect(buildOpenUiTunnelPageUrl(2336, artifact.artifactId)).toBe(
      `/api/computer/static/2336/openui/pages/${artifact.artifactId}`,
    );
  });

  it('rejects an invalid conversation id', () => {
    expect(buildOpenUiTunnelPageUrl('../2336', artifact.artifactId)).toBeNull();
  });
});
