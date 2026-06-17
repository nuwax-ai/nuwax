import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { ReloadOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { collectFilesUnderFolder } from '../utils/buildChangeFileTree';
import type { GitWorkspaceConfig } from '../utils/buildGitWorkspaceParams';
import {
  splitChangeFilesForDisplay,
  type ChangeListSection,
  type SelectedChangeFile,
} from '../utils/changeFileStatus';
import {
  runGitDiscard,
  runGitStage,
  runGitUnstage,
} from '../utils/sourceControlGitActions';
import ChangeFileContextMenu from './ChangeFileContextMenu';
import ChangeFileListSection, {
  type ChangeListViewMode,
} from './ChangeFileListSection';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 右键菜单目标 */
type ContextMenuTarget =
  | { kind: 'file'; fileId: string; isStagedSection: boolean }
  | { kind: 'folder'; folderId: string; isStagedSection: boolean };

export interface SourceControlPanelProps {
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** Git 工作空间 */
  gitWorkspace?: GitWorkspaceConfig;
  /** 是否正在提交 */
  isCommitting?: boolean;
  /** 是否正在刷新 Git 列表 */
  isRefreshing?: boolean;
  /** 当前选中的变更文件（含区块） */
  selectedChangeFile?: SelectedChangeFile | null;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
  /** 刷新 Git 变更列表 */
  onRefresh?: () => void | Promise<void>;
  /** 点击修改项查看 diff */
  onFileClick?: (fileId: string, section: ChangeListSection) => void;
  /** 打开更改（diff） */
  onOpenChanges?: (fileId: string, section: ChangeListSection) => void;
  /** 打开文件 */
  onOpenFile?: (fileId: string) => void;
  /** Git discard 成功后的 UI 同步 */
  onAfterDiscardChange?: (fileId: string) => void | Promise<void>;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
}

/**
 * ConversationAgent 源代码管理面板
 * 展示暂存/未暂存变更，支持刷新、列表/树形切换、提交与 diff 预览
 */
const SourceControlPanel: React.FC<SourceControlPanelProps> = ({
  changeFiles,
  gitWorkspace,
  isCommitting = false,
  isRefreshing = false,
  selectedChangeFile,
  onCommit,
  onRefresh,
  onFileClick,
  onOpenChanges,
  onOpenFile,
  onAfterDiscardChange,
  onAddToGitignore,
}) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  // 视图模式：tree / list
  const [viewMode, setViewMode] = useState<ChangeListViewMode>('list');
  // 提交消息
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  // 右键菜单位置
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  // 右键菜单目标
  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTarget | null>(null);

  /** 暂存区 / 更改区列表（map + merge，角标 A/M/D/U/C/R） */
  const { stagedItems, unstagedItems } = useMemo(
    () => splitChangeFilesForDisplay(changeFiles),
    [changeFiles],
  );

  // 变更项列表
  const changeItems = useMemo(
    () => [...stagedItems, ...unstagedItems],
    [stagedItems, unstagedItems],
  );

  /** 是否存在任意变更（暂存或未暂存） */
  const hasAnyChanges = changeItems.length > 0;

  /** 文件右键时，当前文件的变更信息 */
  const contextMenuFile = useMemo(() => {
    if (contextMenuTarget?.kind !== 'file') {
      return undefined;
    }
    const sectionItems = contextMenuTarget.isStagedSection
      ? stagedItems
      : unstagedItems;
    return sectionItems.find(
      (item) => item.fileId === contextMenuTarget.fileId,
    );
  }, [contextMenuTarget, stagedItems, unstagedItems]);

  /** 文件夹右键时，当前区块内该目录下的所有变更文件 */
  const contextMenuFolderFiles = useMemo(() => {
    if (contextMenuTarget?.kind !== 'folder') {
      return [];
    }
    const sectionItems = contextMenuTarget.isStagedSection
      ? stagedItems
      : unstagedItems;
    return collectFilesUnderFolder(sectionItems, contextMenuTarget.folderId);
  }, [contextMenuTarget, stagedItems, unstagedItems]);

  const isContextMenuStaged =
    contextMenuTarget?.kind === 'folder'
      ? contextMenuTarget.isStagedSection
      : contextMenuTarget?.kind === 'file'
      ? contextMenuTarget.isStagedSection
      : false;

  /** 右键目标类型 */
  const contextMenuTargetType =
    contextMenuTarget?.kind === 'folder' ? 'folder' : 'file';

  /** 关闭右键菜单 */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  }, []);

  /** 文件右键打开菜单 */
  const handleContextMenu = useCallback(
    (isStagedSection: boolean) => (e: React.MouseEvent, fileId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuTarget({ kind: 'file', fileId, isStagedSection });
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [],
  );

  /** 树形视图文件夹右键打开菜单 */
  const handleFolderContextMenu = useCallback(
    (isStagedSection: boolean) => (e: React.MouseEvent, folderId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuTarget({
        kind: 'folder',
        folderId,
        isStagedSection,
      });
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [],
  );

  /**
   * 放弃更改：先调用 Git discard，再执行 UI 同步并刷新列表
   * 注意：confirm 的 onOk 需等待 Promise resolve 才会关闭，刷新 Git 列表不阻塞弹窗关闭
   */
  const discardChanges = useCallback(
    async (fileIds: string[]) => {
      if (!gitWorkspace || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitDiscard(gitWorkspace, fileIds);
      if (!isSuccess) {
        return;
      }

      try {
        for (const fileId of fileIds) {
          await onAfterDiscardChange?.(fileId);
        }
      } catch (error) {
        console.error('Discard UI sync failed:', error);
      }

      void onRefresh?.();
    },
    [gitWorkspace, onAfterDiscardChange, onRefresh],
  );

  /** 放弃更改二次确认（统一封装，确保 onOk 返回 Promise 供 Modal 等待） */
  const confirmDiscardChanges = useCallback(
    (
      fileIds: string[],
      content: string,
      title = dict(
        'PC.Pages.ConversationAgentSourceControl.discardChangesConfirmTitle',
      ),
    ) => {
      modalConfirm(title, content, async () => {
        await discardChanges(fileIds);
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      });
    },
    [discardChanges],
  );

  /** 暂存更改（git add） */
  const stageChanges = useCallback(
    async (fileIds: string[]) => {
      if (!gitWorkspace || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitStage(gitWorkspace, fileIds);
      if (isSuccess) {
        await onRefresh?.();
      }
    },
    [gitWorkspace, onRefresh],
  );

  /** 取消暂存（git restore --staged） */
  const unstageChanges = useCallback(
    async (fileIds: string[]) => {
      if (!gitWorkspace || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitUnstage(gitWorkspace, fileIds);
      if (isSuccess) {
        await onRefresh?.();
      }
    },
    [gitWorkspace, onRefresh],
  );

  /** 放弃更改（二次确认） */
  const handleDiscardChangeWithConfirm = useCallback(() => {
    if (contextMenuTarget?.kind === 'file' && contextMenuFile) {
      const { fileId, fileName } = contextMenuFile;
      closeContextMenu();
      confirmDiscardChanges([fileId], fileName);
      return;
    }

    if (contextMenuTarget?.kind === 'folder' && contextMenuFolderFiles.length) {
      const { folderId } = contextMenuTarget;
      const fileIds = contextMenuFolderFiles.map((item) => item.fileId);
      closeContextMenu();
      confirmDiscardChanges(fileIds, folderId);
    }
  }, [
    closeContextMenu,
    confirmDiscardChanges,
    contextMenuFile,
    contextMenuFolderFiles,
    contextMenuTarget,
  ]);

  /** 暂存文件夹下所有更改 */
  const handleStageFolderChanges = useCallback(() => {
    void stageChanges(contextMenuFolderFiles.map((item) => item.fileId));
  }, [contextMenuFolderFiles, stageChanges]);

  /** 取消暂存文件夹下所有更改 */
  const handleUnstageFolderChanges = useCallback(() => {
    void unstageChanges(contextMenuFolderFiles.map((item) => item.fileId));
  }, [contextMenuFolderFiles, unstageChanges]);

  /** 将文件夹下所有文件添加到 .gitignore */
  const handleAddFolderToGitignore = useCallback(() => {
    contextMenuFolderFiles.forEach((item) => onAddToGitignore?.(item.fileId));
  }, [contextMenuFolderFiles, onAddToGitignore]);

  /** 提交修改 */
  const handleCommit = async () => {
    if (!changeFiles.length || isCommitting) {
      return;
    }
    await onCommit?.(commitMessage.trim());
    setCommitMessage('');
  };

  /** 是否为合并冲突文件 */
  const isConflictFile = useCallback(
    (fileId: string, section: ChangeListSection) => {
      const item = changeFiles.find((file) => file.fileId === fileId);
      if (!item) {
        return false;
      }
      return section === 'staged'
        ? item.stagedStatus === 'conflict'
        : item.unstagedStatus === 'conflict';
    },
    [changeFiles],
  );

  /**
   * 点击变更文件：冲突文件打开代码编辑器，其余文件打开 diff 对比
   */
  const handleFileClick = useCallback(
    (fileId: string, section: ChangeListSection) => {
      if (isConflictFile(fileId, section)) {
        onOpenFile?.(fileId);
        return;
      }
      onFileClick?.(fileId, section);
    },
    [isConflictFile, onFileClick, onOpenFile],
  );

  /** 切换视图模式 */
  const handleToggleViewMode = useCallback(() => {
    if (!hasAnyChanges) {
      return;
    }
    setViewMode((prev) => (prev === 'tree' ? 'list' : 'tree'));
  }, [hasAnyChanges]);

  /** 列表行悬停：打开文件 */
  const handleListOpenFile = useCallback(
    (fileId: string) => {
      onOpenFile?.(fileId);
    },
    [onOpenFile],
  );

  /** 列表行悬停：放弃更改（与右键菜单一致，需二次确认） */
  const handleListDiscardChange = useCallback(
    (fileId: string, fileName: string) => {
      confirmDiscardChanges([fileId], fileName);
    },
    [confirmDiscardChanges],
  );

  /** 列表行悬停：暂存更改 */
  const handleListStageChange = useCallback(
    (fileId: string) => {
      void stageChanges([fileId]);
    },
    [stageChanges],
  );

  /** 列表行悬停：取消暂存 */
  const handleListUnstageChange = useCallback(
    (fileId: string) => {
      void unstageChanges([fileId]);
    },
    [unstageChanges],
  );

  /** 区块标题：放弃所有未暂存更改 */
  const handleDiscardAllUnstagedChanges = useCallback(() => {
    if (!unstagedItems.length) {
      return;
    }
    confirmDiscardChanges(
      unstagedItems.map((item) => item.fileId),
      dict('PC.Pages.ConversationAgentSourceControl.changes'),
      dict(
        'PC.Pages.ConversationAgentSourceControl.discardAllChangesConfirmTitle',
      ),
    );
  }, [confirmDiscardChanges, unstagedItems]);

  /** 区块标题：暂存所有未暂存更改 */
  const handleStageAllUnstagedChanges = useCallback(() => {
    void stageChanges(unstagedItems.map((item) => item.fileId));
  }, [stageChanges, unstagedItems]);

  /** 区块标题：取消所有暂存 */
  const handleUnstageAllStagedChanges = useCallback(() => {
    void unstageChanges(stagedItems.map((item) => item.fileId));
  }, [stagedItems, unstageChanges]);

  /** 视图模式切换标题 */
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
          {/* 刷新按钮 */}
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
          {/* 视图模式切换按钮 */}
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

      {/* 提交消息输入框 */}
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
        {/* 提交按钮 */}
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
        {/* 暂存的变更 */}
        {stagedItems.length > 0 && (
          <ChangeFileListSection
            title={dict(
              'PC.Pages.ConversationAgentSourceControl.stagedChanges',
            )}
            items={stagedItems}
            viewMode={viewMode}
            section="staged"
            selectedChangeFile={selectedChangeFile}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu(true)}
            onFolderContextMenu={handleFolderContextMenu(true)}
            onOpenFile={handleListOpenFile}
            onUnstageChange={handleListUnstageChange}
            onUnstageAllChanges={handleUnstageAllStagedChanges}
          />
        )}
        {/* 未暂存的变更 */}
        <ChangeFileListSection
          title={dict('PC.Pages.ConversationAgentSourceControl.changes')}
          items={unstagedItems}
          viewMode={viewMode}
          section="unstaged"
          selectedChangeFile={selectedChangeFile}
          emptyText={dict('PC.Pages.ConversationAgentSourceControl.noChanges')}
          onFileClick={handleFileClick}
          onContextMenu={handleContextMenu(false)}
          onFolderContextMenu={handleFolderContextMenu(false)}
          onOpenFile={handleListOpenFile}
          onDiscardChange={handleListDiscardChange}
          onStageChange={handleListStageChange}
          onDiscardAllChanges={handleDiscardAllUnstagedChanges}
          onStageAllChanges={handleStageAllUnstagedChanges}
        />
      </div>

      {/* 源代码管理菜单 */}
      <ChangeFileContextMenu
        /** 是否显示菜单 */
        visible={contextMenuVisible}
        /** 菜单位置 */
        position={contextMenuPosition}
        /** 右键目标类型 */
        targetType={contextMenuTargetType}
        /** 是否暂存 */
        isStaged={isContextMenuStaged}
        /** 关闭菜单 */
        onClose={closeContextMenu}
        /** 打开更改（diff） */
        onOpenChanges={() => {
          if (!contextMenuFile || contextMenuTarget?.kind !== 'file') {
            return;
          }
          onOpenChanges?.(
            contextMenuFile.fileId,
            contextMenuTarget.isStagedSection ? 'staged' : 'unstaged',
          );
        }}
        /** 打开文件 */
        onOpenFile={() =>
          contextMenuFile && onOpenFile?.(contextMenuFile.fileId)
        }
        /** 放弃更改 */
        onDiscardChange={handleDiscardChangeWithConfirm}
        /** 暂存更改 */
        onStageChange={() => {
          if (contextMenuTarget?.kind === 'file' && contextMenuFile) {
            void stageChanges([contextMenuFile.fileId]);
            return;
          }
          handleStageFolderChanges();
        }}
        /** 取消暂存 */
        onUnstageChange={() => {
          if (contextMenuTarget?.kind === 'file' && contextMenuFile) {
            void unstageChanges([contextMenuFile.fileId]);
            return;
          }
          handleUnstageFolderChanges();
        }}
        /** 添加到 .gitignore */
        onAddToGitignore={() => {
          if (contextMenuTarget?.kind === 'file' && contextMenuFile) {
            onAddToGitignore?.(contextMenuFile.fileId);
            return;
          }
          handleAddFolderToGitignore();
        }}
      />
    </div>
  );
};

export default SourceControlPanel;

/** @deprecated 使用 SourceControlPanel */
export type ConversationAgentSourceControlProps = SourceControlPanelProps;
