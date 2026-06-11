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
import { ChangeFileInfo } from '@/components/FileTreeView/type';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ImageViewer } from '@/pages/AppDev/components';
import { dict } from '@/services/i18nRuntime';
import { fetchContentFromUrl } from '@/services/skill';
import { HideDesktopEnum } from '@/types/enums/agent';
import { FileNode } from '@/types/interfaces/appDev';
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
  ConversationAgentFileViewProps,
  ConversationAgentFileViewValue,
} from './types';

/**
 * ConversationAgent 文件视图 Hook
 * 从 FileTreeView 提取的状态、副作用与处理器
 */
export function useConversationAgentFileView(
  props: ConversationAgentFileViewProps,
): ConversationAgentFileViewValue {
  const {
    className,
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    originalFiles,
    fileTreeDataLoading,
    readOnly = false,
    targetId,
    onUploadFiles,
    onExportProject,
    onRenameFile,
    // 创建文件回调
    onCreateFileNode,
    // 删除文件回调
    onDeleteFile,
    // 保存文件回调
    onSaveFiles,
    // 单个文件内容变更后实时保存
    onSaveFileContent,
    onClose,
    // 是否隐藏文件树（外部控制）
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
    hideDesktop = HideDesktopEnum.No,
    // 静态资源文件基础路径
    staticFileBasePath,
    /** 选中文件后打开右侧预览面板 */
    onFileSelectOpenPreview,
    /** 文件重命名成功后回调 */
    onFileRenamed,
    /** 文件/文件夹删除成功后回调 */
    onFileDeleted,
    agentSandboxId,
  } = props;
  const headerClassName = undefined;
  const isImportProjectTrigger = undefined;
  const showMoreActions = true;
  const isCloudComputer = agentSandboxId === '-1';
  const isFullscreenPreview = false;
  const onFullscreenPreview = undefined as
    | ((isFullscreen: boolean) => void)
    | undefined;
  const onShare = undefined;
  const isShowShare = true;
  const isShowExportPdfButton = true;
  const isShowDownloadButton = true;
  const showFullscreenIcon = true;
  const hideFileTree = false;
  const showRefreshButton = true;
  const isDynamicTheme = false;
  const isProjectSkill = false;
  // 文件树数据
  const [files, setFiles] = useState<FileNode[]>([]);
  // 当前选中的文件ID
  const [selectedFileId, setSelectedFileId] = useState<string>('');
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
  // 是否正在重命名文件
  const [isRenamingFile, setIsRenamingFile] = useState<boolean>(false);
  // 是否正在刷新文件树
  const [isRefreshingFileTree, setIsRefreshingFileTree] =
    useState<boolean>(false);
  const isRefreshingFileTreeRef = useRef<boolean>(false);

  // 是否正在上传文件
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);

  // 文件树是否可见（默认隐藏，但如果已固定则显示）
  const [internalFileTreeVisible, setInternalFileTreeVisible] =
    useState<boolean>(isFileTreePinned || false);
  const isControlledFileTreeSidebar = isFileTreeSidebarVisible !== undefined;
  const isFileTreeVisible = isControlledFileTreeSidebar
    ? isFileTreeSidebarVisible
    : internalFileTreeVisible;

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

  // 备份文件列表，用于判断文件列表是否发生变化
  const filesRef = useRef<FileNode[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // 用于存储文件的刷新时间戳，确保每次点击时都能刷新
  // 统一使用一个时间戳，适用于 html、office、json、视频、音频、图片等需要刷新的文件类型
  const [fileRefreshTimestamp, setFileRefreshTimestamp] = useState<number>(
    Date.now(),
  );
  /** html / md：预览或代码视图 */
  const [viewFileType, setViewFileType] = useState<'preview' | 'code'>(
    'preview',
  );

  useEffect(() => {
    setViewFileType('preview');
  }, [selectedFileId]);

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

        return fileContent;
      } catch (error) {
        console.error('Failed to fetch file content:', error);
        return '';
      }
    },
    [],
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

  // 刷新文件树和文件内容
  const handleRefreshFileList = useCallback(async () => {
    // 使用 ref 防重复点击，避免闭包中 isRefreshingFileTree 过期
    if (isRefreshingFileTreeRef.current) {
      return;
    }

    isRefreshingFileTreeRef.current = true;
    setIsRefreshingFileTree(true);

    try {
      // 刷新文件树
      await onRefreshFileTree?.();

      // 如果存在当前选中文件，则重新通过 fileProxyUrl 更新文件内容
      if (selectedFileId && selectedFileNode) {
        const fileProxyUrl = selectedFileNode?.fileProxyUrl || '';

        // 如果有 fileProxyUrl，重新获取文件内容
        if (fileProxyUrl) {
          try {
            const fileName = selectedFileNode?.name || '';

            // 判断文件是否支持预览（白名单方案）
            const isPreviewable = isPreviewableFile(fileName, true);
            // 如果文件不支持预览或文件是链接文件，则直接设置选中文件节点（如.zip、.rar、.7z 等压缩文件，不支持预览，也不需要获取压缩文件内容）
            if (!isPreviewable || selectedFileNode?.isLink) {
              return;
            }

            // 更新刷新时间戳，触发预览区重渲染
            setFileRefreshTimestamp(Date.now());

            // 视频、音频、office、图片等通过 FilePreview 渲染，浅拷贝节点触发更新
            if (isVideo || isAudio || isOfficeDocument || isImage) {
              setSelectedFileNode((prevNode) =>
                prevNode ? { ...prevNode } : prevNode,
              );
              return;
            }

            // 获取文件内容并更新文件树
            const newFileContent = await fetchFileContentUpdateFiles(
              fileProxyUrl,
              selectedFileId,
            );

            // 更新选中文件节点的内容
            setSelectedFileNode((prevNode) =>
              prevNode
                ? {
                    ...prevNode,
                    content: newFileContent || '',
                  }
                : prevNode,
            );
          } catch (error) {
            console.error('Failed to refresh file content: ', error);
            setIsRefreshingFileTree(false);
            isRefreshingFileTreeRef.current = false;
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh file tree: ', error);
    } finally {
      isRefreshingFileTreeRef.current = false;
      setIsRefreshingFileTree(false);
    }
  }, [
    onRefreshFileTree,
    isPreviewableFile,
    selectedFileId,
    selectedFileNode,
    fetchFileContentUpdateFiles,
    isVideo,
    isAudio,
    isOfficeDocument,
    isImage,
  ]);

  /**
   * 刷新 Git 变更列表（git status）
   * 进入页面或暂存/取消暂存后调用，与 AppDev 源代码管理保持一致
   */
  const refreshGitList = useCallback(async () => {
    const cid = Number(targetId);
    if (!cid || isRefreshingGitListRef.current) {
      return;
    }

    isRefreshingGitListRef.current = true;
    setIsRefreshingGitList(true);

    try {
      await onRefreshFileTree?.();

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
    } catch (error) {
      console.error('Refresh git list failed:', error);
    } finally {
      isRefreshingGitListRef.current = false;
      setIsRefreshingGitList(false);
    }
  }, [targetId, onRefreshFileTree]);

  /** 进入页面或切换会话时拉取 Git status */
  useEffect(() => {
    if (!targetId) {
      return;
    }
    void refreshGitList();
  }, [targetId]);

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
        // 文件树中点击文件夹：直接选中文件夹并高亮
        if (fileNode.type === 'folder' && options?.selectFolder) {
          setSelectedFileId(fileNode.id);
          setSelectedFileNode(fileNode);
          return;
        }

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
          setSelectedFileId(fileNode?.id || fileId);
          setSelectedFileNode(fileNode);
          return;
        }

        // 文件没有内容或需要重新加载
        if (isRenamingFile) {
          message.warning(dict('PC.Components.FileTreeView.fileRenaming'));
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

        setSelectedFileId(fileNode?.id || fileId);

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

          // 先切到当前文件并清空内容，避免异步返回前继续显示上一个文件内容
          setSelectedFileNode({
            ...fileNode,
            content: '',
          });

          // 获取文件内容并更新文件树
          const newFileContent = await fetchFileContentUpdateFiles(
            fileProxyUrl,
            fileNode?.id || fileId,
          );
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
    [files, isRenamingFile, onFileSelectOpenPreview],
  );

  // 文件选择（对外接口，用于用户主动选择）
  const handleFileSelect = useCallback(
    async (fileId: string, options?: { selectFolder?: boolean }) => {
      // 记录用户主动选择的文件ID
      userSelectedFileRef.current = fileId;
      // 调用内部选择函数
      await handleFileSelectInternal(fileId, options);
    },
    [handleFileSelectInternal],
  );

  // 监听 taskAgentSelectedFileId 和 taskAgentSelectTrigger 的变化，执行自动选择
  // 注意：不依赖 files，避免 files 更新时覆盖用户选择
  useEffect(() => {
    // 如果 taskAgentSelectedFileId 被清空，重置记录的值
    if (!taskAgentSelectedFileId) {
      prevTaskAgentSelectedFileIdRef.current = '';
      prevTaskAgentSelectTriggerRef.current = undefined;
      userSelectedFileRef.current = null;
      return;
    }

    // 检查 files 是否已准备好
    if (!files || files.length === 0) {
      // files 还未准备好，等待下次更新
      return;
    }

    // 检查是否需要执行选择（避免重复选择）
    const hasTriggerChanged =
      taskAgentSelectTrigger !== undefined
        ? taskAgentSelectTrigger !== prevTaskAgentSelectTriggerRef.current
        : taskAgentSelectedFileId !== prevTaskAgentSelectedFileIdRef.current;

    // 如果触发标志或文件ID没有变化，不执行选择
    if (!hasTriggerChanged) {
      /**
       * 如果 taskAgentSelectedFileId 存在，且 prevTaskAgentSelectedFileIdRef.current 为空，则表示首次进入技能页面，默认选择该文件
       *
       * 注意：必须同时检查 !prevTaskAgentSelectedFileIdRef.current，避免在文件ID没有变化时重复执行
       * 如果注释掉这个条件，会导致：
       * 1. handleFileSelectInternal 可能触发 handleRefreshFileList()，更新 files， 此逻辑已删除
       * 2. files 更新导致 useEffect 重新执行
       * 3. 由于 hasTriggerChanged 仍为 false，又会进入这个分支
       * 4. 形成无限循环
       * 5、（很重要）存在这样一种情况，先更新了taskAgentSelectTrigger，但是此时文件树数据还未更新，导致此处直接return，导致文件树数据更新后，无法自动选择文件
       * 而且只能通过判断长度来判断文件列表是否发生变化，因为文件列表中的文件节点可能发生变化，但是文件列表的长度不会发生变化
       */
      if (
        (taskAgentSelectedFileId && !prevTaskAgentSelectedFileIdRef.current) ||
        filesRef.current?.length !== files?.length
      ) {
        prevTaskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
        filesRef.current = files;
        handleFileSelectInternal(taskAgentSelectedFileId);
      }
      return;
    }

    // 如果提供了 taskAgentSelectTrigger 且它变化了，总是执行（允许重复点击同一文件刷新）
    // 如果没有提供 taskAgentSelectTrigger，则检查用户是否选择了其他文件
    const isTriggerUpdate =
      taskAgentSelectTrigger !== undefined &&
      taskAgentSelectTrigger !== prevTaskAgentSelectTriggerRef.current;

    // 如果不是触发标志更新，且用户主动选择了其他文件，则不执行自动选择
    // 这样可以避免用户点击文件树后，因为 files 更新而重新触发 taskAgentSelectedFileId 的选择
    if (
      !isTriggerUpdate &&
      userSelectedFileRef.current &&
      userSelectedFileRef.current !== taskAgentSelectedFileId
    ) {
      // 用户主动选择了其他文件，且不是触发标志更新，不清除 userSelectedFileRef，保持用户的选择
      return;
    }

    // 清除用户选择标记，因为这是通过 taskAgentSelectedFileId 触发的
    userSelectedFileRef.current = null;
    prevTaskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
    if (taskAgentSelectTrigger !== undefined) {
      prevTaskAgentSelectTriggerRef.current = taskAgentSelectTrigger;
    }

    // 备份文件列表，用于判断文件列表是否发生变化
    filesRef.current = files;

    // 使用内部函数，不设置用户选择标记
    handleFileSelectInternal(taskAgentSelectedFileId);
  }, [
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    handleFileSelectInternal,
    files,
  ]);

  useEffect(() => {
    if (!originalFiles || originalFiles.length === 0) {
      setFiles([]);
      return;
    }
    // 如果文件列表不为空，则转换为树形结构
    if (Array.isArray(originalFiles) && originalFiles.length > 0) {
      const treeData: FileNode[] = transformFlatListToTree(
        originalFiles,
        false,
      );
      setFiles(treeData);
    }

    return () => {
      setFiles([]);
    };
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
  }, [files, isProjectSkill, selectedFileId, taskAgentSelectedFileId]);

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

      const removeNodeById = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.id !== targetId)
          .map((node) => {
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: removeNodeById(node.children),
              };
            }
            return node;
          });
      };

      setFiles((prevFiles) => removeNodeById(prevFiles));

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
   * 处理重命名操作
   */
  const handleRenameFile = async (fileNode: FileNode, newName: string) => {
    if (!newName || !newName?.trim()) {
      // 重命名文件失败：新文件名为空
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
          setFiles(filesBackup);
        }
      } else {
        setIsRenamingFile(true);
        // 直接调用现有的重命名文件功能(异步更新文件树)
        const isChangeSuccess = await onRenameFile?.(fileNode, newName);
        setIsRenamingFile(false);
        if (isChangeSuccess) {
          const trimmedName = newName.trim();
          const newNodeId = fileNode.parentPath
            ? `${fileNode.parentPath}/${trimmedName}`
            : trimmedName;

          onFileRenamed?.(fileNode.id, newNodeId);

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
      // 重命名文件失败，重新加载文件树以恢复原状态
      setFiles(filesBackup);
    }
  };

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadFromMenu = async (node: FileNode | null) => {
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

      setIsUploadingFiles(true);

      try {
        // 获取上传的文件列表
        const files = Array.from((e.target as HTMLInputElement).files || []);
        // 获取上传的文件路径列表
        const filePaths = files.map((file) => relativePath + file.name);

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
      const prevTempId = renamingNode.id;
      const removeNodeById = (nodes: FileNode[]): FileNode[] =>
        nodes
          .filter((node) => node.id !== prevTempId)
          .map((node) =>
            node.children && node.children.length > 0
              ? { ...node, children: removeNodeById(node.children) }
              : node,
          );
      setFiles((prevFiles) => removeNodeById(prevFiles));
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
    if (onExportProject) {
      await onExportProject();
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
    if (isControlledFileTreeSidebar) {
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
      // 下载文件
      await downloadFileByUrl?.(node, exportAsPdf);
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
        selectedFileId,
      );
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
    await downloadFileByUrl?.(node, true);
    setIsExportingPdf(false);
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

    // 预览模式：根据文件状态和类型渲染不同内容
    // 未选择文件或新建文件时
    if (!selectedFileNode || selectedFileNode?.id?.includes('__new__')) {
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

    return (
      <CodeViewer
        key={`code-viewer-${selectedFileId}`}
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
      viewMode: 'preview' as const,
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
      isShowExportPdfButton,
      handleExportPdf,
      isExportingPdf,
      onClose,
      isFileTreeVisible,
      isFileTreePinned,
      handleFileTreeToggle,
      isCloudComputer,
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
      files,
      selectedFileId,
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
      handleUploadFromMenu,
      handleCreateFile,
      handleCreateFolder,
      handleDownloadFileByUrl,
      handleExportProject: onExportProject ? handleExportProject : undefined,
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
      isSavingFiles,
    },
  };
}
