/**
 * AppDev 源代码管理（Git）Hook
 * 管理修改文件列表、暂存、提交推送及 diff 预览相关逻辑
 */

import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGitCommit,
  apiGitStash,
  apiGitStashPop,
  apiGitStatus,
} from '@/pages/ConversationAgent/services/git-version-management';
import { getProjectContent, submitFilesUpdate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { treeToFlatList } from '@/utils/appDevUtils';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** 文件管理依赖（Hook 所需的最小接口） */
export interface AppDevSourceControlFileManagement {
  fileContentState: {
    selectedFile: string;
    originalFileContent: string;
  };
  updateFileContent: (fileId: string, content: string) => void;
  cancelEdit: (silent?: boolean) => void;
  switchToFile: (fileId: string) => void;
  findFileNode: (fileId: string) => FileNode | null;
  loadFileTree: (
    preserveState?: boolean,
    forceRefresh?: boolean,
  ) => Promise<void>;
}

export interface UseAppDevSourceControlParams {
  /** 项目 ID */
  projectId: string | null;
  /** 文件管理实例 */
  fileManagement: AppDevSourceControlFileManagement;
  /** 同步工作区文件内容（Umi model） */
  updateWorkspaceFileContent: (fileId: string, content: string) => void;
  /** 切换到代码标签页 */
  onSwitchToCodeTab?: () => void;
  /** 提交成功后刷新项目详情 */
  onRefreshProjectInfo?: () => void;
}

export interface UseAppDevSourceControlReturn {
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 已暂存的文件 ID 集合 */
  stagedFileIds: Set<string>;
  /** 当前选中查看 diff 的文件 ID */
  selectedDiffFileId: string | null;
  /** 当前选中查看 diff 的文件数据 */
  selectedDiffFile: ChangeFileInfo | null;
  /** 是否正在提交 */
  isCommitting: boolean;
  /** 是否正在刷新 Git 列表 */
  isRefreshingGitList: boolean;
  /** 同步修改文件列表（编辑器内容变更时调用） */
  syncChangeFiles: (fileId: string, content: string) => void;
  /** 清除 diff 选中状态 */
  clearSelectedDiff: () => void;
  /** 选中修改文件并展示 diff */
  handleDiffFileSelect: (fileId: string) => void;
  /** 打开文件（非 diff 预览） */
  handleOpenChangeFile: (fileId: string) => void;
  /** 放弃单个文件的更改 */
  handleDiscardChange: (fileId: string) => void;
  /** 暂存更改 */
  handleStageChange: (fileId: string) => Promise<void>;
  /** 取消暂存 */
  handleUnstageChange: (fileId: string) => Promise<void>;
  /** 添加到 .gitignore */
  handleAddToGitignore: (fileId: string) => Promise<void>;
  /** 提交修改（保存并推送） */
  handleCommit: (message: string) => Promise<void>;
  /** 刷新 Git 变更列表 */
  refreshGitList: () => Promise<void>;
  /** 取消编辑并同步清理 Git 状态 */
  handleCancelEdit: (silent?: boolean) => void;
  /** 清除指定文件的修改记录（单文件保存成功后调用） */
  clearChangeForFile: (fileId: string) => void;
}

/**
 * AppDev 源代码管理 Hook
 * 封装修改文件追踪、暂存、提交推送、diff 预览及 .gitignore 等 Git 相关逻辑
 * @param params Hook 配置参数
 * @returns 源代码管理状态与操作方法
 */
export const useAppDevSourceControl = ({
  projectId,
  fileManagement,
  updateWorkspaceFileContent,
  onSwitchToCodeTab,
  onRefreshProjectInfo,
}: UseAppDevSourceControlParams): UseAppDevSourceControlReturn => {
  /** 本地未提交的修改文件列表 */
  const [changeFiles, setChangeFiles] = useState<ChangeFileInfo[]>([]);
  /** 已通过 git stash 暂存的文件 ID 集合 */
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  /** 当前在右侧预览区展示 diff 的文件 ID */
  const [selectedDiffFileId, setSelectedDiffFileId] = useState<string | null>(
    null,
  );
  /** Git 提交推送进行中 */
  const [isCommitting, setIsCommitting] = useState(false);
  /** Git 列表刷新进行中 */
  const [isRefreshingGitList, setIsRefreshingGitList] = useState(false);

  /** 根据 selectedDiffFileId 派生完整的 diff 文件数据 */
  const selectedDiffFile = useMemo(
    () =>
      changeFiles.find((item) => item.fileId === selectedDiffFileId) ?? null,
    [changeFiles, selectedDiffFileId],
  );

  /**
   * 清除指定文件的修改与暂存记录
   * 同时取消该文件的 diff 预览选中状态
   * @param fileId 文件 ID
   */
  const clearChangeForFile = useCallback((fileId: string) => {
    setChangeFiles((prev) => prev.filter((item) => item.fileId !== fileId));
    setStagedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
    setSelectedDiffFileId((current) => (current === fileId ? null : current));
  }, []);

  /** 清除 diff 预览选中状态（切换文件树选中项时调用） */
  const clearSelectedDiff = useCallback(() => {
    setSelectedDiffFileId(null);
  }, []);

  /**
   * 同步修改文件列表
   * 编辑器内容变更时调用，维护 changeFiles 与原始内容的对应关系
   * @param fileId 文件 ID
   * @param content 当前编辑内容
   */
  const syncChangeFiles = useCallback(
    (fileId: string, content: string) => {
      setChangeFiles((prevChangeFiles) => {
        const existingIndex = prevChangeFiles.findIndex(
          (item) => item.fileId === fileId,
        );
        const { fileContentState } = fileManagement;
        let originalContent = '';

        // 优先从已有变更记录取原始内容，避免文件树已被覆盖后丢失基准
        if (existingIndex !== -1) {
          originalContent = prevChangeFiles[existingIndex].originalFileContent;
        } else if (fileContentState.selectedFile === fileId) {
          originalContent = fileContentState.originalFileContent;
        } else {
          const fileNode = fileManagement.findFileNode(fileId);
          originalContent = fileNode?.content ?? '';
        }

        if (existingIndex !== -1) {
          // 内容还原为原始值时，从变更列表中移除
          if (content === originalContent) {
            return prevChangeFiles.filter(
              (_, index) => index !== existingIndex,
            );
          }
          const updated = [...prevChangeFiles];
          updated[existingIndex] = {
            ...updated[existingIndex],
            fileContent: content,
          };
          return updated;
        }

        // 首次检测到变更，追加新记录
        if (content !== originalContent) {
          return [
            ...prevChangeFiles,
            {
              fileId,
              fileContent: content,
              originalFileContent: originalContent,
            },
          ];
        }
        return prevChangeFiles;
      });
    },
    [fileManagement],
  );

  /** 更改列表变化时，清理已不在列表中的暂存标记，避免 stagedFileIds 与 changeFiles 不一致 */
  useEffect(() => {
    setStagedFileIds((prev) => {
      const changeIds = new Set(changeFiles.map((file) => file.fileId));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (changeIds.has(id)) {
          next.add(id);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [changeFiles]);

  /**
   * 批量保存修改的文件到服务端
   * 先拉取最新项目文件列表，再合并变更内容后提交
   * @param filesToSave 待保存的变更文件列表
   * @returns 是否保存成功；无文件或无 projectId 时视为成功
   */
  const saveChangeFiles = useCallback(
    async (filesToSave: ChangeFileInfo[]) => {
      if (!projectId || filesToSave.length === 0) {
        return true;
      }

      try {
        const projectResponse = await getProjectContent(projectId);
        if (
          !projectResponse ||
          projectResponse.code !== SUCCESS_CODE ||
          !projectResponse.data
        ) {
          return false;
        }

        const changeMap = new Map(
          filesToSave.map((item) => [item.fileId, item.fileContent]),
        );

        // 兼容扁平格式与树形格式两种文件列表结构
        let filesList: any[] = [];
        const files = projectResponse.data.files;
        if (Array.isArray(files) && files.length > 0 && files[0].name) {
          filesList = files.map((file) =>
            changeMap.has(file.name)
              ? { ...file, contents: changeMap.get(file.name) }
              : file,
          );
        } else if (Array.isArray(files)) {
          filesList = treeToFlatList(files as FileNode[]).map((file) =>
            changeMap.has(file.name)
              ? { ...file, contents: changeMap.get(file.name) }
              : file,
          );
        }

        const response = await submitFilesUpdate(projectId, filesList);
        return Boolean(response.success && response.code === SUCCESS_CODE);
      } catch (error) {
        console.error('Failed to save change files:', error);
        return false;
      }
    },
    [projectId],
  );

  /**
   * Git 提交并推送到远程仓库
   * 流程：先保存文件到沙箱 → 再执行 git commit + push
   * @param commitMessage 提交说明
   * @param changeFilesList 当前修改的文件列表
   * @returns 是否提交成功
   */
  const commitAndPush = useCallback(
    async (commitMessage: string, changeFilesList: ChangeFileInfo[]) => {
      if (!projectId) {
        message.error(
          dict('PC.Pages.ConversationAgent.gitPush.noConversation'),
        );
        return false;
      }

      setIsCommitting(true);
      try {
        // 1. 先保存文件到沙箱
        if (changeFilesList.length > 0) {
          const saveSuccess = await saveChangeFiles(changeFilesList);
          if (!saveSuccess) {
            message.error(
              dict('PC.Pages.ConversationAgent.gitPush.saveFailed'),
            );
            return false;
          }
        }

        // 2. 执行 git commit + push
        const { code } = await apiGitCommit({
          workspaceType: 'pageApp',
          projectId: Number(projectId),
          message:
            commitMessage ||
            dict('PC.Pages.ConversationAgent.gitPush.defaultMessage'),
          files: changeFilesList.map((file) => file.fileId),
        });

        if (code === SUCCESS_CODE) {
          message.success(dict('PC.Pages.ConversationAgent.gitPush.success'));
          return true;
        }

        message.error(dict('PC.Pages.ConversationAgent.gitPush.failed'));
        return false;
      } catch (error) {
        console.error('Git commit push failed:', error);
        message.error(dict('PC.Pages.ConversationAgent.gitPush.failed'));
        return false;
      } finally {
        setIsCommitting(false);
      }
    },
    [projectId, saveChangeFiles],
  );

  /**
   * 选中修改文件并在右侧展示 diff 预览
   * 仅触发 diff 预览，不走文件树普通选中逻辑
   * @param fileId 文件 ID
   */
  const handleDiffFileSelect = useCallback(
    (fileId: string) => {
      setSelectedDiffFileId(fileId);
      onSwitchToCodeTab?.();
    },
    [onSwitchToCodeTab],
  );

  /**
   * 打开更改文件（选中并进入代码编辑，非 diff 模式）
   * @param fileId 文件 ID
   */
  const handleOpenChangeFile = useCallback(
    (fileId: string) => {
      setSelectedDiffFileId(null);
      fileManagement.switchToFile(fileId);
      onSwitchToCodeTab?.();
    },
    [fileManagement, onSwitchToCodeTab],
  );

  /**
   * 放弃单个文件的更改，还原为原始内容
   * @param fileId 文件 ID
   */
  const handleDiscardChange = useCallback(
    (fileId: string) => {
      const changeFile = changeFiles.find((item) => item.fileId === fileId);
      if (!changeFile) {
        return;
      }

      // 还原文件树与工作区中的内容
      fileManagement.updateFileContent(fileId, changeFile.originalFileContent);
      updateWorkspaceFileContent(fileId, changeFile.originalFileContent);

      if (fileManagement.fileContentState.selectedFile === fileId) {
        fileManagement.cancelEdit(true);
      }

      clearChangeForFile(fileId);
    },
    [
      changeFiles,
      fileManagement,
      updateWorkspaceFileContent,
      clearChangeForFile,
    ],
  );

  /**
   * 暂存更改（git stash）
   * @param fileId 文件 ID
   */
  const handleStageChange = useCallback(
    async (fileId: string) => {
      if (!projectId) {
        return;
      }
      try {
        const { code } = await apiGitStash({
          workspaceType: 'pageApp',
          projectId: Number(projectId),
        });
        if (code !== SUCCESS_CODE) {
          message.warning(
            dict('PC.Pages.ConversationAgentSourceControl.stageFailed'),
          );
        }
      } catch (error) {
        console.error('Git stash failed:', error);
        message.warning(
          dict('PC.Pages.ConversationAgentSourceControl.stageFailed'),
        );
      }
      setStagedFileIds((prev) => new Set(prev).add(fileId));
    },
    [projectId],
  );

  /**
   * 取消暂存（git stash pop）
   * @param fileId 文件 ID
   */
  const handleUnstageChange = useCallback(
    async (fileId: string) => {
      if (!projectId) {
        return;
      }
      try {
        const { code } = await apiGitStashPop({
          workspaceType: 'pageApp',
          projectId: Number(projectId),
        });
        if (code !== SUCCESS_CODE) {
          message.warning(
            dict('PC.Pages.ConversationAgentSourceControl.unstageFailed'),
          );
        }
      } catch (error) {
        console.error('Git stash pop failed:', error);
        message.warning(
          dict('PC.Pages.ConversationAgentSourceControl.unstageFailed'),
        );
      }
      setStagedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    },
    [projectId],
  );

  /**
   * 将文件路径添加到 .gitignore
   * 若 .gitignore 不存在则新建，已存在则追加一行
   * @param fileId 文件 ID（相对路径）
   */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!projectId) {
        return;
      }

      const gitignoreId = '.gitignore';
      const existingNode = fileManagement.findFileNode(gitignoreId);
      const currentContent = existingNode?.content ?? '';
      const entry = fileId.startsWith('/') ? fileId.slice(1) : fileId;

      // 已存在相同规则则跳过
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
        const projectResponse = await getProjectContent(projectId);
        if (
          !projectResponse ||
          projectResponse.code !== SUCCESS_CODE ||
          !projectResponse.data
        ) {
          message.error(
            dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
          );
          return;
        }

        let filesList: any[] = [];
        const files = projectResponse.data.files;
        if (Array.isArray(files) && files.length > 0 && files[0].name) {
          filesList = [...files];
        } else if (Array.isArray(files)) {
          filesList = treeToFlatList(files as FileNode[]);
        }

        if (existingNode) {
          filesList = filesList.map((file) =>
            file.name === gitignoreId
              ? { ...file, contents: newContent }
              : file,
          );
        } else {
          filesList.push({
            name: gitignoreId,
            contents: `${newContent}\n`,
            binary: false,
            sizeExceeded: false,
          });
        }

        const response = await submitFilesUpdate(projectId, filesList);
        if (!response.success || response.code !== SUCCESS_CODE) {
          message.error(
            dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
          );
          return;
        }

        message.success(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await fileManagement.loadFileTree(true, true);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
        message.error(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
        );
      }
    },
    [projectId, fileManagement],
  );

  /**
   * 提交修改（保存并推送）
   * 成功后清空本地 Git 状态并刷新文件树与项目详情
   * @param commitMessage 提交说明
   */
  const handleCommit = useCallback(
    async (commitMessage: string) => {
      const isSuccess = await commitAndPush(commitMessage, changeFiles);
      if (isSuccess) {
        setChangeFiles([]);
        setStagedFileIds(new Set());
        setSelectedDiffFileId(null);
        await fileManagement.loadFileTree(true, true);
        onRefreshProjectInfo?.();
      }
    },
    [changeFiles, commitAndPush, fileManagement, onRefreshProjectInfo],
  );

  /**
   * 取消编辑并同步清理当前文件的 Git 变更记录
   * @param silent 是否静默取消（不弹出提示）
   */
  const handleCancelEdit = useCallback(
    (silent: boolean = false) => {
      const selectedFileId = fileManagement.fileContentState.selectedFile;
      fileManagement.cancelEdit(silent);
      if (selectedFileId) {
        clearChangeForFile(selectedFileId);
      }
    },
    [fileManagement, clearChangeForFile],
  );

  /**
   * 刷新 Git 变更列表
   * 拉取服务端 Git 状态并重新加载文件树
   */
  const refreshGitList = useCallback(async () => {
    if (!projectId || isRefreshingGitList) {
      return;
    }

    setIsRefreshingGitList(true);
    try {
      await apiGitStatus({
        workspaceType: 'pageApp',
        projectId: Number(projectId),
      });
      await fileManagement.loadFileTree(true, true);
    } catch (error) {
      console.error('Refresh git list failed:', error);
      message.error(
        dict('PC.Pages.ConversationAgentSourceControl.refreshFailed'),
      );
    } finally {
      setIsRefreshingGitList(false);
    }
  }, [projectId, isRefreshingGitList, fileManagement]);

  return {
    changeFiles,
    stagedFileIds,
    selectedDiffFileId,
    selectedDiffFile,
    isCommitting,
    isRefreshingGitList,
    syncChangeFiles,
    clearSelectedDiff,
    handleDiffFileSelect,
    handleOpenChangeFile,
    handleDiscardChange,
    handleStageChange,
    handleUnstageChange,
    handleAddToGitignore,
    handleCommit,
    refreshGitList,
    handleCancelEdit,
    clearChangeForFile,
  };
};
