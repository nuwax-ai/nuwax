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
