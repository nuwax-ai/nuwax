import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiSearchFiles } from '@/services/vncDesktop';
import type { FileNode } from '@/types/interfaces/appDev';
import {
  findSearchFileByRelativePath,
  mapSearchFileToNode,
} from '../FileTreePanel/SearchView/mapSearchFileToNode';
import {
  WORKSPACE_SOURCE_ID,
  workspaceNodeId,
  workspaceRelativePath,
  workspaceSearchKeyword,
} from './workspaceFileList';

/**
 * 文件树不再返回全量列表时，用文件名搜索，再按相对路径命中真正的文件。
 * 会话工作区（Chat / ConversationAgent / AppDevPro）共用。
 */
export async function locateWorkspaceChangeFile(
  conversationId: string | number | null | undefined,
  fileId: string,
): Promise<FileNode | null> {
  const relativePath = workspaceRelativePath(fileId).replace(/^\/+|\/+$/g, '');
  if (!conversationId || !relativePath) {
    return null;
  }
  const result = await apiSearchFiles({
    cId: Number(conversationId),
    kw: workspaceSearchKeyword(relativePath),
  });
  if (result.code !== SUCCESS_CODE) {
    return null;
  }
  const hit = findSearchFileByRelativePath(
    result.data?.files || [],
    relativePath,
  );
  if (!hit) {
    return null;
  }
  return mapSearchFileToNode(hit, {
    toNodeId: workspaceNodeId,
    dataSourceId: WORKSPACE_SOURCE_ID,
  });
}

/** 当前树是否是会话工作区的分层列表。只有这种树才需要按文件名补搜。 */
export function isWorkspaceLayeredTree(
  nodes: FileNode[],
  fileId: string,
): boolean {
  if (fileId.startsWith(`${WORKSPACE_SOURCE_ID}:`)) {
    return true;
  }
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    if (node.dataSourceId === WORKSPACE_SOURCE_ID) {
      return true;
    }
    if (node.children?.length) {
      stack.push(...node.children);
    }
  }
  return false;
}
