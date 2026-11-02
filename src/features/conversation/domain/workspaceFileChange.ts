const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const hasDiff = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.some((item) => {
    const entry = record(item);
    return entry.type === 'diff' && typeof entry.path === 'string';
  });

/**
 * 只有工具结束后的文件变更才刷新树。读取、查询、终端命令和 EXECUTING 不代表文件已改变。
 * 协议 kind / diff 优先，旧的编辑类工具名作兜底。
 */
export const shouldRefreshWorkspaceFiles = (value: unknown): boolean => {
  const processing = record(value);
  if (
    processing.type !== 'ToolCall' ||
    !['FINISHED', 'FAILED'].includes(String(processing.status))
  ) {
    return false;
  }
  const result = record(processing.result);
  const input = record(result.input);
  const rawInput = record(input.rawInput ?? input.raw_input);
  if (
    hasDiff(result.data) ||
    hasDiff(result.content) ||
    hasDiff(input.content)
  ) {
    return true;
  }
  const kind = String(
    result.kind ?? input.kind ?? processing.kind ?? '',
  ).toLowerCase();
  if (
    [
      'edit',
      'write',
      'create',
      'delete',
      'remove',
      'move',
      'rename',
      'copy',
    ].includes(kind)
  ) {
    return true;
  }
  if (['read', 'search', 'browser'].includes(kind)) return false;

  const hasEditedContent = [input, rawInput].some((item) =>
    ['new_string', 'old_string', 'newText', 'oldText', 'patch'].some((key) =>
      Object.prototype.hasOwnProperty.call(item, key),
    ),
  );
  if (hasEditedContent) return true;

  // 终端命令（含 git status、npm test、echo、python，以及没有具体命令或失败的 execute）
  // 不刷新文件树。只有上面的编辑、写入、diff 才刷新。
  if (kind === 'execute') return false;

  const name = String(processing.name ?? result.name ?? '').toLowerCase();
  if (
    /(?:^|[.\s_-])(?:bash|shell|terminal|execute)(?:$|[.\s_-])|终端/.test(name)
  ) {
    return false;
  }
  return /(编辑|修改|新增|新建|删除|移动|重命名|创建|写入)|(?:^|[.\s_-])(?:write|edit|create|delete|remove|move|rename|copy|mkdir|apply_patch)(?:$|[.\s_-]|files?\b|directory\b|folder\b)/.test(
    name,
  );
};

const FILE_PATH_KEYS = [
  'filePath',
  'file_path',
  'filepath',
  'path',
  'targetPath',
  'target_path',
];

const STRUCTURE_KINDS = new Set([
  'create',
  'delete',
  'remove',
  'move',
  'rename',
  'copy',
]);

const CONTENT_KINDS = new Set(['edit', 'write']);

/** 从工具记录里取出被操作的文件路径 */
export const collectChangedFilePaths = (processing: unknown): string[] => {
  const item = record(processing);
  const result = record(item.result);
  const input = record(result.input);
  const rawInput = record(input.rawInput ?? input.raw_input);
  const paths: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      paths.push(value.trim());
    }
  };
  [input, rawInput, result].forEach((source) => {
    FILE_PATH_KEYS.forEach((key) => push(source[key]));
  });
  [result.data, result.content, input.content].forEach((list) => {
    if (!Array.isArray(list)) {
      return;
    }
    list.forEach((entry) => {
      const diff = record(entry);
      if (diff.type === 'diff') {
        push(diff.path);
      }
    });
  });
  return paths;
};

/**
 * 新增、删除、移动、重命名会改变树结构。
 * 编辑、写入、diff 只改已有文件内容。
 */
const isStructuralWorkspaceChange = (processing: unknown): boolean => {
  const item = record(processing);
  const result = record(item.result);
  const input = record(result.input);
  const kind = String(
    result.kind ?? input.kind ?? item.kind ?? '',
  ).toLowerCase();
  if (STRUCTURE_KINDS.has(kind)) {
    return true;
  }
  if (CONTENT_KINDS.has(kind)) {
    return false;
  }
  const rawInput = record(input.rawInput ?? input.raw_input);
  if (
    hasDiff(result.data) ||
    hasDiff(result.content) ||
    hasDiff(input.content) ||
    [input, rawInput].some((source) =>
      ['new_string', 'old_string', 'newText', 'oldText', 'patch'].some((key) =>
        Object.prototype.hasOwnProperty.call(source, key),
      ),
    )
  ) {
    return false;
  }
  const name = String(item.name ?? result.name ?? '').toLowerCase();
  return /(新增|新建|删除|移动|重命名|创建)|(?:^|[.\s_-])(?:create|delete|remove|move|rename|copy|mkdir)(?:$|[.\s_-]|files?\b|directory\b|folder\b)/.test(
    name,
  );
};

export type WorkspaceFileRefreshScope = 'none' | 'content' | 'tree';

export interface WorkspaceFileRefreshPlan {
  /** content：只改文件内容；tree：树结构有变化；none：不用刷新 */
  scope: WorkspaceFileRefreshScope;
  paths: string[];
}

/** 流式工具结束后，决定刷文件树还是只刷正文 */
export const classifyWorkspaceFileRefresh = (
  value: unknown,
): WorkspaceFileRefreshPlan => {
  if (!shouldRefreshWorkspaceFiles(value)) {
    return { scope: 'none', paths: [] };
  }
  return {
    scope: isStructuralWorkspaceChange(value) ? 'tree' : 'content',
    paths: collectChangedFilePaths(value),
  };
};

const normalizeWorkspacePath = (value: string): string => {
  const withoutPrefix = value.startsWith('workspace:')
    ? value.slice('workspace:'.length)
    : value;
  return withoutPrefix
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
};

/** 选中文件和工具上报路径是否指向同一个工作区文件 */
export const isSameWorkspaceFile = (
  selectedFileId: string,
  changedPath: string,
): boolean => {
  const selected = normalizeWorkspacePath(selectedFileId);
  const changed = normalizeWorkspacePath(changedPath);
  if (!selected || !changed) {
    return false;
  }
  return (
    selected === changed ||
    selected.endsWith(`/${changed}`) ||
    changed.endsWith(`/${selected}`)
  );
};

/**
 * 内容变更且每一条路径都是当前预览文件时，只刷正文。
 * 改的是别的文件，或认不出路径时，流式过程中不刷文件树。
 * 新增、删除等结构变化不走这里，单独刷新文件树，避免被后面的编辑节流掉。
 */
export const streamingContentRefreshAction = (
  paths: string[],
  selectedFileId: string,
): 'content' | 'skip' => {
  if (
    !selectedFileId ||
    !paths.length ||
    !paths.every((path) => isSameWorkspaceFile(selectedFileId, path))
  ) {
    return 'skip';
  }
  return 'content';
};
