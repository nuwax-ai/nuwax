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
 * 只有工具结束后的文件变更才刷新树。读取/查询和 EXECUTING 不代表文件已改变。
 * 协议 kind / diff 优先，旧工具名作兜底；终端可能运行任意写文件脚本，
 * 除简单只读命令外保守刷新，失败命令也可能留下部分文件。任务 FINAL 另有兜底。
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

  const name = String(processing.name ?? result.name ?? '').toLowerCase();
  if (
    /(编辑|修改|新增|新建|删除|移动|重命名|创建|写入)|(?:^|[.\s_-])(?:write|edit|create|delete|remove|move|rename|copy|mkdir|apply_patch)(?:$|[.\s_-]|files?\b|directory\b|folder\b)/.test(
      name,
    )
  ) {
    return true;
  }
  const command = input.command ?? rawInput.command;
  if (
    kind === 'execute' ||
    typeof command === 'string' ||
    /(?:^|[.\s_-])(?:bash|shell|terminal|execute)(?:$|[.\s_-])|终端/.test(name)
  ) {
    // 不尝试解析任意 shell；管道、重定向、替换、子命令均保守视作可能写文件。
    return !(
      typeof command === 'string' &&
      /^(?:pwd|ls|cat|head|tail)(?:\s+[^;&|<>`$\n]*)?\s*$/.test(command.trim())
    );
  }
  return false;
};
