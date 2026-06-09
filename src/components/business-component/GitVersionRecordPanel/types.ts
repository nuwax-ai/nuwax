import type { GitCommitLogItem } from '@/components/business-component/FileTreePanel/types/git-version-management';

/** 按日期分组的提交列表 */
export interface CommitDateGroup {
  dateKey: string;
  dateLabel: string;
  commits: GitCommitLogItem[];
}
