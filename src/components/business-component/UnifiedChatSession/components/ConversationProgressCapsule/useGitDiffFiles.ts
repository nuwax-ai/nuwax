import {
  apiGitDiff,
  apiGitLogList,
} from '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management';
import type { GitDiffSummaryFileItem } from '@/components/business-component/FileTreeGitSourcePanel/types/git-version-management';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useEffect, useState } from 'react';

/** 终态展示用的 git diff 汇总（文件 + 增删行数，git 统计口径） */
export interface GitDiffFilesSummary {
  files: GitDiffSummaryFileItem[];
  insertions: number;
  deletions: number;
  source: 'worktree' | 'commit';
}

interface GitDiffFilesParams {
  conversationId?: number;
  /** 项目/智能体开启版本管理才拉取 */
  enabled?: boolean;
  /** 当前展示轮次键，轮次切换即作废在途请求 */
  turnKey?: string;
  /** 执行期不请求，终态后拉一次 */
  running?: boolean;
}

const toSummary = (
  res:
    | {
        code?: string;
        data?: {
          summary?: {
            files?: GitDiffSummaryFileItem[];
            insertions?: number;
            deletions?: number;
          };
        };
      }
    | undefined,
  source: 'worktree' | 'commit',
): GitDiffFilesSummary | null => {
  if (res?.code !== SUCCESS_CODE) return null;
  const summary = res.data?.summary;
  const files = summary?.files ?? [];
  if (!files.length) return null;
  return {
    files,
    insertions: summary?.insertions ?? 0,
    deletions: summary?.deletions ?? 0,
    source,
  };
};

/**
 * 会话结束后拉取 git diff 文件汇总：worktree 优先；开自动提交时
 * worktree 干净，兜底最新一次 commit 的 diff。失败/空均静默返回 null，
 * 由展示层回退 V2 投影的文件编辑数据。
 */
export function useGitDiffFiles({
  conversationId,
  enabled,
  turnKey,
  running,
}: GitDiffFilesParams) {
  const [summary, setSummary] = useState<GitDiffFilesSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSummary(null);
    if (!enabled || running || !conversationId || !turnKey) return;

    let cancelled = false;
    const workspace = {
      workspaceType: 'taskAgent' as const,
      cid: conversationId,
    };
    setLoading(true);
    (async () => {
      try {
        let next = toSummary(
          await apiGitDiff({ ...workspace, source: 'worktree' }),
          'worktree',
        );
        if (cancelled) return;
        if (!next) {
          const log = await apiGitLogList({
            ...workspace,
            page: 1,
            pageSize: 1,
          });
          if (cancelled) return;
          const hash = log?.data?.commits?.[0]?.hash;
          if (log?.code === SUCCESS_CODE && hash) {
            next = toSummary(
              await apiGitDiff({ ...workspace, from: hash, source: 'commit' }),
              'commit',
            );
            if (cancelled) return;
          }
        }
        if (!cancelled) setSummary(next);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, enabled, running, turnKey]);

  return { summary, loading };
}
