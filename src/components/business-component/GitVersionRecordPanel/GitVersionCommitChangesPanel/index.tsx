import ChangeFileGitDiffView from '@/components/business-component/ChangeFileGitDiffView';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { getFileIcon } from '@/utils/fileTree';
import {
  BranchesOutlined,
  DownOutlined,
  LeftOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DiffModeEnum } from '@git-diff-view/react';
import { Button, Empty, Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  GitCommitDiffFileItem,
  GitCommitDiffFileStatus,
  GitCommitLogItem,
} from '../../FileTreeGitSourcePanel/types/git-version-management';
import { getDisplayHash } from '../commitListUtils';
import {
  fetchGitCommitDiffFiles,
  getLineDiffStats,
} from '../gitCommitDiffUtils';
import GitVersionRollbackConfirmModal from '../GitVersionRollbackConfirmModal';
import { useGitVersionRollback } from '../useGitVersionRollback';
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
  onBack: () => void;
  onRollbackSuccess?: () => void;
  className?: string;
}

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
  onBack,
  onRollbackSuccess,
  className,
}) => {
  const [files, setFiles] = useState<GitCommitDiffFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    rollbackCommit,
    rollbackModalOpen,
    rollbackLoading,
    openRollbackConfirm,
    closeRollbackConfirm,
    confirmRollback,
  } = useGitVersionRollback({
    workspaceParams,
    onSuccess: onRollbackSuccess,
  });
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

  /** 判断文件是否匹配搜索关键词（路径或变更内容） */
  const matchesSearchKeyword = useCallback(
    (file: GitCommitDiffFileItem, keyword: string) => {
      if (file.path.toLowerCase().includes(keyword)) {
        return true;
      }

      const cached = fileContentMap[file.path];
      const oldContent = (
        cached?.oldContent ??
        file.oldContent ??
        ''
      ).toLowerCase();
      const newContent = (
        cached?.newContent ??
        file.newContent ??
        ''
      ).toLowerCase();

      return oldContent.includes(keyword) || newContent.includes(keyword);
    },
    [fileContentMap],
  );

  // 搜索过滤文件列表（按路径或文件内容）
  const filteredFiles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return files;
    }
    return files.filter((file) => matchesSearchKeyword(file, keyword));
  }, [files, searchKeyword, matchesSearchKeyword]);

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

  // 打开回滚确认弹窗
  const handleRollback = useCallback(() => {
    openRollbackConfirm(commit);
  }, [commit, openRollbackConfirm]);

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
      {/* 顶部栏 */}
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

      {/* 提交卡片 */}
      <div className={cx(styles['commit-card'])}>
        <div className={cx(styles['commit-card-top'])}>
          <div className={cx(styles['commit-hash'])}>
            {getDisplayHash(commit.hash)}
          </div>
          <div className={cx(styles['commit-meta'])}>
            {commit.author_name} · {formatTimeAgo(commit.date)}
          </div>
        </div>
        <p className={cx(styles['commit-message'])}>{commit.message}</p>
        <Button
          type="primary"
          loading={rollbackLoading}
          onClick={handleRollback}
          style={{ marginTop: 8 }}
        >
          {dict('PC.Components.FileTreePanel.GitVersionRecord.revertToVersion')}
        </Button>
      </div>

      {/* 工具栏 */}
      <div className={cx(styles.toolbar)}>
        <span className={cx(styles['file-count'])}>
          {dict(
            'PC.Components.FileTreePanel.GitVersionRecord.changedFileCount',
          ).replace('{0}', String(files.length))}
        </span>
        <div className={cx(styles['toolbar-right'])}>
          {/* 对比模式切换 */}
          <div className={cx(styles['diff-mode-toggle'])} role="group">
            <button
              type="button"
              className={cx(styles['diff-mode-option'], {
                [styles['diff-mode-option-active']]:
                  diffViewMode === DiffModeEnum.Unified,
              })}
              aria-pressed={diffViewMode === DiffModeEnum.Unified}
              onClick={() => setDiffViewMode(DiffModeEnum.Unified)}
            >
              {dict('PC.Components.FileTreePanel.GitVersionRecord.diffUnified')}
            </button>
            <button
              type="button"
              className={cx(styles['diff-mode-option'], {
                [styles['diff-mode-option-active']]:
                  diffViewMode === DiffModeEnum.Split,
              })}
              aria-pressed={diffViewMode === DiffModeEnum.Split}
              onClick={() => setDiffViewMode(DiffModeEnum.Split)}
            >
              {dict('PC.Components.FileTreePanel.GitVersionRecord.diffSplit')}
            </button>
          </div>

          {/* 搜索输入框 */}
          <Input
            allowClear
            className={cx(styles['search-input'])}
            prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
            placeholder={dict(
              'PC.Components.FileTreePanel.GitVersionRecord.searchPlaceholder',
            )}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* 文件列表 */}
      <div className={cx(styles['file-list'])}>
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
                  {/* 文件名 */}
                  <div className={cx(styles['file-row-left'])}>
                    {getFileIcon(getFileName(file.path))}
                    <span className={cx(styles['file-path'])} title={file.path}>
                      {file.path}
                    </span>
                  </div>

                  {/* 文件状态 */}
                  <div className={cx(styles['file-row-right'])}>
                    {/* 新增行数 */}
                    {stats.additions > 0 && (
                      <span className={cx(styles['diff-stats-added'])}>
                        +{stats.additions}
                      </span>
                    )}

                    {/* 删除行数 */}
                    {stats.deletions > 0 && (
                      <span className={cx(styles['diff-stats-deleted'])}>
                        -{stats.deletions}
                      </span>
                    )}

                    {/* 文件状态 */}
                    <span
                      className={cx(
                        styles['status-tag'],
                        styles[`status-tag-${file.status}`],
                      )}
                    >
                      {getStatusLabel(file.status)}
                    </span>

                    {/* 展开图标 */}
                    <DownOutlined
                      className={cx(styles['expand-icon'], {
                        [styles.expanded]: isExpanded,
                      })}
                    />
                  </div>
                </div>

                {/* 文件差异 */}
                {isExpanded && renderFileDiff(file)}
              </div>
            );
          })
        )}
      </div>

      {/* 回滚确认弹窗 */}
      <GitVersionRollbackConfirmModal
        open={rollbackModalOpen}
        commit={rollbackCommit}
        loading={rollbackLoading}
        onCancel={closeRollbackConfirm}
        onConfirm={confirmRollback}
      />
    </div>
  );
};

export default GitVersionCommitChangesPanel;
