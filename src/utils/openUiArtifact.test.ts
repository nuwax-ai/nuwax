import { describe, expect, it } from 'vitest';
import {
  buildOpenUiArtifactFileUrl,
  buildOpenUiFilePath,
  extractOpenUiArtifact,
  extractOpenUiArtifactId,
  extractOpenUiRenderInput,
  getOpenUiArtifactIdFromFileName,
  isBareOpenUiFileName,
  isOpenUiDigestContractFailure,
  isOpenUiFileName,
  isOpenUiRenderToolName,
  openUiFileSchema,
  renderInputToOpenUiFile,
  resolveOpenUiDisplayState,
  resolveOpenUiRenderState,
  tryParseOpenUiFileContent,
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
    expect(isOpenUiFileName('employee_data.openui')).toBe(false);
  });

  it('detects bare .openui extension used as a mistaken data source name', () => {
    expect(isBareOpenUiFileName('employee_data.openui')).toBe(true);
    expect(isBareOpenUiFileName('data/employee_data.openui')).toBe(true);
    expect(isBareOpenUiFileName(`${artifactId}.openui.json`)).toBe(false);
    expect(isBareOpenUiFileName('dashboard.json')).toBe(false);
  });

  it('parses valid openui-file content and detects digest contract failures', () => {
    const validFile = {
      type: 'nuwax.openui-file',
      schemaVersion: 'nuwax.openui-file/v1',
      artifactId,
      title: 'Demo',
      presentation: { mode: 'inline' as const, autoOpen: false },
      document: {
        language: 'openui-lang' as const,
        specVersion: '0.5' as const,
        source: 'root = Stack([])',
        digest: reference.digest,
      },
      bindings: { tools: [] },
      fallback: { markdown: '' },
      createdAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
    };
    expect(tryParseOpenUiFileContent(JSON.stringify(validFile))).toEqual(
      validFile,
    );
    expect(
      tryParseOpenUiFileContent(
        JSON.stringify({
          ...validFile,
          document: { ...validFile.document, digest: 'not-a-digest' },
        }),
      ),
    ).toBeNull();
    expect(
      isOpenUiDigestContractFailure(
        JSON.stringify({
          ...validFile,
          document: { ...validFile.document, digest: 'broken' },
        }),
      ),
    ).toBe(true);
    expect(isOpenUiDigestContractFailure(JSON.stringify(validFile))).toBe(
      false,
    );
    // 普通 JSON / 非 openui 外壳不应误报为 digest 问题
    expect(isOpenUiDigestContractFailure(JSON.stringify({ foo: 1 }))).toBe(
      false,
    );
    expect(
      isOpenUiDigestContractFailure(
        JSON.stringify({ document: { digest: 'broken' } }),
      ),
    ).toBe(false);
  });

  it('derives an artifact ID only from UUID-based file names', () => {
    expect(getOpenUiArtifactIdFromFileName(`${artifactId}.openui.json`)).toBe(
      artifactId,
    );
    expect(
      getOpenUiArtifactIdFromFileName('dashboard.openui.json'),
    ).toBeUndefined();
  });

  it('converts an in-memory render input into a schema-valid OpenUiFile for preview', () => {
    const source = 'root = TextContent("Ready", "large-heavy")';
    const input = extractOpenUiRenderInput({
      rawInput: {
        schemaVersion: 'nuwax.openui/v1',
        title: 'Inline dashboard',
        presentation: { mode: 'sidecar', autoOpen: false },
        document: { language: 'openui-lang', specVersion: '0.5', source },
      },
    });
    if (!input) throw new Error('render input was not extracted');

    // 预览复用内存内容、零拉取：输出必须是合法 OpenUiFile，且 source/digest 正确透传
    const file = renderInputToOpenUiFile(input, artifactId, reference.digest);
    expect(openUiFileSchema.safeParse(file).success).toBe(true);
    expect(file).toMatchObject({
      type: 'nuwax.openui-file',
      schemaVersion: 'nuwax.openui-file/v1',
      artifactId,
      title: 'Inline dashboard',
      presentation: { mode: 'sidecar', autoOpen: false },
      document: { source, digest: reference.digest },
    });
    expect(file.createdAt).toBe(file.updatedAt);
  });
});

describe('buildOpenUiFilePath', () => {
  it('返回 /{conversationId}/data/{artifactId}.openui.json', () => {
    expect(
      buildOpenUiFilePath(1557425, 'a1b2c3d4-1234-1234-89ab-aabbccddeeff'),
    ).toBe('/1557425/data/a1b2c3d4-1234-1234-89ab-aabbccddeeff.openui.json');
  });

  it('对字符串 conversationId 去空白', () => {
    expect(buildOpenUiFilePath(' 2336 ', artifactId)).toBe(
      `/2336/data/${artifactId}.openui.json`,
    );
  });

  it('conversationId 为空或非数字时返回 null（调用方回退现有模式）', () => {
    expect(buildOpenUiFilePath('', artifactId)).toBeNull();
    expect(buildOpenUiFilePath('   ', artifactId)).toBeNull();
    expect(buildOpenUiFilePath('abc', artifactId)).toBeNull();
  });
});
