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
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
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

export function isOpenUiFileName(name: string): boolean {
  const fileName = name.split(/[\\\\/]/).pop() || '';
  return /^.+\.openui\.json$/i.test(fileName);
}

export function getOpenUiArtifactIdFromFileName(
  name: string,
): string | undefined {
  const fileName = name.split(/[\\\\/]/).pop() || '';
  return new RegExp(`^(${UUID_PATTERN})\\.openui\\.json$`, 'i').exec(
    fileName,
  )?.[1];
}
