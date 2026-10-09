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
