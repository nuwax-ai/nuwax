import type { GitCommitLogItem } from '@/components/business-component/FileTreeGitSourcePanel/types/git-version-management';
import dayjs from 'dayjs';
import type { CommitDateGroup } from './types';

/** 获取用于 UI 展示的 hash（取前 10 位） */
export const getDisplayHash = (hash?: string): string =>
  hash?.slice(0, 10) || '';

/** 格式化提交日期（用于分组标题，如 06/06/2026） */
export const formatCommitDateLabel = (date: string): string =>
  date ? dayjs(date).format('DD/MM/YYYY') : '';

/** 格式化提交时间（用于单条记录，如 16:02） */
export const formatCommitTime = (date: string): string =>
  date ? dayjs(date).format('HH:mm') : '';

/**
 * 将提交列表按日期分组，保持原有时间倒序
 */
export const groupCommitsByDate = (
  commits: GitCommitLogItem[],
): CommitDateGroup[] => {
  const groupMap = new Map<string, GitCommitLogItem[]>();

  commits.forEach((commit) => {
    const dateKey = dayjs(commit.date).format('YYYY-MM-DD');
    const existing = groupMap.get(dateKey);
    if (existing) {
      existing.push(commit);
      return;
    }
    groupMap.set(dateKey, [commit]);
  });

  const groups: CommitDateGroup[] = [];
  const seenDateKeys = new Set<string>();

  commits.forEach((commit) => {
    const dateKey = dayjs(commit.date).format('YYYY-MM-DD');
    if (seenDateKeys.has(dateKey)) {
      return;
    }
    seenDateKeys.add(dateKey);
    groups.push({
      dateKey,
      dateLabel: formatCommitDateLabel(commit.date),
      commits: groupMap.get(dateKey) ?? [],
    });
  });

  return groups;
};
