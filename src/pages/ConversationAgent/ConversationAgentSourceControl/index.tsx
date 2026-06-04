import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { getFileIcon } from '@/utils/fileTree';
import { RightOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import ChangeFileContextMenu from './ChangeFileContextMenu';
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
  /** 当前选中查看 diff 的文件 ID */
  selectedDiffFileId?: string | null;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
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
 * 展示已修改文件列表，支持填写提交说明并提交、点击文件查看 diff
 */
const ConversationAgentSourceControl: React.FC<
  ConversationAgentSourceControlProps
> = ({
  changeFiles,
  stagedFileIds = new Set<string>(),
  isCommitting = false,
  selectedDiffFileId,
  onCommit,
  onFileClick,
  onOpenChanges,
  onOpenFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onAddToGitignore,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [changesExpanded, setChangesExpanded] = useState(true);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuFileId, setContextMenuFileId] = useState<string | null>(
    null,
  );
  /** 修改文件列表引用 */
  const changesListRef = useRef<HTMLDivElement>(null);

  /** 修改文件列表 */
  const changeItems = useMemo(
    () =>
      changeFiles.map((item) => {
        console.log('item', item);
        const segments = item.fileId.split('/');
        /** 文件名 */
        const fileName = segments[segments.length - 1] || item.fileId;
        /** 文件路径 */
        const parentPath = item.fileId;
        /** 是否暂存 */
        const isStaged = stagedFileIds.has(item.fileId);
        /** 文件状态 */
        const statusMeta = resolveChangeFileStatus(item, isStaged);

        return {
          ...item,
          fileName,
          parentPath,
          statusMeta,
        };
      }),
    [changeFiles, stagedFileIds],
  );

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

  return (
    <div className={cx(styles['source-control'])}>
      {/* 源代码管理标题 */}
      <div className={cx(styles.header)}>
        <span className={cx(styles.title)}>
          {dict('PC.Pages.ConversationAgentSourceControl.title')}
        </span>
      </div>

      {/* 提交框 */}
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

      {/* 修改文件列表 */}
      <div className={cx(styles['changes-section'])}>
        <div
          className={cx(styles['changes-header'])}
          onClick={() => setChangesExpanded((prev) => !prev)}
        >
          <div className={cx(styles['changes-title'])}>
            <span
              className={cx(styles['changes-expand-icon'], {
                [styles['changes-expand-icon-expanded']]: changesExpanded,
              })}
              aria-hidden
            >
              <RightOutlined />
            </span>
            <span>
              {dict('PC.Pages.ConversationAgentSourceControl.changes')}
            </span>
          </div>
          {/* 修改文件数量 */}
          <span className={cx(styles['changes-count'])}>
            {changeFiles.length}
          </span>
        </div>

        {/* 修改文件列表 */}
        {changesExpanded && (
          <div ref={changesListRef} className={cx(styles['changes-list'])}>
            {changeItems.length ? (
              changeItems.map((item) => (
                <div
                  key={item.fileId}
                  className={cx(styles['change-item'], {
                    [styles['change-item-active']]:
                      selectedDiffFileId === item.fileId,
                  })}
                  onClick={() => onFileClick?.(item.fileId)}
                  onContextMenu={(e) => handleContextMenu(e, item.fileId)}
                  title={item.fileId}
                >
                  {/* 文件图标 */}
                  <span className={cx(styles['file-icon'])}>
                    {getFileIcon(item.fileName)}
                  </span>
                  <div className={cx(styles['file-info'])}>
                    {/* 文件名 */}
                    <span className={cx(styles['file-name'])}>
                      {item.fileName}
                    </span>

                    {/* 文件路径 */}
                    {item.parentPath && (
                      <span className={cx(styles['file-path'])}>
                        {item.parentPath}
                      </span>
                    )}
                  </div>
                  {/* 文件状态 */}
                  <span
                    className={cx(
                      styles['status-badge'],
                      styles[`status-badge--${item.statusMeta.kind}`],
                      {
                        [styles['status-badge--staged']]:
                          item.statusMeta.isStaged,
                      },
                    )}
                  >
                    {item.statusMeta.label}
                  </span>
                </div>
              ))
            ) : (
              // 空状态
              <div className={cx(styles['empty-state'])}>
                {dict('PC.Pages.ConversationAgentSourceControl.noChanges')}
              </div>
            )}
          </div>
        )}
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
