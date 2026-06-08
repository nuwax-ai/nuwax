import { apiGitDiff } from '@/components/business-component/FileTreePanel/services/git-version-management';
import type {
  GitCommitDiffFileItem,
  GitCommitDiffFileStatus,
  GitDiffResponseData,
} from '@/components/business-component/FileTreePanel/types/git-version-management';
import { SUCCESS_CODE } from '@/constants/codes.constants';

type WorkspaceParams = {
  workspaceType: 'pageApp' | 'taskAgent';
  projectId?: number;
  cid?: number;
};

const STATUS_MAP: Record<string, GitCommitDiffFileStatus> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  modified: 'modified',
  added: 'added',
  deleted: 'deleted',
  renamed: 'renamed',
};

/** 行级 diff 统计（用于接口未返回 additions/deletions 时兜底） */
export const getLineDiffStats = (
  oldStr: string = '',
  newStr: string = '',
): { additions: number; deletions: number } => {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs = dp[m][n];
  return { additions: n - lcs, deletions: m - lcs };
};

const mapDiffStatus = (raw: unknown): GitCommitDiffFileStatus => {
  const key = String(raw ?? 'modified');
  return STATUS_MAP[key] ?? 'modified';
};

const normalizeDiffFile = (
  item: Record<string, unknown>,
): GitCommitDiffFileItem => {
  const path = String(item.path ?? item.file ?? item.filePath ?? '');
  const oldContent = String(
    item.oldContent ??
      item.oldText ??
      item.before ??
      item.originalContent ??
      '',
  );
  const newContent = String(
    item.newContent ?? item.newText ?? item.after ?? item.modifiedContent ?? '',
  );
  const stats =
    item.additions !== undefined || item.deletions !== undefined
      ? {
          additions: Number(item.additions ?? item.added ?? 0),
          deletions: Number(
            item.deletions ?? item.deleted ?? item.removed ?? 0,
          ),
        }
      : getLineDiffStats(oldContent, newContent);

  return {
    path,
    status: mapDiffStatus(item.status ?? item.changeType),
    additions: stats.additions,
    deletions: stats.deletions,
    oldContent,
    newContent,
    oldPath: item.oldPath ? String(item.oldPath) : undefined,
  };
};

/** 将接口 data 规范为统一的 diff 文件列表 */
export const normalizeGitDiffResponse = (
  data: GitDiffResponseData | Record<string, unknown> | null | undefined,
): GitCommitDiffFileItem[] => {
  if (!data) {
    return [];
  }

  const rawFiles =
    (data as GitDiffResponseData).files ??
    (data as Record<string, unknown>).diffs ??
    (data as Record<string, unknown>).changes ??
    [];

  if (!Array.isArray(rawFiles)) {
    return [];
  }

  return rawFiles
    .map((item) => normalizeDiffFile(item as Record<string, unknown>))
    .filter((item) => Boolean(item.path));
};

/**
 * 拉取某次提交相对父提交的变更文件列表
 * @param commitHash 目标提交 hash
 */
export const fetchGitCommitDiffFiles = async (
  workspaceParams: WorkspaceParams,
  commitHash: string,
  paths?: string[],
): Promise<GitCommitDiffFileItem[]> => {
  const res = await apiGitDiff({
    ...workspaceParams,
    from: `${commitHash}^`,
    to: commitHash,
    paths,
  });

  if (res?.code !== SUCCESS_CODE) {
    throw new Error(res?.message || 'Git diff failed');
  }

  return normalizeGitDiffResponse(res.data);
};
