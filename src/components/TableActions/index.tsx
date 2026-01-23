/**
 * TableActions - 自适应宽度的表格操作列组件
 *
 * 特性：
 * - 根据容器宽度自动判断显示几个按钮
 * - 超出宽度的按钮自动收入"更多"下拉菜单
 * - 支持二次确认（Popconfirm）
 * - 支持条件显示/隐藏按钮
 */
import { ICON_MORE } from '@/constants/images.constants';
import { modalConfirm } from '@/utils/ant-custom';
import { Button, Dropdown, Space } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 单个操作项配置 */
export interface ActionItem<T> {
  /** 唯一标识 */
  key: string;
  /** 按钮文本 */
  label: string;
  /** 按钮图标 */
  icon?: ReactNode;
  /** 按钮类型：danger 为红色 */
  type?: 'primary' | 'danger' | 'default';
  /** 二次确认配置 */
  confirm?: {
    title: ReactNode;
    description?: ReactNode;
    okText?: string;
    cancelText?: string;
  };
  /** 条件显示函数，返回 false 则隐藏该按钮 */
  visible?: (record: T) => boolean;
  /** 禁用函数 */
  disabled?: (record: T) => boolean;
  /** 点击回调 */
  onClick: (record: T) => void;
}

interface TableActionsProps<T> {
  /** 当前行数据 */
  record: T;
  /** 操作列表配置 */
  actions: ActionItem<T>[];
  /** 容器最大宽度（可选，未设置时自动检测父容器） */
  maxWidth?: number;
  /** 按钮间距，默认 4 */
  gap?: number;
  /** "更多"按钮文本，默认为图标 */
  moreText?: string;
}

/** 预估单个按钮宽度：每个字符约 14px + padding 16px */
const estimateButtonWidth = (label: string, hasIcon: boolean): number => {
  const charWidth = 14;
  const padding = 16;
  const iconWidth = hasIcon ? 18 : 0;
  return label.length * charWidth + padding + iconWidth;
};

/** "更多"按钮宽度计算 */
const getMoreButtonWidth = (moreText?: string): number => {
  if (moreText) {
    // 文本模式：每个字符约 14px + padding 16px
    return moreText.length * 14 + 16;
  }
  // 图标模式：固定 32px
  return 32;
};

/**
 * TableActions 组件
 *
 * @example
 * ```tsx
 * const actions: ActionItem<User>[] = [
 *   { key: 'edit', label: '编辑', onClick: (r) => handleEdit(r) },
 *   { key: 'delete', label: '删除', type: 'danger', confirm: { title: '确认删除？' }, onClick: (r) => handleDelete(r.id) },
 * ];
 *
 * <TableActions record={record} actions={actions} maxWidth={180} />
 * ```
 */
function TableActions<T>({
  record,
  actions,
  maxWidth,
  gap = 4,
  moreText,
}: TableActionsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth ?? 0);

  // 监听容器宽度变化
  useEffect(() => {
    if (maxWidth) {
      setContainerWidth(maxWidth);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 初始化获取一次宽度
    const updateWidth = () => {
      const td = container.closest('td');
      if (td) {
        const tdWidth = td.getBoundingClientRect().width;
        // 减去 td 的 padding（通常左右各 8px）
        setContainerWidth(tdWidth - 16);
      }
    };

    // 延迟获取，确保 DOM 已渲染
    const timer = setTimeout(updateWidth, 0);

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    // 观察 td 元素而不是容器本身
    const td = container.closest('td');
    if (td) {
      observer.observe(td);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [maxWidth]);

  // 过滤出可见的操作
  const visibleActions = actions.filter(
    (action) => action.visible?.(record) !== false,
  );

  // 计算应该显示多少个按钮
  const calculateVisibleCount = useCallback(() => {
    if (visibleActions.length === 0) return 0;
    if (visibleActions.length === 1) return 1;
    if (containerWidth === 0) return 0; // 宽度未初始化，暂不显示

    let totalWidth = 0;
    let count = 0;

    const moreButtonWidth = getMoreButtonWidth(moreText);

    for (let i = 0; i < visibleActions.length; i++) {
      const action = visibleActions[i];
      const btnWidth = estimateButtonWidth(action.label, !!action.icon);
      const nextTotalWidth = totalWidth + btnWidth + (count > 0 ? gap : 0);

      // 如果还有更多按钮要放入下拉菜单，需要预留"更多"按钮的空间
      const needMoreButton = i < visibleActions.length - 1;
      const reservedWidth = needMoreButton ? moreButtonWidth + gap : 0;

      if (nextTotalWidth + reservedWidth <= containerWidth) {
        totalWidth = nextTotalWidth;
        count++;
      } else {
        break;
      }
    }

    // 如果所有按钮都能放下，全部显示
    const allButtonsWidth = visibleActions.reduce(
      (sum, action, idx) =>
        sum +
        estimateButtonWidth(action.label, !!action.icon) +
        (idx > 0 ? gap : 0),
      0,
    );

    if (allButtonsWidth <= containerWidth) {
      return visibleActions.length;
    }

    // 至少显示 0 个按钮（全部放入更多）
    return Math.max(0, count);
  }, [visibleActions, containerWidth, gap, moreText]);

  const visibleCount = calculateVisibleCount();
  const primaryActions = visibleActions.slice(0, visibleCount);
  const moreActions = visibleActions.slice(visibleCount);

  // 渲染单个按钮
  const renderButton = (action: ActionItem<T>) => {
    const isDisabled = action.disabled?.(record) ?? false;

    const handleClick = () => {
      if (action.confirm && !isDisabled) {
        // 使用 Modal.confirm 方式
        modalConfirm(
          action.confirm.title || '提示',
          action.confirm.description || '',
          () => action.onClick(record),
        );
      } else {
        action.onClick(record);
      }
    };

    const buttonContent = (
      <Button
        key={action.key}
        type="link"
        size="small"
        danger={action.type === 'danger'}
        disabled={isDisabled}
        icon={action.icon}
        onClick={handleClick}
        style={{ padding: '0 4px' }}
      >
        {action.label}
      </Button>
    );

    return buttonContent;
  };

  // 下拉菜单项
  const dropdownMenuItems = moreActions.map((action) => {
    const isDisabled = action.disabled?.(record) ?? false;

    const handleMenuClick = () => {
      if (action.confirm && !isDisabled) {
        // 使用 Modal.confirm 方式
        modalConfirm(
          action.confirm.title || '提示',
          action.confirm.description || '',
          () => action.onClick(record),
        );
      } else {
        action.onClick(record);
      }
    };

    return {
      key: action.key,
      label: (
        <span
          style={{ color: action.type === 'danger' ? '#ff4d4f' : undefined }}
        >
          {action.icon} {action.label}
        </span>
      ),
      disabled: isDisabled,
      onClick: handleMenuClick,
    };
  });

  return (
    <div
      ref={containerRef}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <Space size={gap} wrap={false}>
        {primaryActions.map((action) => renderButton(action))}

        {moreActions.length > 0 && (
          <Dropdown menu={{ items: dropdownMenuItems }} trigger={['hover']}>
            <Button
              type="link"
              size="small"
              icon={
                moreText ? undefined : (
                  <Button
                    size="small"
                    type="link"
                    icon={<ICON_MORE />}
                  ></Button>
                )
              }
              style={{ padding: '0 4px' }}
            >
              {moreText}
            </Button>
          </Dropdown>
        )}
      </Space>
    </div>
  );
}

export default TableActions;
