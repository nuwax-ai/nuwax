import type {
  ChangeFileGitStatusKind,
  ChangeFileInfo,
} from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
import type { FileNode } from '@/types/interfaces/appDev';
import type { GitStatusResponse } from '../types/git-version-management';

/** Git status 各数组 membership 快照 */
export interface GitFileStatusFlags {
  inStaged: boolean;
  inCreated: boolean;
  inModified: boolean;
  inDeleted: boolean;
  inUntracked: boolean;
  inConflicted: boolean;
  inRenamed: boolean;
}

/** 解析后的双区状态（同一 fileId 可同时出现在暂存区与更改区，如 MM / 新建已暂存后再改） */
export interface ResolvedGitFileStatuses {
  stagedStatus?: ChangeFileGitStatusKind;
  unstagedStatus?: ChangeFileGitStatusKind;
}

const includes = (list: string[] | undefined, fileId: string): boolean =>
  list?.includes(fileId) ?? false;

/** 读取 fileId 在各 Git status 数组中的归属 */
export const getGitFileStatusFlags = (
  fileId: string,
  status: GitStatusResponse,
): GitFileStatusFlags => ({
  inStaged: includes(status.staged, fileId),
  inCreated: includes(status.created, fileId),
  inModified: includes(status.modified, fileId),
  inDeleted: includes(status.deleted, fileId),
  inUntracked: includes(status.untracked, fileId),
  inConflicted: includes(status.conflicted, fileId),
  inRenamed: includes(status.renamed, fileId),
});

/**
 * 将 Git status 各数组 map 为「暂存的更改 / 更改」双区状态
 *
 * 后端各数组非互斥，表示文件经历过的变更类型；前端按优先级归一化后 merge 到两区展示。
 * 优先级（参考 Kimi / VS Code SCM）：conflict > deleted > created > modified > staged > untracked
 *
 * | 用户操作场景 | 典型数组 | 暂存区 | 更改区 |
 * |-------------|---------|--------|--------|
 * | 新建未暂存 | created | - | A |
 * | 新建后编辑未暂存 | created+modified | - | A（created 优先于 modified） |
 * | git add 新建 | created+modified+staged | A | - |
 * | 暂存后再改 | created+modified+staged | A | M |
 * | 修改未暂存 | modified | - | M |
 * | MM | staged+modified | M | M |
 * | 删除已暂存 | deleted+staged | D | - |
 * | 删除未暂存 | deleted(+modified) | - | D |
 * | 全部累积后删除 | created+modified+deleted+staged | D | - |
 * | 未跟踪 | untracked | - | U |
 * | 冲突 | conflicted | - | C |
 */
export const resolveGitFileStatuses = (
  fileId: string,
  status: GitStatusResponse,
): ResolvedGitFileStatuses => {
  const {
    inStaged,
    inCreated,
    inModified,
    inDeleted,
    inUntracked,
    inConflicted,
    inRenamed,
  } = getGitFileStatusFlags(fileId, status);

  let stagedStatus: ChangeFileGitStatusKind | undefined;
  let unstagedStatus: ChangeFileGitStatusKind | undefined;

  // 1. 冲突 — 仅更改区，置顶展示
  if (inConflicted) {
    return { stagedStatus, unstagedStatus: 'conflict' };
  }

  // 2. 删除 — 最高优先级；已暂存删除只在暂存区
  if (inDeleted) {
    if (inStaged) {
      stagedStatus = 'deleted';
    } else {
      unstagedStatus = 'deleted';
    }
    return { stagedStatus, unstagedStatus };
  }

  // 3. 新建
  if (inCreated) {
    if (inStaged) {
      stagedStatus = 'added';
      // 新建已暂存后又修改：暂存区 A + 更改区 M
      if (inModified) {
        unstagedStatus = 'modified';
      }
    } else {
      // 新建未暂存（含 created+modified）：更改区统一展示 A
      unstagedStatus = 'added';
    }
    return { stagedStatus, unstagedStatus };
  }

  // 4. 修改
  if (inModified) {
    if (inStaged) {
      stagedStatus = 'modified';
      unstagedStatus = 'modified';
    } else {
      unstagedStatus = 'modified';
    }
    return { stagedStatus, unstagedStatus };
  }

  // 5. 纯 staged（如重命名已暂存）
  if (inStaged) {
    stagedStatus = inRenamed ? 'renamed' : 'modified';
    return { stagedStatus, unstagedStatus };
  }

  // 6. 未暂存重命名
  if (inRenamed) {
    unstagedStatus = 'renamed';
    return { stagedStatus, unstagedStatus };
  }

  // 7. 未跟踪
  if (inUntracked) {
    unstagedStatus = 'untracked';
  }

  return { stagedStatus, unstagedStatus };
};

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

/** @deprecated 请使用 resolveGitFileStatuses */
export const resolveStagedStatus = (
  fileId: string,
  status: GitStatusResponse,
): ChangeFileGitStatusKind | undefined =>
  resolveGitFileStatuses(fileId, status).stagedStatus;

/** @deprecated 请使用 resolveGitFileStatuses */
export const resolveUnstagedStatus = (
  fileId: string,
  status: GitStatusResponse,
): ChangeFileGitStatusKind | undefined =>
  resolveGitFileStatuses(fileId, status).unstagedStatus;

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
    const { stagedStatus, unstagedStatus } = resolveGitFileStatuses(
      fileId,
      status,
    );

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
