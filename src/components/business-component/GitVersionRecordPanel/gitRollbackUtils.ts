import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGitCommit,
  apiGitStatus,
} from '../FileTreeGitSourcePanel/services/git-version-management';
import type { GitTagsParams } from '../FileTreeGitSourcePanel/types/git-version-management';
import { mergeGitStatusFileIds } from '../FileTreeGitSourcePanel/utils/gitStatusUtils';

export type CommitUncommittedResult = {
  /** 是否执行了 commit（存在未提交文件并已尝试提交） */
  committed: boolean;
  /** 整体是否成功（无未提交文件，或 commit 成功） */
  success: boolean;
  errorMessage?: string;
};

/**
 * 回滚前检测并提交未 commit 的变更
 * 通过 git status 拉取 staged / modified / untracked 等文件，有则自动 commit
 */
export async function commitUncommittedChangesIfAny(
  workspaceParams: GitTagsParams,
): Promise<CommitUncommittedResult> {
  try {
    const statusResponse = await apiGitStatus(workspaceParams);
    if (statusResponse.code !== SUCCESS_CODE || !statusResponse.data) {
      return {
        committed: false,
        success: false,
        errorMessage: statusResponse.message,
      };
    }

    /** 合并 Git status 中的全部变更文件路径（去重） */
    const fileIds = mergeGitStatusFileIds(statusResponse.data);
    if (fileIds.length === 0) {
      return { committed: false, success: true };
    }

    const commitResponse = await apiGitCommit({
      ...workspaceParams,
      message: dict(
        'PC.Components.FileTreePanel.GitVersionRecord.autoSaveBeforeRestoreMessage',
      ),
      files: fileIds,
    });

    if (commitResponse.code !== SUCCESS_CODE) {
      return {
        committed: true,
        success: false,
        errorMessage: commitResponse.message,
      };
    }

    return { committed: true, success: true };
  } catch {
    return { committed: false, success: false };
  }
}
