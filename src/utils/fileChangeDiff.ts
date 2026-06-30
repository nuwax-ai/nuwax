export interface NormalizedFileDiffItem {
  path: string;
  oldText: string;
  newText: string;
}

const readString = (
  source: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined => {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const readPath = (
  source: Record<string, unknown> | undefined,
  locations?: unknown,
): string | undefined => {
  const direct = readString(source, [
    'path',
    'filePath',
    'filepath',
    'file_path',
    'filename',
  ]);
  if (direct) {
    return direct;
  }
  if (Array.isArray(locations)) {
    const first = locations.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).path === 'string',
    ) as Record<string, unknown> | undefined;
    return first?.path as string | undefined;
  }
  return undefined;
};

export const parseUnifiedDiffToFileDiff = (
  diffText: string | undefined,
  fallbackPath?: string,
): NormalizedFileDiffItem[] => {
  if (!diffText) {
    return [];
  }

  const lines = diffText.split('\n');
  const items: NormalizedFileDiffItem[] = [];
  let path = fallbackPath || '';
  let oldLines: string[] = [];
  let newLines: string[] = [];
  let inHunk = false;

  const flush = () => {
    if (!path || (!oldLines.length && !newLines.length)) {
      return;
    }
    items.push({
      path,
      oldText: oldLines.join('\n'),
      newText: newLines.join('\n'),
    });
    oldLines = [];
    newLines = [];
    inHunk = false;
  };

  lines.forEach((line) => {
    if (line.startsWith('Index: ')) {
      flush();
      path = line.slice('Index: '.length).trim() || path;
      return;
    }
    if (line.startsWith('--- ')) {
      return;
    }
    if (line.startsWith('+++ ')) {
      const nextPath = line.slice(4).trim();
      if (nextPath && nextPath !== '/dev/null') {
        path = nextPath.replace(/^[ab]\//, '');
      }
      return;
    }
    if (line.startsWith('@@')) {
      inHunk = true;
      return;
    }
    if (!inHunk) {
      return;
    }
    if (line.startsWith('+')) {
      newLines.push(line.slice(1));
      return;
    }
    if (line.startsWith('-')) {
      oldLines.push(line.slice(1));
      return;
    }
    if (line.startsWith(' ')) {
      const content = line.slice(1);
      oldLines.push(content);
      newLines.push(content);
    }
  });

  flush();
  return items;
};

export const normalizeFileDiffItems = (
  value: unknown,
): NormalizedFileDiffItem[] => {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const result = value as Record<string, unknown>;
  const data = result.data;
  const existingItems = Array.isArray(data)
    ? data
        .filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === 'object' && item.type === 'diff',
        )
        .map((item) => {
          const path = readPath(item);
          if (!path) {
            return null;
          }
          return {
            path,
            oldText: readString(item, ['oldText', 'old_text']) || '',
            newText: readString(item, ['newText', 'new_text']) || '',
          };
        })
        .filter((item): item is NormalizedFileDiffItem => !!item)
    : [];

  if (existingItems.length) {
    return existingItems;
  }

  const input = (result.input ?? result.rawInput ?? result.raw_input) as
    | Record<string, unknown>
    | undefined;
  const locations = result.locations ?? input?.locations;
  const path = readPath(input, locations) || readPath(result, locations);
  const diffItems = parseUnifiedDiffToFileDiff(
    readString(input, ['diff']),
    path,
  );
  if (diffItems.length) {
    return diffItems;
  }

  if (!path) {
    return [];
  }

  const content = readString(input, ['content', 'newContent', 'new_content']);
  if (content !== undefined) {
    return [{ path, oldText: '', newText: content }];
  }

  const oldText = readString(input, ['oldString', 'old_string', 'oldText']);
  const newText = readString(input, ['newString', 'new_string', 'newText']);
  if (oldText !== undefined || newText !== undefined) {
    return [{ path, oldText: oldText || '', newText: newText || '' }];
  }

  return [];
};
