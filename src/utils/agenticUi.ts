import type {
  AgenticUiNode,
  AgenticUiPatchOperation,
  AgenticUiSurface,
  AgenticUiValidationResult,
} from '@/types/interfaces/agenticUi';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

const AGENTIC_UI_SCHEMA_VERSION = 'nuwax.agentic-ui.v1';
const MAX_SCAN_DEPTH = 8;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseJsonCandidate = (value: string): unknown[] => {
  const trimmed = value.trim();
  const candidates: string[] = [];

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    candidates.push(trimmed);
  }

  const fencedJsonMatches = trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);
  for (const match of fencedJsonMatches) {
    if (match[1]) {
      candidates.push(match[1].trim());
    }
  }

  const schemaIndex = trimmed.indexOf(AGENTIC_UI_SCHEMA_VERSION);
  if (schemaIndex > -1) {
    const start = trimmed.lastIndexOf('{', schemaIndex);
    const end = trimmed.lastIndexOf('}');
    if (start > -1 && end > start) {
      candidates.push(trimmed.slice(start, end + 1));
    }
  }

  return candidates.flatMap((candidate) => {
    try {
      return [JSON.parse(candidate)];
    } catch {
      return [];
    }
  });
};

const validateNode = (node: unknown): node is AgenticUiNode => {
  if (!isRecord(node) || typeof node.type !== 'string' || !node.type) {
    return false;
  }

  if (
    node.children !== undefined &&
    (!Array.isArray(node.children) || !node.children.every(validateNode))
  ) {
    return false;
  }

  if (node.props !== undefined && !isRecord(node.props)) {
    return false;
  }

  return true;
};

const isPatchOperation = (value: unknown): value is AgenticUiPatchOperation => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.op === 'add' || value.op === 'replace' || value.op === 'remove') &&
    typeof value.path === 'string' &&
    value.path.startsWith('/')
  );
};

export const validateAgenticUiSurface = (
  value: unknown,
): AgenticUiValidationResult => {
  if (!isRecord(value)) {
    return { surface: null, error: 'Agentic UI payload is not an object.' };
  }

  if (value.schemaVersion !== AGENTIC_UI_SCHEMA_VERSION) {
    return { surface: null, error: 'Unsupported Agentic UI schemaVersion.' };
  }

  if (typeof value.surfaceId !== 'string' || !value.surfaceId) {
    return { surface: null, error: 'Agentic UI surfaceId is required.' };
  }

  if (
    value.status !== 'pending' &&
    value.status !== 'streaming' &&
    value.status !== 'ready' &&
    value.status !== 'error'
  ) {
    return { surface: null, error: 'Unsupported Agentic UI status.' };
  }

  if (
    value.mode !== 'replace' &&
    value.mode !== 'append' &&
    value.mode !== 'patch'
  ) {
    return { surface: null, error: 'Unsupported Agentic UI mode.' };
  }

  if (value.mode === 'replace' || value.mode === 'append') {
    if (!validateNode(value.root)) {
      return { surface: null, error: 'Agentic UI root node is invalid.' };
    }
  }

  if (value.mode === 'patch') {
    if (
      value.root !== undefined &&
      value.root !== null &&
      !validateNode(value.root)
    ) {
      return { surface: null, error: 'Agentic UI root node is invalid.' };
    }
    if (
      value.patches !== undefined &&
      (!Array.isArray(value.patches) || !value.patches.every(isPatchOperation))
    ) {
      return { surface: null, error: 'Agentic UI patches are invalid.' };
    }
    if (!value.root && !value.patches?.length) {
      return {
        surface: null,
        error: 'Agentic UI patch requires root or patches.',
      };
    }
  }

  return { surface: value as unknown as AgenticUiSurface };
};

const collectAgenticUiSurfaces = (
  value: unknown,
  surfaces: AgenticUiSurface[],
  visited: WeakSet<object>,
  depth: number,
) => {
  if (depth > MAX_SCAN_DEPTH || value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    parseJsonCandidate(value).forEach((candidate) =>
      collectAgenticUiSurfaces(candidate, surfaces, visited, depth + 1),
    );
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  const validation = validateAgenticUiSurface(value);
  if (validation.surface) {
    surfaces.push(validation.surface);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) =>
      collectAgenticUiSurfaces(item, surfaces, visited, depth + 1),
    );
    return;
  }

  Object.values(value).forEach((item) =>
    collectAgenticUiSurfaces(item, surfaces, visited, depth + 1),
  );
};

