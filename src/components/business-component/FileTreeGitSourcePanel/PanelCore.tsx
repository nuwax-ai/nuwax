import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { BranchesOutlined, FolderOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import FileTreePanel from './FileTreePanel';
import styles from './index.less';
import SourceControlPanel from './SourceControlPanel';
import type { FileTreeGitSourcePanelProps } from './types/file-tree-git-source';

const cx = classNames.bind(styles);

/** 中间面板视图类型 */
type PanelView = 'files' | 'sourceControl';

/**
 * FileTreeGitSourcePanel 公共组件
 * ConversationAgent 中间面板 / AppDev 文件树侧栏的统一壳层
 * 顶部切换文件树 / 源代码管理，统一样式与 Git 面板交互
 */
const FileTreeGitSourcePanel: React.FC<FileTreeGitSourcePanelProps> = ({
  className,
  isCollapsed,
  showSourceControl,
  tree,
  treeClassName,
  treeHeaderClassName,
  treeEmptyState,
  sourceControl,
}) => {
  const [activeView, setActiveView] = useState<PanelView>('files');

  const {
    changeFiles,
    gitWorkspace,
    selectedChangeFile = null,
    isCommitting = false,
    isRefreshingGitList = false,
    onRefreshGitList,
    onCommit,
    onDiffFileSelect,
    onOpenChangeFile,
    onAfterDiscardChange,
    onAddToGitignore,
  } = sourceControl;

  const modifiedCount = changeFiles.length;
  const enableSourceControl = showSourceControl ?? Boolean(onCommit);

  /** 点击修改文件：仅触发 diff 预览，不走文件树选中逻辑 */
  const handleModifiedFileClick = useCallback(
    (fileId: string, section: 'staged' | 'unstaged') => {
      onDiffFileSelect?.(fileId, section);
    },
    [onDiffFileSelect],
  );

  const panelBody = (
    <>
      {enableSourceControl && (
        <div className={cx(styles.iconBar)}>
          {/* 文件 */}
          <div className={cx(styles.iconBarItem)}>
            <TooltipIcon
              title={dict('PC.Pages.ConversationAgentMiddlePanel.files')}
              ariaLabel={dict('PC.Pages.ConversationAgentMiddlePanel.files')}
              placement="bottom"
              className={cx(styles.iconBtn, {
                [styles.active]: activeView === 'files',
              })}
              icon={<FolderOutlined style={{ fontSize: 16 }} />}
              onClick={() => setActiveView('files')}
            />
          </div>
          {/* 源代码管理 */}
          <div className={cx(styles.iconBarItem)}>
            <TooltipIcon
              title={dict(
                'PC.Pages.ConversationAgentMiddlePanel.sourceControl',
              )}
              ariaLabel={dict(
                'PC.Pages.ConversationAgentMiddlePanel.sourceControl',
              )}
              placement="bottom"
              className={cx(styles.iconBtn, {
                [styles.active]: activeView === 'sourceControl',
              })}
              icon={
                <>
                  <BranchesOutlined style={{ fontSize: 16 }} />
                  {modifiedCount > 0 && (
                    <span className={cx(styles.iconBadge)}>
                      {modifiedCount > 99 ? '99+' : modifiedCount}
                    </span>
                  )}
                </>
              }
              onClick={() => setActiveView('sourceControl')}
            />
          </div>
        </div>
      )}

      <div className={cx(styles.panelContent)}>
        {activeView === 'sourceControl' && enableSourceControl ? (
          <div className={cx(styles.sourceControlContainer)}>
            {/* 源代码管理面板 */}
            <SourceControlPanel
              changeFiles={changeFiles}
              gitWorkspace={gitWorkspace}
              isCommitting={isCommitting}
              isRefreshing={isRefreshingGitList}
              selectedChangeFile={selectedChangeFile}
              onRefresh={onRefreshGitList}
              onCommit={onCommit}
              onFileClick={handleModifiedFileClick}
              onOpenChanges={onDiffFileSelect}
              onOpenFile={onOpenChangeFile}
              onAfterDiscardChange={onAfterDiscardChange}
              onAddToGitignore={onAddToGitignore}
            />
          </div>
        ) : (
          // 文件树容器（内部统一渲染 FileTreePanel）
          <div className={cx(styles.fileTreeContainer)}>
            <FileTreePanel
              tree={tree}
              className={treeClassName}
              headerClassName={treeHeaderClassName}
              emptyState={treeEmptyState}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cx(
        styles.panelSidebar,
        'flex',
        'flex-col',
        {
          [styles.collapsed]: isCollapsed,
        },
        className,
      )}
    >
      {panelBody}
    </div>
  );
};

export default FileTreeGitSourcePanel;
