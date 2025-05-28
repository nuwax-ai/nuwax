import type { CategoryInfo } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { HOVER_TEXTS } from '../constants';
import styles from '../index.less';

const cx = classNames.bind(styles);

// 抽取栏目标签组件
interface CategoryTabProps {
  category: CategoryInfo;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  dragHoverText: string;
  onTabClick: (type: string) => void;
  onMouseEnter: (text: string) => void;
  onMouseLeave: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({
    category,
    index,
    isActive,
    isDragging,
    dragHoverText,
    onTabClick,
    onMouseEnter,
    onMouseLeave,
  }) => {
    return (
      <Draggable key={category.type} draggableId={category.type} index={index}>
        {(provided: any, snapshot: any) => (
          <span
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => onTabClick(category.type)}
            onMouseEnter={() => onMouseEnter(HOVER_TEXTS.CATEGORY)}
            onMouseLeave={onMouseLeave}
            className={cx(styles.item, {
              [styles.active]: isActive,
              [styles.dragging]: snapshot.isDragging,
            })}
            title={dragHoverText && !isDragging ? dragHoverText : ''}
          >
            {category.name}
          </span>
        )}
      </Draggable>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;
