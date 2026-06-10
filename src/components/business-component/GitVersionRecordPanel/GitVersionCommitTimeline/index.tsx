import avatarImage from '@/assets/images/avatar.png';
import { dict } from '@/services/i18nRuntime';
import { UndoOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { GitCommitLogItem } from '../../FileTreeGitSourcePanel/types/git-version-management';
import { formatCommitTime, getDisplayHash } from '../commitListUtils';
import type { CommitDateGroup } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface GitVersionCommitTimelineProps {
  /** 按日期分组后的提交列表 */
  groups: CommitDateGroup[];
  /** 正在回滚的提交 hash */
  rollbackLoadingHash?: string | null;
  /** 点击查看变更 */
  onOpenCommitChanges: (commit: GitCommitLogItem) => void;
  /** 点击回滚 */
  onRollback: (commit: GitCommitLogItem) => void;
}

/**
 * Git 提交时间线列表
 *
 * 按日期分组展示提交历史，支持查看变更与回滚操作。
 */
const GitVersionCommitTimeline: React.FC<GitVersionCommitTimelineProps> = ({
  groups,
  rollbackLoadingHash = null,
  onOpenCommitChanges,
  onRollback,
}) => {
  const renderCommitItem = (commit: GitCommitLogItem) => {
    const isRollbackLoading = rollbackLoadingHash === commit.hash;

    return (
      <div key={commit.hash} className={cx(styles.item)}>
        <div
          className={cx(styles['item-main'])}
          onClick={() => onOpenCommitChanges(commit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onOpenCommitChanges(commit);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <p className={cx(styles.message)}>{commit.message}</p>
          <div className={cx(styles.meta)}>
            <span className={cx(styles.hash)}>
              {getDisplayHash(commit.hash)}
            </span>
            <span className={cx(styles.divider)}>|</span>
            <span className={cx(styles.author)}>
              <span className={cx(styles['author-avatar'])}>
                <img src={avatarImage} alt={commit.author_name} />
              </span>
              {commit.author_name}
            </span>
            <span className={cx(styles.divider)}>|</span>
            <span className={cx(styles.time)}>
              {formatCommitTime(commit.date)}
            </span>
          </div>
        </div>
        <div
          className={cx(styles['item-action'], {
            [styles['item-action-visible']]: isRollbackLoading,
          })}
        >
          <Button
            size="small"
            type="primary"
            icon={<UndoOutlined />}
            loading={isRollbackLoading}
            onClick={(e) => {
              e.stopPropagation();
              onRollback(commit);
            }}
          >
            {dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.rollback')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={cx(styles.timeline)}>
      {groups.map((group) => (
        <section key={group.dateKey} className={cx(styles['date-group'])}>
          <header className={cx(styles['date-header'])}>
            <span className={cx(styles['date-node'])} aria-hidden>
              ◇
            </span>
            <span className={cx(styles['date-label'])}>
              {dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.commitsOn',
              ).replace('{0}', group.dateLabel)}
            </span>
          </header>
          <div className={cx(styles['date-commits'])}>
            {group.commits.map(renderCommitItem)}
          </div>
        </section>
      ))}
    </div>
  );
};

export default GitVersionCommitTimeline;
