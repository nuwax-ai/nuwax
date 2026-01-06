import { ImageViewer } from '@/pages/AppDev/components';
import { fetchContentFromUrl } from '@/services/skill';
import { FileNode } from '@/types/interfaces/appDev';
import {
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
  updateFileTreeContent,
  updateFileTreeName,
} from '@/utils/fileTree';
import { message, Modal, Spin } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import AppDevEmptyState from '../business-component/AppDevEmptyState';
import FilePreview, { FileType } from '../business-component/FilePreview';
import VncPreview from '../business-component/VncPreview';
import type { VncPreviewRef } from '../business-component/VncPreview/type';
import CodeViewer from '../CodeViewer';
import FileContextMenu from './FileContextMenu';
import FilePathHeader from './FilePathHeader';
import FileTree from './FileTree';
import styles from './index.less';
import SearchView from './SearchView';
import { ChangeFileInfo, FileTreeViewProps, FileTreeViewRef } from './type';
// import { apiAgentConversationShare } from '@/services/vncDesktop';

const cx = classNames.bind(styles);

/**
 * 文件树视图组件
 */
const FileTreeView = forwardRef<FileTreeViewRef, FileTreeViewProps>(
  (
    {
      headerClassName,
      taskAgentSelectedFileId,
      taskAgentSelectTrigger,
      originalFiles,
      fileTreeDataLoading,
      readOnly = false,
      targetId,
      viewMode,
      showViewModeButtons = true,
      showFileTreeToggleButton = true,
      onUploadFiles,
      onExportProject,
      onRenameFile,
      onCreateFileNode,
      onDeleteFile,
      onViewModeChange,
      onSaveFiles,
      onImportProject,
      onRestartServer,
      onRestartAgent,
      // 是否显示更多操作菜单
      showMoreActions = true,
      // 是否显示全屏预览，由父组件控制
      isFullscreenPreview = false,
      onFullscreenPreview,
      onShare,
      isShowShare = true,
      onClose,
      showFullscreenIcon = true,
      // 是否隐藏文件树（外部控制）
      hideFileTree = false,
      // 文件树是否固定（用户点击后固定）
      isFileTreePinned = false,
      // 文件树固定状态变化回调
      onFileTreePinnedChange,
      // 是否可以删除技能文件(SKILL.md文件), 默认不可以删除(为false时，则隐藏删除菜单项，为true时，则显示删除菜单项)
      isCanDeleteSkillFile = false,
      // 刷新文件树回调
      onRefreshFileTree,
      // 是否显示刷新按钮
      showRefreshButton = true,
      // 是否仅显示智能体电脑，默认显示所有（文件预览、智能体电脑）
      isOnlyShowDesktop = false,
    },
    ref,
  ) => {
    // 文件树数据
    const [files, setFiles] = useState<FileNode[]>([]);
    // 重启状态
    const [isRestarting, setIsRestarting] = useState(false);
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
    const [contextMenuVisible, setContextMenuVisible] =
      useState<boolean>(false);
    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    // 修改的文件列表
    const [changeFiles, setChangeFiles] = useState<ChangeFileInfo[]>([]);

    // 是否正在保存文件
    const [isSavingFiles, setIsSavingFiles] = useState<boolean>(false);
    // 是否正在下载项目文件压缩包
    const [isExportingProjecting, setIsExportingProjecting] =
      useState<boolean>(false);
    // 是否正在下载文件
    const [isDownloadingFile, setIsDownloadingFile] = useState<boolean>(false);
    // 是否正在导出 PDF
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
    // 是否正在重命名文件
    const [isRenamingFile, setIsRenamingFile] = useState<boolean>(false);
    // 是否正在刷新文件树
    const [isRefreshingFileTree, setIsRefreshingFileTree] =
      useState<boolean>(false);

    /** 当前文件查看类型：预览、代码 */
    const [viewFileType, setViewFileType] = useState<'preview' | 'code'>(
      'preview',
    );

    // 文件树是否可见（默认隐藏，但如果已固定则显示）
    const [isFileTreeVisible, setIsFileTreeVisible] = useState<boolean>(
      isFileTreePinned || false,
    );

    // VNC 预览组件 ref
    const vncPreviewRef = useRef<VncPreviewRef>(null);
    // 文件树容器 ref
    const fileTreeContainerRef = useRef<HTMLDivElement>(null);

    // 用于跟踪用户是否主动选择了文件（通过点击文件树）
    const userSelectedFileRef = useRef<string | null>(null);
    // 用于记录上次的 taskAgentSelectedFileId 和 taskAgentSelectTrigger，避免重复选择
    const prevTaskAgentSelectedFileIdRef = useRef<string>('');
    const prevTaskAgentSelectTriggerRef = useRef<number | string | undefined>(
      undefined,
    );
    // 用于记录创建成功后需要选择的文件路径
    const pendingSelectFileRef = useRef<string | null>(null);

    // 用于存储文件的刷新时间戳，确保每次点击时都能刷新
    // 统一使用一个时间戳，适用于 html、office、json 等需要刷新的文件类型
    const fileRefreshTimestampRef = useRef<number>(Date.now());
    // 用于存储视频文件的刷新时间戳，确保每次点击时都能刷新
    const videoRefreshTimestampRef = useRef<number>(Date.now());
    // 用于存储音频文件的刷新时间戳，确保每次点击时都能刷新
    const audioRefreshTimestampRef = useRef<number>(Date.now());

    useEffect(() => {
      // 如果通过父组件全屏预览模式打开，则设置全屏状态
      if (isFullscreenPreview) {
        setIsFullscreen(true);
      }
    }, [isFullscreenPreview]);

    // 获取文件内容并更新文件树
    const fetchFileContentUpdateFiles = useCallback(
      async (fileProxyUrl: string, fileId: string) => {
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
      },
      [],
    );

    // 刷新文件树和文件内容
    const handleRefreshFileList = useCallback(async () => {
      // 如果正在刷新，直接返回，防止重复点击
      if (isRefreshingFileTree) {
        return;
      }

      try {
        setIsRefreshingFileTree(true);

        // 刷新文件树
        await onRefreshFileTree?.();

        // 如果存在当前选中文件，则重新通过 fileProxyUrl 更新文件内容
        if (selectedFileId && selectedFileNode) {
          const fileProxyUrl = selectedFileNode?.fileProxyUrl || '';

          // 如果有 fileProxyUrl，重新获取文件内容
          if (fileProxyUrl) {
            try {
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
              // message.error('刷新文件内容失败');
              return;
            }
          }
        }

        // 刷新成功提示
        // message.success('刷新成功');
      } catch (error) {
        // message.error('刷新文件树失败');
      } finally {
        setIsRefreshingFileTree(false);
      }
    }, [
      isRefreshingFileTree,
      onRefreshFileTree,
      selectedFileId,
      selectedFileNode,
      fetchFileContentUpdateFiles,
    ]);

    // 文件选择（内部函数，执行实际的选择逻辑）
    const handleFileSelectInternal = useCallback(
      async (fileId: string) => {
        // 根据文件ID查找文件节点
        const fileNode = findFileNode(fileId, files);

        if (fileNode) {
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

          // 如果文件节点是链接文件，则不支持预览
          if (fileNode?.isLink) {
            setSelectedFileId(fileId);
            setViewFileType('preview');
            setSelectedFileNode(fileNode);
            return;
          }

          // 检查是否是重复点击同一个文件
          const isSameFile = selectedFileId === fileId;
          // 检查是否是 html 文件
          const isHtmlFile = fileNode?.name?.includes('.htm') || false;
          // 判断文件是否为文档类型
          const result = isDocumentFile(fileNode?.name || '');
          // 判断文件是否为office文档类型
          const isOfficeFile = result?.isDoc || false;
          // 检查是否是 json 文件
          const isJsonFile = fileNode?.name?.includes('.json') || false;
          // 判断文件是否为视频类型
          const isVideoFileType = isVideoFile(fileNode?.name || '');
          // 判断文件是否为音频类型
          const isAudioFileType = isAudioFile(fileNode?.name || '');

          // 如果是重复点击需要刷新的文件（html、office、json），更新刷新时间戳以强制刷新
          if (isSameFile && (isHtmlFile || isOfficeFile || isJsonFile)) {
            fileRefreshTimestampRef.current = Date.now();
            // 仍然调用刷新逻辑以更新文件内容
            await handleRefreshFileList();
            return;
          }

          // 如果是重复点击视频文件，更新刷新时间戳以强制刷新
          if (isSameFile && isVideoFileType) {
            videoRefreshTimestampRef.current = Date.now();
            // 仍然调用刷新逻辑以更新文件内容
            // await handleRefreshFileList();
            return;
          }

          // 如果是重复点击音频文件，更新刷新时间戳以强制刷新
          if (isSameFile && isAudioFileType) {
            audioRefreshTimestampRef.current = Date.now();
            // 仍然调用刷新逻辑以更新文件内容
            // await handleRefreshFileList();
            return;
          }

          // 如果是新选中的需要刷新的文件（html、office、json），更新刷新时间戳
          if (isHtmlFile || isOfficeFile || isJsonFile) {
            fileRefreshTimestampRef.current = Date.now();
          }

          // 如果是新选中的视频文件，更新刷新时间戳
          if (isVideoFileType) {
            videoRefreshTimestampRef.current = Date.now();
          }

          // 如果是新选中的音频文件，更新刷新时间戳
          if (isAudioFileType) {
            audioRefreshTimestampRef.current = Date.now();
          }

          // 获取文件内容
          const fileContent = fileNode?.content || '';
          // 获取文件代理URL
          const fileProxyUrl = fileNode?.fileProxyUrl || '';

          // 如果文件有内容，直接使用缓存
          if (fileContent && !fileProxyUrl) {
            setSelectedFileId(fileId);
            setViewFileType('preview');
            setSelectedFileNode(fileNode);
            return;
          }

          // 文件没有内容或需要重新加载
          if (isRenamingFile) {
            message.warning('文件正在重命名中，请稍后再试');
            return;
          }

          setSelectedFileId(fileId);
          setViewFileType('preview');
          // 判断文件是否为图片类型
          const isImage = isImageFile(fileNode?.name || '');
          // 判断文件是否为视频类型
          const isVideo = isVideoFile(fileNode?.name || '');
          // 判断文件是否为音频类型
          const isAudio = isAudioFile(fileNode?.name || '');
          // 判断文件是否为文档类型（复用之前声明的 result 变量）
          // 判断文件是否为office文档类型
          const isOfficeDocument = isOfficeFile;

          // 如果文件为图片、视频、音频、文档类型，或则没有文件代理URL，则直接设置为选中文件节点
          if (
            isImage ||
            isVideo ||
            isAudio ||
            isOfficeDocument ||
            !fileProxyUrl
          ) {
            setSelectedFileNode(fileNode);
          }
          // 其他类型文件：使用文件代理URL获取文件内容
          // "fileProxyUrl": "/api/computer/static/1464425/国际财经分析报告_20241222.md"
          else if (fileProxyUrl) {
            // 获取文件内容并更新文件树
            const newFileContent = await fetchFileContentUpdateFiles(
              fileProxyUrl,
              fileId,
            );
            // 设置选中文件节点
            setSelectedFileNode({
              ...fileNode,
              content: newFileContent || '',
            });
          }
        } else {
          setSelectedFileNode(null);
        }
      },
      [files, isRenamingFile, selectedFileId, handleRefreshFileList],
    );

    // 文件选择（对外接口，用于用户主动选择）
    const handleFileSelect = useCallback(
      async (fileId: string) => {
        // 记录用户主动选择的文件ID
        userSelectedFileRef.current = fileId;
        // 调用内部选择函数
        await handleFileSelectInternal(fileId);
      },
      [handleFileSelectInternal],
    );

    // 通过 ref 暴露 changeFiles 给父组件
    useImperativeHandle(
      ref,
      () => ({
        changeFiles,
      }),
      [changeFiles],
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

      // 检查是否需要执行选择（避免重复选择）
      const hasTriggerChanged =
        taskAgentSelectTrigger !== undefined
          ? taskAgentSelectTrigger !== prevTaskAgentSelectTriggerRef.current
          : taskAgentSelectedFileId !== prevTaskAgentSelectedFileIdRef.current;

      // 如果触发标志或文件ID没有变化，不执行选择
      if (!hasTriggerChanged) {
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

      // 检查 files 是否已准备好
      if (!files || files.length === 0) {
        // files 还未准备好，等待下次更新
        return;
      }

      // 清除用户选择标记，因为这是通过 taskAgentSelectedFileId 触发的
      userSelectedFileRef.current = null;
      prevTaskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
      if (taskAgentSelectTrigger !== undefined) {
        prevTaskAgentSelectTriggerRef.current = taskAgentSelectTrigger;
      }

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
        const treeData: FileNode[] = transformFlatListToTree(originalFiles);
        setFiles(treeData);
      }

      return () => {
        setFiles([]);
        setChangeFiles([]);
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

    // 当 isFileTreePinned 变化时，同步更新 isFileTreeVisible
    // 确保组件重新挂载或 isFileTreePinned 从外部变化时，文件树能正确显示
    useEffect(() => {
      if (isFileTreePinned) {
        setIsFileTreeVisible(true);
      }
    }, [isFileTreePinned]);

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
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
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

      setRenamingNode(null);
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
              return false;
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
            // 如果当前选中的文件节点是被重命名的节点，则同步更新名称
            if (
              selectedFileNode &&
              (selectedFileNode.id === fileNode.id ||
                selectedFileNode.name === fileNode.name)
            ) {
              setSelectedFileNode((prevNode) =>
                prevNode ? { ...prevNode, name: newName } : prevNode,
              );
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
    const handleUploadFromMenu = (node: FileNode | null) => {
      // 直接调用现有的上传多个文件功能
      onUploadFiles?.(node);
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
     * 处理新建文件操作
     */
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
     * 处理内容变化
     */
    const handleContentChange = (fileId: string, content: string) => {
      // 保存原始内容的引用（用于首次修改时记录）
      let originalContent = '';

      // 更新文件树中的文件内容
      setFiles((prevFiles) => {
        // 从最新的 files 中获取原始内容
        const currentFile = findFileNode(fileId, prevFiles);
        // 获取原始内容
        originalContent = currentFile?.content || '';

        const updatedFiles: FileNode[] = updateFileTreeContent(
          fileId,
          content,
          prevFiles,
        );
        return updatedFiles;
      });

      // 更新当前选中的文件内容
      setSelectedFileNode((prevNode: any) => ({
        ...prevNode,
        content,
      }));

      // 使用函数式更新获取最新的 changeFiles 状态
      setChangeFiles((prevChangeFiles) => {
        const existingIndex = prevChangeFiles.findIndex(
          (item) => item.fileId === fileId,
        );

        if (existingIndex !== -1) {
          // 如果已存在，更新该项的 fileContent，保留原始的 originalFileContent
          const updatedChangeFiles = [...prevChangeFiles];
          updatedChangeFiles[existingIndex] = {
            ...updatedChangeFiles[existingIndex],
            fileContent: content,
          };
          return updatedChangeFiles;
        } else if (content !== originalContent) {
          // 如果不存在，追加新项，使用从最新 files 中获取的原始内容
          return [
            ...prevChangeFiles,
            {
              fileId,
              fileContent: content,
              originalFileContent: originalContent,
            },
          ];
        } else {
          return prevChangeFiles;
        }
      });
    };

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
    // 判断文件是否支持预览（白名单方案）
    const isPreviewable = isPreviewableFile(selectedFileNode?.name || '');

    /**
     * 处理全屏切换
     */
    const handleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
      onFullscreenPreview?.(!isFullscreen);
    };

    /**
     * 关闭全屏
     */
    const handleCloseFullscreen = () => {
      setIsFullscreen(false);
      onFullscreenPreview?.(false);
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

    // 渲染 VNC 预览状态标签
    const renderVncPreviewStatusTag = () => {
      if (vncPreviewRef.current) {
        return vncPreviewRef.current.renderStatusTag();
      }
      return null;
    };

    // 处理视图模式切换
    const handleChangeViewMode = (mode: 'preview' | 'desktop') => {
      // 用户点击打开智能体电脑时，自动连接打开（不管之前是否打开过）
      if (mode === 'desktop') {
        // 连接 VNC 预览
        vncPreviewRef.current?.connect();
      }
      onViewModeChange?.(mode);
    };

    /**
     * 处理文件树展开/折叠（点击图标）
     * 隐藏状态时点击展开文件树，展开时点击收起文件树
     */
    const handleFileTreeToggle = () => {
      const newVisibleState = !isFileTreeVisible;
      setIsFileTreeVisible(newVisibleState);
      // 如果展开文件树，同时固定它；如果隐藏文件树，取消固定
      if (newVisibleState) {
        onFileTreePinnedChange?.(true);
      } else {
        onFileTreePinnedChange?.(false);
      }
    };

    // 处理下载项目操作
    const handleDownloadProject = async () => {
      setIsExportingProjecting(true);
      await onExportProject?.();
      setIsExportingProjecting(false);
    };

    // 处理下载文件操作
    const handleDownloadFileByUrl = async (
      node: FileNode,
      exportAsPdf?: boolean,
    ) => {
      setIsDownloadingFile(true);
      await downloadFileByUrl?.(node, exportAsPdf);
      setIsDownloadingFile(false);
    };

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
     * @param customTimestampRef - 可选的自定义时间戳 ref，如果不提供则使用默认的 fileRefreshTimestampRef
     * @returns 包含 key 和 url 的对象
     */
    const buildFilePreviewProps = useCallback(
      (
        fileType: string,
        fileProxyUrl: string,
        selectedFileId: string,
        customTimestampRef?: React.MutableRefObject<number>,
      ): { key: string; url: string } => {
        // 使用自定义时间戳 ref 或默认的 fileRefreshTimestampRef
        const timestampRef = customTimestampRef || fileRefreshTimestampRef;

        // 构建 key：同时包含两个值，确保任何一个变化都能触发重新渲染
        const triggerPart =
          taskAgentSelectTrigger !== undefined
            ? `trigger-${taskAgentSelectTrigger}`
            : 'trigger-none';
        const timestampPart = `timestamp-${timestampRef.current}`;
        const fileKey = `${fileType}-${selectedFileId}-${triggerPart}-${timestampPart}`;

        // 构建 URL 参数：使用组合值，确保任何一个变化都会导致 URL 变化
        // 优先使用 taskAgentSelectTrigger，如果不存在则使用时间戳 ref
        const triggerValue =
          taskAgentSelectTrigger !== undefined
            ? taskAgentSelectTrigger
            : timestampRef.current;
        const fileUrl = triggerValue
          ? `${fileProxyUrl}?t=${triggerValue}`
          : fileProxyUrl;

        return { key: fileKey, url: fileUrl };
      },
      [taskAgentSelectTrigger],
    );

    /**
     * 渲染内容区域
     * 根据视图模式和文件类型渲染不同的预览组件
     */
    const renderContent = () => {
      // 桌面模式：显示 VNC 预览
      if (viewMode === 'desktop') {
        return (
          <VncPreview
            ref={vncPreviewRef}
            serviceUrl={process.env.BASE_URL || ''}
            cId={targetId?.toString() || ''}
            readOnly={readOnly}
            autoConnect={true}
            className={cx(styles['vnc-preview'])}
          />
        );
      }

      // 如果 taskAgentSelectedFileId 存在，但没有选中文件，则不渲染内容
      if (taskAgentSelectedFileId && !selectedFileNode) {
        return null;
      }

      // 预览模式：根据文件状态和类型渲染不同内容
      // 未选择文件或新建文件时
      if (!selectedFileNode || selectedFileNode?.id?.includes('__new__')) {
        return (
          <AppDevEmptyState
            type="empty"
            title="请从左侧文件树选择一个文件进行预览"
            description="当前没有可预览的文件，请从左侧文件树选择一个文件进行预览"
          />
        );
      }

      // 获取文件代理URL
      const fileProxyUrl = selectedFileNode?.fileProxyUrl
        ? `${process.env.BASE_URL}${selectedFileNode?.fileProxyUrl}`
        : '';

      // 视频文件：使用FilePreview组件
      if (isVideo && fileProxyUrl) {
        const { key: videoKey, url: videoUrl } = buildFilePreviewProps(
          'video',
          fileProxyUrl,
          selectedFileId,
          videoRefreshTimestampRef,
        );

        return <FilePreview key={videoKey} src={videoUrl} fileType="video" />;
      }

      // 音频文件：使用FilePreview组件
      if (isAudio && fileProxyUrl) {
        const { key: audioKey, url: audioUrl } = buildFilePreviewProps(
          'audio',
          fileProxyUrl,
          selectedFileId,
          audioRefreshTimestampRef,
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

      // 文档文件：使用FilePreview组件
      if (selectedFileNode?.name?.includes('.json') && fileProxyUrl) {
        const { key: jsonKey, url: jsonUrl } = buildFilePreviewProps(
          'json',
          fileProxyUrl,
          selectedFileId,
        );

        return <FilePreview key={jsonKey} src={jsonUrl} fileType="text" />;
      }

      // 图片文件：使用图片查看器
      if (isImage) {
        // 如果文件代理URL存在，使用FilePreview组件
        if (fileProxyUrl) {
          return <FilePreview src={fileProxyUrl} fileType="image" />;
        }

        return (
          <ImageViewer
            imageUrl={processImageContent(selectedFileNode?.content || '')}
            alt={selectedFileId}
            onRefresh={() => {
              // 刷新图片预览
              // if (previewRef.current) {
              //   previewRef.current.refresh();
              // }
            }}
          />
        );
      }

      // 文件类型不支持预览
      if (!isPreviewable || selectedFileNode?.isLink) {
        const fileExtension =
          selectedFileId?.split('.')?.pop() || selectedFileId;
        return (
          <AppDevEmptyState
            type="error"
            title="无法预览此文件类型"
            description={`当前不支持预览【${fileExtension}】格式的文件。`}
          />
        );
      }

      // 获取文件内容
      const fileContent = selectedFileNode?.content || '';
      // 获取文件名
      const fileName = selectedFileId?.split('/')?.pop() || '';

      // 如果是html、md文件，并且处于预览模式
      if (
        (fileName?.includes('.htm') || isMarkdownFile(fileName)) &&
        viewFileType === 'preview' &&
        fileProxyUrl
      ) {
        // html 文件或无 content 的 markdown：使用 fileProxyUrl
        // 对于 html 文件，添加时间戳参数以确保每次点击时都能刷新 iframe
        const isHtml = fileName?.includes('.htm');

        const { key: htmlKey, url: htmlUrl } = buildFilePreviewProps(
          'html',
          fileProxyUrl,
          selectedFileId,
        );

        return (
          <FilePreview
            key={htmlKey}
            src={htmlUrl}
            fileType={isHtml ? 'html' : 'markdown'}
          />
        );
      }

      // 代码文件：使用代码查看器
      return (
        <CodeViewer
          fileId={selectedFileId}
          fileName={fileName}
          filePath={`app/${selectedFileId}`}
          content={fileContent}
          readOnly={readOnly}
          onContentChange={handleContentChange}
        />
      );
    };

    // 处理重启服务器并刷新 VNC
    const handleRestartServer = async () => {
      if (onRestartServer) {
        setIsRestarting(true);
        try {
          // 1. 调用父组件的重启逻辑
          await onRestartServer();

          // 2. 刷新 VNC (如果是桌面模式)
          if (viewMode === 'desktop' && vncPreviewRef.current) {
            // 先断开连接
            vncPreviewRef.current.disconnect();
            // 稍后重新连接，利用 VncPreview 的重试机制
            setTimeout(() => {
              vncPreviewRef.current?.connect();
            }, 0);
          }
        } catch (error) {
          console.error('Restart server failed:', error);
          message.error('重启失败，请重试');
        } finally {
          setIsRestarting(false);
        }
      }
    };

    /**
     * 渲染头部组件
     */
    const renderHeader = () => {
      return (
        <FilePathHeader
          conversationId={targetId?.toString() || ''}
          className={headerClassName}
          // 文件节点
          targetNode={selectedFileNode}
          // 当前视图模式
          viewMode={viewMode}
          // 视图模式切换回调
          onViewModeChange={handleChangeViewMode}
          // 是否显示视图模式切换按钮
          showViewModeButtons={showViewModeButtons}
          // 是否显示文件树展开/折叠按钮
          showFileTreeToggleButton={showFileTreeToggleButton}
          // 导出项目回调
          onExportProject={onExportProject ? handleDownloadProject : undefined}
          // 处理导入项目操作
          onImportProject={onImportProject}
          // 重启容器
          onRestartServer={handleRestartServer}
          // 重启智能体
          onRestartAgent={onRestartAgent}
          // 是否正在导出项目
          isExportingProjecting={isExportingProjecting}
          // 全屏回调
          onFullscreen={handleFullscreen}
          // 是否处于全屏状态
          isFullscreen={isFullscreen}
          // 是否显示全屏图标
          showFullscreenIcon={showFullscreenIcon}
          // 保存文件回调
          onSaveFiles={saveFiles}
          // 取消保存文件回调
          onCancelSaveFiles={cancelSaveFiles}
          // 是否存在修改过的文件
          hasModifiedFiles={changeFiles.length > 0}
          // 是否正在保存文件
          isSavingFiles={isSavingFiles}
          // 是否显示更多操作菜单
          showMoreActions={showMoreActions}
          // 当前文件类型
          viewFileType={viewFileType}
          // 针对html、md文件，切换预览和代码视图
          onViewFileTypeChange={setViewFileType}
          // 处理通过URL下载文件操作
          onDownloadFileByUrl={handleDownloadFileByUrl}
          // 是否正在下载文件
          isDownloadingFile={isDownloadingFile}
          // 是否显示分享按钮
          isShowShare={isShowShare}
          // 分享回调
          onShare={onShare}
          // 导出 PDF 回调
          onExportPdf={handleExportPdf}
          // 是否正在导出 PDF
          isExportingPdf={isExportingPdf}
          // 关闭整个面板
          onClose={onClose}
          // 连接 VNC 预览状态
          vncConnectStatus={renderVncPreviewStatusTag()}
          // 文件树是否可见
          isFileTreeVisible={isFileTreeVisible}
          // 文件树是否固定
          isFileTreePinned={isFileTreePinned}
          // 文件树展开/折叠回调
          onFileTreeToggle={handleFileTreeToggle}
          // 刷新文件树回调
          onRefreshFileTree={handleRefreshFileList}
          // 是否正在刷新文件树
          isRefreshingFileTree={isRefreshingFileTree}
          // 是否显示刷新按钮
          showRefreshButton={showRefreshButton}
          // 是否仅显示智能体电脑，默认显示所有（文件预览、智能体电脑）
          isOnlyShowDesktop={isOnlyShowDesktop}
        />
      );
    };

    return (
      <>
        {/* 全屏代码编辑器 Modal */}
        <Modal
          open={isFullscreen}
          onCancel={handleCloseFullscreen}
          footer={null}
          closable={false}
          mask={false}
          width="100%"
          style={{
            top: 0,
            paddingBottom: 0,
            maxWidth: '100%',
          }}
          styles={{
            body: {
              height: '100vh',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
          className={cx(styles['fullscreen-modal'])}
          destroyOnHidden={false}
        >
          <div className={cx(styles['fullscreen-container'])}>
            {/* 全屏模式下的头部组件 */}
            {renderHeader()}
            {/* 全屏模式下的代码编辑器 */}
            <div className={cx(styles['fullscreen-content'])}>
              {renderContent()}
            </div>
          </div>
        </Modal>

        <div className={cx('flex', 'flex-1', 'overflow-hide')}>
          {/* 右键菜单 */}
          <FileContextMenu
            visible={contextMenuVisible}
            position={contextMenuPosition}
            // 右键菜单目标节点
            targetNode={contextMenuTarget}
            // 是否禁用删除功能(SKILL.md文件不能删除)
            disabledDelete={
              !isCanDeleteSkillFile &&
              contextMenuTarget?.name?.toLowerCase() === 'skill.md'
            }
            // 关闭右键菜单
            onClose={closeContextMenu}
            // 处理删除操作
            onDelete={handleDelete}
            // 处理重命名操作
            onRename={handleRenameFromMenu}
            // 处理上传文件操作
            onUploadFiles={handleUploadFromMenu}
            // 处理新建文件操作
            onCreateFile={handleCreateFile}
            // 处理新建文件夹操作
            onCreateFolder={handleCreateFolder}
            // 处理导入项目操作
            onImportProject={onImportProject}
            // 处理通过URL下载文件操作
            onDownloadFileByUrl={handleDownloadFileByUrl}
          />
          {/* 左边文件树 - 远程桌面模式下隐藏，且未通过外部属性隐藏 */}
          {viewMode !== 'desktop' && !hideFileTree && (
            <div
              ref={fileTreeContainerRef}
              className={cx(
                styles['file-tree-view'],
                'h-full',
                'flex',
                'flex-col',
                'overflow-hide',
                {
                  [styles['file-tree-view-visible']]: isFileTreeVisible,
                  [styles['file-tree-view-hidden']]: !isFileTreeVisible,
                },
              )}
            >
              <SearchView
                className={headerClassName}
                files={files}
                onFileSelect={handleFileSelect}
              />
              <FileTree
                fileTreeDataLoading={fileTreeDataLoading}
                files={files}
                taskAgentSelectedFileId={taskAgentSelectedFileId}
                // 当前选中的文件ID
                selectedFileId={selectedFileId}
                // 正在重命名的节点
                renamingNode={renamingNode}
                // 取消重命名回调
                onCancelRename={handleCancelRename}
                // 右键菜单回调
                onContextMenu={handleContextMenu}
                // 文件选择回调
                onFileSelect={handleFileSelect}
                // 重命名文件回调
                onConfirmRenameFile={handleRenameFile}
              />
            </div>
          )}
          {/* 右边内容 */}
          <div
            className={cx(
              'h-full',
              'flex',
              'flex-col',
              'flex-1',
              'overflow-hide',
            )}
          >
            {/* 渲染头部组件 */}
            {renderHeader()}
            {/* 右边内容 */}
            <div className={cx(styles['content-container'])}>
              {renderContent()}
              {isRestarting && (
                <div className={cx(styles['restart-container'])}>
                  {/* 背景占位符（清晰的背景图，按比例显示） */}
                  <div className={cx(styles['background-placeholder'])} />
                  {/* 遮罩层（半透明遮罩 + Loading + Spin） */}
                  <div className={cx(styles['loading-overlay'])}>
                    <Spin size="large" className={cx(styles['loading-spin'])} />
                    <span className={cx(styles['loading-text'])}>
                      重启中...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  },
);

export default FileTreeView;
