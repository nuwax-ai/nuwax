import { isMarkdownFile } from '@/utils/common';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  ImportOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
  onUploadFiles,
  onCreateFile,
  onCreateFolder,
  // 导入项目
  onImportProject,
  onDownloadFileByUrl,
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
    if (!onUploadFiles) return;
    handleMenuItemClick(() => {
      onUploadFiles(targetNode);
    });
  }, [targetNode, onUploadFiles, handleMenuItemClick]);

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

  /**
   * 处理下载文件操作
   */
  const handleDownload = useCallback(() => {
    if (!targetNode || !targetNode.fileProxyUrl) return;

    handleMenuItemClick(() => {
      onDownloadFileByUrl?.(targetNode);
    });
  }, [targetNode, handleMenuItemClick]);

  /**
   * 处理导出为 PDF 操作（仅 Markdown 文件）
   */
  const handleExportPdf = useCallback(() => {
    if (!targetNode || !targetNode.fileProxyUrl) return;

    handleMenuItemClick(() => {
      onDownloadFileByUrl?.(targetNode, true);
    });
  }, [targetNode, handleMenuItemClick, onDownloadFileByUrl]);

  // 菜单 DOM 引用（必须在条件返回之前）
  const menuRef = useRef<HTMLDivElement>(null);
  // 调整后的菜单位置（必须在条件返回之前）
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // 计算并调整菜单位置，避免超出视口（必须在条件返回之前）
  useLayoutEffect(() => {
    if (!visible || !menuRef.current) {
      // 菜单不可见时，重置为原始位置
      if (!visible) {
        setAdjustedPosition(position);
      }
      return;
    }

    const menuElement = menuRef.current;
    const menuHeight = menuElement.offsetHeight;
    const menuWidth = menuElement.offsetWidth;

    // 如果菜单还未渲染完成（高度为 0），使用原始位置
    if (menuHeight === 0) {
      setAdjustedPosition(position);
      return;
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let adjustedTop = position.y;
    let adjustedLeft = position.x;

    // 如果菜单底部超出视口，向上调整位置
    if (position.y + menuHeight > viewportHeight) {
      adjustedTop = position.y - menuHeight;
      // 确保调整后的菜单顶部不会超出视口顶部，且至少距离顶部 8px
      adjustedTop = Math.max(8, adjustedTop);
      // 如果菜单高度超过视口高度，确保菜单顶部从视口顶部开始（保留 8px 边距）
      if (menuHeight > viewportHeight - 16) {
        adjustedTop = 8;
      }
    }

    // 如果菜单右侧超出视口，向左调整位置
    if (position.x + menuWidth > viewportWidth) {
      adjustedLeft = Math.max(8, viewportWidth - menuWidth - 8); // 至少距离右侧 8px
    }

    setAdjustedPosition({ x: adjustedLeft, y: adjustedTop });
  }, [visible, position]);

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
            disabled: !onUploadFiles || targetNode?.name?.startsWith('.'),
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
          // 只有当 fileProxyUrl 存在且不为空时才显示下载选项
          ...(targetNode?.fileProxyUrl
            ? [
                {
                  key: 'download',
                  label: '下载',
                  icon: <DownloadOutlined />,
                  onClick: handleDownload,
                },
                // 如果是 Markdown 文件，显示导出为 PDF 选项
                ...(isMarkdownFile(targetNode?.name || '')
                  ? [
                      {
                        key: 'exportPdf',
                        label: '导出为 PDF',
                        icon: <FilePdfOutlined />,
                        onClick: handleExportPdf,
                      },
                    ]
                  : []),
              ]
            : []),
          {
            key: 'upload',
            label: '上传文件',
            icon: <UploadOutlined />,
            onClick: handleUpload,
            disabled: !onUploadFiles || targetNode?.name?.startsWith('.'),
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
        // 只有当 onImportProject 存在时才显示导入项目选项
        ...(onImportProject
          ? [
              {
                key: 'importProject',
                label: '导入项目',
                icon: <ImportOutlined />,
                onClick: onImportProject,
              },
            ]
          : []),
        {
          key: 'divider1',
          type: 'divider' as const,
        },
        {
          key: 'upload',
          label: '上传文件',
          icon: <UploadOutlined />,
          onClick: handleUpload,
          disabled: !onUploadFiles,
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
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
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
