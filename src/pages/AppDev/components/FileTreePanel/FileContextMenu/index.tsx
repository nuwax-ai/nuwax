import {
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import React, { useCallback, useEffect } from 'react';
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
  isChatLoading = false,
  isComparing = false,
  onClose,
  onDelete,
  onRename,
  onUploadSingleFile,
  onUploadProject,
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
   * 处理上传项目操作（空白区域菜单）
   */
  const handleUploadProject = useCallback(() => {
    if (!onUploadProject) return;
    handleMenuItemClick(() => {
      onUploadProject();
    });
  }, [onUploadProject, handleMenuItemClick]);

  /**
   * 点击外部关闭菜单
   */
  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    if (visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [visible, onClose]);

  // 如果不显示，返回 null
  if (!visible) {
    return null;
  }

  // 如果正在聊天加载或版本对比模式，禁用菜单
  if (isChatLoading || isComparing) {
    return null;
  }

  // 构建菜单项 - 根据是否有目标节点显示不同菜单
  const menuItems = targetNode
    ? [
        // 文件/文件夹菜单项
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
          disabled: !onUploadSingleFile || targetNode.name.startsWith('.'),
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
          key: 'uploadProject',
          label: '导入项目',
          icon: <ImportOutlined />,
          onClick: handleUploadProject,
          disabled: !onUploadProject,
        },
        {
          key: 'upload',
          label: '上传文件',
          icon: <UploadOutlined />,
          onClick: handleUpload,
          disabled: !onUploadSingleFile,
        },
      ];

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
