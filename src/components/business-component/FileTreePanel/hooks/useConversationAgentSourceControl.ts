/**
 * ConversationAgent 源代码管理 Hook
 * 变更列表由外部 fileView 维护，本 Hook 统一 Git 操作与选中状态
 */
import { fetchGitChangeFileContent } from '@/components/business-component/FileTreePanel/GitVersionRecordPanel/gitCommitDiffUtils';
import {
  buildGitWorkspaceParams,
  isGitWorkspaceReady,
} from '@/components/business-component/FileTreePanel/hooks/buildGitWorkspaceParams';
import { apiGitCommit } from '@/components/business-component/FileTreePanel/services/git-version-management';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '@/components/business-component/FileTreePanel/SourceControl/changeFileStatus';
import { runGitDiscard } from '@/components/business-component/FileTreePanel/SourceControl/sourceControlGitActions';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

/** ConversationAgent 场景外部适配器 */
export interface ConversationAgentSourceControlAdapters {
  /** 保存变更文件到沙箱 */
  saveChangeFiles: (files: ChangeFileInfo[]) => Promise<boolean>;
  /** 放弃单个文件更改（还原编辑器内容） */
  discardChangeFile: (fileId: string) => void;
  /** 打开文件（非 diff） */
  openChangeFile: (fileId: string) => void;
  /** 将文件添加到 .gitignore（由页面实现具体读写逻辑） */
  addFileToGitignore: (fileId: string) => Promise<void>;
  /** diff 选中后的额外操作（如打开预览 Tab） */
  onDiffFileSelect?: (fileId: string, section: ChangeListSection) => void;
  /** 放弃更改后的额外操作（如关闭 Tab） */
  onAfterDiscardChange?: (fileId: string) => void;
  /** 提交成功后的额外操作 */
  onCommitSuccess?: () => Promise<void>;
  /** 刷新文件列表 */
  refreshFileList?: () => Promise<void>;
}

export interface UseConversationAgentSourceControlParams {
  /** 会话 ID */
  cid: number | null;
  /** 外部维护的变更文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 当前选中的变更文件（由页面维护，便于与预览 Tab 联动） */
  selectedChangeFile: SelectedChangeFile | null;
  setSelectedChangeFile: React.Dispatch<
    React.SetStateAction<SelectedChangeFile | null>
  >;
  /** 场景适配器 */
  adapters: ConversationAgentSourceControlAdapters;
}

export interface UseConversationAgentSourceControlReturn {
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 当前选中的变更文件（含区块） */
  selectedChangeFile: SelectedChangeFile | null;
  /** 当前选中查看 diff 的文件数据 */
  selectedDiffFile: ChangeFileInfo | null;
  /** 是否正在提交 */
  isCommitting: boolean;
  setSelectedChangeFile: React.Dispatch<
    React.SetStateAction<SelectedChangeFile | null>
  >;
  handleDiffFileSelect: (fileId: string, section: ChangeListSection) => void;
  handleOpenChangeFile: (fileId: string) => void;
  /** 放弃更改（支持单文件或文件夹下多文件，含 Git discard + UI 同步） */
  handleDiscardChange: (fileIds: string[]) => Promise<void>;
  handleAddToGitignore: (fileId: string) => Promise<void>;
  handleCommit: (message: string) => Promise<void>;
}

/**
 * ConversationAgent 源代码管理 Hook
 */
