import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ChangeFileContextMenuProps {
  /** 是否可见 */
  visible: boolean;
  /** 菜单坐标（相对容器） */
  position: { x: number; y: number };
  /** 右键目标类型：文件 / 文件夹 */
  targetType?: 'file' | 'folder';
  /** 目标文件是否已暂存（文件）或是否来自暂存区块（文件夹） */
  isStaged?: boolean;
  /** 关闭菜单 */
  onClose: () => void;
  /** 打开更改（diff） */
  onOpenChanges?: () => void;
  /** 打开文件 */
  onOpenFile?: () => void;
  /** 放弃更改 */
  onDiscardChange?: () => void;
  /** 暂存更改 */
  onStageChange?: () => void;
  /** 取消暂存 */
  onUnstageChange?: () => void;
  /** 添加到 .gitignore */
  onAddToGitignore?: () => void;
}

/**
 * 源代码管理 - 更改文件右键菜单
 * 未暂存与已暂存文件展示不同菜单项
 */
const ChangeFileContextMenu: React.FC<ChangeFileContextMenuProps> = ({
  visible,
  position,
  targetType = 'file',
  isStaged = false,
  onClose,
  onOpenChanges,
  onOpenFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onAddToGitignore,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const handleItemClick = useCallback(
    (action?: () => void) => {
      action?.();
      onClose();
    },
    [onClose],
  );

  useLayoutEffect(() => {
    if (!visible || !menuRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + menuRect.width > viewportWidth) {
      x = Math.max(0, viewportWidth - menuRect.width - 8);
    }
    if (y + menuRect.height > viewportHeight) {
      y = Math.max(0, viewportHeight - menuRect.height - 8);
    }

    setAdjustedPosition({ x, y });
  }, [visible, position]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const handleDocumentClick = () => {
      onClose();
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  const unstagedItems = [
    {
      key: 'openChanges',
      label: dict('PC.Pages.ConversationAgentSourceControl.openChanges'),
      onClick: onOpenChanges,
    },
    {
      key: 'openFile',
      label: dict('PC.Pages.ConversationAgentSourceControl.openFile'),
      onClick: onOpenFile,
    },
    {
      key: 'discard',
      label: dict('PC.Pages.ConversationAgentSourceControl.discardChanges'),
      onClick: onDiscardChange,
    },
    {
      key: 'stage',
      label: dict('PC.Pages.ConversationAgentSourceControl.stageChanges'),
      onClick: onStageChange,
    },
    {
      key: 'gitignore',
      label: dict('PC.Pages.ConversationAgentSourceControl.addToGitignore'),
      onClick: onAddToGitignore,
    },
  ];

  const stagedItems = [
    {
      key: 'openChanges',
      label: dict('PC.Pages.ConversationAgentSourceControl.openChanges'),
      onClick: onOpenChanges,
    },
    {
      key: 'openFile',
      label: dict('PC.Pages.ConversationAgentSourceControl.openFile'),
      onClick: onOpenFile,
    },
    {
      key: 'unstage',
      label: dict('PC.Pages.ConversationAgentSourceControl.unstageChanges'),
      onClick: onUnstageChange,
    },
  ];

  const unstagedFolderItems = [
    {
      key: 'discard',
      label: dict('PC.Pages.ConversationAgentSourceControl.discardChanges'),
      onClick: onDiscardChange,
    },
    {
      key: 'stage',
      label: dict('PC.Pages.ConversationAgentSourceControl.stageChanges'),
      onClick: onStageChange,
    },
    {
      key: 'gitignore',
      label: dict('PC.Pages.ConversationAgentSourceControl.addToGitignore'),
      onClick: onAddToGitignore,
    },
  ];

  const stagedFolderItems = [
    {
      key: 'unstage',
      label: dict('PC.Pages.ConversationAgentSourceControl.unstageChanges'),
      onClick: onUnstageChange,
    },
  ];

  const menuItems =
    targetType === 'folder'
      ? isStaged
        ? stagedFolderItems
        : unstagedFolderItems
      : isStaged
      ? stagedItems
      : unstagedItems;

  return (
    <div
      ref={menuRef}
      className={cx(styles['context-menu'])}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuItems.map((item) => (
        <div
          key={item.key}
          className={cx(styles['context-menu-item'])}
          onClick={() => handleItemClick(item.onClick)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ChangeFileContextMenu;
