import type { SelectedChangeFile } from '@/components/business-component/FileTreeGitSourcePanel';
import { useConversationAgentSourceControl } from '@/components/business-component/FileTreeGitSourcePanel';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { dict } from '@/services/i18nRuntime';
import { apiUpdateStaticFile } from '@/services/vncDesktop';
import type { UpdateFileInfo } from '@/types/interfaces/fileTree';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { updateFilesListContent } from '@/utils/fileTree';
import { message } from 'antd';
import { useCallback, useState } from 'react';

export interface UseChatGitSourceControlParams {
  /** 会话 ID */
  conversationId?: number;
  /** 原始文件列表（用于 .gitignore 读写） */
  fileTreeData: StaticFileInfo[] | null;
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 保存变更文件 */
  handleSaveFiles: (files: ChangeFileInfo[]) => Promise<boolean>;
  /** 放弃单个文件本地修改 */
  discardChangeFile: (fileId: string) => void;
  /** 打开文件（非 diff） */
  openChangeFile: (fileId: string) => void | Promise<void>;
  /** 刷新 Git 变更列表 */
  refreshGitList: () => Promise<void>;
  /** 刷新文件树 */
  handleRefreshFileList: (id: number) => Promise<void>;
  /** 选中 diff 时切换到预览模式（如当前为 desktop） */
  onDiffFileSelect?: () => void;
}

/**
 * Chat 页 Git 源代码管理 Hook
 * 复用 ConversationAgent 的 Git 操作封装，适配 Chat 预览区（无 Tab 栏）
 */
export function useChatGitSourceControl({
  conversationId,
  fileTreeData,
  changeFiles,
  handleSaveFiles,
  discardChangeFile,
  openChangeFile,
  refreshGitList,
  handleRefreshFileList,
  onDiffFileSelect,
}: UseChatGitSourceControlParams) {
  const [selectedChangeFile, setSelectedChangeFile] =
    useState<SelectedChangeFile | null>(null);

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!conversationId) {
        return;
      }

      const gitignoreId = '.gitignore';
      const existing = fileTreeData?.find(
        (item: StaticFileInfo) => item.fileId === gitignoreId,
      );
      const currentContent = existing?.contents ?? '';
      const entry = fileId.startsWith('/') ? fileId.slice(1) : fileId;

      if (
        currentContent
          .split('\n')
          .some(
            (line: string) => line.trim() === entry || line.trim() === fileId,
          )
      ) {
        message.info(
          dict('PC.Pages.ConversationAgentSourceControl.alreadyInGitignore'),
        );
        return;
      }

      const newContent = currentContent
        ? `${currentContent.replace(/\n$/, '')}\n${entry}`
        : entry;

      try {
        if (existing) {
          const updatedFilesList = updateFilesListContent(
            fileTreeData || [],
            [
              {
                fileId: gitignoreId,
                fileContent: newContent,
                originalFileContent: currentContent,
              },
            ],
            'modify',
          );
          await apiUpdateStaticFile({
            cId: conversationId,
            files: updatedFilesList as UpdateFileInfo[],
          });
        } else {
          await apiUpdateStaticFile({
            cId: conversationId,
            files: [
              {
                name: gitignoreId,
                contents: `${newContent}\n`,
                operation: 'create',
                binary: false,
                sizeExceeded: false,
                renameFrom: '',
                isDir: false,
              },
            ],
          });
        }

        message.success(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await handleRefreshFileList(conversationId);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
      }
    },
    [conversationId, fileTreeData, handleRefreshFileList],
  );

  const gitSourceControl = useConversationAgentSourceControl({
    cid: conversationId ?? null,
    changeFiles,
    selectedChangeFile,
    setSelectedChangeFile,
    adapters: {
      saveChangeFiles: handleSaveFiles,
      discardChangeFile,
      openChangeFile: (fileId: string) => {
        setSelectedChangeFile(null);
        void openChangeFile(fileId);
      },
      addFileToGitignore: handleAddToGitignore,
      onDiffFileSelect: () => {
        onDiffFileSelect?.();
      },
      onAfterDiscardChange: () => {
        setSelectedChangeFile(null);
      },
      onCommitSuccess: async () => {
        await refreshGitList();
        setSelectedChangeFile(null);
      },
      refreshFileList: conversationId
        ? async () => {
            await refreshGitList();
          }
        : undefined,
    },
  });

  return gitSourceControl;
}
