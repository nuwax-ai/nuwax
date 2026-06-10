import type { GitCommitLogItem } from '@/components/business-component/FileTreeGitSourcePanel/types/git-version-management';
import { dict } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { getDisplayHash } from '../commitListUtils';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface GitVersionRollbackConfirmModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 待回滚的提交 */
  commit: GitCommitLogItem | null;
  /** 确认按钮 loading */
  loading?: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 确认回滚 */
  onConfirm: () => void;
}

/**
 * Git 版本回滚确认弹窗
 */
const GitVersionRollbackConfirmModal: React.FC<
  GitVersionRollbackConfirmModalProps
> = ({ open, commit, loading = false, onCancel, onConfirm }) => {
  if (!commit) {
    return null;
  }

  const displayHash = getDisplayHash(commit.hash);

  return (
    <Modal
      open={open}
      centered
      width={520}
      destroyOnHidden
      className={cx(styles.modal)}
      title={dict(
        'PC.Components.FileTreePanel.GitVersionRecord.rollbackModalTitle',
      ).replace('{0}', displayHash)}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={loading}>
            {dict('PC.Common.Global.cancel')}
          </Button>
          <Button type="primary" loading={loading} onClick={onConfirm}>
            {dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.rollback')}
          </Button>
        </>
      }
    >
      <div className={cx(styles['summary-card'])}>
        <div className={cx(styles['summary-title'])}>
          {dict(
            'PC.Components.FileTreePanel.GitVersionRecord.rollbackVersionLabel',
          )}{' '}
          <strong>{displayHash}</strong>
        </div>
        <div className={cx(styles['summary-meta'])}>
          {commit.author_name} · {formatTimeAgo(commit.date)}
        </div>
        <p className={cx(styles['summary-message'])}>{commit.message}</p>
      </div>

      <section className={cx(styles.effects)}>
        <div className={cx(styles['effects-title'])}>
          {dict(
            'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectTitle',
          )}
        </div>
        <ul className={cx(styles['effects-list'])}>
          <li className={cx(styles['effects-warning'])}>
            {dict(
              'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectAutoSave',
            )}
          </li>
          <li>
            {dict(
              'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectBranchSync',
            )}
          </li>
          <li>
            {dict(
              'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectWorkspace',
            )}
          </li>
          <li>
            {dict(
              'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectUndoChanges',
            )}
          </li>
          <li>
            {dict(
              'PC.Components.FileTreePanel.GitVersionRecord.rollbackEffectHistory',
            )}
          </li>
        </ul>
      </section>
    </Modal>
  );
};

export default GitVersionRollbackConfirmModal;
