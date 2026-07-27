import { describe, expect, it } from 'vitest';
import {
  buildOpenUiArtifactFileUrl,
  extractOpenUiArtifact,
  extractOpenUiArtifactId,
  extractOpenUiRenderInput,
  getOpenUiArtifactIdFromFileName,
  isOpenUiFileName,
  isOpenUiRenderToolName,
  resolveOpenUiDisplayState,
  resolveOpenUiRenderState,
} from './openUiArtifact';

const artifactId = '550e8400-e29b-41d4-a716-446655440000';
const uuidV6ArtifactId = '3f8b1a2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c';
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
  it('recognizes OpenUI render tool names without matching reference tools', () => {
    expect(isOpenUiRenderToolName('nuwax-openui_nuwax_render_openui')).toBe(
      true,
    );
    expect(isOpenUiRenderToolName('nuwax-openui__nuwax_render_openui')).toBe(
      true,
    );
    expect(isOpenUiRenderToolName('nuwax_render_openui')).toBe(true);
    expect(
      isOpenUiRenderToolName('nuwax-openui_nuwax_get_openui_reference'),
    ).toBe(false);
  });

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

  it('keeps inline rendering available when the MCP transport drops structuredContent', () => {
    const source = 'root = Stack([card], "column", "m")';
    const payload = {
      params: {
        schemaVersion: 'nuwax.openui/v1',
        title: 'Inline 卡片演示',
        presentation: { mode: 'inline', preferredWidth: 'compact' },
        document: {
          language: 'openui-lang',
          specVersion: '0.5',
          source,
        },
      },
      response: [
        {
          content: {
            type: 'text',
            text: `OpenUI inline artifact created: data/${artifactId}.openui.json`,
          },
          type: 'content',
        },
      ],
    };

    expect(resolveOpenUiDisplayState(payload)).toMatchObject({
      status: 'input-only',
      renderInput: { document: { source } },
    });
    expect(extractOpenUiArtifactId(payload)).toBe(artifactId);
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

  it('accepts UUID v6 artifact IDs emitted by the MCP input contract', () => {
    expect(buildOpenUiArtifactFileUrl(2336, uuidV6ArtifactId)).toBe(
      `/api/computer/static/2336/data/${uuidV6ArtifactId}.openui.json`,
    );
    expect(
      extractOpenUiArtifactId(
        `OpenUI inline artifact created: data/${uuidV6ArtifactId}.openui.json`,
      ),
    ).toBe(uuidV6ArtifactId);
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
