import type { FileNode } from '@/types/interfaces/appDev';
import { workspaceRelativePath } from './workspaceFileList';

export function movedFileId(
  id: string,
  source: string,
  destination: string,
): string {
  const relative = workspaceRelativePath(id);
  const from = workspaceRelativePath(source);
  const to = workspaceRelativePath(destination);
  return relative === from || relative.startsWith(`${from}/`)
    ? `${id.startsWith('workspace:') ? 'workspace:' : ''}${to}${relative.slice(
        from.length,
      )}`
    : id;
}

/** 移动只改变父目录；路径相对于当前工作区，不能切换到另一台电脑。 */
export function fileMovePaths(node: FileNode, directory: string) {
  const source = workspaceRelativePath(node.id);
  const parent = directory.trim().replace(/\/$/, '');
  if (
    !source ||
    source.startsWith('/') ||
    source.includes('\\') ||
    /[:\0\\]/.test(parent) ||
    parent.startsWith('/') ||
    (parent &&
      parent.split('/').some((part) => !part || part === '.' || part === '..'))
  )
    throw new Error('Invalid destination directory');
  const name = source.split('/').pop()!;
  const destination = parent ? `${parent}/${name}` : name;
  if (
    destination === source ||
    (node.type === 'folder' && destination.startsWith(`${source}/`))
  )
    throw new Error('Invalid destination directory');
  return { source, destination };
}

export function movedFileNode(
  node: FileNode,
  source: string,
  destination: string,
): FileNode {
  const relative = workspaceRelativePath(node.id);
  if (relative !== source && !relative.startsWith(`${source}/`)) return node;
  const path = `${destination}${relative.slice(source.length)}`;
  const parentPath = path.split('/').slice(0, -1).join('/');
  const prefix = node.id.startsWith('workspace:') ? 'workspace:' : '';
  const localPath = node.localFile?.path;
  return {
    ...node,
    id: `${prefix}${path}`,
    path,
    fullPath: path,
    parentPath,
    name: path.split('/').pop()!,
    localFile: node.localFile
      ? {
          ...node.localFile,
          path: localPath?.endsWith(relative)
            ? `${localPath.slice(0, -relative.length)}${path}`
            : path,
        }
      : undefined,
    children: node.children?.map((child) =>
      movedFileNode(child, source, destination),
    ),
  };
}
