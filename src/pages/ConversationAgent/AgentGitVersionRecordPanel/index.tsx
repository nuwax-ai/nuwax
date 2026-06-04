import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGitLogList,
  apiGitRollback,
} from '@/pages/ConversationAgent/services/git-version-management';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { formatTimeAgo } from '@/utils/common';
import { EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Empty, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AgentGitVersionRecordPanelProps {
  /** 开发会话 ID（沙箱 cId） */
  conversationId?: number;
  /** 无 author 时的默认展示名 */
  defaultAuthor?: string;
  /** 查看某次提交的变更 */
  onViewChanges?: (commit: any) => void;
  /** 回滚成功后的回调（如刷新文件树） */
  onRollbackSuccess?: () => void;
  className?: string;
}

const getShortHash = (commit: any): string =>
  commit.shortHash || commit.commitHash?.slice(0, 7) || '';

/**
 * 编排面板「版本」Tab：Git 提交记录列表
 * 布局参考版本记录设计稿（hash、标签、相对时间、查看变更、回滚）
 */
const AgentGitVersionRecordPanel: React.FC<AgentGitVersionRecordPanelProps> = ({
  conversationId,
  defaultAuthor = 'NuwaPilot',
  onViewChanges,
  onRollbackSuccess,
  className,
}) => {
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [rollbackLoadingHash, setRollbackLoadingHash] = useState<string | null>(
    null,
  );

  const {
    data: logResponse,
    loading,
    run: fetchLog,
  } = useRequest(
    (cid: number) =>
      apiGitLogList({
        workspaceType: 'taskAgent',
        cid,
      }),
    {
      manual: true,
      onSuccess: (res) => {
        if (res?.code !== SUCCESS_CODE) {
          message.error(
            res?.message ||
              dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.loadFailed',
              ),
          );
        }
      },
      onError: () => {
        message.error(
          dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.loadFailed'),
        );
      },
    },
  );

  const logData: any =
    logResponse?.code === SUCCESS_CODE ? logResponse.data : undefined;

  const commits = useMemo(() => {
    const list = logData?.commits ?? [];
    return list.map((item: any, index: number) => ({
      ...item,
      tag: item.tag ?? (index === 0 ? ('latest' as any) : undefined),
    }));
  }, [logData?.commits]);

  const branch = logData?.branch ?? 'main';
  const total = logData?.total ?? commits.length;

  // useEffect(() => {
  //   if (conversationId) {
  //     fetchLog(conversationId);
  //   }
  // }, [conversationId, fetchLog]);

  useEffect(() => {
    if (commits.length > 0) {
      setSelectedHash(commits[0].commitHash);
    } else {
      setSelectedHash(null);
    }
  }, [commits]);

  const handleViewChanges = useCallback(
    (commit: any) => {
      setSelectedHash(commit.commitHash);
      if (onViewChanges) {
        onViewChanges(commit);
        return;
      }
      message.info(
        dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.viewChangesTip'),
      );
    },
    [onViewChanges],
  );

  const handleRollback = useCallback(
    (commit: any) => {
      if (!conversationId) {
        return;
      }
      const shortHash = getShortHash(commit);
      modalConfirm(
        dict(
          'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackConfirmTitle',
        ),
        dict(
          'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackConfirmContent',
        ).replace('{0}', shortHash),
        async () => {
          setRollbackLoadingHash(commit.commitHash);
          try {
            const { code, message: msg } = await apiGitRollback({
              workspaceType: 'taskAgent',
              cid: conversationId,
              target: commit.commitHash,
            });
            if (code === SUCCESS_CODE) {
              message.success(
                dict(
                  'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackSuccess',
                ),
              );
              fetchLog(conversationId);
              onRollbackSuccess?.();
            } else {
              message.error(
                msg ||
                  dict(
                    'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackFailed',
                  ),
              );
            }
          } catch {
            message.error(
              dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackFailed',
              ),
            );
          } finally {
            setRollbackLoadingHash(null);
          }
        },
      );
    },
    [conversationId, fetchLog, onRollbackSuccess],
  );

  const renderTag = (tag?: any) => {
    if (!tag) {
      return null;
    }
    const label =
      tag === 'latest'
        ? dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.tagLatest')
        : dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.tagStable');
    return (
      <span className={cx(styles.tag, styles[`tag-${tag}`])}>{label}</span>
    );
  };

  if (!conversationId) {
    return (
      <div className={cx(styles.panel, className)}>
        <Empty
          description={dict(
            'PC.Pages.ConversationAgent.AgentGitVersionRecord.noConversation',
          )}
        />
      </div>
    );
  }

  return (
    <div className={cx(styles.panel, className)}>
      <header className={cx(styles.header)}>
        <h2 className={cx(styles.title)}>
          {dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.title')}
        </h2>
        <p className={cx(styles.subtitle)}>
          {dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.subtitle')
            .replace('{0}', String(total))
            .replace('{1}', branch)}
        </p>
      </header>

      <div className={cx(styles.list, 'scroll-container')}>
        {loading ? (
          <div className={cx(styles['list-loading'])}>
            <Loading />
          </div>
        ) : commits.length === 0 ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Empty
              description={dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.empty',
              )}
            />
          </div>
        ) : (
          commits.map((commit: any) => {
            const isActive = selectedHash === commit.commitHash;
            const isRollbackLoading = rollbackLoadingHash === commit.commitHash;
            return (
              <div
                key={commit.commitHash}
                className={cx(styles.item, {
                  [styles['item-active']]: isActive,
                })}
                onClick={() => setSelectedHash(commit.commitHash)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedHash(commit.commitHash);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={cx(styles['item-top'])}>
                  <div className={cx(styles['item-hash-row'])}>
                    <span className={cx(styles.hash)}>
                      {getShortHash(commit)}
                    </span>
                    {renderTag(commit.tag)}
                  </div>
                  <span className={cx(styles.time)}>
                    {formatTimeAgo(commit.committedAt)}
                  </span>
                </div>
                <p className={cx(styles.message)}>{commit.message}</p>
                <span className={cx(styles.author)}>
                  {commit.author || defaultAuthor}
                </span>
                <div className={cx(styles.actions)}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    className={cx(styles['btn-view'])}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewChanges(commit);
                    }}
                  >
                    {dict(
                      'PC.Pages.ConversationAgent.AgentGitVersionRecord.viewChanges',
                    )}
                  </Button>
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    className={cx(styles['btn-rollback'])}
                    loading={isRollbackLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRollback(commit);
                    }}
                  >
                    {dict(
                      'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollback',
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AgentGitVersionRecordPanel;
