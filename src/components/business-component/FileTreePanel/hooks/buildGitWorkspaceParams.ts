import type { GitWorkspaceType } from '@/components/business-component/FileTreePanel/types/git-version-management';

/** Git 工作空间配置 */
export type GitWorkspaceConfig =
  | { workspaceType: 'pageApp'; projectId: string | number | null }
  | { workspaceType: 'taskAgent'; cid: string | number | null };

/** 构建 Git API 公共请求参数 */
export const buildGitWorkspaceParams = (
  workspace: GitWorkspaceConfig,
): {
  workspaceType: GitWorkspaceType;
  projectId?: number;
  cid?: number;
} => {
  if (workspace.workspaceType === 'pageApp') {
    return {
      workspaceType: 'pageApp',
      projectId: workspace.projectId ? Number(workspace.projectId) : undefined,
    };
  }

  return {
    workspaceType: 'taskAgent',
    cid: workspace.cid ? Number(workspace.cid) : undefined,
  };
};

/** 工作空间 ID 是否可用 */
export const isGitWorkspaceReady = (workspace: GitWorkspaceConfig): boolean => {
  if (workspace.workspaceType === 'pageApp') {
    return Boolean(workspace.projectId);
  }
  return Boolean(workspace.cid);
};
