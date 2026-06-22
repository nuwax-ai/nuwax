/**
 * 源代码管理（Git）统一 Hook
 * 管理修改文件列表、暂存、提交推送及 diff 预览相关逻辑
 * 支持 pageApp / taskAgent 两种 workspace，Git 操作集中在此，页面差异通过 callbacks 注入
 */
import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { getProjectContent, submitFilesUpdate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { treeToFlatList } from '@/utils/appDevUtils';
import { message } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { fetchGitChangeFileContent } from '../../GitVersionRecordPanel/gitCommitDiffUtils';
import { apiGitCommit, apiGitStatus } from '../services/git-version-management';
import {
  buildGitWorkspaceParams,
  isGitWorkspaceReady,
  type GitWorkspaceConfig,
} from '../utils/buildGitWorkspaceParams';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '../utils/changeFileStatus';
import {
  buildChangeFilesFromGitStatus,
  mergeGitStatusFileIds,
} from '../utils/gitStatusUtils';
import {
  runGitDiscard,
  runGitStage,
  runGitUnstage,
} from '../utils/sourceControlGitActions';

export type { GitWorkspaceConfig };

/** 各页面在 Git 操作成功后的差异化处理 */
export interface SourceControlCallbacks {
  /** 打开更改文件（非 diff） */
  openChangeFile: (fileId: string) => void;
  /** 放弃单个文件本地修改（还原编辑器内容） */
  discardChangeFile: (fileId: string) => void;
  /** 将文件添加到 .gitignore（taskAgent 由页面实现；pageApp 不传则走内置逻辑） */
  addFileToGitignore?: (fileId: string) => Promise<void>;
  /** 选中 diff 文件后的页面操作 */
  onDiffFileSelect?: (fileId: string, section: ChangeListSection) => void;
  /** Git discard 成功后的页面操作 */
  onAfterDiscardChange?: (fileId: string) => void;
  /** Git commit 成功后的页面操作 */
  onCommitSuccess?: () => Promise<void>;
  /** discard 等操作后刷新 Git 列表（taskAgent 通常刷新 fileView） */
  onRefreshGitList?: () => Promise<void>;
  /** pageApp：刷新文件树 */
  loadFileTree?: (
    preserveState?: boolean,
    forceRefresh?: boolean,
  ) => Promise<void>;
  /** pageApp：查找文件节点（syncChangeFiles 用） */
  findFileNode?: (fileId: string) => FileNode | null;
  /** pageApp：更新编辑器文件内容 */
  updateFileContent?: (fileId: string, content: string) => void;
  /** pageApp：取消编辑 */
  cancelEdit?: (silent?: boolean) => void;
  /** pageApp：当前编辑中的文件状态 */
  getFileContentState?: () => {
    selectedFile: string;
    originalFileContent: string;
  };
  /** pageApp：提交成功后刷新项目详情 */
  onRefreshProjectInfo?: () => void;
}

export interface UseSourceControlParams {
  /** Git 工作空间：pageApp 传 projectId，taskAgent 传 cid */
  workspace: GitWorkspaceConfig;
  /** 页面回调 */
  callbacks: SourceControlCallbacks;
  /**
   * 外部维护的变更文件列表（taskAgent）。
   * 不传时由 Hook 内部维护（pageApp）。
   */
  changeFiles?: ChangeFileInfo[];
  /** 外部维护的选中变更（taskAgent）；不传时 Hook 内部维护 */
  selectedChangeFile?: SelectedChangeFile | null;
  setSelectedChangeFile?: Dispatch<SetStateAction<SelectedChangeFile | null>>;
}

export interface UseSourceControlReturn {
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
  setSelectedChangeFile: Dispatch<SetStateAction<SelectedChangeFile | null>>;
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
  /** 暂存更改（git add） */
  handleStageChanges: (fileIds: string[]) => Promise<void>;
  /** 取消暂存（git restore --staged） */
  handleUnstageChanges: (fileIds: string[]) => Promise<void>;
  /** Git discard 成功后的 UI 同步（不再调用 discard 接口，一般无需页面直接调用） */
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
 * 源代码管理统一 Hook
 * 封装修改文件追踪、暂存、提交推送、diff 预览及 .gitignore 等 Git 相关逻辑
 * @param params Hook 配置参数
 * @returns 源代码管理状态与操作方法
 */
export const useSourceControl = ({
  workspace,
  callbacks,
  changeFiles: externalChangeFiles,
  selectedChangeFile: externalSelectedChangeFile,
  setSelectedChangeFile: externalSetSelectedChangeFile,
}: UseSourceControlParams): UseSourceControlReturn => {
  const manageChangeFilesInternally = externalChangeFiles === undefined;

  /** 本地未提交的修改文件列表（pageApp 内部维护） */
  const [internalChangeFiles, setInternalChangeFiles] = useState<
    ChangeFileInfo[]
  >([]);
  const changeFiles = manageChangeFilesInternally
    ? internalChangeFiles
    : externalChangeFiles;

  /** 已暂存（git add）的文件 ID 集合，由 status 接口派生 */
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  /** 当前在右侧预览区展示的变更文件（含区块） */
  const [internalSelectedChangeFile, setInternalSelectedChangeFile] =
    useState<SelectedChangeFile | null>(null);
  const selectedChangeFile =
    externalSelectedChangeFile !== undefined
      ? externalSelectedChangeFile
      : internalSelectedChangeFile;
  const setSelectedChangeFile =
    externalSetSelectedChangeFile ?? setInternalSelectedChangeFile;

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

  useEffect(() => {
    if (!selectedChangeFile) {
      setDiffFileContent(null);
    }
  }, [selectedChangeFile]);

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
  const clearChangeForFile = useCallback(
    (fileId: string) => {
      if (!manageChangeFilesInternally) {
        return;
      }
      setInternalChangeFiles((prev) =>
        prev.filter((item) => item.fileId !== fileId),
      );
      setStagedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      setSelectedChangeFile((current) =>
        current?.fileId === fileId ? null : current,
      );
    },
    [manageChangeFilesInternally, setSelectedChangeFile],
  );

  /** 清除 diff 预览选中状态（切换文件树选中项时调用） */
  const clearSelectedDiff = useCallback(() => {
    setSelectedChangeFile(null);
    setDiffFileContent(null);
  }, [setSelectedChangeFile]);

  /**
   * 同步修改文件列表
   * 编辑器内容变更时调用，维护 changeFiles 与原始内容的对应关系
   * @param fileId 文件 ID
   * @param content 当前编辑内容
   */
  const syncChangeFiles = useCallback(
    (fileId: string, content: string) => {
      if (!manageChangeFilesInternally) {
        return;
      }

      setInternalChangeFiles((prevChangeFiles) => {
        const existingIndex = prevChangeFiles.findIndex(
          (item) => item.fileId === fileId,
        );
        let originalContent = '';

        // 优先从已有变更记录取原始内容，避免文件树已被覆盖后丢失基准
        if (existingIndex !== -1) {
          originalContent = prevChangeFiles[existingIndex].originalFileContent;
        } else {
          const fileContentState = callbacks.getFileContentState?.();
          if (fileContentState?.selectedFile === fileId) {
            originalContent = fileContentState.originalFileContent;
          } else {
            const fileNode = callbacks.findFileNode?.(fileId);
            originalContent = fileNode?.content ?? '';
          }
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
    [manageChangeFilesInternally, callbacks],
  );

  /**
   * 选中修改文件并在右侧展示 diff 预览
   * 调用 apiGitFileContent 拉取 HEAD 与 worktree/staged 文件内容
   */
  const handleDiffFileSelect = useCallback(
    (fileId: string, section: ChangeListSection) => {
      setSelectedChangeFile({ fileId, section });
      setDiffFileContent(null);
      callbacks.onDiffFileSelect?.(fileId, section);

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
    [callbacks, workspace, setSelectedChangeFile],
  );

  /**
   * 打开更改文件（选中并进入代码编辑，非 diff 模式）
   * @param fileId 文件 ID
   */
  const handleOpenChangeFile = useCallback(
    (fileId: string) => {
      setSelectedChangeFile(null);
      setDiffFileContent(null);
      callbacks.openChangeFile(fileId);
    },
    [callbacks, setSelectedChangeFile],
  );

  /**
   * 同步单个文件放弃更改后的 UI 状态
   */
  const syncAfterDiscardChange = useCallback(
    (fileId: string) => {
      if (manageChangeFilesInternally) {
        const changeFile = internalChangeFiles.find(
          (item) => item.fileId === fileId,
        );
        if (!changeFile) {
          clearChangeForFile(fileId);
          callbacks.onAfterDiscardChange?.(fileId);
          return;
        }

        callbacks.updateFileContent?.(fileId, changeFile.originalFileContent);

        if (callbacks.getFileContentState?.()?.selectedFile === fileId) {
          callbacks.cancelEdit?.(true);
        }

        clearChangeForFile(fileId);
      } else {
        callbacks.discardChangeFile(fileId);
      }

      callbacks.onAfterDiscardChange?.(fileId);
    },
    [
      manageChangeFilesInternally,
      internalChangeFiles,
      callbacks,
      clearChangeForFile,
    ],
  );

  /**
   * 刷新 Git 变更列表（仅 status 接口）
   * 后端各数组非互斥，由 resolveGitFileStatuses 按优先级归一化后 merge 到暂存区/更改区
   */
  const refreshGitList = useCallback(async () => {
    if (!isGitWorkspaceReady(workspace) || isRefreshingGitList) {
      return;
    }

    if (!manageChangeFilesInternally) {
      await callbacks.onRefreshGitList?.();
      return;
    }

    setIsRefreshingGitList(true);
    try {
      // 刷新文件树 （网页应用开发中需要，因为网页应用开发中文件内容是通过文件树接口一次性返回的，并不是点击文件时，通过文件url请求获取的）
      void callbacks.loadFileTree?.(true, true);

      const statusResponse = await apiGitStatus(
        buildGitWorkspaceParams(workspace),
      );

      if (statusResponse.code !== SUCCESS_CODE || !statusResponse.data) {
        return;
      }

      setGitBranch(statusResponse.data.current || 'main');

      const statusFileIds = mergeGitStatusFileIds(statusResponse.data);

      setInternalChangeFiles((prev) => {
        // 将 Git status 转为变更文件列表
        const nextChangeFiles = buildChangeFilesFromGitStatus(
          statusResponse.data!,
          statusFileIds,
          prev,
          (fileId) => callbacks.findFileNode?.(fileId) ?? null,
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
  }, [workspace, isRefreshingGitList, manageChangeFilesInternally, callbacks]);

  /** Git 变更操作成功后刷新列表（pageApp 内部 / taskAgent 走页面回调） */
  const refreshAfterGitMutation = useCallback(async () => {
    if (manageChangeFilesInternally) {
      await refreshGitList();
    } else {
      await callbacks.onRefreshGitList?.();
    }
  }, [manageChangeFilesInternally, refreshGitList, callbacks]);

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

      await refreshAfterGitMutation();
    },
    [
      workspace,
      syncAfterDiscardChange,
      setSelectedChangeFile,
      refreshAfterGitMutation,
    ],
  );

  /** 暂存更改（git add） */
  const handleStageChanges = useCallback(
    async (fileIds: string[]) => {
      if (!isGitWorkspaceReady(workspace) || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitStage(workspace, fileIds);
      if (isSuccess) {
        await refreshAfterGitMutation();
      }
    },
    [workspace, refreshAfterGitMutation],
  );

  /** 取消暂存（git restore --staged） */
  const handleUnstageChanges = useCallback(
    async (fileIds: string[]) => {
      if (!isGitWorkspaceReady(workspace) || !fileIds.length) {
        return;
      }

      const isSuccess = await runGitUnstage(workspace, fileIds);
      if (isSuccess) {
        await refreshAfterGitMutation();
      }
    },
    [workspace, refreshAfterGitMutation],
  );

  /**
   * 将文件路径添加到 .gitignore（pageApp 内置实现）
   * 若 .gitignore 不存在则新建，已存在则追加一行
   * @param fileId 文件 ID（相对路径）
   */
  const handlePageAppAddToGitignore = useCallback(
    async (fileId: string) => {
      if (workspace.workspaceType !== 'pageApp' || !workspace.projectId) {
        return;
      }

      const projectId = String(workspace.projectId);
      const gitignoreId = '.gitignore';
      const existingNode = callbacks.findFileNode?.(gitignoreId);
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
        await callbacks.loadFileTree?.(true, true);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
      }
    },
    [workspace, callbacks],
  );

  /**
   * 将文件路径添加到 .gitignore
   * taskAgent 走页面 callbacks；pageApp 走内置逻辑
   */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!isGitWorkspaceReady(workspace)) {
        return;
      }

      if (callbacks.addFileToGitignore) {
        try {
          await callbacks.addFileToGitignore(fileId);
        } catch (error) {
          console.error('Add to gitignore failed:', error);
        }
        return;
      }

      if (workspace.workspaceType === 'pageApp') {
        await handlePageAppAddToGitignore(fileId);
      }
    },
    [workspace, callbacks, handlePageAppAddToGitignore],
  );

  /**
   * 提交修改（保存并推送）
   * 成功后清空本地 Git 状态并刷新文件树与项目详情
   * @param commitMessage 提交说明
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
        // 执行 git commit + push
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
        setDiffFileContent(null);

        if (manageChangeFilesInternally) {
          setInternalChangeFiles([]);
          setStagedFileIds(new Set());
          callbacks.onRefreshProjectInfo?.();
        }

        await callbacks.onCommitSuccess?.();
      } catch (error) {
        console.error('Git commit push failed:', error);
      } finally {
        setIsCommitting(false);
      }
    },
    [
      workspace,
      changeFiles,
      manageChangeFilesInternally,
      callbacks,
      setSelectedChangeFile,
    ],
  );

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

  /**
   * 取消编辑并同步清理当前文件的 Git 变更记录
   * @param silent 是否静默取消（不弹出提示）
   */
  const handleCancelEdit = useCallback(
    (silent: boolean = false) => {
      const selectedFileId = callbacks.getFileContentState?.()?.selectedFile;
      callbacks.cancelEdit?.(silent);
      if (selectedFileId) {
        clearChangeForFile(selectedFileId);
      }
    },
    [callbacks, clearChangeForFile],
  );

  return {
    changeFiles,
    stagedFileIds,
    selectedChangeFile,
    selectedDiffFile,
    isCommitting,
    isRefreshingGitList: manageChangeFilesInternally
      ? isRefreshingGitList
      : false,
    gitBranch: manageChangeFilesInternally ? gitBranch : 'main',
    setSelectedChangeFile,
    syncChangeFiles,
    clearSelectedDiff,
    handleDiffFileSelect,
    handleOpenChangeFile,
    handleDiscardChange,
    handleStageChanges,
    handleUnstageChanges,
    handleAfterDiscardChange,
    handleAddToGitignore,
    handleCommit,
    refreshGitList,
    handleCancelEdit,
    clearChangeForFile,
  };
};
