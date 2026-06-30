import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import FilePreview, {
  FileType,
} from '@/components/business-component/FilePreview';
import { apiGitStatus } from '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management';
import {
  buildChangeFilesFromGitStatus,
  mergeGitStatusFileIds,
} from '@/components/business-component/FileTreeGitSourcePanel/utils/gitStatusUtils';
import CodeViewer from '@/components/CodeViewer';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ImageViewer } from '@/pages/AppDev/components';
import { dict } from '@/services/i18nRuntime';
import { fetchContentFromUrl } from '@/services/skill';
import { HideDesktopEnum } from '@/types/enums/agent';
import { FileNode } from '@/types/interfaces/appDev';
import { checkFileSizeExceedLimit } from '@/utils';
import {
  findBestMatchingFileNode,
  findFileNode,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isPreviewableFile,
  isVideoFile,
  processImageContent,
  transformFlatListToTree,
} from '@/utils/appDevUtils';
import { isMarkdownFile } from '@/utils/common';
import {
  downloadFileByUrl,
  updateFileProxyUrl,
  updateFileTreeContent,
  updateFileTreeName,
} from '@/utils/fileTree';
import { message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FileTreePreviewViewProps,
  FileTreePreviewViewValue,
} from '../types';
import { ChangeFileInfo } from '../types/file-tree';

/** 从文件树中移除指定 ID 的节点（含子树递归） */
const removeNodeByIdFromTree = (
  nodes: FileNode[],
  targetId: string,
): FileNode[] =>
  nodes
    .filter((node) => node.id !== targetId)
    .map((node) =>
      node.children?.length
        ? { ...node, children: removeNodeByIdFromTree(node.children, targetId) }
        : node,
    );

/**
 * 文件树 + 预览视图 Hook
 * 从 FileTreeView 提取的状态、副作用与处理器，供 FileTreePreviewPanel 及上层页面使用
 */
