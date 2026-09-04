import { dict } from '@/services/i18nRuntime';
import { HolderOutlined } from '@ant-design/icons';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useContext, useMemo } from 'react';

// Row Context 用于传递拖拽相关的 listeners 和 setActivatorNodeRef
interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
  /** 是否禁用拖拽（从 Row 透传到 DragHandle） */
  disabled?: boolean;
}

const RowContext = React.createContext<RowContextProps>({});

/**
 * 拖拽手柄组件
 * 用于表格行拖拽排序的触发按钮
 */
export const DragHandle: React.FC<{ disabled?: boolean }> = ({
  disabled: propDisabled,
}) => {
  const {
    setActivatorNodeRef,
    listeners,
    disabled: ctxDisabled,
  } = useContext(RowContext);
  const isDisabled = propDisabled ?? ctxDisabled ?? false;
  if (isDisabled) {
    return (
      <HolderOutlined
        aria-label={dict('PC.Pages.SystemConfigI18n.columnSortDisabled')}
        style={{ cursor: 'not-allowed', color: '#bfbfbf' }}
      />
    );
  }
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      aria-label={dict('PC.Pages.SystemConfigI18n.columnSort')}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

/**
 * 可拖拽的行组件 Props
 */
interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string | number;
  /** 是否显示拖拽时的样式 */
  showDraggingStyle?: boolean;
  /**
   * 是否禁用该行的拖拽（用于筛选态等场景）。
   * 透传给 useSortable 并通过 Context 下发到 DragHandle。
   */
  disabled?: boolean;
}

/**
 * 可拖拽的表格行组件
 * 用于 Ant Design Table 的拖拽排序功能
 */
export const Row: React.FC<RowProps> = ({
  showDraggingStyle = true,
  disabled = false,
  ...props
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(props['data-row-key']), disabled });

  const style: React.CSSProperties = {
    ...props.style,
    ...(isDragging ? { position: 'relative' } : {}),
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners, disabled }),
    [setActivatorNodeRef, listeners, disabled],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={classNames(props.className, showDraggingStyle)}
      />
    </RowContext.Provider>
  );
};
