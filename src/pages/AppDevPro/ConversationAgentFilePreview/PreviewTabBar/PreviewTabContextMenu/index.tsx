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

/** 菜单进出场动画时长（与 less 中 transition 保持一致） */
const MENU_TRANSITION_MS = 160;

export interface PreviewTabContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  /** 是否已固定 */
  isPinned?: boolean;
  onClose: () => void;
  onCloseTab?: () => void;
  onCloseOtherTabs?: () => void;
  onCloseAllTabs?: () => void;
  onTogglePin?: () => void;
}

interface MenuItemConfig {
  key: string;
  labelKey: string;
  shortcut?: string;
  onClick?: () => void;
  dividerBefore?: boolean;
}

/**
 * 预览区标签页右键菜单（带淡入缩放过渡）
 */
const PreviewTabContextMenu: React.FC<PreviewTabContextMenuProps> = ({
  visible,
  position,
  isPinned = false,
  onClose,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onTogglePin,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  /** 是否挂载 DOM（关闭动画结束后再卸载） */
  const [mounted, setMounted] = useState(false);
  /** 是否处于展开态（控制 opacity / transform） */
  const [expanded, setExpanded] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const handleItemClick = useCallback(
    (action?: () => void) => {
      action?.();
      onClose();
    },
    [onClose],
  );

  /** 同步 visible：先挂载再展开；收起后延迟卸载 */
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setAdjustedPosition(position);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setExpanded(false);
    const timer = window.setTimeout(() => {
      setMounted(false);
    }, MENU_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [visible, position]);

  useLayoutEffect(() => {
    if (!mounted || !menuRef.current) {
      return;
    }
    const menuRect = menuRef.current.getBoundingClientRect();
    let x = position.x;
    let y = position.y;
    if (x + menuRect.width > window.innerWidth) {
      x = Math.max(0, window.innerWidth - menuRect.width - 8);
    }
    if (y + menuRect.height > window.innerHeight) {
      y = Math.max(0, window.innerHeight - menuRect.height - 8);
    }
    setAdjustedPosition({ x, y });
  }, [mounted, position]);

  useEffect(() => {
    if (!mounted || !expanded) {
      return;
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted, expanded, onClose]);

  if (!mounted) {
    return null;
  }

  const pinLabelKey = isPinned
    ? 'PC.Pages.ConversationAgentPreviewTabBar.contextMenu.unpin'
    : 'PC.Pages.ConversationAgentPreviewTabBar.contextMenu.pin';

  const items: MenuItemConfig[] = [
    {
      key: 'close',
      labelKey: 'PC.Pages.ConversationAgentPreviewTabBar.contextMenu.close',
      shortcut: '⌥ W',
      onClick: onCloseTab,
    },
    {
      key: 'closeOthers',
      labelKey:
        'PC.Pages.ConversationAgentPreviewTabBar.contextMenu.closeOthers',
      shortcut: '⌘ ⌥ T',
      onClick: onCloseOtherTabs,
    },
    {
      key: 'closeAll',
      labelKey: 'PC.Pages.ConversationAgentPreviewTabBar.contextMenu.closeAll',
      shortcut: '⌥ ⇧ W',
      onClick: onCloseAllTabs,
    },
    {
      key: 'pin',
      labelKey: pinLabelKey,
      shortcut: '⌥ P',
      onClick: onTogglePin,
      dividerBefore: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className={cx(styles.menu, { [styles['menu-expanded']]: expanded })}
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <React.Fragment key={item.key}>
          {item.dividerBefore && <div className={cx(styles.divider)} />}
          <button
            type="button"
            className={cx(styles['menu-item'])}
            role="menuitem"
            onClick={() => handleItemClick(item.onClick)}
          >
            <span className={cx(styles.label)}>{dict(item.labelKey)}</span>
            {item.shortcut && (
              <span className={cx(styles.shortcut)}>{item.shortcut}</span>
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default PreviewTabContextMenu;
