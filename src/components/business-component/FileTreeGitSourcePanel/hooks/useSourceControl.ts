/**
 * AppDev 源代码管理（Git）Hook
 * 管理修改文件列表、暂存、提交推送及 diff 预览相关逻辑
 */
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { getProjectContent, submitFilesUpdate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { treeToFlatList } from '@/utils/appDevUtils';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchGitChangeFileContent } from '../../GitVersionRecordPanel/gitCommitDiffUtils';
import { apiGitCommit, apiGitStatus } from '../services/git-version-management';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '../utils/changeFileStatus';
import {
  buildChangeFilesFromGitStatus,
  mergeGitStatusFileIds,
} from '../utils/gitStatusUtils';
import { runGitDiscard } from '../utils/sourceControlGitActions';

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
  /** 提交成功后刷新项目详情 */
  onRefreshProjectInfo?: () => void;
}

export interface UseAppDevSourceControlReturn {
  /** 已修改文件列表 */
  changeFiles: ChangeFileInfo[];
  /** 已暂存的文件 ID 集合 */
  stagedFileIds: Set<string>;
  /** 当前选中的变更文件（含区块） */
  selectedChangeFile: SelectedChangeFile | null;
  /** 当前选中查看 diff 的文件数据 */
  selectedDiffFile: ChangeFileInfo | null;
  /** 是否正在提交 */
  isCommitting: boolean;
  /** 是否正在刷新 Git 列表 */
  isRefreshingGitList: boolean;
  /** 当前 Git 分支名（来自 git status 的 current） */
  gitBranch: string;
  /** 同步修改文件列表（编辑器内容变更时调用） */
  syncChangeFiles: (fileId: string, content: string) => void;
  /** 清除 diff 选中状态 */
  clearSelectedDiff: () => void;
  /** 选中修改文件并展示 diff */
  handleDiffFileSelect: (fileId: string, section: ChangeListSection) => void;
  /** 打开文件（非 diff 预览） */
  handleOpenChangeFile: (fileId: string) => void;
  /** 放弃更改（支持单文件或文件夹下多文件，含 Git discard + UI 同步） */
  handleDiscardChange: (fileIds: string[]) => Promise<void>;
  /** Git discard 成功后的 UI 同步（不再调用 discard 接口） */
  handleAfterDiscardChange: (fileId: string) => void;
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

/** 从变更列表派生暂存区文件 ID */
const deriveStagedFileIds = (files: ChangeFileInfo[]): Set<string> =>
  new Set(files.filter((item) => item.stagedStatus).map((item) => item.fileId));

/**
 * AppDev 源代码管理 Hook
 * 封装修改文件追踪、暂存、提交推送、diff 预览及 .gitignore 等 Git 相关逻辑
 * @param params Hook 配置参数
 * @returns 源代码管理状态与操作方法
 */
export const useSourceControl = ({
  projectId,
  fileManagement,
  onRefreshProjectInfo,
}: UseAppDevSourceControlParams): UseAppDevSourceControlReturn => {
  /** 本地未提交的修改文件列表 */
  const [changeFiles, setChangeFiles] = useState<ChangeFileInfo[]>([]);
  /** 已暂存（git add）的文件 ID 集合，由 status 接口派生 */
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  /** 当前在右侧预览区展示的变更文件（含区块） */
  const [selectedChangeFile, setSelectedChangeFile] =
    useState<SelectedChangeFile | null>(null);
  /** 通过 apiGitFileContent 拉取的 diff 内容 */
  const [diffFileContent, setDiffFileContent] = useState<{
    fileId: string;
    section: ChangeListSection;
    originalFileContent: string;
    fileContent: string;
  } | null>(null);
  /** Git 提交推送进行中 */
  const [isCommitting, setIsCommitting] = useState(false);
  /** Git 列表刷新进行中 */
  const [isRefreshingGitList, setIsRefreshingGitList] = useState(false);
  /** 当前 Git 分支名 */
  const [gitBranch, setGitBranch] = useState('main');

  /** 根据选中项派生完整的 diff 文件数据（优先使用 apiGitDiff 返回内容） */
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
    setSelectedChangeFile((current) =>
      current?.fileId === fileId ? null : current,
    );
  }, []);

  /** 清除 diff 预览选中状态（切换文件树选中项时调用） */
  const clearSelectedDiff = useCallback(() => {
    setSelectedChangeFile(null);
    setDiffFileContent(null);
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
        // if (changeFilesList.length > 0) {
        //   const saveSuccess = await saveChangeFiles(changeFilesList);
        //   if (!saveSuccess) {
        //     message.error(
        //       dict('PC.Pages.ConversationAgent.gitPush.saveFailed'),
        //     );
        //     return false;
        //   }
        // }

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
        return false;
      } catch (error) {
        console.error('Git commit push failed:', error);
        return false;
      } finally {
        setIsCommitting(false);
      }
    },
    [projectId, saveChangeFiles],
  );

  /**
   * 选中修改文件并在右侧展示 diff 预览
   * 调用 apiGitFileContent 拉取 HEAD 与 worktree/staged 文件内容
   */
  const handleDiffFileSelect = useCallback(
    (fileId: string, section: ChangeListSection) => {
      setSelectedChangeFile({ fileId, section });
      setDiffFileContent(null);

      if (!projectId) {
        return;
      }

      void (async () => {
        try {
          const content = await fetchGitChangeFileContent(
            { workspaceType: 'pageApp', projectId: Number(projectId) },
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
    [projectId],
  );

  /**
   * 打开更改文件（选中并进入代码编辑，非 diff 模式）
   * @param fileId 文件 ID
   */
  const handleOpenChangeFile = useCallback(
    (fileId: string) => {
      setSelectedChangeFile(null);
      setDiffFileContent(null);
      fileManagement.switchToFile(fileId);
    },
    [fileManagement],
  );

  /**
   * 同步单个文件放弃更改后的 UI 状态
   */
  const syncAfterDiscardChange = useCallback(
    (fileId: string) => {
      const changeFile = changeFiles.find((item) => item.fileId === fileId);
      if (!changeFile) {
        clearChangeForFile(fileId);
        return;
      }

      fileManagement.updateFileContent(fileId, changeFile.originalFileContent);

      if (fileManagement.fileContentState.selectedFile === fileId) {
        fileManagement.cancelEdit(true);
      }

      clearChangeForFile(fileId);
    },
    [changeFiles, fileManagement, clearChangeForFile],
  );

  /**
   * 刷新 Git 变更列表（仅 status 接口）
   * - 暂存的更改：status.staged
   * - 更改：status.created + modified + deleted + untracked + conflicted
   */
  const refreshGitList = useCallback(async () => {
    if (!projectId || isRefreshingGitList) {
      return;
    }

    setIsRefreshingGitList(true);
    try {
      await fileManagement.loadFileTree(true, true);

      const statusResponse = await apiGitStatus({
        workspaceType: 'pageApp',
        projectId: Number(projectId),
      });

      if (statusResponse.code !== SUCCESS_CODE || !statusResponse.data) {
        return;
      }

      setGitBranch(statusResponse.data.current || 'main');

      const statusFileIds = mergeGitStatusFileIds(statusResponse.data);

      setChangeFiles((prev) => {
        // 将 Git status 转为变更文件列表
        const nextChangeFiles = buildChangeFilesFromGitStatus(
          statusResponse.data!,
          statusFileIds,
          prev,
          fileManagement.findFileNode,
        );
        // 派生暂存区文件 ID 集合
        setStagedFileIds(deriveStagedFileIds(nextChangeFiles));
        return nextChangeFiles;
      });
    } catch (error) {
      console.error('Refresh git list failed:', error);
    } finally {
      setIsRefreshingGitList(false);
    }
  }, [projectId, isRefreshingGitList, fileManagement]);

  /**
   * 放弃更改：先 Git discard，再批量同步 UI 并刷新列表
   * @param fileIds 文件 ID 列表（单文件或同一文件夹下多文件）
   */
  const handleDiscardChange = useCallback(
    async (fileIds: string[]) => {
      if (!projectId || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitDiscard(
        { workspaceType: 'pageApp', projectId },
        fileIds,
      );
      if (!isSuccess) {
        return;
      }

      fileIds.forEach((fileId) => syncAfterDiscardChange(fileId));

      setSelectedChangeFile((current) =>
        current && fileIds.includes(current.fileId) ? null : current,
      );

      await refreshGitList();
    },
    [projectId, syncAfterDiscardChange, refreshGitList],
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

        await submitFilesUpdate(projectId, filesList);
        message.success(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await fileManagement.loadFileTree(true, true);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
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
        setSelectedChangeFile(null);
        setDiffFileContent(null);
        // await fileManagement.loadFileTree(true, true);
        // onRefreshProjectInfo?.();
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

  /** 进入页面或切换项目时拉取 Git status */
  useEffect(() => {
    if (!projectId) {
      return;
    }
    void refreshGitList();
    // 仅在 projectId 就绪时触发，避免与 refreshGitList 引用变化重复请求
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /** SourceControlPanel 已完成 Git discard 后，仅同步本地 UI */
  const handleAfterDiscardChange = useCallback(
    (fileId: string) => {
      syncAfterDiscardChange(fileId);
      setSelectedChangeFile((current) =>
        current?.fileId === fileId ? null : current,
      );
    },
    [syncAfterDiscardChange, setSelectedChangeFile],
  );

  return {
    changeFiles,
    stagedFileIds,
    selectedChangeFile,
    selectedDiffFile,
    isCommitting,
    isRefreshingGitList,
    gitBranch,
    syncChangeFiles,
    clearSelectedDiff,
    handleDiffFileSelect,
    handleOpenChangeFile,
    handleDiscardChange,
    handleAfterDiscardChange,
    handleAddToGitignore,
    handleCommit,
    refreshGitList,
    handleCancelEdit,
    clearChangeForFile,
  };
};
