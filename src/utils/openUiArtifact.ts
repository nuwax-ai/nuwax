import type {
  OpenUiArtifact,
  OpenUiArtifactRef,
  OpenUiFile,
  OpenUiRenderState,
} from '@/types/interfaces/openUi';
import {
  openUiArtifactSchema,
  renderOpenUiInputSchema,
  type RenderOpenUiInput,
} from '@nuwax-ai/openui-mcp/contracts';
import { z } from 'zod';

const MAX_VISITED_VALUES = 128;
const MAX_JSON_TEXT_LENGTH = 200_000;
const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const PRIORITY_KEYS = [
  'structuredContent',
  'structured_content',
  'rawInput',
  'raw_input',
  'input',
  'arguments',
  'rawOutput',
  'raw_output',
  'data',
  'result',
  'output',
  'content',
  'response',
] as const;

const presentationSchema = z.object({
  mode: z.enum(['inline', 'sidecar']),
  autoOpen: z.boolean(),
  preferredWidth: z.enum(['compact', 'normal', 'wide']).optional(),
});

export function isOpenUiRenderToolName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  return /(?:^|[_-])nuwax_render_openui$/i.test(name.trim());
}

export const openUiFileSchema: z.ZodType<OpenUiFile> = z.object({
  type: z.literal('nuwax.openui-file'),
  schemaVersion: z.literal('nuwax.openui-file/v1'),
  artifactId: z.string().uuid(),
  title: z.string(),
  presentation: presentationSchema,
  document: z.object({
    language: z.literal('openui-lang'),
    specVersion: z.literal('0.5'),
    source: z.string(),
    digest: z.string().regex(DIGEST_PATTERN),
  }),
  bindings: z.object({ tools: z.array(z.record(z.string(), z.unknown())) }),
  fallback: z.object({ markdown: z.string() }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const openUiArtifactRefSchema: z.ZodType<OpenUiArtifactRef> = z
  .object({
    type: z.literal('nuwax.openui-ref'),
    schemaVersion: z.literal('nuwax.openui-ref/v1'),
    artifactId: z.string().uuid(),
    path: z.string(),
    title: z.string(),
    presentation: presentationSchema,
    digest: z.string().regex(DIGEST_PATTERN),
    operation: z.enum(['created', 'updated']),
  })
  .superRefine((value, ctx) => {
    if (value.path !== `data/${value.artifactId}.openui.json`) {
      ctx.addIssue({
        code: 'custom',
        message: 'Artifact path does not match artifactId.',
      });
    }
  });

function parseJsonCandidate(value: string): unknown {
  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > MAX_JSON_TEXT_LENGTH ||
    (!candidate.startsWith('{') && !candidate.startsWith('['))
  )
    return undefined;
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}

export function extractOpenUiArtifact(value: unknown): OpenUiArtifact | null {
  const queue: unknown[] = [value];
  const visitedObjects = new WeakSet<object>();
  let visitedValues = 0;
  while (queue.length && visitedValues < MAX_VISITED_VALUES) {
    const current = queue.shift();
    visitedValues += 1;
    const reference = openUiArtifactRefSchema.safeParse(current);
    if (reference.success) return reference.data;
    const legacy = openUiArtifactSchema.safeParse(current);
    if (legacy.success) return legacy.data;
    if (typeof current === 'string') {
      const json = parseJsonCandidate(current);
      if (json !== undefined) queue.push(json);
      continue;
    }
    if (!current || typeof current !== 'object' || visitedObjects.has(current))
      continue;
    visitedObjects.add(current);
    if (Array.isArray(current)) queue.push(...current);
    else {
      const record = current as Record<string, unknown>;
      for (const key of PRIORITY_KEYS)
        if (key in record) queue.push(record[key]);
      for (const [key, nested] of Object.entries(record)) {
        if (!PRIORITY_KEYS.includes(key as (typeof PRIORITY_KEYS)[number]))
          queue.push(nested);
      }
    }
  }
  return null;
}

export function resolveOpenUiRenderState(value: unknown): OpenUiRenderState {
  const artifact = extractOpenUiArtifact(value);
  return artifact ? { status: 'ready', artifact } : { status: 'absent' };
}

export function extractOpenUiRenderInput(
  value: unknown,
): RenderOpenUiInput | null {
  const queue: unknown[] = [value];
  const visitedObjects = new WeakSet<object>();
  let visitedValues = 0;
  while (queue.length && visitedValues < MAX_VISITED_VALUES) {
    const current = queue.shift();
    visitedValues += 1;
    const input = renderOpenUiInputSchema.safeParse(current);
    if (input.success) return input.data;
    if (typeof current === 'string') {
      const json = parseJsonCandidate(current);
      if (json !== undefined) queue.push(json);
      continue;
    }
    if (!current || typeof current !== 'object' || visitedObjects.has(current))
      continue;
    visitedObjects.add(current);
    if (Array.isArray(current)) queue.push(...current);
    else {
      const record = current as Record<string, unknown>;
      for (const key of PRIORITY_KEYS)
        if (key in record) queue.push(record[key]);
      for (const [key, nested] of Object.entries(record)) {
        if (!PRIORITY_KEYS.includes(key as (typeof PRIORITY_KEYS)[number]))
          queue.push(nested);
      }
    }
  }
  return null;
}

export function resolveOpenUiDisplayState(value: unknown) {
  const artifactState = resolveOpenUiRenderState(value);
  const renderInput = extractOpenUiRenderInput(value);
  if (artifactState.status === 'ready') {
    return { ...artifactState, renderInput } as const;
  }
  if (renderInput?.presentation.mode === 'inline') {
    return { status: 'input-only', renderInput } as const;
  }
  return { status: 'absent' } as const;
}

export function extractOpenUiArtifactId(value: unknown): string | undefined {
  const queue: unknown[] = [value];
  const visitedObjects = new WeakSet<object>();
  let visitedValues = 0;
  const pathPattern = new RegExp(
    `(?:^|[^0-9a-z])data/(${UUID_PATTERN})\\.openui\\.json(?:$|[^0-9a-z])`,
    'i',
  );
  while (queue.length && visitedValues < MAX_VISITED_VALUES) {
    const current = queue.shift();
    visitedValues += 1;
    if (typeof current === 'string') {
      const match = pathPattern.exec(current);
      if (match) return match[1];
      const json = parseJsonCandidate(current);
      if (json !== undefined) queue.push(json);
      continue;
    }
    if (!current || typeof current !== 'object' || visitedObjects.has(current))
      continue;
    visitedObjects.add(current);
    if (Array.isArray(current)) queue.push(...current);
    else queue.push(...Object.values(current as Record<string, unknown>));
  }
  return undefined;
}

export function isOpenUiArtifactRef(
  value: OpenUiArtifact,
): value is OpenUiArtifactRef {
  return value.type === 'nuwax.openui-ref';
}

export function buildOpenUiArtifactFileUrl(
  conversationId: number | string,
  artifactId: string,
  digest?: string,
): string | null {
  const normalizedConversationId = String(conversationId).trim();
  if (
    !/^\d+$/.test(normalizedConversationId) ||
    !new RegExp(`^${UUID_PATTERN}$`, 'i').test(artifactId)
  )
    return null;
  const baseUrl = (process.env.BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/computer/static/${encodeURIComponent(
    normalizedConversationId,
  )}/data/${encodeURIComponent(artifactId)}.openui.json`;
  return digest ? `${url}?digest=${encodeURIComponent(digest)}` : url;
}

/**
 * 构造 OpenUI Runtime「自主拉取」模式所需的 file_path（/api/computer/static 之后的相对地址）。
 * 用于 index.html?file_path=...：iframe 内 inline script 据此拼 `${origin}/api/computer/static${file_path}` 同源拉取。
 * 例：conversationId=1557425, artifactId=<uuid> → /1557425/data/<uuid>.openui.json
 */
export function buildOpenUiFilePath(
  conversationId: number | string,
  artifactId: string,
): string | null {
  const normalizedConversationId = String(conversationId).trim();
  // 与 buildOpenUiArtifactFileUrl 一致：conversationId 必须是纯数字，否则返回 null（调用方回退现有模式）
  if (!/^\d+$/.test(normalizedConversationId) || !artifactId) return null;
  return `/${normalizedConversationId}/data/${artifactId}.openui.json`;
}

export function legacyArtifactToOpenUiFile(
  artifact: Exclude<OpenUiArtifact, OpenUiArtifactRef>,
): OpenUiFile {
  return {
    type: 'nuwax.openui-file',
    schemaVersion: 'nuwax.openui-file/v1',
    artifactId: artifact.artifactId,
    title: artifact.title,
    presentation: artifact.presentation,
    document: artifact.document,
    bindings: artifact.bindings,
    fallback: artifact.fallback,
    createdAt: artifact.createdAt,
    updatedAt: artifact.createdAt,
  };
}

/**
 * 将工具返回中已有的渲染输入（RenderOpenUiInput）转为预览可直接使用的 OpenUiFile。
 * 预览（sidecar）场景复用该内存内容，避免再次请求 data/{artifactId}.openui.json
 * （规避静态访问 cookie 失效、并发重复拉取等问题）。
 * digest 复用 artifact 携带的值（ref.digest 即 document.source 的 sha256）。
 */
export function renderInputToOpenUiFile(
  input: RenderOpenUiInput,
  artifactId: string,
  digest: string,
): OpenUiFile {
  const now = new Date().toISOString();
  return {
    type: 'nuwax.openui-file',
    schemaVersion: 'nuwax.openui-file/v1',
    artifactId,
    title: input.title,
    presentation: input.presentation,
    document: { ...input.document, digest },
    bindings: input.bindings,
    fallback: input.fallback,
    createdAt: now,
    updatedAt: now,
  };
}

export function isOpenUiFileName(name: string): boolean {
  const fileName = name.split(/[\\\\/]/).pop() || '';
  return /^.+\.openui\.json$/i.test(fileName);
}

/**
 * 是否为误用的裸 `.openui` 扩展名（非契约数据源 `*.openui.json`）。
 *
 * @param name 文件路径或文件名
 * @returns 以 `.openui` 结尾且不是 `.openui.json` 时为 true
 */
export function isBareOpenUiFileName(name: string): boolean {
  const fileName = name.split(/[\\\\/]/).pop() || '';
  return /^.+\.openui$/i.test(fileName) && !/\.openui\.json$/i.test(fileName);
}

/**
 * 尝试将文件内容解析为合法的 `nuwax.openui-file/v1` Artifact。
 * 用于文件树预览：对 `*.openui.json` 与误用的裸 `.openui` 做内容嗅探。
 *
 * @param content 文件文本或已解析对象
 * @returns 合法 OpenUiFile；解析失败返回 null
 */
export function tryParseOpenUiFileContent(content: unknown): OpenUiFile | null {
  if (content === undefined || content === null || content === '') {
    return null;
  }
  try {
    const raw = typeof content === 'string' ? JSON.parse(content) : content;
    const parsed = openUiFileSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * 判断内容是否像 OpenUI Artifact 外壳（避免把任意 JSON 误判为 digest 问题）。
 *
 * @param raw 已解析的 JSON 对象
 * @returns 是否接近 nuwax.openui-file 结构
 */
function looksLikeOpenUiFileShell(raw: object): boolean {
  const record = raw as {
    type?: unknown;
    schemaVersion?: unknown;
    document?: { source?: unknown; digest?: unknown };
  };
  if (record.type === 'nuwax.openui-file') return true;
  if (
    typeof record.schemaVersion === 'string' &&
    record.schemaVersion.startsWith('nuwax.openui-file')
  ) {
    return true;
  }
  return (
    !!record.document &&
    typeof record.document === 'object' &&
    typeof record.document.source === 'string'
  );
}

/**
 * 判断 OpenUI 文件内容契约失败是否像 digest 问题（便于给出定向修复提示）。
 * 仅在内容已像 openui-file 外壳时才归因 digest，避免普通 JSON 误报。
 *
 * @param content 文件文本或已解析对象
 * @returns 若接近 openui-file 且 digest 不符合 sha256 正则则为 true
 */
export function isOpenUiDigestContractFailure(content: unknown): boolean {
  if (content === undefined || content === null || content === '') {
    return false;
  }
  try {
    const raw =
      typeof content === 'string' ? JSON.parse(String(content)) : content;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    if (!looksLikeOpenUiFileShell(raw)) return false;
    const digest = (raw as { document?: { digest?: unknown } }).document
      ?.digest;
    if (typeof digest !== 'string') return true;
    return !DIGEST_PATTERN.test(digest);
  } catch {
    return false;
  }
}

export function getOpenUiArtifactIdFromFileName(
  name: string,
): string | undefined {
  const fileName = name.split(/[\\\\/]/).pop() || '';
  return new RegExp(`^(${UUID_PATTERN})\\.openui\\.json$`, 'i').exec(
    fileName,
  )?.[1];
}
