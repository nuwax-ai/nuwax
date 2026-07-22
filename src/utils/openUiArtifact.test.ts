import { describe, expect, it } from 'vitest';
import {
  buildOpenUiArtifactFileUrl,
  extractOpenUiArtifact,
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

  it('recognizes only UUID-based .openui.json files', () => {
    expect(isOpenUiFileName(`${artifactId}.openui.json`)).toBe(true);
    expect(isOpenUiFileName('dashboard.openui.json')).toBe(false);
  });
});
