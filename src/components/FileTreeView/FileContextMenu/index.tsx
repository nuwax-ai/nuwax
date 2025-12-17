import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import React, { useCallback } from 'react';
import styles from './index.less';
import type { FileContextMenuProps } from './types';

/**
 * FileContextMenu 组件
 * 提供文件树右键上下文菜单功能
 */
const FileContextMenu: React.FC<FileContextMenuProps> = ({
  visible,
  position,
  targetNode,
  onClose,
  onDelete,
  onRename,
  onUploadSingleFile,
  onCreateFile,
  onCreateFolder,
  disableDelete = false,
}) => {
  /**
   * 处理菜单项点击
   */
  const handleMenuItemClick = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose],
  );

  /**
   * 处理删除操作
   */
  const handleDelete = useCallback(() => {
    if (!targetNode) return;
    handleMenuItemClick(() => {
      // 创建一个模拟的 MouseEvent 对象，包含必要的方法
      const mockEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
        currentTarget: null,
        target: null,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        nativeEvent: {} as Event,
        timeStamp: Date.now(),
        type: 'click',
      } as unknown as React.MouseEvent;

      onDelete(targetNode, mockEvent);
    });
  }, [targetNode, onDelete, handleMenuItemClick]);

  /**
   * 处理重命名操作
   */
  const handleRename = useCallback(() => {
    if (!targetNode || !onRename) return;
    handleMenuItemClick(() => {
      onRename(targetNode);
    });
  }, [targetNode, onRename, handleMenuItemClick]);

  /**
   * 处理上传操作
   */
  const handleUpload = useCallback(() => {
    if (!onUploadSingleFile) return;
    handleMenuItemClick(() => {
      onUploadSingleFile(targetNode);
    });
  }, [targetNode, onUploadSingleFile, handleMenuItemClick]);

  /**
   * 处理新建文件操作
   */
  const handleCreateFile = useCallback(() => {
    if (!onCreateFile) return;
    handleMenuItemClick(() => {
      // 如果目标节点是文件夹，则在该文件夹下创建；否则在根目录创建
      const parentNode =
        targetNode && targetNode.type === 'folder' ? targetNode : null;
      onCreateFile(parentNode);
    });
  }, [targetNode, onCreateFile, handleMenuItemClick]);

  /**
   * 处理新建文件夹操作
   */
  const handleCreateFolder = useCallback(() => {
    if (!onCreateFolder) return;
    handleMenuItemClick(() => {
      // 如果目标节点是文件夹，则在该文件夹下创建；否则在根目录创建
      const parentNode =
        targetNode && targetNode.type === 'folder' ? targetNode : null;
      onCreateFolder(parentNode);
    });
  }, [targetNode, onCreateFolder, handleMenuItemClick]);

  // 如果不显示，返回 null
  if (!visible) {
    return null;
  }

  // 构建菜单项 - 根据是否有目标节点显示不同菜单
  const allMenuItems = targetNode
    ? targetNode.type === 'folder'
      ? [
          // 文件夹菜单项
          {
            key: 'createFile',
            label: '新建文件',
            icon: <FileAddOutlined />,
            onClick: handleCreateFile,
            disabled: !onCreateFile,
          },
          {
            key: 'createFolder',
            label: '新建文件夹',
            icon: <FolderAddOutlined />,
            onClick: handleCreateFolder,
            disabled: !onCreateFolder,
          },
          {
            key: 'divider1',
            type: 'divider' as const,
          },
          {
            key: 'rename',
            label: '重命名',
            icon: <EditOutlined />,
            onClick: handleRename,
            disabled: !onRename,
          },
          {
            key: 'upload',
            label: '上传文件',
            icon: <UploadOutlined />,
            onClick: handleUpload,
            disabled: !onUploadSingleFile || targetNode?.name?.startsWith('.'),
          },
          {
            key: 'divider2',
            type: 'divider' as const,
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: handleDelete,
            danger: true,
          },
        ]
      : [
          // 文件菜单项（不包含新建选项）
          {
            key: 'rename',
            label: '重命名',
            icon: <EditOutlined />,
            onClick: handleRename,
            disabled: !onRename,
          },
          {
            key: 'upload',
            label: '上传文件',
            icon: <UploadOutlined />,
            onClick: handleUpload,
            disabled: !onUploadSingleFile || targetNode?.name?.startsWith('.'),
          },
          {
            key: 'divider',
            type: 'divider' as const,
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: handleDelete,
            danger: true,
          },
        ]
    : [
        // 空白区域菜单项
        {
          key: 'createFile',
          label: '新建文件',
          icon: <FileAddOutlined />,
          onClick: handleCreateFile,
          disabled: !onCreateFile,
        },
        {
          key: 'createFolder',
          label: '新建文件夹',
          icon: <FolderAddOutlined />,
          onClick: handleCreateFolder,
          disabled: !onCreateFolder,
        },
        {
          key: 'divider1',
          type: 'divider' as const,
        },
        {
          key: 'upload',
          label: '上传文件',
          icon: <UploadOutlined />,
          onClick: handleUpload,
          disabled: !onUploadSingleFile,
        },
      ];

  // 如果对于SKILL.md文件禁用删除功能和重命名功能，过滤掉删除菜单项、重命名菜单项和相关 divider
  const menuItems = disableDelete
    ? allMenuItems.filter(
        (item) =>
          item.key !== 'delete' &&
          item.key !== 'rename' &&
          item.key !== 'divider' &&
          item.key !== 'divider2',
      )
    : allMenuItems;

  return (
    <div
      className={styles.contextMenu}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className={styles.contextMenuDivider} />;
        }

        return (
          <div
            key={item.key}
            className={`${styles.contextMenuItem} ${
              item.danger ? styles.dangerMenuItem : ''
            } ${item.disabled ? styles.disabledMenuItem : ''}`}
            onClick={item.disabled ? undefined : item.onClick}
          >
            <span className={styles.contextMenuIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default FileContextMenu;