export const extractAgenticUiSurfaces = (
  value: unknown,
): AgenticUiSurface[] => {
  const surfaces: AgenticUiSurface[] = [];
  collectAgenticUiSurfaces(value, surfaces, new WeakSet(), 0);

  const uniqueSurfaces = new Map<string, AgenticUiSurface>();
  surfaces.forEach((surface) => {
    uniqueSurfaces.set(surface.surfaceId, surface);
  });

  return Array.from(uniqueSurfaces.values());
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const decodePointerSegment = (segment: string) =>
  segment.replace(/~1/g, '/').replace(/~0/g, '~');

const applyPatchOperation = (
  target: Record<string, unknown>,
  patch: AgenticUiPatchOperation,
): string | null => {
  const segments = patch.path
    .split('/')
    .slice(1)
    .map(decodePointerSegment)
    .filter(Boolean);

  if (!segments.length) {
    return `Patch path ${patch.path} is invalid.`;
  }

  let cursor: any = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (
      Array.isArray(cursor) &&
      segment !== '-' &&
      Number.isNaN(Number(segment))
    ) {
      return `Patch path ${patch.path} points to an invalid array index.`;
    }
    if (cursor?.[segment] === undefined || cursor?.[segment] === null) {
      const nextSegment = segments[index + 1];
      cursor[segment] =
        /^\d+$/.test(nextSegment) || nextSegment === '-' ? [] : {};
    }
    cursor = cursor[segment];
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(cursor)) {
    if (lastSegment !== '-' && Number.isNaN(Number(lastSegment))) {
      return `Patch path ${patch.path} points to an invalid array index.`;
    }
    if (patch.op === 'remove') {
      cursor.splice(Number(lastSegment), 1);
      return null;
    }
    if (lastSegment === '-') {
      cursor.push(patch.value);
      return null;
    }
    if (patch.op === 'add') {
      cursor.splice(Number(lastSegment), 0, patch.value);
      return null;
    }
    cursor[Number(lastSegment)] = patch.value;
    return null;
  }

  if (patch.op === 'remove') {
    delete cursor[lastSegment];
    return null;
  }
  cursor[lastSegment] = patch.value;
  return null;
};

export const mergeAgenticUiSurface = (
  existing: AgenticUiSurface,
  incoming: AgenticUiSurface,
): AgenticUiSurface => {
  if (incoming.mode === 'replace') {
    return incoming;
  }

  if (incoming.mode === 'append') {
    if (!existing.root || !incoming.root) {
      return incoming.root ? incoming : existing;
    }
    return {
      ...existing,
      ...incoming,
      mode: 'replace',
      root: {
        ...existing.root,
        children: [
          ...(existing.root.children || []),
          ...(incoming.root.children || []),
        ],
      },
    };
  }

  const patchedSurface = cloneJson({
    ...existing,
    status: incoming.status,
    metadata: {
      ...existing.metadata,
      ...incoming.metadata,
    },
    mode: 'replace' as const,
  });

  if (incoming.root) {
    patchedSurface.root = incoming.root;
  }

  const patchErrors = incoming.patches
    ?.map((patch) =>
      applyPatchOperation(
        patchedSurface as unknown as Record<string, unknown>,
        patch,
      ),
    )
    .filter(Boolean) as string[] | undefined;

  if (patchErrors?.length) {
    patchedSurface.metadata = {
      ...patchedSurface.metadata,
      validationErrors: [
        ...(patchedSurface.metadata?.validationErrors || []),
        ...patchErrors,
      ],
    };
  }

  return patchedSurface;
};

export const mergeAgenticUiSurfaces = (
  existing: AgenticUiSurface[] | undefined,
  incoming: AgenticUiSurface[],
): AgenticUiSurface[] | undefined => {
  if (!incoming.length) {
    return existing;
  }

  const surfaceMap = new Map<string, AgenticUiSurface>();
  existing?.forEach((surface) => surfaceMap.set(surface.surfaceId, surface));
  incoming.forEach((surface) => {
    const current = surfaceMap.get(surface.surfaceId);
    surfaceMap.set(
      surface.surfaceId,
      current ? mergeAgenticUiSurface(current, surface) : surface,
    );
  });

  return Array.from(surfaceMap.values());
};

export const hydrateAgenticUiSurfacesInMessageList = (
  messageList: MessageInfo[],
): MessageInfo[] =>
  messageList.map((message) => {
    const extractedSurfaces = extractAgenticUiSurfaces(message);
    const agenticUiSurfaces = mergeAgenticUiSurfaces(
      message.agenticUiSurfaces,
      extractedSurfaces,
    );

    if (!agenticUiSurfaces?.length) {
      return message;
    }

    return {
      ...message,
      agenticUiSurfaces,
    };
  });

export const findLatestAgenticUiSurface = (
  messageList: MessageInfo[],
): AgenticUiSurface | null => {
  for (let index = messageList.length - 1; index >= 0; index -= 1) {
    const surfaces = messageList[index]?.agenticUiSurfaces;
    if (surfaces?.length) {
      return surfaces[surfaces.length - 1];
    }
  }
  return null;
};
