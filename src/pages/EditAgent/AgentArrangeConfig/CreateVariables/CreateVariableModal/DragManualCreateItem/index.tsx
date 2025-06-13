import { DragManualCreateItemProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input } from 'antd';
import React, { useContext, useMemo } from 'react';

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

// 拖拽手柄图标组件
const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

// 可拖拽手动创建项组件
const DragManualCreateItem: React.FC<DragManualCreateItemProps> = ({
  id,
  onChange,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 样式
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    paddingRight: '10px',
  };

  // 上下文值
  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners, attributes }),
    [setActivatorNodeRef, listeners, attributes],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <div
        ref={setNodeRef}
        style={style}
        className={'flex items-center gap-10'}
      >
        <DragHandle />
        <Input onChange={onChange} />
        <DeleteOutlined onClick={onDelete} />
      </div>
    </RowContext.Provider>
  );
};

export default DragManualCreateItem;
