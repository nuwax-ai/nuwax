import {
  buildGitWorkspaceParams,
  isGitWorkspaceReady,
  type GitWorkspaceConfig,
} from '@/components/business-component/FileTreePanel/hooks/buildGitWorkspaceParams';
import {
  apiGitLogList,
  apiGitRevert,
} from '@/components/business-component/FileTreePanel/services/git-version-management';
import type { GitCommitLogItem } from '@/components/business-component/FileTreePanel/types/git-version-management';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { formatTimeAgo } from '@/utils/common';
import { EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Empty, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GitVersionCommitChangesPanel from './GitVersionCommitChangesPanel';
import styles from './index.less';

const cx = classNames.bind(styles);

/** Git log 每页条数 */
const GIT_LOG_PAGE_SIZE = 20;

/** 列表滚动容器 ID（InfiniteScroll 挂载目标） */
const GIT_VERSION_LIST_SCROLL_ID = 'gitVersionRecordList';

export interface GitVersionRecordPanelProps {
  /** Git 工作空间（pageApp / taskAgent） */
  workspace?: GitWorkspaceConfig;
  /** 无 author 时的默认展示名 */
  defaultAuthor?: string;
  /** 查看某次提交的变更 */
  onViewChanges?: (commit: GitCommitLogItem) => void;
  /** 回滚成功后的回调（如刷新文件树） */
  onRollbackSuccess?: () => void;
  /** 自定义根节点类名 */
  className?: string;
}

/**
 * 获取提交的短 hash（优先 shortHash，否则取 commitHash 前 7 位）
 */
const getShortHash = (commit: GitCommitLogItem): string =>
  commit.shortHash || commit.commitHash?.slice(0, 7) || '';

/**
 * 根据工作空间类型返回空状态文案
 */
const getWorkspaceEmptyDescription = (workspace?: GitWorkspaceConfig) => {
  if (workspace?.workspaceType === 'pageApp') {
    return dict('PC.Components.FileTreePanel.GitVersionRecord.noProject');
  }
  return dict(
    'PC.Pages.ConversationAgent.AgentGitVersionRecord.noConversation',
  );
};

/**
 * Git 版本记录面板
 *
 * 功能：展示 Git 提交历史列表，支持滚动分页加载、查看变更、回滚到指定提交。
 * 适用场景：AppDev（pageApp）、ConversationAgent（taskAgent）等工作空间。
 *
 * 注意事项：
 * - workspaceParams 仅依赖 workspaceKey，避免父组件内联 workspace 对象触发重复请求
 * - 列表滚动到底部时通过 InfiniteScrollDiv 自动加载下一页
 */
const GitVersionRecordPanel: React.FC<GitVersionRecordPanelProps> = ({
  workspace,
  defaultAuthor = 'NuwaPilot',
  onViewChanges,
  onRollbackSuccess,
  className,
}) => {
  // ---------- 列表与交互状态 ----------
  /** 当前高亮选中的提交 hash */
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  /** 正在执行回滚的提交 hash（用于按钮 loading） */
  const [rollbackLoadingHash, setRollbackLoadingHash] = useState<string | null>(
    null,
  );
  /** 已加载的提交列表（多页累加） */
  const [commits, setCommits] = useState<GitCommitLogItem[]>([]);
  /** 当前分支名 */
  const [branch, setBranch] = useState('main');
  /** 提交总数（接口返回，用于判断是否还有更多） */
  const [total, setTotal] = useState(0);
  /** 当前已加载到的页码 */
  const [currentPage, setCurrentPage] = useState(0);
  /** 首屏/刷新加载中 */
  const [loading, setLoading] = useState(false);
  /** 滚动加载下一页中 */
  const [loadingMore, setLoadingMore] = useState(false);
  /** 当前查看变更详情的提交（非空时展示变更文件列表） */
  const [activeCommit, setActiveCommit] = useState<GitCommitLogItem | null>(
    null,
  );

  const workspaceReady = workspace ? isGitWorkspaceReady(workspace) : false;

  /** 是否还有未加载的提交 */
  const hasMore = commits.length < total;

  /** 为列表项补充展示标签（首条默认标记为 latest） */
  const commitsWithTags = useMemo(
    () =>
      commits.map((item, index) => ({
        ...item,
        tag: item.tag ?? (index === 0 ? ('latest' as const) : undefined),
      })),
    [commits],
  );

  /** 工作空间唯一标识：pageApp 用 projectId，taskAgent 用 cid */
  const workspaceKey =
    workspace?.workspaceType === 'pageApp'
      ? workspace.projectId
      : workspace?.workspaceType === 'taskAgent'
      ? workspace.cid
      : null;

  /**
   * 稳定的 Git API 请求参数
   * 仅随 workspaceKey / workspaceType 变化，不直接依赖 workspace 对象引用
   */
  const workspaceParams = useMemo(() => {
    if (
      !workspaceReady ||
      workspaceKey === null ||
      workspaceKey === undefined ||
      !workspace?.workspaceType
    ) {
      return null;
    }
    if (workspace.workspaceType === 'pageApp') {
      return buildGitWorkspaceParams({
        workspaceType: 'pageApp',
        projectId: workspaceKey,
      });
    }
    return buildGitWorkspaceParams({
      workspaceType: 'taskAgent',
      cid: workspaceKey,
    });
  }, [workspaceKey, workspace?.workspaceType, workspaceReady]);

  /**
   * 拉取指定页的 Git log
   * @param page 页码，从 1 开始
   * @param append true 时追加到 commits，false 时替换（首屏/刷新）
   */
  const fetchLogPage = useCallback(
    async (page: number, append: boolean) => {
      if (!workspaceParams) {
        return;
      }

      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await apiGitLogList({
          ...workspaceParams,
          page,
          pageSize: GIT_LOG_PAGE_SIZE,
        });

        if (res?.code !== SUCCESS_CODE) {
          message.error(
            res?.message ||
              dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.loadFailed',
              ),
          );
          return;
        }

        const data = res.data;
        const newCommits = data?.commits ?? [];

        setBranch(data?.branch ?? 'main');
        setTotal(data?.total ?? newCommits.length);
        setCurrentPage(page);
        setCommits((prev) => (append ? [...prev, ...newCommits] : newCommits));
      } catch {
        message.error(
          dict('PC.Pages.ConversationAgent.AgentGitVersionRecord.loadFailed'),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workspaceParams],
  );

  /** 重置列表并重新从第 1 页加载（回滚成功后调用） */
  const refreshLog = useCallback(() => {
    setSelectedHash(null);
    setActiveCommit(null);
    setCommits([]);
    setTotal(0);
    setCurrentPage(0);
    void fetchLogPage(1, false);
  }, [fetchLogPage]);

  /** 打开某次提交的变更文件列表 */
  const openCommitChanges = useCallback(
    (commit: GitCommitLogItem) => {
      setSelectedHash(commit.commitHash);
      if (onViewChanges) {
        onViewChanges(commit);
        return;
      }
      setActiveCommit(commit);
    },
    [onViewChanges],
  );

  /** 滚动触底时加载下一页 */
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    void fetchLogPage(currentPage + 1, true);
  }, [loading, loadingMore, hasMore, currentPage, fetchLogPage]);

  // 工作空间切换时重置并拉取首屏数据
  useEffect(() => {
    if (!workspaceReady || !workspaceParams) {
      return;
    }
    setSelectedHash(null);
    setActiveCommit(null);
    setCommits([]);
    setTotal(0);
    setCurrentPage(0);
    void fetchLogPage(1, false);
  }, [
    workspaceKey,
    workspace?.workspaceType,
    workspaceReady,
    workspaceParams,
    fetchLogPage,
  ]);

  // 首屏加载完成后默认选中第一条提交
  useEffect(() => {
    if (commits.length > 0 && !selectedHash) {
      setSelectedHash(commits[0].commitHash);
    } else if (commits.length === 0) {
      setSelectedHash(null);
    }
  }, [commits, selectedHash]);

  /** 查看某次提交的变更（与点击列表项行为一致） */
  const handleViewChanges = useCallback(
    (commit: GitCommitLogItem) => {
      openCommitChanges(commit);
    },
    [openCommitChanges],
  );

  /** 回滚到指定提交，需二次确认 */
  const handleRollback = useCallback(
    (commit: GitCommitLogItem) => {
      if (!workspaceParams) {
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
            const { code, message: msg } = await apiGitRevert({
              ...workspaceParams,
              target: commit.commitHash,
            });
            if (code === SUCCESS_CODE) {
              message.success(
                dict(
                  'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackSuccess',
                ),
              );
              refreshLog();
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
    [workspaceParams, refreshLog, onRollbackSuccess],
  );

  /** 渲染 latest / stable 标签 */
  const renderTag = (tag?: GitCommitLogItem['tag']) => {
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

  // 工作空间 ID 未就绪时展示空状态
  if (!workspaceReady) {
    return (
      <div className={cx(styles.panel, className)}>
        <Empty description={getWorkspaceEmptyDescription(workspace)} />
      </div>
    );
  }

  if (activeCommit && workspaceParams) {
    return (
      <GitVersionCommitChangesPanel
        className={className}
        commit={activeCommit}
        branch={branch}
        workspaceParams={workspaceParams}
        defaultAuthor={defaultAuthor}
        onBack={() => setActiveCommit(null)}
        onRollbackSuccess={() => {
          refreshLog();
          onRollbackSuccess?.();
        }}
      />
    );
  }

  return (
    <div className={cx(styles.panel, className)}>
      {/* 标题区：总提交数 + 分支名 */}
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

      {/* 提交列表：支持滚动分页 */}
      <div
        id={GIT_VERSION_LIST_SCROLL_ID}
        className={cx(styles.list, 'scroll-container')}
      >
        {loading && commits.length === 0 ? (
          // 首屏加载
          <div className={cx(styles['list-loading'])}>
            <Loading />
          </div>
        ) : commits.length === 0 ? (
          // 无提交记录
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
          // 滚动到底部自动 loadMore
          <InfiniteScrollDiv
            scrollableTarget={GIT_VERSION_LIST_SCROLL_ID}
            list={commits}
            hasMore={hasMore}
            onScroll={loadMore}
            showLoader={loadingMore}
          >
            {commitsWithTags.map((commit) => {
              const isActive = selectedHash === commit.commitHash;
              const isRollbackLoading =
                rollbackLoadingHash === commit.commitHash;
              return (
                // 单条提交：hash、消息、作者、查看变更、回滚
                <div
                  key={commit.commitHash}
                  className={cx(styles.item, {
                    [styles['item-active']]: isActive,
                  })}
                  onClick={() => openCommitChanges(commit)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openCommitChanges(commit);
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
            })}
          </InfiniteScrollDiv>
        )}
      </div>
    </div>
  );
};

export default GitVersionRecordPanel;
