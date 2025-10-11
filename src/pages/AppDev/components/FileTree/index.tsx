import { FileNode } from '@/models/appDev';
import {
  DeleteOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

interface FileTreeProps {
  files: FileNode[];
  level?: number;
  onFileSelect?: (fileId: string) => void;
  onFileCreate?: (path: string, content: string) => void;
  onFolderCreate?: (path: string) => void;
  onFileDelete?: (fileId: string) => void;
  activeFileId?: string;
}

interface FileTreeItemProps {
  file: FileNode;
  level?: number;
  onFileSelect?: (fileId: string) => void;
  onFileCreate?: (path: string, content: string) => void;
  onFolderCreate?: (path: string) => void;
  onFileDelete?: (fileId: string) => void;
  activeFileId?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level = 0,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onFileDelete,
  activeFileId,
}) => {
  const [isExpanded, setIsExpanded] = useState(file.type === 'folder');
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  const isActive = activeFileId === file.id;

  const handleClick = () => {
    console.log(
      '🖱️ [FileTree] Clicked on file:',
      file.name,
      'type:',
      file.type,
    );
    if (file.type === 'file') {
      console.log('📄 [FileTree] Setting active file:', file.id);
      onFileSelect?.(file.id);
    } else {
      console.log(
        '📁 [FileTree] Toggling folder expansion:',
        isExpanded ? 'collapsing' : 'expanding',
      );
      setIsExpanded(!isExpanded);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsContextMenuOpen(true);
  };

  const handleCreateFile = () => {
    const path =
      file.type === 'folder'
        ? `${file.path}/new-file.tsx`
        : `${file.path.split('/').slice(0, -1).join('/')}/new-file.tsx`;
    onFileCreate?.(path, '// New file');
    setIsContextMenuOpen(false);
  };

  const handleCreateFolder = () => {
    const path =
      file.type === 'folder'
        ? `${file.path}/new-folder`
        : `${file.path.split('/').slice(0, -1).join('/')}/new-folder`;
    onFolderCreate?.(path);
    setIsContextMenuOpen(false);
  };

  const handleDelete = () => {
    if (file.type === 'file') {
      onFileDelete?.(file.id);
    }
    setIsContextMenuOpen(false);
  };

  const getFileIcon = () => {
    if (file.type === 'folder') {
      return isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />;
    }
    return <FileOutlined />;
  };

  return (
    <div className={styles.fileTreeItem}>
      <div
        className={`${styles.fileItem} ${isActive ? styles.active : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.fileIcon}>{getFileIcon()}</div>
        <span className={styles.fileName}>{file.name}</span>

        <div className={styles.fileActions}>
          <Tooltip title="新建文件">
            <Button
              type="text"
              size="small"
              icon={<FileAddOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFile();
              }}
              className={styles.actionButton}
            />
          </Tooltip>
          <Tooltip title="新建文件夹">
            <Button
              type="text"
              size="small"
              icon={<FolderAddOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFolder();
              }}
              className={styles.actionButton}
            />
          </Tooltip>
          <Tooltip title="更多操作">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setIsContextMenuOpen(!isContextMenuOpen);
              }}
              className={styles.actionButton}
            />
          </Tooltip>
        </div>
      </div>

      {isContextMenuOpen && (
        <div className={styles.contextMenu}>
          <div className={styles.contextMenuItem} onClick={handleCreateFile}>
            <FileAddOutlined className={styles.contextMenuIcon} />
            新建文件
          </div>
          <div className={styles.contextMenuItem} onClick={handleCreateFolder}>
            <FolderAddOutlined className={styles.contextMenuIcon} />
            新建文件夹
          </div>
          {file.type === 'file' && (
            <div
              className={`${styles.contextMenuItem} ${styles.danger}`}
              onClick={handleDelete}
            >
              <DeleteOutlined className={styles.contextMenuIcon} />
              删除
            </div>
          )}
        </div>
      )}

      {file.type === 'folder' && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeItem
              key={child.id}
              file={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFolderCreate={onFolderCreate}
              onFileDelete={onFileDelete}
              activeFileId={activeFileId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({
  files,
  level = 0,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onFileDelete,
  activeFileId,
}) => {
  return (
    <div className={styles.fileTree}>
      {files.map((file) => (
        <FileTreeItem
          key={file.id}
          file={file}
          level={level}
          onFileSelect={onFileSelect}
          onFileCreate={onFileCreate}
          onFolderCreate={onFolderCreate}
          onFileDelete={onFileDelete}
          activeFileId={activeFileId}
        />
      ))}
    </div>
  );
};

export default FileTree;
