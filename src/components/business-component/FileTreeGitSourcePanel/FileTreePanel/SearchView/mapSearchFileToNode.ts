import type { FileNode } from '@/types/interfaces/appDev';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';

/** 服务端搜索结果转成文件树节点所需的字段 */
export interface SearchFileNodeOptions {
  /** 把相对路径转成与文件树一致的节点 id */
  toNodeId?: (relativePath: string) => string;
  /** 数据源标识，会话工作区为 workspace */
  dataSourceId?: string;
}

/**
 * 把搜索接口的扁平文件转成文件树节点。
 * 接口的 name 是相对路径，展示名取最后一段。
 */
export function mapSearchFileToNode(
  file: StaticFileInfo,
  options?: SearchFileNodeOptions,
): FileNode {
  const relativePath = (file.name || '').replace(/^\/+|\/+$/g, '');
  const parts = relativePath.split('/').filter(Boolean);
  const name = parts[parts.length - 1] || relativePath;
  const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;

  return {
    id: options?.toNodeId ? options.toNodeId(relativePath) : relativePath,
    name,
    type: file.isDir ? 'folder' : 'file',
    path: relativePath,
    fullPath: relativePath,
    parentPath,
    binary: file.binary,
    sizeExceeded: file.sizeExceeded,
    fileProxyUrl: file.fileProxyUrl,
    isLink: file.isLink,
    relativePath,
    dataSourceId: options?.dataSourceId,
  };
}

/** 在搜索结果里按任务结果的相对路径命中文件，优先完整路径一致 */
export function findSearchFileByRelativePath<T extends { name: string }>(
  files: T[],
  relativePath: string,
): T | undefined {
  const target = relativePath.replace(/^\/+|\/+$/g, '');
  if (!target) {
    return undefined;
  }
  const normalize = (name: string) => name.replace(/^\/+|\/+$/g, '');
  return (
    files.find((file) => normalize(file.name) === target) ||
    files.find((file) => {
      const name = normalize(file.name);
      return name.endsWith(`/${target}`) || target.endsWith(`/${name}`);
    })
  );
}
