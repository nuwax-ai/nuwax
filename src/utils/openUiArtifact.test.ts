import { describe, expect, it } from 'vitest';
import {
  buildOpenUiArtifactFileUrl,
  extractOpenUiArtifact,
  extractOpenUiRenderInput,
  getOpenUiArtifactIdFromFileName,
  isOpenUiFileName,
  resolveOpenUiRenderState,
} from './openUiArtifact';

const artifactId = '550e8400-e29b-41d4-a716-446655440000';
const reference = {
  type: 'nuwax.openui-ref',
  schemaVersion: 'nuwax.openui-ref/v1',
  artifactId,
  path: `data/${artifactId}.openui.json`,
  title: 'Build summary',
  presentation: { mode: 'inline', autoOpen: false },
  digest: `sha256:${'a'.repeat(64)}`,
  operation: 'created',
} as const;

describe('OpenUI file artifact references', () => {
  it('finds a valid reference inside MCP wrapper shapes', () => {
    expect(
      extractOpenUiArtifact({ result: { structuredContent: reference } }),
    ).toMatchObject({ artifactId });
  });

  it('extracts inline renderer input independently from the durable reference', () => {
    const source = 'root = TextContent("Ready", "large-heavy")';
    expect(
      extractOpenUiRenderInput({
        rawOutput: JSON.stringify(reference),
        rawInput: {
          schemaVersion: 'nuwax.openui/v1',
          title: 'Inline dashboard',
          presentation: { mode: 'inline', autoOpen: false },
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source,
          },
        },
      }),
    ).toMatchObject({ document: { source }, presentation: { mode: 'inline' } });
  });

  it('rejects a reference whose path does not match its artifact ID', () => {
    expect(
      extractOpenUiArtifact({ ...reference, path: 'data/other.openui.json' }),
    ).toBeNull();
  });

  it('treats durable references as ready without TTL checks', () => {
    expect(resolveOpenUiRenderState(reference).status).toBe('ready');
  });

  it('builds a conversation-scoped file URL with a digest cache key', () => {
    expect(buildOpenUiArtifactFileUrl(2336, artifactId, reference.digest)).toBe(
      `/api/computer/static/2336/data/${artifactId}.openui.json?digest=${encodeURIComponent(
        reference.digest,
      )}`,
    );
  });

  it('recognizes the dedicated .openui.json suffix for file-tree previews', () => {
    expect(isOpenUiFileName(`${artifactId}.openui.json`)).toBe(true);
    expect(isOpenUiFileName('dashboard.openui.json')).toBe(true);
    expect(isOpenUiFileName('data/dashboard.openui.json')).toBe(true);
    expect(isOpenUiFileName('openui.json')).toBe(false);
    expect(isOpenUiFileName('dashboard.openui.json.bak')).toBe(false);
  });

  it('derives an artifact ID only from UUID-based file names', () => {
    expect(getOpenUiArtifactIdFromFileName(`${artifactId}.openui.json`)).toBe(
      artifactId,
    );
    expect(
      getOpenUiArtifactIdFromFileName('dashboard.openui.json'),
    ).toBeUndefined();
  });
});
