import TooltipIcon from '@/components/custom/TooltipIcon';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { ReloadOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import ChangeFileContextMenu from './ChangeFileContextMenu';
import ChangeFileListSection, {
  type ChangeListViewMode,
} from './ChangeFileListSection';
import { resolveChangeFileStatus } from './changeFileStatus';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationAgentSourceControlProps {
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 已暂存的文件 ID 集合 */
  stagedFileIds?: Set<string>;
  /** 是否正在提交 */
  isCommitting?: boolean;
  /** 是否正在刷新 Git 列表 */
  isRefreshing?: boolean;
  /** 当前选中查看 diff 的文件 ID */
  selectedDiffFileId?: string | null;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
  /** 刷新 Git 变更列表 */
  onRefresh?: () => void | Promise<void>;
  /** 点击修改项查看 diff */
  onFileClick?: (fileId: string) => void;
  /** 打开更改（diff） */
  onOpenChanges?: (fileId: string) => void;
  /** 打开文件 */
  onOpenFile?: (fileId: string) => void;
  /** 放弃更改 */
  onDiscardChange?: (fileId: string) => void;
  /** 暂存更改 */
  onStageChange?: (fileId: string) => void;
  /** 取消暂存 */
  onUnstageChange?: (fileId: string) => void;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
}

/**
 * ConversationAgent 源代码管理面板
 * 展示暂存/未暂存变更，支持刷新、列表/树形切换、提交与 diff 预览
 */
const ConversationAgentSourceControl: React.FC<
  ConversationAgentSourceControlProps
> = ({
  changeFiles,
  stagedFileIds = new Set<string>(),
  isCommitting = false,
  isRefreshing = false,
  selectedDiffFileId,
  onCommit,
  onRefresh,
  onFileClick,
  onOpenChanges,
  onOpenFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onAddToGitignore,
}) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [viewMode, setViewMode] = useState<ChangeListViewMode>('tree');
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuFileId, setContextMenuFileId] = useState<string | null>(
    null,
  );

  /** 变更项（含文件名、路径、状态角标） */
  const changeItems = useMemo(
    () =>
      changeFiles.map((item) => {
        const segments = item.fileId.split('/');
        /** 文件名 */
        const fileName = segments[segments.length - 1] || item.fileId;
        const isStaged = stagedFileIds.has(item.fileId);
        /** 文件状态 */
        const statusMeta = resolveChangeFileStatus(item, isStaged);

        return {
          ...item,
          fileName,
          parentPath: item.fileId,
          statusMeta,
        };
      }),
    [changeFiles, stagedFileIds],
  );

  const stagedItems = useMemo(
    () => changeItems.filter((item) => stagedFileIds.has(item.fileId)),
    [changeItems, stagedFileIds],
  );

  const unstagedItems = useMemo(
    () => changeItems.filter((item) => !stagedFileIds.has(item.fileId)),
    [changeItems, stagedFileIds],
  );

  /** 是否存在任意变更（暂存或未暂存） */
  const hasAnyChanges = changeItems.length > 0;

  const contextMenuTarget = useMemo(
    () => changeItems.find((item) => item.fileId === contextMenuFileId),
    [changeItems, contextMenuFileId],
  );

  const isContextMenuStaged = contextMenuFileId
    ? stagedFileIds.has(contextMenuFileId)
    : false;

  /** 关闭右键菜单 */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuFileId(null);
  }, []);

  /** 右键打开菜单 */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuFileId(fileId);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [],
  );

  /** 放弃更改（二次确认） */
  const handleDiscardChangeWithConfirm = useCallback(() => {
    if (!contextMenuTarget) {
      return;
    }

    const { fileId, fileName } = contextMenuTarget;
    closeContextMenu();
    modalConfirm(
      dict(
        'PC.Pages.ConversationAgentSourceControl.discardChangesConfirmTitle',
      ),
      fileName,
      () => onDiscardChange?.(fileId),
    );
  }, [closeContextMenu, contextMenuTarget, onDiscardChange]);

  /** 提交修改 */
  const handleCommit = async () => {
    if (!changeFiles.length || isCommitting) {
      return;
    }
    await onCommit?.(commitMessage.trim());
    setCommitMessage('');
  };

  const handleToggleViewMode = useCallback(() => {
    if (!hasAnyChanges) {
      return;
    }
    setViewMode((prev) => (prev === 'tree' ? 'list' : 'tree'));
  }, [hasAnyChanges]);

  const viewToggleTitle =
    viewMode === 'tree'
      ? dict('PC.Pages.ConversationAgentSourceControl.viewAsList')
      : dict('PC.Pages.ConversationAgentSourceControl.viewAsTree');

  return (
    <div className={cx(styles['source-control'])}>
      <div className={cx(styles.header)}>
        <span className={cx(styles.title)}>
          {dict('PC.Pages.ConversationAgentSourceControl.title')}
        </span>
        <div className={cx(styles['header-actions'])}>
          <TooltipIcon
            title={dict('PC.Pages.ConversationAgentSourceControl.refresh')}
            ariaLabel={dict('PC.Pages.ConversationAgentSourceControl.refresh')}
            placement="bottom"
            className={cx(styles['header-action-btn'], {
              [styles['header-action-btn-loading']]: isRefreshing,
            })}
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={() => onRefresh?.()}
          />
          <TooltipIcon
            title={viewToggleTitle}
            ariaLabel={viewToggleTitle}
            placement="bottom"
            className={cx(styles['header-action-btn'], {
              [styles.active]: viewMode === 'list',
              [styles['header-action-btn-disabled']]: !hasAnyChanges,
            })}
            icon={<UnorderedListOutlined />}
            onClick={hasAnyChanges ? handleToggleViewMode : undefined}
          />
        </div>
      </div>

      <div className={cx(styles['commit-box'])}>
        <Input.TextArea
          className={cx(styles['message-input'])}
          placeholder={dict(
            'PC.Pages.ConversationAgentSourceControl.commitMessage',
          )}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={isCommitting}
        />
        <Button
          type="primary"
          className={cx(styles['commit-btn'])}
          onClick={handleCommit}
          loading={isCommitting}
          disabled={!changeFiles.length}
        >
          {dict('PC.Pages.ConversationAgentSourceControl.commit')}
        </Button>
      </div>

      <div className={cx(styles['changes-scroll'])}>
        {stagedItems.length > 0 && (
          <ChangeFileListSection
            title={dict(
              'PC.Pages.ConversationAgentSourceControl.stagedChanges',
            )}
            items={stagedItems}
            viewMode={viewMode}
            selectedDiffFileId={selectedDiffFileId}
            onFileClick={onFileClick}
            onContextMenu={handleContextMenu}
          />
        )}
        <ChangeFileListSection
          title={dict('PC.Pages.ConversationAgentSourceControl.changes')}
          items={unstagedItems}
          viewMode={viewMode}
          selectedDiffFileId={selectedDiffFileId}
          emptyText={dict('PC.Pages.ConversationAgentSourceControl.noChanges')}
          onFileClick={onFileClick}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* 源代码管理菜单 */}
      <ChangeFileContextMenu
        /** 是否显示菜单 */
        visible={contextMenuVisible}
        /** 菜单位置 */
        position={contextMenuPosition}
        /** 是否暂存 */
        isStaged={isContextMenuStaged}
        /** 关闭菜单 */
        onClose={closeContextMenu}
        /** 打开更改（diff） */
        onOpenChanges={() =>
          contextMenuTarget && onOpenChanges?.(contextMenuTarget.fileId)
        }
        /** 打开文件 */
        onOpenFile={() =>
          contextMenuTarget && onOpenFile?.(contextMenuTarget.fileId)
        }
        /** 放弃更改 */
        onDiscardChange={handleDiscardChangeWithConfirm}
        /** 暂存更改 */
        onStageChange={() =>
          contextMenuTarget && onStageChange?.(contextMenuTarget.fileId)
        }
        /** 取消暂存 */
        onUnstageChange={() =>
          contextMenuTarget && onUnstageChange?.(contextMenuTarget.fileId)
        }
        /** 添加到 .gitignore */
        onAddToGitignore={() =>
          contextMenuTarget && onAddToGitignore?.(contextMenuTarget.fileId)
        }
      />
    </div>
  );
};

export default ConversationAgentSourceControl;
