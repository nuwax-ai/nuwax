import type {
  ChangeFileGitStatusKind,
  ChangeFileInfo,
} from '@/components/FileTreeView/type';
import type { GitStatusResponse } from '@/components/business-component/FileTreeGitSourcePanel/types/git-version-management';
import type { FileNode } from '@/types/interfaces/appDev';

/** 合并 Git status 中的全部变更文件路径（去重） */
export const mergeGitStatusFileIds = (status: GitStatusResponse): string[] =>
  Array.from(
    new Set([
      ...(status.staged ?? []),
      ...(status.created ?? []),
      ...(status.modified ?? []),
      ...(status.deleted ?? []),
      ...(status.untracked ?? []),
      ...(status.renamed ?? []),
      ...(status.conflicted ?? []),
    ]),
  );

/** 解析暂存区文件状态（staged / renamed） */
export const resolveStagedStatus = (
  fileId: string,
  status: GitStatusResponse,
): ChangeFileGitStatusKind | undefined => {
  if (status.renamed?.includes(fileId)) {
    return 'renamed';
  }
  if (status.staged?.includes(fileId)) {
    return 'modified';
  }
  return undefined;
};

/** 解析工作区未暂存文件状态（created / modified / deleted / untracked / conflict） */
export const resolveUnstagedStatus = (
  fileId: string,
  status: GitStatusResponse,
): ChangeFileGitStatusKind | undefined => {
  if (status.created?.includes(fileId)) {
    return 'added';
  }
  if (status.untracked?.includes(fileId)) {
    return 'untracked';
  }
  if (status.conflicted?.includes(fileId)) {
    return 'conflict';
  }
  if (status.modified?.includes(fileId)) {
    return 'modified';
  }
  if (status.deleted?.includes(fileId)) {
    return 'deleted';
  }
  if (status.renamed?.includes(fileId)) {
    return 'renamed';
  }
  return undefined;
};

/**
 * 将 Git status 转为变更文件列表
 * 优先保留本地已有变更记录，避免丢失 diff 基准内容
 */
export const buildChangeFilesFromGitStatus = (
  status: GitStatusResponse,
  fileIds: string[],
  prevChangeFiles: ChangeFileInfo[],
  findFileNode: (fileId: string) => FileNode | null,
): ChangeFileInfo[] => {
  const prevMap = new Map(prevChangeFiles.map((item) => [item.fileId, item]));
  const deletedSet = new Set(status.deleted ?? []);

  return fileIds.map((fileId) => {
    const existing = prevMap.get(fileId);
    const stagedStatus = resolveStagedStatus(fileId, status);
    const unstagedStatus = resolveUnstagedStatus(fileId, status);

    if (existing) {
      return {
        ...existing,
        stagedStatus,
        unstagedStatus,
      };
    }

    const fileNode = findFileNode(fileId);
    const nodeContent = fileNode?.content ?? '';

    if (deletedSet.has(fileId)) {
      return {
        fileId,
        fileContent: '',
        originalFileContent: nodeContent,
        stagedStatus,
        unstagedStatus,
      };
    }

    return {
      fileId,
      fileContent: nodeContent,
      originalFileContent: nodeContent,
      stagedStatus,
      unstagedStatus,
    };
  });
};
