import { ImageViewer } from '@/pages/AppDev/components';
import { FileNode } from '@/types/interfaces/appDev';
import {
  findFileNode,
  isImageFile,
  isPreviewableFile,
  processImageContent,
} from '@/utils/appDevUtils';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import AppDevEmptyState from '../business-component/AppDevEmptyState';
import CodeViewer from '../CodeViewer';
import FileContextMenu from './FileContextMenu';
import FilePathHeader from './FilePathHeader';
import FileTree from './FileTree';
import styles from './index.less';
import SearchView from './SearchView';

const cx = classNames.bind(styles);

interface FileTreeViewProps {
  files: FileNode[];
}

/**
 * 文件树视图组件
 */
const FileTreeView: React.FC<FileTreeViewProps> = ({ files }) => {
  // 当前选中的文件ID
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  // 选中的文件节点
  const [selectedFileNode, setSelectedFileNode] = useState<any>(null);
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

  // 文件选择
  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    // 根据文件ID查找文件节点
    const fileNode = findFileNode(fileId, files);
    if (fileNode) {
      setSelectedFileNode(fileNode);
    } else {
      setSelectedFileNode(null);
    }
  };

  /**
   * 处理右键菜单显示
   * @param e - 鼠标事件
   * @param node - 目标节点, 可以为 null 表示点击空白区域，清空目标节点
   */
  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
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
  const handleCancelRename = () => {
    setRenamingNode(null);
  };

  /**
   * 处理重命名操作（从右键菜单触发）
   */
  const handleRenameFromMenu = (node: any) => {
    setRenamingNode(node);
  };

  /**
   * 处理重命名操作
   */
  const handleRenameFile = (node: FileNode, newName: string) => {
    // 直接调用现有的重命名文件功能
    // onRenameFile(node, newName);
    console.log('handleRenameFile', node, newName);
    return Promise.resolve(true);
  };

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadFromMenu = (node: any) => {
    // 直接调用现有的上传单个文件功能
    // onUploadSingleFile(node);
    console.log('handleUploadFromMenu', node);
  };

  /**
   * 处理删除操作
   */
  const handleDelete = (node: any) => {
    // 直接调用现有的删除文件功能
    // onDeleteFile(node);
    console.log('handleDelete', node);
  };

  /**
   * 处理上传操作
   */
  const handleUpload = () => {
    // 直接调用现有的上传文件功能
    // onUploadFile(node);
  };

  /**
   * 处理内容变化
   */
  const handleContentChange = (fileId: string, content: string) => {
    // 直接调用现有的内容变化功能
    // onContentChange(fileId, content);
    console.log('handleContentChange', fileId, content);
  };

  const isImage = isImageFile(selectedFileId);
  const isPreviewable = isPreviewableFile(selectedFileId);

  return (
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
        // 处理重命名操作（从右键菜单触发）
        onRename={handleRenameFromMenu}
        // 处理上传操作（从右键菜单触发）
        onUploadSingleFile={handleUploadFromMenu}
        // 处理上传操作
        onUploadProject={handleUpload}
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
          onRenameFile={handleRenameFile}
        />
      </div>
      <div
        className={cx('h-full', 'flex', 'flex-col', 'flex-1', 'overflow-hide')}
      >
        {/* 文件路径显示 */}
        <FilePathHeader
          filePath={selectedFileNode?.path || selectedFileId}
          fileName={selectedFileNode?.name}
          fileSize={selectedFileNode?.size}
          lastModified={selectedFileNode?.lastModified}
        />
        {/* 右边内容 */}
        <div className={cx(styles['content-container'])}>
          {!isPreviewable && !selectedFileNode?.content ? (
            // 不支持预览的文件类型
            <AppDevEmptyState
              type="error"
              title="无法预览此文件类型"
              description={`当前不支持预览 ${
                selectedFileId.split('.').pop() || selectedFileId
              } 格式的文件。`}
            />
          ) : isImage ? (
            <ImageViewer
              imageUrl={processImageContent(
                selectedFileNode?.content,
                // devServerUrl
                //   ? `${devServerUrl}/${selectedFileId}`
                //   : `/${selectedFileId}`,
              )}
              alt={selectedFileId}
              onRefresh={() => {
                // if (previewRef.current) {
                //   previewRef.current.refresh();
                // }
              }}
            />
          ) : (
            <CodeViewer
              fileId={selectedFileId}
              fileName={selectedFileId.split('/').pop() || selectedFileId}
              filePath={`app/${selectedFileId}`}
              content={selectedFileNode?.content}
              readOnly={false}
              onContentChange={handleContentChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTreeView;
