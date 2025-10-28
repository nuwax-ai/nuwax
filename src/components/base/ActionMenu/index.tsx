import SvgIcon from '@/components/base/SvgIcon';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, theme } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ActionItem {
  /** 唯一标识 */
  key: string;
  /** 图标名称 */
  icon: string;
  /** 显示文本 */
  title: string;
  /** 点击回调函数 */
  onClick: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示分割线 */
  divider?: boolean;
}

export interface ActionMenuProps {
  /** 操作项列表 */
  actions: ActionItem[];
  /** 显示的操作项数量，超出部分放入更多菜单 */
  visibleCount?: number;
  /** 更多菜单的文本 */
  moreText?: string;
  /** 更多菜单的图标 */
  moreIcon?: string;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 操作项之间的间距 */
  gap?: number;
  /** 是否禁用所有操作 */
  disabled?: boolean;
}

/**
 * 通用操作菜单组件
 * 支持配置图标、标题、点击回调，可以控制显示多少项，其他项放到更多下拉菜单中
 */
const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  visibleCount = 3,
  moreText = '更多',
  moreIcon = 'icons-more',
  showArrow = true,
  className,
  gap,
  disabled = false,
}) => {
  const { token } = theme.useToken();

  const iconSize = useMemo(() => {
    return token.fontSizeLG;
  }, [token.fontSizeLG]);

  const normalizeGap = useMemo(() => {
    return gap || token.marginXS;
  }, [gap, token.marginXS]);

  const [visibleActions, setVisibleActions] = useState<ActionItem[]>([]);
  const [moreActions, setMoreActions] = useState<ActionItem[]>([]);

  // 根据visibleCount分割操作项
  React.useEffect(() => {
    const visible = actions.slice(0, visibleCount);
    const more = actions.slice(visibleCount);
    setVisibleActions(visible);
    setMoreActions(more);
  }, [actions, visibleCount]);

  // 渲染操作项
  const renderActionItem = (action: ActionItem, index: number) => (
    <div
      key={action.key}
      className={cx(styles['action-item'], action.className, {
        [styles.disabled]: action.disabled || disabled,
      })}
      style={{
        marginLeft: index === 0 ? 0 : normalizeGap,
      }}
      onClick={() => {
        if (!action.disabled && !disabled) {
          action.onClick();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !action.disabled && !disabled) {
          action.onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={action.title}
    >
      <SvgIcon
        name={action.icon}
        className={styles['action-icon']}
        style={{ fontSize: iconSize }}
      />
      <span className={styles['action-text']}>{action.title}</span>
    </div>
  );

  // 更多菜单项
  const moreMenuItems = moreActions.map((action) => ({
    key: action.key,
    label: (
      <div className={styles['more-menu-item']}>
        <SvgIcon
          name={action.icon}
          className={styles['more-menu-icon']}
          style={{ fontSize: iconSize }}
        />
        <span>{action.title}</span>
      </div>
    ),
    onClick: () => {
      if (!action.disabled && !disabled) {
        action.onClick();
      }
    },
    disabled: action.disabled || disabled,
  }));

  // 如果有分割线，在菜单项之间添加分割线
  const menuItemsWithDividers: any[] = [];
  moreActions.forEach((action, index) => {
    if (action.divider && index > 0) {
      menuItemsWithDividers.push({ type: 'divider' });
    }
    menuItemsWithDividers.push({
      key: action.key,
      label: (
        <div className={styles['more-menu-item']}>
          <SvgIcon name={action.icon} className={styles['more-menu-icon']} />
          <span>{action.title}</span>
        </div>
      ),
      onClick: () => {
        if (!action.disabled && !disabled) {
          action.onClick();
        }
      },
      disabled: action.disabled || disabled,
    });
  });

  return (
    <div className={cx(styles['action-menu'], className)}>
      {/* 显示的操作项 */}
      {visibleActions.map((action, index) => renderActionItem(action, index))}

      {/* 更多下拉菜单 */}
      {moreActions.length > 0 && (
        <Dropdown
          overlayClassName={styles['more-menu']}
          menu={{
            items:
              menuItemsWithDividers.length > 0
                ? menuItemsWithDividers
                : moreMenuItems,
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div
            className={cx(styles['action-item'], styles['more-button'])}
            tabIndex={0}
            role="button"
            aria-label={moreText}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
            style={{
              marginLeft: normalizeGap,
            }}
          >
            <SvgIcon
              name={moreIcon}
              className={styles['action-icon']}
              style={{ fontSize: iconSize }}
            />
            <span className={styles['action-text']}>{moreText}</span>
            {showArrow && <DownOutlined className={styles['more-arrow']} />}
          </div>
        </Dropdown>
      )}
    </div>
  );
};

export default ActionMenu;
