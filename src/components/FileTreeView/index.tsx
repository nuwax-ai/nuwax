import { ImageViewer } from '@/pages/AppDev/components';
import { FileNode } from '@/types/interfaces/appDev';
import {
  findFileNode,
  isImageFile,
  isPreviewableFile,
  processImageContent,
  transformFlatListToTree,
} from '@/utils/appDevUtils';
import { updateFileTreeContent, updateFileTreeName } from '@/utils/fileTree';
import { Modal } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import AppDevEmptyState from '../business-component/AppDevEmptyState';
import VncPreview from '../business-component/VncPreview';
import CodeViewer from '../CodeViewer';
import FileContextMenu from './FileContextMenu';
import FilePathHeader from './FilePathHeader';
import FileTree from './FileTree';
import styles from './index.less';
import SearchView from './SearchView';

const cx = classNames.bind(styles);

interface FileTreeViewProps {
  originalFiles: any[];
  /** 是否只读 */
  readOnly?: boolean;
  /** 目标ID */
  targetId?: string;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 上传单个文件回调 */
  onUploadSingleFile?: (node: FileNode | null) => void;
  /** 下载文件回调 */
  onDownload?: () => void;
  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 创建文件回调 */
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 删除文件回调 */
  onDeleteFile?: (node: FileNode) => void;
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: 'preview' | 'desktop') => void;
  /** 保存文件回调 */
  onSaveFiles?: (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => Promise<boolean>;
}

/**
 * 文件树视图组件
 */
const FileTreeView: React.FC<FileTreeViewProps> = ({
  originalFiles,
  readOnly = false,
  targetId,
  viewMode,
  onUploadSingleFile,
  onDownload,
  onRenameFile,
  onCreateFileNode,
  onDeleteFile,
  onViewModeChange,
  onSaveFiles,
}) => {
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
  const [changeFiles, setChangeFiles] = useState<
    { fileId: string; fileContent: string; originalFileContent: string }[]
  >([]);

  // 是否正在保存文件
  const [isSavingFiles, setIsSavingFiles] = useState<boolean>(false);

  // 文件选择
  const handleFileSelect = (fileId: string) => {
    // 切换到预览模式
    onViewModeChange?.('preview');
    setSelectedFileId(fileId);
    // 根据文件ID查找文件节点
    const fileNode = findFileNode(fileId, files);
    if (fileNode) {
      setSelectedFileNode(fileNode);
    } else {
      setSelectedFileNode(null);
    }
  };

  useEffect(() => {
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
   */
  const closeContextMenu = () => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  };

  // 点击外部关闭右键菜单
  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

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
        if (!isCreateSuccess) {
          setFiles(filesBackup);
        }
      } else {
        // 直接调用现有的重命名文件功能
        const isChangeSuccess = await onRenameFile?.(fileNode, newName);
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
    // 直接调用现有的上传单个文件功能
    onUploadSingleFile?.(node);
  };

  /**
   * 处理删除操作
   */
  const handleDelete = (node: FileNode) => {
    // 直接调用现有的删除文件功能
    onDeleteFile?.(node);
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
      setSelectedFileId(newNode.id);
      setSelectedFileNode(newNode);
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

    // 使用函数式更新获取最新的 files 状态
    setFiles((prevFiles) => {
      // 从最新的 files 中获取原始内容
      const currentFile = findFileNode(fileId, prevFiles);
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
  // 判断文件是否支持预览（白名单方案）
  const isPreviewable = isPreviewableFile(selectedFileNode?.name || '');

  /**
   * 处理全屏切换
   */
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /**
   * 关闭全屏
   */
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
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
    // 还原当前选中的文件内容
    const oldContent = restoredFiles.find(
      (file) => file.id === selectedFileId,
    )?.content;
    setSelectedFileNode((prevNode: any) => ({
      ...prevNode,
      content: oldContent,
    }));
    // 清空已修改文件列表
    setChangeFiles([]);
  };

  /**
   * 渲染内容区域
   * 根据视图模式和文件类型渲染不同的预览组件
   */
  const renderContent = () => {
    // 桌面模式：显示 VNC 预览
    if (viewMode === 'desktop') {
      return (
        <VncPreview
          serviceUrl={process.env.BASE_URL || ''}
          cId={targetId || ''}
          readOnly={readOnly}
          autoConnect={true}
          className={cx(styles['vnc-preview'])}
        />
      );
    }

    // 预览模式：根据文件状态和类型渲染不同内容
    // 未选择文件
    if (!selectedFileNode) {
      return (
        <AppDevEmptyState
          type="empty"
          title="请从左侧文件树选择一个文件进行预览"
          description="当前没有可预览的文件，请从左侧文件树选择一个文件进行预览"
        />
      );
    }

    // 文件类型不支持预览
    if (!isPreviewable) {
      const fileExtension = selectedFileId?.split('.')?.pop() || selectedFileId;
      return (
        <AppDevEmptyState
          type="error"
          title="无法预览此文件类型"
          description={`当前不支持预览 ${fileExtension} 格式的文件。`}
        />
      );
    }

    // 图片文件：使用图片查看器
    if (isImage) {
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

    // 代码文件：使用代码查看器
    return (
      <CodeViewer
        fileId={selectedFileId}
        fileName={selectedFileId.split('/').pop() || selectedFileId}
        filePath={`app/${selectedFileId}`}
        content={selectedFileNode?.content || ''}
        readOnly={readOnly}
        onContentChange={handleContentChange}
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
          {/* 全屏模式下的文件路径显示 */}
          <div className={cx(styles['fullscreen-header'])}>
            <FilePathHeader
              fileName={selectedFileNode?.name}
              fileSize={selectedFileNode?.size}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              onDownload={onDownload}
              onFullscreen={handleFullscreen}
              isFullscreen={true}
              onSaveFiles={saveFiles}
              onCancelSaveFiles={cancelSaveFiles}
              hasModifiedFiles={changeFiles.length > 0}
              isSavingFiles={isSavingFiles}
            />
          </div>
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
          disableDelete={contextMenuTarget?.name?.toLowerCase() === 'skill.md'}
          // 关闭右键菜单
          onClose={closeContextMenu}
          // 处理删除操作
          onDelete={handleDelete}
          // 处理重命名操作
          onRename={handleRenameFromMenu}
          // 处理上传文件操作
          onUploadSingleFile={handleUploadFromMenu}
          // 处理新建文件操作
          onCreateFile={handleCreateFile}
          // 处理新建文件夹操作
          onCreateFolder={handleCreateFolder}
        />
        {/* 左边文件树 */}
        <div
          className={cx(
            styles['file-tree-view'],
            'h-full',
            'flex',
            'flex-col',
            'overflow-hide',
          )}
        >
          <SearchView files={files} onFileSelect={handleFileSelect} />
          <FileTree
            files={files}
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
        <div
          className={cx(
            'h-full',
            'flex',
            'flex-col',
            'flex-1',
            'overflow-hide',
          )}
        >
          {/* 文件路径显示 */}
          <FilePathHeader
            fileName={selectedFileNode?.name}
            fileSize={selectedFileNode?.size}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onDownload={onDownload}
            onFullscreen={handleFullscreen}
            isFullscreen={false}
            onSaveFiles={saveFiles}
            onCancelSaveFiles={cancelSaveFiles}
            hasModifiedFiles={changeFiles.length > 0}
            isSavingFiles={isSavingFiles}
          />
          {/* 右边内容 */}
          <div className={cx(styles['content-container'])}>
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default FileTreeView;
