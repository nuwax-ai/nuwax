import { apiGitRevert } from '@/components/business-component/FileTreePanel/services/git-version-management';
import type {
  GitCommitDiffFileItem,
  GitCommitDiffFileStatus,
  GitCommitLogItem,
} from '@/components/business-component/FileTreePanel/types/git-version-management';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import ChangeFileGitDiffView from '@/pages/ConversationAgent/ConversationAgentFilePreview/ChangeFileGitDiffView';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { formatTimeAgo } from '@/utils/common';
import { getFileIcon } from '@/utils/fileTree';
import {
  BranchesOutlined,
  DownOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { DiffModeEnum } from '@git-diff-view/react';
import { Button, Empty, Input, Segmented, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGitCommitDiffFiles,
  getLineDiffStats,
} from '../gitCommitDiffUtils';
import styles from './index.less';

const cx = classNames.bind(styles);

type WorkspaceParams = {
  workspaceType: 'pageApp' | 'taskAgent';
  projectId?: number;
  cid?: number;
};

export interface GitVersionCommitChangesPanelProps {
  commit: GitCommitLogItem;
  branch: string;
  workspaceParams: WorkspaceParams;
  defaultAuthor?: string;
  onBack: () => void;
  onRollbackSuccess?: () => void;
  className?: string;
}

const getShortHash = (commit: GitCommitLogItem): string =>
  commit.hash?.slice(0, 7) || '';

const getFileName = (path: string): string => {
  const segments = path.split('/');
  return segments[segments.length - 1] || path;
};

const getStatusLabel = (status: GitCommitDiffFileStatus): string => {
  const keyMap: Record<GitCommitDiffFileStatus, string> = {
    modified: 'PC.Components.FileTreePanel.GitVersionRecord.statusModified',
    added: 'PC.Components.FileTreePanel.GitVersionRecord.statusAdded',
    deleted: 'PC.Components.FileTreePanel.GitVersionRecord.statusDeleted',
    renamed: 'PC.Components.FileTreePanel.GitVersionRecord.statusRenamed',
  };
  return dict(keyMap[status]);
};

/**
 * 单次提交的变更详情：变更文件列表 + 可展开的文件 diff
 */
const GitVersionCommitChangesPanel: React.FC<
  GitVersionCommitChangesPanelProps
> = ({
  commit,
  branch,
  workspaceParams,
  defaultAuthor = 'NuwaPilot',
  onBack,
  onRollbackSuccess,
  className,
}) => {
  const [files, setFiles] = useState<GitCommitDiffFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(
    () => new Set(),
  );
  const [fileContentMap, setFileContentMap] = useState<
    Record<string, GitCommitDiffFileItem>
  >({});
  const [diffViewMode, setDiffViewMode] = useState<DiffModeEnum>(
    DiffModeEnum.Unified,
  );
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载提交的变更文件列表
  const loadCommitFiles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchGitCommitDiffFiles(workspaceParams, commit.hash);
      setFiles(list);
      const contentMap: Record<string, GitCommitDiffFileItem> = {};
      list.forEach((item) => {
        if (item.oldContent || item.newContent) {
          contentMap[item.path] = item;
        }
      });
      setFileContentMap(contentMap);
    } catch {
      setFiles([]);
      setFileContentMap({});
    } finally {
      setLoading(false);
    }
  }, [workspaceParams, commit.hash]);

  useEffect(() => {
    setExpandedPaths(new Set());
    setLoadingPaths(new Set());
    setFileContentMap({});
    setSearchKeyword('');
    void loadCommitFiles();
  }, [loadCommitFiles]);

  const filteredFiles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return files;
    }
    return files.filter((file) => file.path.toLowerCase().includes(keyword));
  }, [files, searchKeyword]);

  /** 确保文件内容已加载 */
  const ensureFileContent = useCallback(
    async (path: string) => {
      if (fileContentMap[path]) {
        return;
      }
      setLoadingPaths((prev) => new Set(prev).add(path));
      try {
        const list = await fetchGitCommitDiffFiles(
          workspaceParams,
          commit.hash,
          [path],
        );
        const target = list.find((item) => item.path === path) ?? list[0];
        if (target) {
          setFileContentMap((prev) => ({ ...prev, [path]: target }));
        }
      } finally {
        setLoadingPaths((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [fileContentMap, workspaceParams, commit.hash],
  );

  const toggleFileExpand = useCallback(
    (path: string) => {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
          void ensureFileContent(path);
        }
        return next;
      });
    },
    [ensureFileContent],
  );

  const handleRollback = useCallback(() => {
    const shortHash = getShortHash(commit);
    modalConfirm(
      dict(
        'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackConfirmTitle',
      ),
      dict(
        'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackConfirmContent',
      ).replace('{0}', shortHash),
      async () => {
        setRollbackLoading(true);
        try {
          const { code, message: msg } = await apiGitRevert({
            ...workspaceParams,
            target: commit.hash,
          });
          if (code === SUCCESS_CODE) {
            message.success(
              dict(
                'PC.Pages.ConversationAgent.AgentGitVersionRecord.rollbackSuccess',
              ),
            );
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
          setRollbackLoading(false);
        }
      },
    );
  }, [commit, workspaceParams, onRollbackSuccess]);

  const renderFileDiff = (file: GitCommitDiffFileItem) => {
    const cached = fileContentMap[file.path] ?? file;
    const isLoadingContent = loadingPaths.has(file.path);

    if (isLoadingContent) {
      return (
        <div className={cx(styles['file-diff-loading'])}>
          <Loading />
        </div>
      );
    }

    return (
      <ChangeFileGitDiffView
        fileId={file.path}
        fileName={getFileName(file.path)}
        originalContent={cached.oldContent}
        modifiedContent={cached.newContent}
        diffViewMode={diffViewMode}
        className={styles['file-diff']}
      />
    );
  };

  return (
    <div className={cx(styles.panel, className)}>
      <div className={cx(styles['top-bar'])}>
        <Button
          type="text"
          icon={<LeftOutlined />}
          className={cx(styles['back-btn'])}
          onClick={onBack}
        >
          {dict('PC.Components.FileTreePanel.GitVersionRecord.backToList')}
        </Button>
        <div className={cx(styles['branch-row'])}>
          <BranchesOutlined />
          <span>{branch}</span>
        </div>
      </div>

      <div className={cx(styles['commit-card'])}>
        <div className={cx(styles['commit-card-top'])}>
          <div className={cx(styles['commit-hash'])}>
            {getShortHash(commit)}
          </div>
          <div className={cx(styles['commit-meta'])}>
            {commit.author_name || defaultAuthor} · {formatTimeAgo(commit.date)}
          </div>
        </div>
        <p className={cx(styles['commit-message'])}>{commit.message}</p>
        <Button
          size="small"
          loading={rollbackLoading}
          onClick={handleRollback}
          style={{ marginTop: 8 }}
        >
          {dict('PC.Components.FileTreePanel.GitVersionRecord.revertToVersion')}
        </Button>
      </div>

      <div className={cx(styles.toolbar)}>
        <span className={cx(styles['file-count'])}>
          {dict(
            'PC.Components.FileTreePanel.GitVersionRecord.changedFileCount',
          ).replace('{0}', String(files.length))}
        </span>
        <div className={cx(styles['toolbar-right'])}>
          <Segmented
            className={cx(styles['diff-mode-segmented'])}
            size="small"
            value={diffViewMode}
            onChange={(value) => setDiffViewMode(value as DiffModeEnum)}
            options={[
              {
                label: dict(
                  'PC.Components.FileTreePanel.GitVersionRecord.diffUnified',
                ),
                value: DiffModeEnum.Unified,
              },
              {
                label: dict(
                  'PC.Components.FileTreePanel.GitVersionRecord.diffSplit',
                ),
                value: DiffModeEnum.Split,
              },
            ]}
          />
          <Input
            allowClear
            size="small"
            className={cx(styles['search-input'])}
            placeholder={dict(
              'PC.Components.FileTreePanel.GitVersionRecord.searchPlaceholder',
            )}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className={cx(styles['file-list'], 'scroll-container')}>
        {loading ? (
          <div className={cx(styles['list-loading'])}>
            <Loading />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className={cx(styles['list-empty'])}>
            <Empty
              description={dict(
                'PC.Components.FileTreePanel.GitVersionRecord.noChangedFiles',
              )}
            />
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isExpanded = expandedPaths.has(file.path);
            const stats =
              file.additions || file.deletions
                ? file
                : {
                    ...file,
                    ...getLineDiffStats(file.oldContent, file.newContent),
                  };

            return (
              <div key={file.path} className={cx(styles['file-block'])}>
                <div
                  className={cx(styles['file-row'])}
                  onClick={() => toggleFileExpand(file.path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleFileExpand(file.path);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={cx(styles['file-row-left'])}>
                    <span className={cx(styles['file-icon'])}>
                      {getFileIcon(getFileName(file.path))}
                    </span>
                    <span className={cx(styles['file-path'])} title={file.path}>
                      {file.path}
                    </span>
                  </div>
                  <div className={cx(styles['file-row-right'])}>
                    {stats.additions > 0 && (
                      <span className={cx(styles['diff-stats-added'])}>
                        +{stats.additions}
                      </span>
                    )}
                    {stats.deletions > 0 && (
                      <span className={cx(styles['diff-stats-deleted'])}>
                        -{stats.deletions}
                      </span>
                    )}
                    <span
                      className={cx(
                        styles['status-tag'],
                        styles[`status-tag-${file.status}`],
                      )}
                    >
                      {getStatusLabel(file.status)}
                    </span>
                    <DownOutlined
                      className={cx(styles['expand-icon'], {
                        [styles.expanded]: isExpanded,
                      })}
                    />
                  </div>
                </div>
                {isExpanded && renderFileDiff(file)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GitVersionCommitChangesPanel;
