import {
  buildGitWorkspaceParams,
  type GitWorkspaceConfig,
  isGitWorkspaceReady,
} from '@/components/business-component/FileTreePanel/hooks/buildGitWorkspaceParams';
import {
  apiGitAdd,
  apiGitDiscard,
  apiGitUnstage,
} from '@/components/business-component/FileTreePanel/services/git-version-management';
import { SUCCESS_CODE } from '@/constants/codes.constants';

/** 在源代码管理面板内执行 Git discard */
export const runGitDiscard = async (
  workspace: GitWorkspaceConfig,
  files: string[],
): Promise<boolean> => {
  if (!isGitWorkspaceReady(workspace) || !files.length) {
    return false;
  }

  try {
    const { code } = await apiGitDiscard({
      ...buildGitWorkspaceParams(workspace),
      files,
    });
    return code === SUCCESS_CODE;
  } catch (error) {
    console.error('Git discard failed:', error);
    return false;
  }
};

/** 在源代码管理面板内执行 Git add（暂存） */
export const runGitStage = async (
  workspace: GitWorkspaceConfig,
  files: string[],
): Promise<boolean> => {
  if (!isGitWorkspaceReady(workspace) || !files.length) {
    return false;
  }

  try {
    const { code } = await apiGitAdd({
      ...buildGitWorkspaceParams(workspace),
      files,
    });
    return code === SUCCESS_CODE;
  } catch (error) {
    console.error('Git stage failed:', error);
    return false;
  }
};

/** 在源代码管理面板内执行 Git unstage（取消暂存） */
export const runGitUnstage = async (
  workspace: GitWorkspaceConfig,
  files: string[],
): Promise<boolean> => {
  if (!isGitWorkspaceReady(workspace) || !files.length) {
    return false;
  }

  try {
    const { code } = await apiGitUnstage({
      ...buildGitWorkspaceParams(workspace),
      files,
    });
    return code === SUCCESS_CODE;
  } catch (error) {
    console.error('Git unstage failed:', error);
    return false;
  }
};
