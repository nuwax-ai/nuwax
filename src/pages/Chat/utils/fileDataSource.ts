export const WORKSPACE_SOURCE_ID = 'workspace';

export function workspaceNodeId(relativePath: string): string {
  return `${WORKSPACE_SOURCE_ID}:${relativePath}`;
}

export function workspaceRelativePath(fileId: string): string {
  return fileId.startsWith(`${WORKSPACE_SOURCE_ID}:`)
    ? fileId.slice(WORKSPACE_SOURCE_ID.length + 1)
    : fileId;
}

export function parentDirectory(relativePath: string): string {
  return relativePath.split('/').slice(0, -1).join('/');
}

/**
 * 从全量递归扁平列表裁出 relativePath 所指目录的一层内容：
 * 直接子文件直取；递归列表不含非空目录自身条目（仅空目录有 isDir 条目），
 * 从更深路径前缀合成目录条目。
 */
export function filterDirectoryLevel<
  T extends { name: string; isDir: boolean },
>(files: T[], relativePath: string): T[] {
  const prefix = relativePath ? `${relativePath.replace(/\/+$/, '')}/` : '';
  const children = new Map<string, T>();
  for (const file of files) {
    const name = file.name.replace(/^\/+/, '');
    if (!name.startsWith(prefix)) {
      continue;
    }
    const rest = name.slice(prefix.length);
    if (!rest) {
      continue;
    }
    const slashIndex = rest.indexOf('/');
    if (slashIndex === -1) {
      children.set(rest, file);
    } else {
      // 更深路径：合成非空子目录条目
      const dirName = rest.slice(0, slashIndex);
      if (!children.has(dirName)) {
        children.set(dirName, {
          name: `${prefix}${dirName}`,
          isDir: true,
        } as T);
      }
    }
  }
  return Array.from(children.values());
}

let warnedRecursiveFallback = false;

/**
 * #5a 懒加载降级：请求单层（recursive:false）但响应 recursive 回显不为
 * false 时，说明网关/旧后端未透传单层参数、返回的仍是全量递归扁平列表，
 * 前端裁出当前层兜底（仅告警一次）。
 */
export function resolveDirectoryLevelFiles<
  T extends { name: string; isDir: boolean },
>(files: T[], recursiveEcho: boolean | undefined, relativePath: string): T[] {
  if (recursiveEcho === false) {
    return files;
  }
  if (!warnedRecursiveFallback) {
    warnedRecursiveFallback = true;
    console.warn(
      '[file-tree] file-list 单层参数未生效（响应 recursive 非 false），已降级为前端裁剪当前层；请确认网关对 relativePath/recursive 的透传',
    );
  }
  return filterDirectoryLevel(files, relativePath);
}
