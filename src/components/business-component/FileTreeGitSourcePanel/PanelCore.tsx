import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import {
  BranchesOutlined,
  FolderOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import SourceControlPanel from './SourceControl';
import TaskAgentFileTree from './TaskAgentFileTree';
import styles from './index.less';
import type { FileTreeGitSourcePanelProps } from './types';

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
  layout = 'embedded',
  showSourceControl,
  collapsible = false,
  tree,
  treeClassName,
  treeHeaderClassName,
  treeEmptyState,
  sourceControl,
}) => {
  const [activeView, setActiveView] = useState<PanelView>('files');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          // 文件树容器（内部统一渲染 TaskAgentFileTree）
          <div className={cx(styles.fileTreeContainer)}>
            <TaskAgentFileTree
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

  if (layout === 'sidebar') {
    return (
      <>
        {/* 悬浮折叠/展开按钮 - 放在预览区域左下角 */}
        {collapsible && (
          <Tooltip
            title={
              isCollapsed
                ? dict('PC.Pages.AppDevFileTreePanel.expand')
                : dict('PC.Pages.AppDevFileTreePanel.collapse')
            }
          >
            <Button
              shape="circle"
              size="small"
              icon={isCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={cx(styles.collapseButton, {
                [styles.collapsed]: isCollapsed,
                [styles.expanded]: !isCollapsed,
              })}
            />
          </Tooltip>
        )}

        {/* 文件树侧边栏 / 版本对比文件列表 */}
        <div
          className={cx(styles.panelSidebar, {
            [styles.collapsed]: collapsible && isCollapsed,
          })}
        >
          <Card className={cx(styles.panelCard)} variant="borderless">
            {!(collapsible && isCollapsed) && panelBody}
          </Card>
        </div>
      </>
    );
  }

  return <div className={cx(styles.panel, className)}>{panelBody}</div>;
};

export default FileTreeGitSourcePanel;