export function useFileTreePreviewView(
  props: FileTreePreviewViewProps,
): FileTreePreviewViewValue {
  const {
    className,
    headerClassName,
    taskAgentSelectedFileId,
    clearTaskAgentSelectedFileId,
    taskAgentSelectTrigger,
    isImportProjectTrigger,
    originalFiles,
    fileTreeDataLoading,
    readOnly = false,
    targetId,
    viewMode = 'preview',
    onUploadFiles,
    onExportProject,
    onRenameFile,
    // 创建文件回调
    onCreateFileNode,
    // 删除文件回调
    onDeleteFile,
    // 保存文件回调
    onSaveFiles,
    onImportProject,
    isImportingProject = false,
    // 单个文件内容变更后实时保存
    onSaveFileContent,
    agentSandboxId,
    showMoreActions = true,
    isFullscreenPreview = false,
    onFullscreenPreview,
    onShare,
    isShowShare = true,
    isShowExportPdfButton = true,
    isShowDownloadButton = true,
    showFullscreenIcon = true,
    onClose,
    hideFileTree = false,
    // 文件树是否固定（用户点击后固定）
    isFileTreePinned = false,
    // 文件树固定状态变化回调
    onFileTreePinnedChange,
    // 文件树侧边栏是否可见（受控模式）
    isFileTreeSidebarVisible,
    // 文件树侧边栏可见性变化回调
    onFileTreeSidebarVisibleChange,
    // 是否可以删除技能文件(SKILL.md文件), 默认不可以删除(为false时，则隐藏删除菜单项，为true时，则显示删除菜单项)
    isCanDeleteSkillFile = false,
    // 刷新文件树回调
    onRefreshFileTree,
    showRefreshButton = true,
    hideDesktop = HideDesktopEnum.No,
    isProjectSkill = false,
    initViewFileType,
    // 静态资源文件基础路径
    staticFileBasePath,
    /** 选中文件后打开右侧预览面板 */
    onFileSelectOpenPreview,
    /** 文件重命名成功后回调 */
    onFileRenamed,
    /** 文件/文件夹删除成功后回调 */
    onFileDeleted,
    /** 刷新文件树后，当前选中文件已不存在时回调 */
    onSelectedFileMissing,
    isDynamicTheme = false,
    /** 是否启用 Git status，仅通用型 TaskAgent 智能体为 true */
    enableGitStatus = false,
  } = props;
  const isCloudComputer = agentSandboxId === '-1';
  // 文件树数据
  const [files, setFiles] = useState<FileNode[]>([]);
  // 当前选中的文件ID
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  /**
   * 当前选中文件ID的同步引用
   * - 用途：在异步请求返回时，判断用户是否已经切换到其他文件
   */
  const selectedFileIdRef = useRef<string>('');
  /**
   * 当前文件选择请求 token
   * - 用途：只允许“最后一次点击文件”的请求回写内容，避免慢请求/跳转请求覆盖最新选中项
   */
  const latestFileSelectTokenRef = useRef<string>('');
  /** 文件树中选中的文件夹 ID（仅用于树高亮与工具栏新建父级，不影响预览区） */
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  // 选中的文件节点
  const [selectedFileNode, setSelectedFileNode] = useState<FileNode | null>(
    null,
  );
  // 内联重命名状态
  const [renamingNode, setRenamingNode] = useState<FileNode | null>(null);
  // 右键菜单目标节点
  const [contextMenuTarget, setContextMenuTarget] = useState<FileNode | null>(
    null,
  );
  // 右键菜单位置
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  // 右键菜单可见
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // 修改的文件列表
  const [changeFiles, setChangeFiles] = useState<ChangeFileInfo[]>([]);
  const changeFilesRef = useRef(changeFiles);
  changeFilesRef.current = changeFiles;
  const onSaveFileContentRef = useRef(onSaveFileContent);
  onSaveFileContentRef.current = onSaveFileContent;

  // Git 列表刷新进行中
  const [isRefreshingGitList, setIsRefreshingGitList] =
    useState<boolean>(false);
  const [gitBranch, setGitBranch] = useState<string>('main');
  const isRefreshingGitListRef = useRef<boolean>(false);

  // 是否正在保存文件
  const [isSavingFiles, setIsSavingFiles] = useState<boolean>(false);
  // 是否正在下载文件
  const [isDownloadingFile, setIsDownloadingFile] = useState<boolean>(false);
  // 当前下载文件的ID(用于header组件中下载图标是否显示为loading图标的判断标识)
  const [currentDownloadingFileId, setCurrentDownloadingFileId] =
    useState<string>('');
  // 是否正在导出 PDF
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  // 是否正在刷新文件树
  const [isRefreshingFileTree, setIsRefreshingFileTree] =
    useState<boolean>(false);
  const isRefreshingFileTreeRef = useRef<boolean>(false);
  const refreshFileTreeTimeoutRef = useRef<number | null>(null);

  /** 统一结束文件树刷新状态，避免异常或外部请求不 resolve 导致按钮持续 loading */
  const stopRefreshingFileTree = useCallback(() => {
    if (refreshFileTreeTimeoutRef.current) {
      window.clearTimeout(refreshFileTreeTimeoutRef.current);
      refreshFileTreeTimeoutRef.current = null;
    }
    isRefreshingFileTreeRef.current = false;
    setIsRefreshingFileTree(false);
  }, []);

  // 是否正在上传文件
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);
  // 是否正在导出项目
  const [isExportingProject, setIsExportingProject] = useState<boolean>(false);

  // 文件树是否可见（默认隐藏，但如果已固定则显示）
  const [internalFileTreeVisible, setInternalFileTreeVisible] =
    useState<boolean>(isFileTreePinned || false);
  const isFileTreeVisible = isFileTreeSidebarVisible || internalFileTreeVisible;

  // 文件树容器 ref
  const fileTreeContainerRef = useRef<HTMLDivElement>(null);

  // 用于跟踪用户是否主动选择了文件（通过点击文件树）
  const userSelectedFileRef = useRef<string | null>(null);
  // 用于记录上次的 taskAgentSelectedFileId 和 taskAgentSelectTrigger，避免重复选择
  const prevTaskAgentSelectedFileIdRef = useRef<string>('');
  const prevTaskAgentSelectTriggerRef = useRef<number | string | undefined>(
    undefined,
  );
  // 用于记录创建文件成功后需要选择的文件路径
  const pendingSelectFileRef = useRef<string | null>(null);
  /** 文件树异步刷新完成后，是否需要基于新文件树处理当前选中文件 */
  const pendingRefreshSelectedAfterFilesUpdateRef = useRef<boolean>(false);

  // 备份文件列表，用于判断文件列表是否发生变化
  const filesRef = useRef<FileNode[]>([]);
  /** TaskResult 等触发的自动选中：文件树刷新完成前暂存，避免 trigger 被过早消费 */
  const pendingTaskAgentAutoSelectRef = useRef<{
    fileId: string;
    trigger?: number | string;
  } | null>(null);
  /** 是否已发起过文件树拉取（用于区分「初始空数组」与「接口已返回空列表」） */
  const fileTreeFetchStartedRef = useRef(false);
  /** 是否已至少完成一次文件树拉取（含成功返回空列表） */
  const fileTreeFetchResolvedRef = useRef(false);

  useEffect(() => {
    fileTreeFetchStartedRef.current = false;
    fileTreeFetchResolvedRef.current = false;
  }, [targetId]);

  useEffect(() => {
    if (fileTreeDataLoading) {
      fileTreeFetchStartedRef.current = true;
      return;
    }
    if (fileTreeFetchStartedRef.current) {
      fileTreeFetchResolvedRef.current = true;
    }
  }, [fileTreeDataLoading]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    selectedFileIdRef.current = selectedFileId;
  }, [selectedFileId]);

  // 用于存储文件的刷新时间戳，确保每次点击时都能刷新
  // 统一使用一个时间戳，适用于 html、office、json、视频、音频、图片等需要刷新的文件类型
  const [fileRefreshTimestamp, setFileRefreshTimestamp] = useState<number>(
    Date.now(),
  );
  /** html / md：预览或代码视图 */
  const [viewFileType, setViewFileType] = useState<'preview' | 'code'>(
    'preview',
  );
  const onSelectedFileMissingRef = useRef(onSelectedFileMissing);
  onSelectedFileMissingRef.current = onSelectedFileMissing;

  useEffect(() => {
    if (!initViewFileType) {
      setViewFileType('preview');
    }
  }, [selectedFileId, initViewFileType]);

  useEffect(() => {
    if (initViewFileType) {
      setViewFileType(initViewFileType);
    }
  }, [initViewFileType]);

  // 当 isFileTreePinned 变化时，同步展开文件树（与 FileTreeView 一致）
  useEffect(() => {
    if (isFileTreePinned && isFileTreeSidebarVisible === undefined) {
      setInternalFileTreeVisible(true);
    }

    return () => {
      setInternalFileTreeVisible(false);
    };
  }, [isFileTreePinned, isFileTreeSidebarVisible]);

  useEffect(() => {
    // 如果通过父组件全屏预览模式打开，则设置全屏状态
    if (isFullscreenPreview) {
      setIsFullscreen(true);
    }
  }, [isFullscreenPreview]);

  // 获取文件内容并更新文件树
  const fetchFileContentUpdateFiles = useCallback(
    async (fileProxyUrl: string, fileId: string) => {
      try {
        // 获取文件内容
        const fileContent = await fetchContentFromUrl(fileProxyUrl);

        // 更新文件树中的文件内容
        setFiles((prevFiles) => {
          const updatedFiles: FileNode[] = updateFileTreeContent(
            fileId,
            fileContent,
            prevFiles,
          );
          return updatedFiles;
        });
        // 内容拉取成功后更新时间戳，供只读技能详情场景强制刷新 CodeViewer
        setFileRefreshTimestamp(Date.now());

        return fileContent;
      } catch (error) {
        console.error('Failed to fetch file content:', error);
        return '';
      }
    },
    [],
  );

  /** 导出 PDF 前先通过 fileProxyUrl 拉取 md/html 文件内容 */
  const resolveNodeContentForPdfExport = useCallback(
    async (node: FileNode): Promise<FileNode> => {
      const fileName = node.name || '';
      const canExportPdf =
        isMarkdownFile(fileName) ||
        fileName.endsWith('.html') ||
        fileName.endsWith('.htm');
      if (!canExportPdf || !node.fileProxyUrl) {
        return node;
      }

      const fileContent = await fetchFileContentUpdateFiles(
        node.fileProxyUrl,
        node.id,
      );
      return {
        ...node,
        content: fileContent,
      };
    },
    [fetchFileContentUpdateFiles],
  );

  // 判断文件是否为图片类型
  const isImage = isImageFile(selectedFileNode?.name || '');
  // 判断文件是否为视频类型
  const isVideo = isVideoFile(selectedFileNode?.name || '');
  // 判断文件是否为音频类型
  const isAudio = isAudioFile(selectedFileNode?.name || '');
  // 判断文件是否为文档类型
  const result = isDocumentFile(selectedFileNode?.name || '');
  // 判断文件是否为office文档类型
  const isOfficeDocument = result?.isDoc || false;
  const documentFileType = result?.fileType;

  /** 清空当前选中文件信息 */
  const clearSelectedFile = useCallback(() => {
    selectedFileIdRef.current = '';
    setSelectedFileId('');
    setSelectedFileNode(null);
  }, []);

  /** 通过当前选中文件的 fileProxyUrl 重新拉取文件内容 */
  const refreshSelectedFileContent = useCallback(
    async (targetNode?: FileNode) => {
      const currentSelectedFileId =
        targetNode?.id || selectedFileIdRef.current || selectedFileId;
      if (!currentSelectedFileId) {
        return;
      }

      const currentNode =
        targetNode ||
        findFileNode(currentSelectedFileId, filesRef.current) ||
        selectedFileNode;
      const fileProxyUrl = currentNode?.fileProxyUrl || '';
      if (!currentNode || !fileProxyUrl || currentNode.isLink) {
        return;
      }

      const fileName = currentNode.name || '';
      const currentDocumentResult = isDocumentFile(fileName);
      const shouldOnlyRefreshPreview =
        isVideoFile(fileName) ||
        isAudioFile(fileName) ||
        currentDocumentResult?.isDoc ||
        isImageFile(fileName);

      setFileRefreshTimestamp(Date.now());

      if (shouldOnlyRefreshPreview) {
        setSelectedFileNode((prevNode) =>
          prevNode ? { ...prevNode, ...currentNode } : currentNode,
        );
        return;
      }

      const newFileContent = await fetchFileContentUpdateFiles(
        fileProxyUrl,
        currentSelectedFileId,
      );

      // 请求返回时如果用户已经切换文件，则丢弃本次回写
      if (selectedFileIdRef.current !== currentSelectedFileId) {
        return;
      }

      setSelectedFileNode((prevNode) =>
        prevNode || currentNode
          ? {
              ...(prevNode || currentNode),
              ...currentNode,
              content: newFileContent || '',
            }
          : prevNode,
      );
    },
    [selectedFileId, selectedFileNode, fetchFileContentUpdateFiles],
  );

  // 刷新文件树和文件内容
  const handleRefreshFileList = useCallback(async () => {
    // 使用 ref 防重复点击，避免闭包中 isRefreshingFileTree 过期
    if (isRefreshingFileTreeRef.current) {
      return;
    }

    isRefreshingFileTreeRef.current = true;
    setIsRefreshingFileTree(true);
    if (refreshFileTreeTimeoutRef.current) {
      window.clearTimeout(refreshFileTreeTimeoutRef.current);
    }
    refreshFileTreeTimeoutRef.current = window.setTimeout(() => {
      pendingRefreshSelectedAfterFilesUpdateRef.current = false;
      stopRefreshingFileTree();
    }, 10000);

    try {
      pendingRefreshSelectedAfterFilesUpdateRef.current = Boolean(
        selectedFileIdRef.current || selectedFileId,
      );
      // 刷新文件树
      await onRefreshFileTree?.();
    } catch (error) {
      pendingRefreshSelectedAfterFilesUpdateRef.current = false;
      console.error('Failed to refresh file tree: ', error);
    } finally {
      // 如果父级暴露了文件树 loading，则等待外部 loading 结束再复位；
      // 否则直接复位，超时兜底会处理异常悬挂场景。
      if (!fileTreeDataLoading) {
        stopRefreshingFileTree();
      }
    }
  }, [
    onRefreshFileTree,
    selectedFileId,
    fileTreeDataLoading,
    stopRefreshingFileTree,
  ]);

  useEffect(() => {
    if (!fileTreeDataLoading && isRefreshingFileTreeRef.current) {
      stopRefreshingFileTree();
    }
  }, [fileTreeDataLoading, stopRefreshingFileTree]);

  useEffect(
    () => () => {
      if (refreshFileTreeTimeoutRef.current) {
        window.clearTimeout(refreshFileTreeTimeoutRef.current);
      }
    },
    [],
  );

  /**
   * 刷新 Git 变更列表（git status）
   * 文件树展开或暂存/取消暂存后调用，与 AppDev 源代码管理保持一致
   */
  const refreshGitList = useCallback(async () => {
    if (!enableGitStatus) {
      return;
    }

    const cid = Number(targetId);
    if (!cid || isRefreshingGitListRef.current) {
      return;
    }

    isRefreshingGitListRef.current = true;
    setIsRefreshingGitList(true);

    try {
      // 文件树刷新不阻塞 git status，避免与 openPreviewView 等并发刷新时 Promise 悬挂
      // void onRefreshFileTree?.();

      const statusResponse = await apiGitStatus({
        workspaceType: 'taskAgent',
        cid,
      });

      if (statusResponse.code !== SUCCESS_CODE || !statusResponse.data) {
        return;
      }

      setGitBranch(statusResponse.data.current || 'main');

      const statusFileIds = mergeGitStatusFileIds(statusResponse.data);

      setChangeFiles((prev) =>
        buildChangeFilesFromGitStatus(
          statusResponse.data!,
          statusFileIds,
          prev,
          (fileId) => findFileNode(fileId, filesRef.current),
        ),
      );
    } finally {
      isRefreshingGitListRef.current = false;
      setIsRefreshingGitList(false);
    }
  }, [enableGitStatus, targetId]);

  /** 启用 Git status 时拉取一次，避免新建临时节点导致 files.length 变化后误触发 */
  useEffect(() => {
    if (!targetId || !enableGitStatus) {
      isRefreshingGitListRef.current = false;
      setIsRefreshingGitList(false);
      return;
    }

    void refreshGitList();
    return () => {
      isRefreshingGitListRef.current = false;
      setIsRefreshingGitList(false);
    };
  }, [targetId, enableGitStatus]);

  // 文件选择（内部函数，执行实际的选择逻辑）
  const handleFileSelectInternal = useCallback(
    async (fileId: string, options?: { selectFolder?: boolean }) => {
      // 根据文件ID查找文件节点（精确匹配）
      let fileNode = findFileNode(fileId, files);

      // 如果仍然没有找到，尝试模糊匹配
      if (!fileNode && fileId && fileId.includes('.')) {
        fileNode = findBestMatchingFileNode(fileId, files);
      }

      if (fileNode) {
        // 文件树中点击文件夹：更新树选中态（与文件高亮互斥），不切换预览区
        if (fileNode.type === 'folder' && options?.selectFolder) {
          setSelectedFolderId(fileNode.id);
          return;
        }

        // 选中文件时清除文件夹选中态
        setSelectedFolderId('');

        // 为本次“选中文件”生成唯一 token（后续异步回写时用于判定是否过期）
        const currentSelectedId = fileNode?.id || fileId;
        const selectToken = `${currentSelectedId}-${Date.now()}`;
        latestFileSelectTokenRef.current = selectToken;

        // 如果文件节点是文件夹(folder)，则选择第一个子节点(点击会话中文件名时，如果文件名是文件夹，则选择第一个子节点)
        if (fileNode.type === 'folder') {
          // 如果文件节点是文件夹，且有子节点，则选择第一个子节点
          if (fileNode?.children?.length) {
            const firstChild = fileNode.children?.[0];
            if (firstChild) {
              handleFileSelectInternal(firstChild.id);
            }
          }
          return;
        }

        // 获取文件代理URL
        const fileProxyUrl = fileNode?.fileProxyUrl || '';

        /**
         * kill技能页面时，文件可能有内容，也可能文件内容为空，但是没有文件代理URL
         * 如果文件节点是链接文件，则不支持预览
         */
        if (!fileProxyUrl || fileNode?.isLink) {
          onFileSelectOpenPreview?.(fileNode?.id || fileId);
          // 同步 ref，确保异步逻辑读取到最新选中文件
          selectedFileIdRef.current = currentSelectedId;
          setSelectedFileId(currentSelectedId);
          if (!initViewFileType) {
            setViewFileType('preview');
          }
          setSelectedFileNode(fileNode);
          return;
        }

        // 选中文件后打开右侧预览面板（隐藏编排区域）
        onFileSelectOpenPreview?.(fileNode?.id || fileId);

        // 判断文件是否为文档类型
        const result = isDocumentFile(fileNode?.name || '');
        // 判断文件是否为office文档类型
        const isOfficeFile = result?.isDoc || false;
        // 判断文件是否为视频类型
        const isVideoFileType = isVideoFile(fileNode?.name || '');
        // 判断文件是否为音频类型
        const isAudioFileType = isAudioFile(fileNode?.name || '');
        // 判断文件是否为图片类型
        const isImageFileType = isImageFile(fileNode?.name || '');

        // 更新刷新时间戳，触发预览区重渲染
        setFileRefreshTimestamp(Date.now());

        // 先写 ref 再 setState，降低异步回调读取旧选中值的概率
        selectedFileIdRef.current = currentSelectedId;
        setSelectedFileId(currentSelectedId);

        if (!initViewFileType) {
          setViewFileType('preview');
        }

        // 图片、视频、音频、office 等通过 FilePreview 渲染
        if (
          isImageFileType ||
          isVideoFileType ||
          isAudioFileType ||
          isOfficeFile
        ) {
          setSelectedFileNode({ ...fileNode });
        }
        // 其他类型文件：使用文件代理URL获取文件内容
        // "fileProxyUrl": "/api/computer/static/1464425/国际财经分析报告_20241222.md"
        else if (fileProxyUrl) {
          // 判断文件是否支持预览（白名单方案）
          const isPreviewable = isPreviewableFile(fileNode?.name || '', true);
          // 如果文件不支持预览，则直接设置选中文件节点（如.zip、.rar、.7z 等压缩文件，不支持预览，也不需要获取压缩文件内容）
          if (!isPreviewable) {
            setSelectedFileNode(fileNode);
            return;
          }

          const fileNameLower = (fileNode?.name || '').toLowerCase();
          const _isMarkdownFile = isMarkdownFile(fileNameLower);
          if (_isMarkdownFile && !initViewFileType) {
            setSelectedFileNode({
              ...fileNode,
              content: '',
            });
            return;
          }

          // 先切到当前文件并清空内容，避免异步返回前继续显示上一个文件内容
          setSelectedFileNode({
            ...fileNode,
            content: '',
          });

          // 获取文件内容并更新文件树
          const newFileContent = await fetchFileContentUpdateFiles(
            fileProxyUrl,
            currentSelectedId,
          );

          // 只允许“当前最新选中”的请求回写编辑器内容，避免 302 跳转/慢请求导致旧数据覆盖
          if (
            latestFileSelectTokenRef.current !== selectToken ||
            selectedFileIdRef.current !== currentSelectedId
          ) {
            return;
          }

          // 设置选中文件节点
          setSelectedFileNode({
            ...fileNode,
            content: newFileContent || '',
          });
        }
      } else {
        // 所有匹配方式都失败，设置选中文件节点为 null
        setSelectedFileNode(null);
        setSelectedFileId('');
      }
    },
    [files, onFileSelectOpenPreview, initViewFileType],
  );

  // 文件选择（对外接口，用于用户主动选择）
  const handleFileSelect = useCallback(
    async (fileId: string, options?: { selectFolder?: boolean }) => {
      if (options?.selectFolder) {
        await handleFileSelectInternal(fileId, options);
        return;
      }
      // 记录用户主动选择的文件ID
      userSelectedFileRef.current = fileId;
      clearTaskAgentSelectedFileId?.();
      await handleFileSelectInternal(fileId, options);
    },
    [handleFileSelectInternal, clearTaskAgentSelectedFileId],
  );

  /**
   * 监听 taskAgentSelectedFileId / taskAgentSelectTrigger，自动定位并打开消息中的目标文件。
   *
   * 典型入口：TaskResult、Markdown 内联文件链接点击。
   * 调用方通常会先 openPreviewView({ forceRefresh: true }) 拉取最新文件树，
   * 再设置 fileId + trigger；本 effect 负责在树就绪后完成选中，并避免重复请求文件列表。
   */
  useEffect(() => {
    /** 判断目标 fileId 是否已在当前文件树中（含模糊匹配，兼容路径差异） */
    const isFileInTree = (fileId: string, tree: FileNode[]) => {
      if (!fileId || !tree?.length) {
        return false;
      }
      if (findFileNode(fileId, tree)) {
        return true;
      }
      if (fileId.includes('.')) {
        return Boolean(findBestMatchingFileNode(fileId, tree));
      }
      return false;
    };

    /** 执行自动选中，并同步 prev ref，避免同一 trigger 重复处理 */
    const applyAutoSelect = (fileId: string, tree: FileNode[]) => {
      void handleFileSelectInternal(fileId);
      prevTaskAgentSelectedFileIdRef.current = fileId;
      if (taskAgentSelectTrigger !== undefined) {
        prevTaskAgentSelectTriggerRef.current = taskAgentSelectTrigger;
      }
      filesRef.current = tree;
      pendingTaskAgentAutoSelectRef.current = null;
    };

    // 外部清空选中目标时，重置所有自动选择相关状态
    if (!taskAgentSelectedFileId) {
      prevTaskAgentSelectedFileIdRef.current = '';
      prevTaskAgentSelectTriggerRef.current = undefined;
      userSelectedFileRef.current = null;
      pendingTaskAgentAutoSelectRef.current = null;
      return;
    }

    // 用户重复点击同一文件时，仅靠 fileId 无法触发 effect，需配合 trigger 时间戳
    const isTriggerUpdate =
      taskAgentSelectTrigger !== undefined &&
      taskAgentSelectTrigger !== prevTaskAgentSelectTriggerRef.current;

    const hasSelectionChanged =
      taskAgentSelectedFileId !== prevTaskAgentSelectedFileIdRef.current;

    const pending = pendingTaskAgentAutoSelectRef.current;
    /** 上次刷新后仍待选中的同一目标（files 更新后会再次进入本 effect） */
    const isPendingRetry =
      pending?.fileId === taskAgentSelectedFileId &&
      (pending.trigger === undefined ||
        pending.trigger === taskAgentSelectTrigger);

    const isFileTreeFetchInFlight =
      Boolean(fileTreeDataLoading) || isRefreshingFileTreeRef.current;
    /**
     * 父级是否已完成至少一次文件树拉取。
     * 不能只靠 originalFiles.length：接口成功返回空列表时 length 为 0，
     * 若仍视为「未拉取」会与 isPendingRetry 形成无限 refresh 循环。
     */
    const hasFetchedOriginalFiles =
      Boolean(originalFiles?.length) || fileTreeFetchResolvedRef.current;

    /** 拉取已完成但文件树仍为空，放弃自动选中并通知外部清理 */
    const abandonAutoSelectWhenTreeEmpty = () => {
      pendingTaskAgentAutoSelectRef.current = null;
      prevTaskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
      if (taskAgentSelectTrigger !== undefined) {
        prevTaskAgentSelectTriggerRef.current = taskAgentSelectTrigger;
      }
      onSelectedFileMissingRef.current?.(taskAgentSelectedFileId);
    };

    /**
     * 按需刷新文件树，避免与 openPreviewView.forceRefresh 重复调用同一接口。
     * - 正在加载 / 刷新中：跳过
     * - 已完成拉取（含空列表）：不再二次请求
     */
    const requestFileTreeRefreshIfNeeded = () => {
      if (isFileTreeFetchInFlight || hasFetchedOriginalFiles) {
        return;
      }
      void handleRefreshFileList();
    };

    // 本地树尚未构建：记录 pending，必要时触发一次刷新；files 更新后依赖项变化会重入
    if (!files?.length) {
      if (isTriggerUpdate || isPendingRetry || hasSelectionChanged) {
        if (
          hasFetchedOriginalFiles &&
          !originalFiles?.length &&
          !isFileTreeFetchInFlight
        ) {
          abandonAutoSelectWhenTreeEmpty();
          return;
        }
        pendingTaskAgentAutoSelectRef.current = {
          fileId: taskAgentSelectedFileId,
          trigger: taskAgentSelectTrigger,
        };
        requestFileTreeRefreshIfNeeded();
      }
      return;
    }

    const shouldAutoSelect =
      isTriggerUpdate ||
      hasSelectionChanged ||
      isPendingRetry ||
      (taskAgentSelectedFileId && !prevTaskAgentSelectedFileIdRef.current) ||
      filesRef.current?.length !== files.length;

    if (!shouldAutoSelect) {
      return;
    }

    // 用户已在树中手动选了其他文件，且非本次 trigger 驱动时，不覆盖用户选择
    if (
      !isTriggerUpdate &&
      !isPendingRetry &&
      userSelectedFileRef.current &&
      userSelectedFileRef.current !== taskAgentSelectedFileId
    ) {
      return;
    }

    userSelectedFileRef.current = null;

    pendingTaskAgentAutoSelectRef.current = {
      fileId: taskAgentSelectedFileId,
      trigger: taskAgentSelectTrigger,
    };

    if (isFileInTree(taskAgentSelectedFileId, files)) {
      applyAutoSelect(taskAgentSelectedFileId, files);
      return;
    }

    // 目标不在当前树中（例如新产出文件）：尝试刷新后再选
    if (hasFetchedOriginalFiles) {
      abandonAutoSelectWhenTreeEmpty();
      return;
    }
    requestFileTreeRefreshIfNeeded();
  }, [
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    handleFileSelectInternal,
    handleRefreshFileList,
    files,
    fileTreeDataLoading,
    originalFiles,
  ]);

  useEffect(() => {
    if (!originalFiles || originalFiles.length === 0) {
      setFiles([]);
      if (pendingRefreshSelectedAfterFilesUpdateRef.current) {
        pendingRefreshSelectedAfterFilesUpdateRef.current = false;
        const currentSelectedFileId =
          selectedFileIdRef.current || selectedFileId;
        if (currentSelectedFileId) {
          onSelectedFileMissingRef.current?.(currentSelectedFileId);
          clearSelectedFile();
        }
      }
      return;
    }
    // 如果文件列表不为空，则转换为树形结构
    if (Array.isArray(originalFiles) && originalFiles.length > 0) {
      const treeData: FileNode[] = transformFlatListToTree(
        originalFiles,
        false,
      );
      filesRef.current = treeData;
      setFiles(treeData);

      // discard / 回滚等场景必须基于“刚刷新得到的新文件树”判断当前选中文件。
      // 不再放到独立的 files effect 中，避免同一轮 effect 读取到旧 files。
      if (pendingRefreshSelectedAfterFilesUpdateRef.current) {
        pendingRefreshSelectedAfterFilesUpdateRef.current = false;

        const currentSelectedFileId =
          selectedFileIdRef.current || selectedFileId;
        if (!currentSelectedFileId) {
          return;
        }

        const nextSelectedFileNode = findFileNode(
          currentSelectedFileId,
          treeData,
        );
        if (!nextSelectedFileNode) {
          onSelectedFileMissingRef.current?.(currentSelectedFileId);
          clearSelectedFile();
          return;
        }

        selectedFileIdRef.current = nextSelectedFileNode.id;
        setSelectedFileId(nextSelectedFileNode.id);
        setSelectedFileNode(nextSelectedFileNode);
        void refreshSelectedFileContent(nextSelectedFileNode);
      }
    }
  }, [originalFiles]);

  // 监听 files 变化，当有待选择的文件时自动选择
  useEffect(() => {
    if (pendingSelectFileRef.current && files && files.length > 0) {
      const filePath = pendingSelectFileRef.current;
      // 从文件树中查找新文件（通过路径或ID匹配）
      const newFile = findFileNode(filePath, files);
      if (newFile) {
        // 找到新文件，清除待选择标记，使用内部函数选择（不设置用户选择标记）
        pendingSelectFileRef.current = null;
        handleFileSelectInternal(filePath);
      }
    }
  }, [files, handleFileSelectInternal]);

  // 监听 files 变化，同步更新 selectedFileNode 的 content（用于重新导入后更新文件内容）
  // 特别适用于 SkillDetails 页面，其中 fileProxyUrl 为空，内容直接存储在 content 字段中
  useEffect(() => {
    // 如果当前有选中的文件，且 files 已更新，需要同步更新 selectedFileNode 的 content
    if (
      files &&
      files.length > 0 &&
      (isImportProjectTrigger || isProjectSkill)
    ) {
      // 优先使用当前选中的 ID，如果没有则尝试使用外部传入的 ID
      const targetSyncId = selectedFileId || taskAgentSelectedFileId;
      if (!targetSyncId) return;

      // 从新的 files 中查找对应的文件节点
      const newFileNode = findFileNode(targetSyncId, files);

      if (newFileNode) {
        setSelectedFileNode(newFileNode);
        setSelectedFileId(newFileNode?.id);
      }
    }
  }, [
    files,
    isImportProjectTrigger,
    isProjectSkill,
    selectedFileId,
    taskAgentSelectedFileId,
  ]);

  /**
   * 处理右键菜单显示
   * @param e - 鼠标事件
   * @param node - 目标节点, 可以为 null 表示点击空白区域，清空目标节点
   */
  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    if (readOnly) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    setContextMenuTarget(node);

    // 计算相对于文件树容器的坐标
    // 如果文件树容器存在，使用相对于容器的坐标；否则使用视口坐标
    if (fileTreeContainerRef.current) {
      const containerRect =
        fileTreeContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const relativeY = e.clientY - containerRect.top;
      setContextMenuPosition({ x: relativeX, y: relativeY });
    } else {
      // 如果容器不存在，使用视口坐标作为后备方案
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    }

    setContextMenuVisible(true);
  };

  /**
   * 关闭右键菜单
   * @param e - 鼠标事件（可能是 React.MouseEvent 或原生 Event，可选）
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  }, []);

  // 点击外部关闭右键菜单
  useEffect(() => {
    // 只在右键菜单显示时才添加点击事件监听器
    if (!contextMenuVisible) {
      return;
    }

    const handleDocumentClick = () => {
      // 只在右键菜单显示时才处理点击事件（双重检查，避免闭包问题）
      // 注意：这里使用最新的 contextMenuVisible 状态可能会有延迟
      // 但由于我们在 useEffect 中已经检查了 contextMenuVisible，所以这里应该是安全的
      closeContextMenu();
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [contextMenuVisible, closeContextMenu]);

  /**
   * 取消重命名
   */
  const handleCancelRename = (options?: {
    removeIfNew?: boolean;
    node?: FileNode | null;
  }) => {
    // 如果是新建节点且未输入内容，则需要从文件树中移除该临时节点
    if (options?.removeIfNew && options.node) {
      const targetId = options.node.id;

      setFiles((prevFiles) => removeNodeByIdFromTree(prevFiles, targetId));

      // 如果当前选中的是这个临时节点，清空选中状态
      if (selectedFileId === targetId) {
        setSelectedFileId('');
        setSelectedFileNode(null);
      }
    }

    // 仅当取消的是当前重命名节点时才清空状态，
    // 避免上一个输入框的延迟 blur 误清掉新一轮新建的重命名状态
    setRenamingNode((prev) =>
      options?.node && prev && prev.id !== options.node.id ? prev : null,
    );
  };

  /**
   * 处理重命名操作（从右键菜单触发）
   */
  const handleRenameFromMenu = (node: FileNode) => {
    setRenamingNode(node);
  };

  /**
   * 新建失败时：移除临时节点并退出重命名态，恢复到新建前的目录
   */
  const rollbackFailedCreate = (
    fileNode: FileNode,
    filesBackup: FileNode[],
  ) => {
    setFiles(removeNodeByIdFromTree(filesBackup, fileNode.id));
    setRenamingNode(null);
  };

  /**
   * 处理重命名操作
   */
  const handleRenameFile = async (fileNode: FileNode, newName: string) => {
    if (!newName || !newName?.trim()) {
      if (fileNode?.status === 'create') {
        setFiles((prev) => removeNodeByIdFromTree(prev, fileNode.id));
        setRenamingNode(null);
      }
      return;
    }

    // 备份文件列表,用于重命名失败时恢复文件树
    const filesBackup = cloneDeep(files);

    try {
      // 重命名文件失败：找不到文件节点
      if (!fileNode) {
        return;
      }

      const isNewNode = fileNode.status === 'create';

      // 先立即更新文件树中的显示名字，提供即时反馈
      const updatedFileTree = updateFileTreeName(
        files,
        fileNode.id,
        newName.trim(),
      );

      setFiles(updatedFileTree);

      // 如果是新建节点（文件或文件夹），走创建逻辑；否则走重命名逻辑
      if (isNewNode) {
        const isCreateSuccess = await onCreateFileNode?.(fileNode, newName);

        if (isCreateSuccess) {
          const trimmedName = newName?.trim();
          if (!trimmedName) {
            rollbackFailedCreate(fileNode, filesBackup);
            return;
          }

          // 计算新文件的完整路径：父路径 + 新文件名
          const parentPath = fileNode.parentPath || '';
          const newPath = parentPath
            ? `${parentPath}/${trimmedName}`
            : trimmedName;

          // 记录需要选择的文件路径，等待文件树更新后自动选择
          pendingSelectFileRef.current = newPath;
        } else {
          rollbackFailedCreate(fileNode, filesBackup);
        }
      } else {
        // 直接调用现有的重命名文件功能(异步更新文件树)
        const isChangeSuccess = await onRenameFile?.(fileNode, newName);
        if (isChangeSuccess) {
          const trimmedName = newName.trim();
          const newNodeId = fileNode.parentPath
            ? `${fileNode.parentPath}/${trimmedName}`
            : trimmedName;

          onFileRenamed?.(fileNode.id, newNodeId);

          if (fileNode.type === 'folder' && selectedFolderId === fileNode.id) {
            setSelectedFolderId(newNodeId);
          }

          // 如果当前选中的文件节点是被重命名的节点，则同步更新名称
          if (
            selectedFileNode &&
            (selectedFileNode.id === fileNode.id ||
              selectedFileNode.name === fileNode.name)
          ) {
            // 根据新的文件名，替换 fileProxyUrl 中的文件名部分
            const newFileProxyUrl = fileNode?.fileProxyUrl
              ? updateFileProxyUrl(
                  fileNode.fileProxyUrl,
                  trimmedName,
                  fileNode.parentPath || undefined,
                )
              : fileNode?.fileProxyUrl;

            setSelectedFileNode((prevNode) =>
              prevNode
                ? {
                    ...prevNode,
                    name: trimmedName,
                    id: newNodeId,
                    path: newNodeId,
                    fullPath: newNodeId,
                    fileProxyUrl: newFileProxyUrl, // 更新 fileProxyUrl
                  }
                : prevNode,
            );

            setSelectedFileId(newNodeId);
          }
        } else {
          setFiles(filesBackup);
        }
      }
    } catch {
      if (fileNode?.status === 'create') {
        rollbackFailedCreate(fileNode, filesBackup);
      } else {
        setFiles(filesBackup);
      }
    }
  };

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadMultipleFiles = async (node: FileNode | null) => {
    // 两种情况 第一个是文件夹，第二个是文件
    let relativePath = '';

    if (node) {
      if (node.type === 'file') {
        relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
      } else if (node.type === 'folder') {
        relativePath = node.path + '/';
      }
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = '*';
    input.multiple = true;
    document.body.appendChild(input);

    // 等待用户选择文件
    input.click();

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      // 获取上传的文件列表
      const files = Array.from((e.target as HTMLInputElement).files || []);
      // 获取上传的文件路径列表
      const filePaths = files.map((file) => relativePath + file.name);

      // 检查文件大小是否超过最大上传文件大小
      const { isExceedLimitSize, maxFileSize } =
        checkFileSizeExceedLimit(files);
      // 如果超过最大上传文件大小，则提示错误
      if (isExceedLimitSize) {
        message.error(
          dict('PC.Common.Global.uploadFileSizeExceed', String(maxFileSize)),
        );
        return;
      }

      setIsUploadingFiles(true);

      try {
        // 直接调用现有的上传多个文件功能
        await onUploadFiles?.(files, filePaths);

        setTimeout(() => {
          setIsUploadingFiles(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to upload file', error);
        setIsUploadingFiles(false);
      } finally {
        document.body.removeChild(input);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
    };
  };

  /**
   * 处理删除操作
   */
  const handleDelete = async (node: FileNode) => {
    // 直接调用现有的删除文件功能，等待返回值
    const isDeleteSuccess = await onDeleteFile?.(node);

    // 成功删除
    if (isDeleteSuccess) {
      // 如果删除的是当前选中的文件节点，则清空选中状态
      if (node.id === selectedFileNode?.id) {
        setSelectedFileNode(null);
        setSelectedFileId('');
      }
      if (node.id === selectedFolderId) {
        setSelectedFolderId('');
      }
      onFileDeleted?.(node);
    }
  };

  /**
   * 在文件树中指定位置创建一个临时节点，并进入重命名状态
   * @param parentNode 目标父级文件夹；为空表示在根目录创建
   * @param type 创建类型：file 或 folder
   */
  const createTempNodeAndStartRename = (
    parentNode: FileNode | null,
    type: 'file' | 'folder',
  ) => {
    // 连续点击新建时，先移除上一个尚未命名的临时节点，避免残留空占位
    if (renamingNode?.status === 'create') {
      setFiles((prevFiles) =>
        removeNodeByIdFromTree(prevFiles, renamingNode.id),
      );
    }

    const parentPath = parentNode?.path || null;
    const tempIdSuffix = `__new__${Date.now()}`;
    const fullPath = parentPath
      ? `${parentPath}/${tempIdSuffix}`
      : tempIdSuffix;

    // 预先构造好要插入的临时节点
    const newNode: FileNode = {
      id: fullPath,
      name: '',
      type,
      path: fullPath,
      children: type === 'folder' ? [] : undefined,
      parentPath: parentPath,
      content: type === 'file' ? '' : undefined,
      lastModified: Date.now(),
      status: 'create',
    };

    setFiles((prevFiles) => {
      const parentId = parentNode?.id || null;

      const insertNodeAtTop = (
        nodes: FileNode[],
        targetParentId: string | null,
      ): FileNode[] => {
        // 在根目录创建
        if (!targetParentId) {
          return [newNode, ...nodes];
        }

        return nodes.map((node) => {
          if (node.id === targetParentId) {
            const children = node.children || [];
            return {
              ...node,
              children: [newNode, ...children],
            };
          }

          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: insertNodeAtTop(node.children, targetParentId),
            };
          }

          return node;
        });
      };

      const updatedFiles = insertNodeAtTop(prevFiles, parentId);
      return updatedFiles;
    });

    // 将新建的节点设置为当前重命名目标和选中节点
    if (newNode) {
      setRenamingNode(newNode);
    }
  };

  /**
   * 处理项目导出
   */
  const handleExportProject = useCallback(async () => {
    if (!onExportProject) {
      return;
    }
    setIsExportingProject(true);
    try {
      await onExportProject();
    } finally {
      setTimeout(() => setIsExportingProject(false), 1000);
    }
  }, [onExportProject]);

  const handleCreateFile = (parentNode: FileNode | null) => {
    createTempNodeAndStartRename(parentNode, 'file');
  };

  /**
   * 处理新建文件夹操作
   */
  const handleCreateFolder = (parentNode: FileNode | null) => {
    createTempNodeAndStartRename(parentNode, 'folder');
  };

  /**
   * 处理内容变化：同步本地状态并防抖提交到服务端
   */
  const handleContentChange = useCallback(
    (fileId: string, content: string) => {
      const currentFile = findFileNode(fileId, filesRef.current);
      const originalContent = currentFile?.content || '';
      const existingChange = changeFilesRef.current.find(
        (item) => item.fileId === fileId,
      );
      const originalFileContent =
        existingChange?.originalFileContent ?? originalContent;

      setFiles((prevFiles) =>
        updateFileTreeContent(fileId, content, prevFiles),
      );

      setSelectedFileNode((prevNode) =>
        prevNode ? { ...prevNode, content } : prevNode,
      );

      setChangeFiles((prevChangeFiles) => {
        const existingIndex = prevChangeFiles.findIndex(
          (item) => item.fileId === fileId,
        );

        if (existingIndex !== -1) {
          const updatedChangeFiles = [...prevChangeFiles];
          updatedChangeFiles[existingIndex] = {
            ...updatedChangeFiles[existingIndex],
            fileContent: content,
          };
          return updatedChangeFiles;
        }
        if (content !== originalFileContent) {
          return [
            ...prevChangeFiles,
            {
              fileId,
              fileContent: content,
              originalFileContent,
            },
          ];
        }
        return prevChangeFiles;
      });

      if (content !== originalFileContent && !readOnly) {
        void onSaveFileContentRef
          .current?.(fileId, content, originalFileContent)
          .then((success) => {
            if (!success) {
              return;
            }
            setChangeFiles((prev) => {
              const item = prev.find((change) => change.fileId === fileId);
              if (!item || item.fileContent !== content) {
                return prev;
              }
              return prev.filter((change) => change.fileId !== fileId);
            });
          });
      }
    },
    [readOnly],
  );

  /**
   * 处理全屏切换
   */
  const handleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    onFullscreenPreview?.(newFullscreenState);
    // 切换 body 类，用于隐藏父组件的干扰元素
    if (newFullscreenState) {
      document.body.classList.add('file-tree-view-fullscreen-active');
    } else {
      document.body.classList.remove('file-tree-view-fullscreen-active');
    }
  };

  /** 按 ESC 键退出全屏 */
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        onFullscreenPreview?.(false);
        document.body.classList.remove('file-tree-view-fullscreen-active');
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen, onFullscreenPreview]);

  // 保存文件
  const saveFiles = async () => {
    setIsSavingFiles(true);
    const isSaveSuccess = await onSaveFiles?.(changeFiles);
    setIsSavingFiles(false);
    if (isSaveSuccess) {
      // 清空已修改文件列表
      setChangeFiles([]);
    }
  };

  /**
   * 放弃单个文件的修改，还原为原始内容
   * @param fileId 文件 ID
   */
  const discardChangeFile = useCallback(
    (fileId: string) => {
      const changeFile = changeFiles.find((item) => item.fileId === fileId);
      if (!changeFile) {
        return;
      }

      setFiles((prevFiles) =>
        updateFileTreeContent(
          fileId,
          changeFile.originalFileContent,
          prevFiles,
        ),
      );

      if (selectedFileId === fileId) {
        setSelectedFileNode((prevNode) =>
          prevNode
            ? { ...prevNode, content: changeFile.originalFileContent }
            : prevNode,
        );
      }

      setChangeFiles((prev) => prev.filter((item) => item.fileId !== fileId));
    },
    [changeFiles, selectedFileId],
  );

  // 取消保存文件
  const cancelSaveFiles = () => {
    // 还原所有已修改文件的内容
    let restoredFiles = files;
    changeFiles.forEach((changeFile) => {
      restoredFiles = updateFileTreeContent(
        changeFile.fileId,
        changeFile.originalFileContent,
        restoredFiles,
      );
    });
    setFiles(restoredFiles);

    // 从已修改文件列表中获取原始内容，用于还原当前选中的文件内容
    const changeFile = changeFiles?.find(
      (item) => item.fileId === selectedFileId,
    );
    if (changeFile) {
      const originalFileContent = changeFile?.originalFileContent;

      setSelectedFileNode((prevNode: any) => ({
        ...prevNode,
        content: originalFileContent,
      }));
    }

    // 清空已修改文件列表
    setChangeFiles([]);
  };

  /**
   * 处理文件树展开/折叠（点击图标）
   * 隐藏状态时点击展开文件树，展开时点击收起文件树
   */
  const handleFileTreeToggle = () => {
    const newVisibleState = !isFileTreeVisible;
    if (isFileTreeSidebarVisible !== undefined) {
      onFileTreeSidebarVisibleChange?.(newVisibleState);
    } else {
      setInternalFileTreeVisible(newVisibleState);
    }
    // 如果展开文件树，同时固定它；如果隐藏文件树，取消固定
    if (newVisibleState) {
      onFileTreePinnedChange?.(true);
    } else {
      onFileTreePinnedChange?.(false);
    }
  };

  // 处理下载文件操作
  const handleDownloadFileByUrl = async (
    node: FileNode,
    exportAsPdf?: boolean,
  ) => {
    setIsDownloadingFile(true);
    setCurrentDownloadingFileId(node?.id);
    try {
      const targetNode = exportAsPdf
        ? await resolveNodeContentForPdfExport(node)
        : node;
      await downloadFileByUrl?.(targetNode, exportAsPdf);
      setTimeout(() => {
        setIsDownloadingFile(false);
        setCurrentDownloadingFileId('');
      }, 1000);
    } catch (error) {
      console.error('Failed to download file', error);
      setIsDownloadingFile(false);
      setCurrentDownloadingFileId('');
    }
  };

  /** 切换为代码视图时重新拉取文件内容（与 FileTreeView 一致） */
  const handleRefreshFileContent = useCallback(async () => {
    const fileProxyUrl = selectedFileNode?.fileProxyUrl || '';
    if (!fileProxyUrl || !selectedFileId) {
      return;
    }

    const currentRefreshFileId = selectedFileId;

    const fileName = selectedFileNode?.name || '';
    const previewable = isPreviewableFile(fileName, true);
    const isNeedRefreshFileContent =
      !previewable ||
      selectedFileNode?.isLink ||
      isOfficeDocument ||
      isVideo ||
      isAudio ||
      isImage;

    if (isNeedRefreshFileContent) {
      return;
    }

    try {
      const newFileContent = await fetchFileContentUpdateFiles(
        fileProxyUrl,
        currentRefreshFileId,
      );
      // 请求返回时若用户已切换文件，则丢弃本次回写
      if (selectedFileIdRef.current !== currentRefreshFileId) {
        return;
      }
      setSelectedFileNode((prevNode) =>
        prevNode
          ? {
              ...prevNode,
              content: newFileContent || '',
            }
          : prevNode,
      );
    } catch (error) {
      console.error('Failed to refresh file content:', error);
    }
  }, [
    selectedFileNode,
    selectedFileId,
    isOfficeDocument,
    isVideo,
    isAudio,
    isImage,
    fetchFileContentUpdateFiles,
  ]);

  const handleViewFileTypeChange = useCallback(
    async (type: 'preview' | 'code') => {
      setViewFileType(type);
      if (type === 'code' && selectedFileNode) {
        await handleRefreshFileContent();
      }
    },
    [selectedFileNode, handleRefreshFileContent],
  );

  // 处理导出 PDF 操作
  const handleExportPdf = async (node: FileNode) => {
    setIsExportingPdf(true);
    try {
      const targetNode = await resolveNodeContentForPdfExport(node);
      await downloadFileByUrl?.(targetNode, true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * 构建文件预览的 URL 和 key，用于强制刷新
   * @param fileType - 文件类型标识（如 'html', 'office', 'json', 'video', 'audio'）
   * @param fileProxyUrl - 文件代理 URL
   * @param selectedFileId - 选中的文件 ID
   * @returns 包含 key 和 url 的对象
   */
  const buildFilePreviewProps = useCallback(
    (
      fileType: string,
      fileProxyUrl: string,
      selectedFileId: string,
    ): { key: string; url: string } => {
      // 构建 key：同时包含两个值，确保任何一个变化都能触发重新渲染
      const triggerPart =
        taskAgentSelectTrigger !== undefined
          ? `trigger-${taskAgentSelectTrigger}`
          : 'trigger-none';
      const timestampPart = `timestamp-${fileRefreshTimestamp}`;
      const fileKey = `${fileType}-${selectedFileId}-${triggerPart}-${timestampPart}`;

      // 构建 URL 参数：使用组合值，确保任何一个变化都会导致 URL 变化
      // 优先使用 taskAgentSelectTrigger，如果不存在则使用时间戳 ref
      const triggerValue =
        taskAgentSelectTrigger !== undefined
          ? taskAgentSelectTrigger
          : fileRefreshTimestamp;
      const separator = fileProxyUrl.includes('?') ? '&' : '?';
      const fileUrl = triggerValue
        ? `${fileProxyUrl}${separator}t=${triggerValue}`
        : fileProxyUrl;

      return { key: fileKey, url: fileUrl };
    },
    [taskAgentSelectTrigger, fileRefreshTimestamp],
  );

  /**
   * 渲染内容区域
   * 根据文件类型渲染不同的预览组件
   */
  const renderContent = () => {
    const isFileTreeLoading =
      Boolean(fileTreeDataLoading) || isRefreshingFileTree;

    // 左侧文件树未展示时，在预览区展示 loading；文件树已展开时由其自身 loading 负责
    if (!files?.length && isFileTreeLoading && !isFileTreeVisible) {
      return <Loading className="h-full" />;
    }

    // 如果文件列表为空，则显示空状态
    if (!files?.length) {
      return (
        <AppDevEmptyState
          showTitle={false}
          showIcon={false}
          showButtons={false}
          description={dict('PC.Components.FileTreeView.noFilesToPreview')}
        />
      );
    }

    // 如果 taskAgentSelectedFileId 存在，但没有选中文件，则不渲染内容
    if (taskAgentSelectedFileId && !selectedFileNode && !selectedFileId) {
      return (
        <AppDevEmptyState
          showTitle={false}
          showIcon={false}
          showButtons={false}
          description={dict('PC.Components.FileTreeView.noMatchingFile')}
        />
      );
    }

    // 未选择文件、选中文件夹或新建文件时
    if (
      !selectedFileNode ||
      selectedFileNode.type === 'folder' ||
      selectedFileNode?.id?.includes('__new__')
    ) {
      return (
        <AppDevEmptyState
          showTitle={false}
          showIcon={false}
          showButtons={false}
          description={dict('PC.Components.FileTreeView.selectFileToPreview')}
        />
      );
    }

    // 获取文件代理URL
    let fileProxyUrl = selectedFileNode?.fileProxyUrl || '';
    // 如果是相对路径（不以 http://, https:// 或 // 开头），则添加 BASE_URL 前缀
    if (fileProxyUrl && !/^(https?:)?\/\//i.test(fileProxyUrl)) {
      fileProxyUrl = `${process.env.BASE_URL || ''}${fileProxyUrl}`;
    }

    // 视频文件：使用FilePreview组件
    if (isVideo && fileProxyUrl) {
      const { key: videoKey, url: videoUrl } = buildFilePreviewProps(
        'video',
        fileProxyUrl,
        selectedFileId,
      );

      return <FilePreview key={videoKey} src={videoUrl} fileType="video" />;
    }

    // 音频文件：使用FilePreview组件
    if (isAudio && fileProxyUrl) {
      const { key: audioKey, url: audioUrl } = buildFilePreviewProps(
        'audio',
        fileProxyUrl,
        selectedFileId,
      );

      return <FilePreview key={audioKey} src={audioUrl} fileType="audio" />;
    }

    // office文档文件：使用FilePreview组件
    if (isOfficeDocument && fileProxyUrl) {
      const { key: officeKey, url: officeUrl } = buildFilePreviewProps(
        'office',
        fileProxyUrl,
        selectedFileId,
      );

      return (
        <FilePreview
          key={officeKey}
          src={officeUrl}
          fileType={documentFileType as FileType}
        />
      );
    }

    // 图片文件：使用图片查看器
    if (isImage) {
      // 如果文件代理URL存在，使用FilePreview组件
      if (fileProxyUrl) {
        const { key: imageKey, url: imageUrl } = buildFilePreviewProps(
          'image',
          fileProxyUrl,
          selectedFileId,
        );

        return <FilePreview key={imageKey} src={imageUrl} fileType="image" />;
      }

      return (
        <ImageViewer
          imageUrl={processImageContent(selectedFileNode?.content || '')}
          alt={selectedFileId}
        />
      );
    }

    // 软链接文件不支持编辑预览
    if (selectedFileNode?.isLink) {
      const fileExtension = selectedFileId?.split('.')?.pop() || selectedFileId;
      return (
        <AppDevEmptyState
          type="error"
          title={dict('PC.Components.FileTreeView.cannotPreviewType')}
          showButtons={false}
          description={dict(
            'PC.Components.FileTreeView.unsupportedFormat',
            fileExtension,
          )}
        />
      );
    }

    // 压缩包等不支持预览的文件（如 .zip、.skill、.rar、.7z 等）
    const selectedFileName =
      selectedFileNode?.name || selectedFileId?.split('/')?.pop() || '';
    if (!isPreviewableFile(selectedFileName, true)) {
      const fileExtension = selectedFileId?.split('.')?.pop() || selectedFileId;
      return (
        <AppDevEmptyState
          type="error"
          title={dict('PC.Components.FileTreeView.cannotPreviewType')}
          showButtons={false}
          description={dict(
            'PC.Components.FileTreeView.unsupportedFormat',
            fileExtension,
          )}
        />
      );
    }

    const fileName = selectedFileId?.split('/')?.pop() || '';
    const fileNameLower = fileName?.toLowerCase() || '';
    const isHtmlInCondition = /\.html?($|\?)/i.test(fileNameLower);

    if (
      (isHtmlInCondition || isMarkdownFile(fileNameLower)) &&
      viewFileType === 'preview' &&
      (fileProxyUrl || selectedFileNode?.content)
    ) {
      const fileTypeForPreview = isHtmlInCondition ? 'html' : 'markdown';
      const { key: filePreviewKey, url: filePreviewUrl } =
        buildFilePreviewProps(fileTypeForPreview, fileProxyUrl, selectedFileId);

      return (
        <FilePreview
          key={filePreviewKey}
          src={filePreviewUrl}
          content={selectedFileNode?.content}
          fileType={fileTypeForPreview}
          staticFileBasePath={staticFileBasePath}
        />
      );
    }

    const fileContent = String(selectedFileNode?.content ?? '');
    /**
     * 只读技能详情场景下，带上 fileRefreshTimestamp 强制重建 CodeViewer，
     * 兜底规避 Monaco 增量更新链路在慢请求场景下可能不刷新的问题。
     */
    const codeViewerKey =
      readOnly && isProjectSkill
        ? `code-viewer-${selectedFileId}-${fileRefreshTimestamp}`
        : `code-viewer-${selectedFileId}`;

    return (
      <CodeViewer
        key={codeViewerKey}
        isDynamicTheme={isDynamicTheme}
        fileId={selectedFileId}
        fileName={fileName}
        filePath={`app/${selectedFileId}`}
        content={fileContent}
        readOnly={readOnly}
        onContentChange={handleContentChange}
      />
    );
  };

  const filePathHeaderProps = useMemo(
    () => ({
      conversationId: targetId?.toString() || '',
      className: headerClassName,
      targetNode: selectedFileNode,
      onFullscreen: handleFullscreen,
      isFullscreen,
      showFullscreenIcon,
      showMoreActions,
      onDownloadFileByUrl: handleDownloadFileByUrl,
      isDownloadingFile:
        isDownloadingFile &&
        !!selectedFileId &&
        currentDownloadingFileId === selectedFileId,
      isShowShare,
      isShowDownloadButton,
      onShare,
      isShowExportPdfButton,
      onExportPdf: handleExportPdf,
      isExportingPdf,
      onClose,
      isFileTreeVisible,
      isFileTreePinned,
      onFileTreeToggle: handleFileTreeToggle,
      isCloudComputer,
      viewMode,
      viewFileType,
      onViewFileTypeChange: handleViewFileTypeChange,
    }),
    [
      targetId,
      headerClassName,
      selectedFileNode,
      handleFullscreen,
      isFullscreen,
      showFullscreenIcon,
      showMoreActions,
      handleDownloadFileByUrl,
      isDownloadingFile,
      selectedFileId,
      currentDownloadingFileId,
      isShowShare,
      isShowDownloadButton,
      onShare,
      isShowExportPdfButton,
      handleExportPdf,
      isExportingPdf,
      onClose,
      isFileTreeVisible,
      isFileTreePinned,
      handleFileTreeToggle,
      isCloudComputer,
      viewMode,
      viewFileType,
      handleViewFileTypeChange,
    ],
  );

  const renderPreviewContent = useCallback(
    () => renderContent(),
    [
      isFullscreen,
      targetId,
      readOnly,
      files,
      fileTreeDataLoading,
      isRefreshingFileTree,
      isFileTreeVisible,
      taskAgentSelectedFileId,
      selectedFileNode,
      selectedFileId,
      isVideo,
      isAudio,
      isOfficeDocument,
      documentFileType,
      isImage,
      buildFilePreviewProps,
      isDynamicTheme,
      onFullscreenPreview,
      handleContentChange,
      viewFileType,
      staticFileBasePath,
    ],
  );

  return {
    className,
    changeFiles,
    isRefreshingGitList,
    gitBranch,
    refreshGitList,
    tree: {
      readOnly,
      files,
      selectedFileId,
      selectedFolderId,
      renamingNode,
      contextMenuTarget,
      contextMenuPosition,
      contextMenuVisible,
      isFileTreeVisible,
      fileTreeContainerRef,
      fileTreeDataLoading,
      taskAgentSelectedFileId,
      isCanDeleteSkillFile,
      isRefreshingFileTree,
      isUploadingFiles,
      isDownloadingFile,
      hideFileTree,
      showRefreshButton,
      handleFileSelect,
      handleContextMenu,
      closeContextMenu,
      handleRenameFile,
      handleCancelRename,
      handleRefreshFileList,
      handleDelete,
      handleRenameFromMenu,
      handleUploadMultipleFiles,
      handleCreateFile,
      handleCreateFolder,
      handleDownloadFileByUrl,
      handleExportProject: onExportProject ? handleExportProject : undefined,
      handleImportProject: onImportProject
        ? () => void onImportProject()
        : undefined,
      isExportingProject,
      isImportingProject,
      toolbarDisabled: fileTreeDataLoading || isUploadingFiles,
    },
    preview: {
      selectedFileNode,
      selectedFileId,
      isFullscreen,
      hideDesktop,
      changeFiles,
      staticFileBasePath,
      targetId,
      readOnly,
      renderPreviewContent,
      filePathHeaderProps,
      handleFullscreen,
      handleFileTreeToggle,
      saveFiles,
      cancelSaveFiles,
      discardChangeFile,
      refreshSelectedFileContent,
      isSavingFiles,
    },
  };
}
