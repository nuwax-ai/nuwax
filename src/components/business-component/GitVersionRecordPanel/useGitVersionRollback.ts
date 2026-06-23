import { apiGitRevert } from '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management';
import type {
  GitCommitLogItem,
  GitTagsParams,
} from '@/components/business-component/FileTreeGitSourcePanel/types/git-version-management';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { commitUncommittedChangesIfAny } from './gitRollbackUtils';

export interface UseGitVersionRollbackOptions {
  workspaceParams: GitTagsParams | null;
  onSuccess?: () => void;
}

/**
 * Git 版本回滚交互：打开确认弹窗并执行回滚
 */
export function useGitVersionRollback({
  workspaceParams,
  onSuccess,
}: UseGitVersionRollbackOptions) {
  const [rollbackCommit, setRollbackCommit] = useState<GitCommitLogItem | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const openRollbackConfirm = useCallback((commit: GitCommitLogItem) => {
    setRollbackCommit(commit);
  }, []);

  const closeRollbackConfirm = useCallback(() => {
    if (loading) {
      return;
    }
    setRollbackCommit(null);
  }, [loading]);

  // 回滚功能，目前使用 git revert 命令
  const confirmRollback = useCallback(async () => {
    if (!workspaceParams || !rollbackCommit) {
      return;
    }

    setLoading(true);
    try {
      const commitResult = await commitUncommittedChangesIfAny(workspaceParams);
      if (!commitResult.success) {
        return;
      }

      const { code } = await apiGitRevert({
        ...workspaceParams,
        target: rollbackCommit.hash,
        // mode: 'mixed',
      });
      if (code === SUCCESS_CODE) {
        message.success(
          dict(
            'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackSuccess',
          ),
        );
        setRollbackCommit(null);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceParams, rollbackCommit, onSuccess]);

  const rollbackLoadingHash = useMemo(
    () => (loading ? rollbackCommit?.hash ?? null : null),
    [loading, rollbackCommit],
  );

  return {
    rollbackCommit,
    rollbackModalOpen: rollbackCommit !== null,
    rollbackLoading: loading,
    rollbackLoadingHash,
    openRollbackConfirm,
    closeRollbackConfirm,
    confirmRollback,
  };
}
