import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGitDiff,
  apiGitFileContent,
} from '../FileTreeGitSourcePanel/services/git-version-management';
import type {
  GitCommitDiffFileItem,
  GitCommitDiffFileStatus,
  GitDiffResponseData,
  GitDiffSummaryFileItem,
  GitFileContentResponseData,
} from '../FileTreeGitSourcePanel/types/git-version-management';
import type { ChangeListSection } from '../FileTreeGitSourcePanel/utils/changeFileStatus';

type WorkspaceParams = {
  workspaceType: 'pageApp' | 'taskAgent';
  projectId?: number;
  cid?: number;
};

interface ParsedDiffFile {
  path: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
  rawChunk: string;
}

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

const normalizeDiffPath = (rawPath: string): string =>
  rawPath.replace(/^a\//, '').replace(/^b\//, '').trim();

const inferDiffFileStatus = (
  insertions: number,
  deletions: number,
  rawChunk: string,
): GitCommitDiffFileStatus => {
  if (rawChunk.includes('--- /dev/null')) {
    return 'added';
  }
  if (rawChunk.includes('+++ /dev/null')) {
    return 'deleted';
  }
  if (rawChunk.includes('rename from') || rawChunk.includes('rename to')) {
    return 'renamed';
  }
  if (insertions > 0 && deletions === 0) {
    return 'added';
  }
  if (insertions === 0 && deletions > 0) {
    return 'deleted';
  }
  return 'modified';
};

/** 从 unified diff 文本块还原旧/新文件内容 */
const parseDiffChunkContent = (
  chunk: string,
): {
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
} => {
  const oldLines: string[] = [];
  const newLines: string[] = [];
  let additions = 0;
  let deletions = 0;

  chunk.split('\n').forEach((line) => {
    if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('@@') ||
      line.startsWith('new file mode') ||
      line.startsWith('deleted file mode') ||
      line.startsWith('similarity index') ||
      line.startsWith('rename from') ||
      line.startsWith('rename to')
    ) {
      return;
    }

    if (line.startsWith('+')) {
      additions += 1;
      newLines.push(line.slice(1));
      return;
    }

    if (line.startsWith('-')) {
      deletions += 1;
      oldLines.push(line.slice(1));
      return;
    }

    const content = line.startsWith(' ') ? line.slice(1) : line;
    oldLines.push(content);
    newLines.push(content);
  });

  return {
    oldContent: oldLines.join('\n'),
    newContent: newLines.join('\n'),
    additions,
    deletions,
  };
};

/** 将 unified diff 文本按文件拆分并解析 */
const parseUnifiedDiffToFileContents = (
  diffText: string,
): Map<string, ParsedDiffFile> => {
  const result = new Map<string, ParsedDiffFile>();
  if (!diffText.trim()) {
    return result;
  }

  const chunks = diffText.split(/(?=^diff --git )/m);
  const fileChunks =
    chunks.length > 1
      ? chunks.filter(Boolean)
      : diffText.split(/(?=^--- )/m).filter((chunk) => chunk.trim());

  fileChunks.forEach((chunk) => {
    const gitPathMatch = chunk.match(/^diff --git a\/(.+?) b\/(.+?)$/m);
    const oldPathMatch = chunk.match(/^--- a\/(.+?)(?:\t|$)/m);
    const newPathMatch = chunk.match(/^\+\+\+ b\/(.+?)(?:\t|$)/m);
    const rawPath =
      newPathMatch?.[1] ??
      oldPathMatch?.[1] ??
      gitPathMatch?.[2] ??
      gitPathMatch?.[1] ??
      '';

    const path = normalizeDiffPath(rawPath);
    if (!path) {
      return;
    }

    const parsed = parseDiffChunkContent(chunk);
    result.set(path, {
      path,
      oldContent: parsed.oldContent,
      newContent: parsed.newContent,
      additions: parsed.additions,
      deletions: parsed.deletions,
      rawChunk: chunk,
    });
  });

  return result;
};

const buildDiffFileItem = (
  summaryItem: GitDiffSummaryFileItem,
  parsed?: ParsedDiffFile,
): GitCommitDiffFileItem => {
  const path = summaryItem.file;
  const oldContent = parsed?.oldContent ?? '';
  const newContent = parsed?.newContent ?? '';
  const additions = summaryItem.insertions ?? parsed?.additions ?? 0;
  const deletions = summaryItem.deletions ?? parsed?.deletions ?? 0;

  return {
    path,
    status: inferDiffFileStatus(additions, deletions, parsed?.rawChunk ?? ''),
    additions,
    deletions,
    oldContent,
    newContent,
    unifiedDiff: parsed?.rawChunk,
  };
};

/** 将接口 data 规范为统一的 diff 文件列表 */
export const normalizeGitDiffResponse = (
  data: GitDiffResponseData | null | undefined,
): GitCommitDiffFileItem[] => {
  if (!data) {
    return [];
  }

  const parsedByPath = parseUnifiedDiffToFileContents(data.diff ?? '');
  const summaryFiles = data.summary?.files ?? [];

  if (summaryFiles.length > 0) {
    return summaryFiles.map((item) =>
      buildDiffFileItem(item, parsedByPath.get(item.file)),
    );
  }

  return Array.from(parsedByPath.values()).map((parsed) =>
    buildDiffFileItem(
      {
        file: parsed.path,
        changes: parsed.additions + parsed.deletions,
        insertions: parsed.additions,
        deletions: parsed.deletions,
        binary: false,
      },
      parsed,
    ),
  );
};

/** 源代码管理 diff 双端文件内容 */
export interface GitChangeFileContent {
  originalFileContent: string;
  fileContent: string;
}

/** 将接口 data 规范为字符串文件内容 */
const normalizeGitFileContent = (
  data: GitFileContentResponseData | null | undefined,
): string => String(data?.content ?? '');

/**
 * 拉取指定 ref 下的单文件内容
 */
const fetchSingleGitFileContent = async (
  workspaceParams: WorkspaceParams,
  ref: string,
  filePath: string,
): Promise<string> => {
  const res = await apiGitFileContent({
    ...workspaceParams,
    ref,
    filePath,
  });

  if (res?.code !== SUCCESS_CODE) {
    // 新文件在 HEAD 下可能不存在，返回空内容用于 diff 左侧
    if (ref === 'HEAD') {
      return '';
    }
    throw new Error(res?.message || 'Git file content failed');
  }

  return normalizeGitFileContent(res.data);
};

/**
 * 拉取工作区或暂存区中单个文件的变更内容（HEAD vs worktree/staged）
 * @param fileId 文件路径
 * @param section unstaged 对比 worktree，staged 对比 staged
 */
export const fetchGitChangeFileContent = async (
  workspaceParams: WorkspaceParams,
  fileId: string,
  section: ChangeListSection,
): Promise<GitChangeFileContent> => {
  const modifiedRef = section === 'staged' ? 'staged' : 'worktree';

  // 拉取 HEAD 和 worktree/staged 的文件内容
  const [originalFileContent, fileContent] = await Promise.all([
    fetchSingleGitFileContent(workspaceParams, 'HEAD', fileId),
    fetchSingleGitFileContent(workspaceParams, modifiedRef, fileId),
  ]);

  return { originalFileContent, fileContent };
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
    from: commitHash,
    source: 'commit',
    paths,
  });

  if (res?.code !== SUCCESS_CODE) {
    throw new Error(res?.message || 'Git diff failed');
  }

  return normalizeGitDiffResponse(res.data);
};
