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
import CodeViewer from '../CodeViewer';
import FileContextMenu from './FileContextMenu';
import FilePathHeader from './FilePathHeader';
import FileTree from './FileTree';
import styles from './index.less';
import SearchView from './SearchView';

const cx = classNames.bind(styles);

interface FileTreeViewProps {
  originalFiles: any[];
  onUploadSingleFile?: (node: FileNode | null) => void;
  onDownload?: () => void;
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
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
  onUploadSingleFile,
  onDownload,
  onRenameFile,
  onSaveFiles,
}) => {
  // 文件树数据
  const [files, setFiles] = useState<FileNode[]>([]);
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
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // 修改的文件列表
  const [changeFiles, setChangeFiles] = useState<
    { fileId: string; fileContent: string; originalFileContent: string }[]
  >([]);

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

  useEffect(() => {
    console.log('originalFiles55555555555555', originalFiles);
    let treeData: FileNode[] = [];
    // 如果文件列表不为空，则转换为树形结构
    if (Array.isArray(originalFiles) && originalFiles.length > 0) {
      console.log('useEffect00111111');
      treeData = transformFlatListToTree(originalFiles);
    }
    // else if (Array.isArray(originalFiles)) {
    //   console.log('useEffect002');
    //   treeData = originalFiles;
    // }
    // else {
    //   // 从模板中获取文件列表
    //   const {
    //     data: templateInfo,
    //     code,
    //     message: errorMessage,
    //   } = await apiSkillTemplate();
    //   if (code === SUCCESS_CODE) {
    //     treeData = transformFlatListToTree(templateInfo.files);
    //   } else {
    //     message.error(errorMessage || '获取技能模板失败');
    //   }
    // }
    setFiles(treeData);

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
  const handleRenameFromMenu = (node: FileNode) => {
    console.log('handleRenameFromMenu', node);
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

      // 先立即更新文件树中的显示名字，提供即时反馈
      const updatedFileTree = updateFileTreeName(
        files,
        fileNode.id,
        newName.trim(),
      );

      console.log('处理重命名操作', updatedFileTree);

      setFiles(updatedFileTree);

      // 直接调用现有的重命名文件功能
      const result = await onRenameFile?.(fileNode, newName);
      if (!result) {
        setFiles(filesBackup);
      }
    } catch {
      // 重命名文件失败，重新加载文件树以恢复原状态
      setFiles(filesBackup);
    }
  };

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadFromMenu = (node: any) => {
    // 直接调用现有的上传单个文件功能
    onUploadSingleFile?.(node);
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

  console.log('处理内容变化', files);
  /**
   * 处理内容变化
   */
  const handleContentChange = (fileId: string, content: string) => {
    // 更新当前选中的文件内容
    setSelectedFileNode({
      ...selectedFileNode,
      content,
    });
    // 更新文件内容
    const updatedFiles: FileNode[] = updateFileTreeContent(
      fileId,
      content,
      files,
    );
    setFiles(updatedFiles);

    // 检查是否已存在该文件的修改记录
    const existingIndex = changeFiles.findIndex(
      (item) => item.fileId === fileId,
    );

    if (existingIndex !== -1) {
      // 如果已存在，更新该项的 fileContent，保留原始的 originalFileContent
      const updatedChangeFiles = [...changeFiles];
      updatedChangeFiles[existingIndex] = {
        ...updatedChangeFiles[existingIndex],
        fileContent: content,
      };
      setChangeFiles(updatedChangeFiles);
    } else {
      // 如果不存在，追加新项
      setChangeFiles([
        ...changeFiles,
        {
          fileId,
          fileContent: content,
          originalFileContent: selectedFileNode?.content,
        },
      ]);
    }
  };

  const isImage = isImageFile(selectedFileId);
  const isPreviewable = isPreviewableFile(selectedFileId);

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
    // setIsFullscreen(false);
    const result = await onSaveFiles?.(changeFiles);
    // console.log('saveFiles result33333', result);
    if (result) {
      // 清空已修改文件列表
      setChangeFiles([]);
    }
  };

  // console.log('changeFil11111111111', changeFiles);
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
    console.log('restoredFiles888888', restoredFiles);
    setFiles(restoredFiles);
    // 还原当前选中的文件内容
    // setSelectedFileNode({
    //   ...selectedFileNode,
    //   content: restoredFiles.find((file) => file.id === selectedFileId)?.content,
    // });
    // 清空已修改文件列表
    setChangeFiles([]);
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
              filePath={selectedFileNode?.path || selectedFileId}
              fileName={selectedFileNode?.name}
              fileSize={selectedFileNode?.size}
              lastModified={selectedFileNode?.lastModified}
              onDownload={onDownload}
              onFullscreen={handleFullscreen}
              isFullscreen={true}
              onSaveFiles={saveFiles}
              onCancelSaveFiles={cancelSaveFiles}
              hasModifiedFiles={changeFiles.length > 0}
            />
          </div>
          {/* 全屏模式下的代码编辑器 */}
          <div className={cx(styles['fullscreen-content'])}>
            {!isPreviewable && !selectedFileNode?.content ? (
              <AppDevEmptyState
                type="error"
                title="无法预览此文件类型"
                description={`当前不支持预览 ${
                  selectedFileId.split('.').pop() || selectedFileId
                } 格式的文件。`}
              />
            ) : isImage ? (
              <ImageViewer
                imageUrl={processImageContent(selectedFileNode?.content)}
                alt={selectedFileId}
                onRefresh={() => {}}
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
            filePath={selectedFileNode?.path || selectedFileId}
            fileName={selectedFileNode?.name}
            fileSize={selectedFileNode?.size}
            lastModified={selectedFileNode?.lastModified}
            onDownload={onDownload}
            onFullscreen={handleFullscreen}
            isFullscreen={false}
            onSaveFiles={saveFiles}
            onCancelSaveFiles={cancelSaveFiles}
            hasModifiedFiles={changeFiles.length > 0}
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
    </>
  );
};

export default FileTreeView;
