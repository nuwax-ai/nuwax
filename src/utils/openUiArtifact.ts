import type {
  OpenUiArtifact,
  OpenUiRenderState,
} from '@/types/interfaces/openUi';
import { openUiArtifactSchema } from '@nuwax-ai/openui-mcp/contracts';

const MAX_VISITED_VALUES = 128;
const MAX_JSON_TEXT_LENGTH = 200_000;
const PRIORITY_KEYS = [
  'structuredContent',
  'structured_content',
  'rawOutput',
  'raw_output',
  'data',
  'result',
  'output',
  'content',
  'response',
] as const;

function parseJsonCandidate(value: string): unknown {
  const candidate = value.trim();
  if (
    candidate.length === 0 ||
    candidate.length > MAX_JSON_TEXT_LENGTH ||
    (!candidate.startsWith('{') && !candidate.startsWith('['))
  ) {
    return undefined;
  }

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

  while (queue.length > 0 && visitedValues < MAX_VISITED_VALUES) {
    const current = queue.shift();
    visitedValues += 1;

    const parsed = openUiArtifactSchema.safeParse(current);
    if (parsed.success) return parsed.data;

    if (typeof current === 'string') {
      const json = parseJsonCandidate(current);
      if (json !== undefined) queue.push(json);
      continue;
    }

    if (!current || typeof current !== 'object') continue;
    if (visitedObjects.has(current)) continue;
    visitedObjects.add(current);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of PRIORITY_KEYS) {
      if (key in record) queue.push(record[key]);
    }

    for (const [key, nestedValue] of Object.entries(record)) {
      if (!PRIORITY_KEYS.includes(key as (typeof PRIORITY_KEYS)[number])) {
        queue.push(nestedValue);
      }
    }
  }

  return null;
}

export function isTrustedOpenUiSidecarUrl(
  value: string,
  artifactId: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '' &&
      url.pathname === `/openui/pages/${artifactId}`
    );
  } catch {
    return false;
  }
}

export function resolveOpenUiRenderState(value: unknown): OpenUiRenderState {
  const artifact = extractOpenUiArtifact(value);
  if (!artifact) return { status: 'absent' };

  const pageExpiresAt = artifact.page?.expiresAt;
  if (
    Date.parse(artifact.expiresAt) <= Date.now() ||
    (pageExpiresAt !== undefined && Date.parse(pageExpiresAt) <= Date.now())
  ) {
    return { status: 'expired', artifact };
  }

  if (
    artifact.presentation.mode === 'sidecar' &&
    (!artifact.page ||
      !isTrustedOpenUiSidecarUrl(artifact.page.url, artifact.artifactId))
  ) {
    return { status: 'untrusted', artifact };
  }

  return { status: 'ready', artifact };
}
