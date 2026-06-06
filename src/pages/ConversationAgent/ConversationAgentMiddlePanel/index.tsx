import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { BranchesOutlined, FolderOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import ConversationAgentFileTree from '../ConversationAgentFileTree';
import ConversationAgentSourceControl from '../ConversationAgentSourceControl';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '../ConversationAgentSourceControl/changeFileStatus';
import type { ConversationAgentFileViewValue } from '../hooks/types';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 中间面板视图类型 */
type MiddlePanelView = 'files' | 'sourceControl';

export interface ConversationAgentMiddlePanelProps {
  /** 文件视图数据 */
  fileView: ConversationAgentFileViewValue;
  className?: string;
  /** 当前选中的变更文件（含区块） */
  selectedChangeFile?: SelectedChangeFile | null;
  /** 选中修改文件，在右侧预览区展示 diff */
  onDiffFileSelect?: (fileId: string, section: ChangeListSection) => void;
  /** 打开文件（选中并预览，非 diff） */
  onOpenChangeFile?: (fileId: string) => void;
  /** 放弃单个文件的更改 */
  onDiscardChange?: (fileId: string) => void;
  /** 暂存更改 */
  onStageChange?: (fileId: string) => void;
  /** 取消暂存 */
  onUnstageChange?: (fileId: string) => void;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
  /** 是否正在提交 */
  isCommitting?: boolean;
}

/**
 * ConversationAgent 中间面板
 * 顶部切换文件树 / 源代码管理，下方展示对应内容
 */
const ConversationAgentMiddlePanel: React.FC<
  ConversationAgentMiddlePanelProps
> = ({
  fileView,
  className,
  selectedChangeFile = null,
  onDiffFileSelect,
  onOpenChangeFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onAddToGitignore,
  onCommit,
  isCommitting = false,
}) => {
  const [activeView, setActiveView] = useState<MiddlePanelView>('files');
  const { tree, changeFiles } = fileView;
  const modifiedCount = changeFiles.length;

  /** 点击修改文件：仅触发 diff 预览，不走文件树选中逻辑 */
  const handleModifiedFileClick = useCallback(
    (fileId: string, section: ChangeListSection) => {
      onDiffFileSelect?.(fileId, section);
    },
    [onDiffFileSelect],
  );

  return (
    <div className={cx(styles['middle-panel'], className)}>
      <div className={cx(styles['icon-bar'])}>
        <div className={cx(styles['icon-bar-item'])}>
          <TooltipIcon
            title={dict('PC.Pages.ConversationAgentMiddlePanel.files')}
            ariaLabel={dict('PC.Pages.ConversationAgentMiddlePanel.files')}
            placement="bottom"
            className={cx(styles['icon-btn'], {
              [styles.active]: activeView === 'files',
            })}
            icon={<FolderOutlined style={{ fontSize: 16 }} />}
            onClick={() => setActiveView('files')}
          />
        </div>
        <div className={cx(styles['icon-bar-item'])}>
          <TooltipIcon
            title={dict('PC.Pages.ConversationAgentMiddlePanel.sourceControl')}
            ariaLabel={dict(
              'PC.Pages.ConversationAgentMiddlePanel.sourceControl',
            )}
            placement="bottom"
            className={cx(styles['icon-btn'], {
              [styles.active]: activeView === 'sourceControl',
            })}
            icon={
              <>
                <BranchesOutlined style={{ fontSize: 16 }} />
                {modifiedCount > 0 && (
                  <span className={cx(styles['icon-badge'])}>
                    {modifiedCount > 99 ? '99+' : modifiedCount}
                  </span>
                )}
              </>
            }
            onClick={() => setActiveView('sourceControl')}
          />
        </div>
      </div>

      <div className={cx(styles['panel-content'])}>
        {activeView === 'files' ? (
          <ConversationAgentFileTree tree={tree} className="w-full h-full" />
        ) : (
          <ConversationAgentSourceControl
            changeFiles={changeFiles}
            isCommitting={isCommitting}
            selectedChangeFile={selectedChangeFile}
            onCommit={onCommit}
            onFileClick={handleModifiedFileClick}
            onOpenChanges={onDiffFileSelect}
            onOpenFile={onOpenChangeFile}
            onDiscardChange={onDiscardChange}
            onStageChange={onStageChange}
            onUnstageChange={onUnstageChange}
            onAddToGitignore={onAddToGitignore}
          />
        )}
      </div>
    </div>
  );
};

export default ConversationAgentMiddlePanel;