export const useConversationAgentSourceControl = ({
  cid,
  changeFiles,
  selectedChangeFile,
  setSelectedChangeFile,
  adapters,
}: UseConversationAgentSourceControlParams): UseConversationAgentSourceControlReturn => {
  const workspace = useMemo(
    () => ({ workspaceType: 'taskAgent' as const, cid }),
    [cid],
  );

  const [isCommitting, setIsCommitting] = useState(false);
  /** 通过 apiGitFileContent 拉取的 diff 内容 */
  const [diffFileContent, setDiffFileContent] = useState<{
    fileId: string;
    section: ChangeListSection;
    originalFileContent: string;
    fileContent: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedChangeFile) {
      setDiffFileContent(null);
    }
  }, [selectedChangeFile]);

  /** 当前选中查看 diff 的文件数据（优先使用 apiGitFileContent 返回内容） */
  const selectedDiffFile = useMemo(() => {
    if (!selectedChangeFile) {
      return null;
    }

    const base =
      changeFiles.find((item) => item.fileId === selectedChangeFile.fileId) ??
      null;

    const apiDiff =
      diffFileContent &&
      diffFileContent.fileId === selectedChangeFile.fileId &&
      diffFileContent.section === selectedChangeFile.section
        ? diffFileContent
        : null;

    if (base && apiDiff) {
      return {
        ...base,
        originalFileContent: apiDiff.originalFileContent,
        fileContent: apiDiff.fileContent,
      };
    }

    if (base) {
      return base;
    }

    if (apiDiff) {
      return {
        fileId: apiDiff.fileId,
        fileContent: apiDiff.fileContent,
        originalFileContent: apiDiff.originalFileContent,
      };
    }

    return null;
  }, [changeFiles, selectedChangeFile, diffFileContent]);

  /** 选中修改文件并在右侧展示 diff 预览，并调用 apiGitFileContent 拉取变更内容 */
  const handleDiffFileSelect = useCallback(
    (fileId: string, section: ChangeListSection) => {
      setSelectedChangeFile({ fileId, section });
      setDiffFileContent(null);
      adapters.onDiffFileSelect?.(fileId, section);

      if (!isGitWorkspaceReady(workspace)) {
        return;
      }

      void (async () => {
        try {
          const content = await fetchGitChangeFileContent(
            buildGitWorkspaceParams(workspace),
            fileId,
            section,
          );
          setDiffFileContent({
            fileId,
            section,
            originalFileContent: content.originalFileContent,
            fileContent: content.fileContent,
          });
        } catch (error) {
          console.error('Git file content failed:', error);
        }
      })();
    },
    [adapters, workspace],
  );

  /** 打开更改文件（选中文件并预览，非 diff） */
  const handleOpenChangeFile = useCallback(
    (fileId: string) => {
      setSelectedChangeFile(null);
      adapters.openChangeFile(fileId);
    },
    [adapters],
  );

  /**
   * 同步单个文件放弃更改后的 UI 状态
   */
  const syncAfterDiscardChange = useCallback(
    (fileId: string) => {
      adapters.discardChangeFile(fileId);
      adapters.onAfterDiscardChange?.(fileId);
    },
    [adapters],
  );

  /**
   * 放弃更改：先 Git discard，再批量同步 UI 并刷新列表
   * @param fileIds 文件 ID 列表（单文件或同一文件夹下多文件）
   */
  const handleDiscardChange = useCallback(
    async (fileIds: string[]) => {
      if (!isGitWorkspaceReady(workspace) || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitDiscard(workspace, fileIds);
      if (!isSuccess) {
        return;
      }

      fileIds.forEach((fileId) => syncAfterDiscardChange(fileId));

      setSelectedChangeFile((current) =>
        current && fileIds.includes(current.fileId) ? null : current,
      );

      await adapters.refreshFileList?.();
    },
    [workspace, syncAfterDiscardChange, adapters],
  );

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!isGitWorkspaceReady(workspace)) {
        return;
      }
      try {
        await adapters.addFileToGitignore(fileId);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
        message.error(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
        );
      }
    },
    [workspace, adapters],
  );

  /**
   * Git 提交并推送到远程仓库
   * 先保存文件到沙箱，再执行 git commit + push
   */
  const handleCommit = useCallback(
    async (commitMessage: string) => {
      if (!isGitWorkspaceReady(workspace)) {
        message.error(
          dict('PC.Pages.ConversationAgent.gitPush.noConversation'),
        );
        return;
      }

      setIsCommitting(true);
      try {
        // if (changeFiles.length > 0) {
        //   const saveSuccess = await adapters.saveChangeFiles(changeFiles);
        //   if (!saveSuccess) {
        //     message.error(
        //       dict('PC.Pages.ConversationAgent.gitPush.saveFailed'),
        //     );
        //     return;
        //   }
        // }

        const { code } = await apiGitCommit({
          ...buildGitWorkspaceParams(workspace),
          message:
            commitMessage ||
            dict('PC.Pages.ConversationAgent.gitPush.defaultMessage'),
          files: changeFiles.map((file) => file.fileId),
        });

        if (code !== SUCCESS_CODE) {
          return;
        }

        message.success(dict('PC.Pages.ConversationAgent.gitPush.success'));
        setSelectedChangeFile(null);
        await adapters.onCommitSuccess?.();
      } catch (error) {
        console.error('Git commit push failed:', error);
      } finally {
        setIsCommitting(false);
      }
    },
    [workspace, changeFiles, adapters],
  );

  return {
    changeFiles,
    selectedChangeFile,
    selectedDiffFile,
    isCommitting,
    setSelectedChangeFile,
    handleDiffFileSelect,
    handleOpenChangeFile,
    handleDiscardChange,
    handleAddToGitignore,
    handleCommit,
  };
};
