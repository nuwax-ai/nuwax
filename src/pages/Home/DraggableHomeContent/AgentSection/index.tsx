import AgentItem from '@/pages/Home/AgentItem';
import type {
  CategoryInfo,
  CategoryItemInfo,
} from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { HOVER_TEXTS } from '../constants';
import styles from '../index.less';

const cx = classNames.bind(styles);

// 抽取智能体区域组件
interface AgentSectionProps {
  category: CategoryInfo;
  agents: CategoryItemInfo[];
  dragHoverText: string;
  isDragging: boolean;
  onAgentClick: (targetId: number) => void;
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  onMouseEnter: (text: string) => void;
  onMouseLeave: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

const AgentSection: React.FC<AgentSectionProps> = React.memo(
  ({
    category,
    agents,
    dragHoverText,
    isDragging,
    onAgentClick,
    onToggleCollect,
    onMouseEnter,
    onMouseLeave,
    sectionRef,
  }) => {
    return (
      <section ref={sectionRef} id={category.type}>
        <h2 className={styles['category-name']}>{category.name}</h2>
        <Droppable droppableId={category.type} type="AGENT">
          {(provided: any) => (
            <div
              className={cx(styles['category-list'])}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {agents.map((info: CategoryItemInfo, index: number) => (
                <Draggable
                  key={info.targetId}
                  draggableId={`${category.type}-${info.targetId}`}
                  index={index}
                >
                  {(provided: any, snapshot: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onMouseEnter={() => onMouseEnter(HOVER_TEXTS.AGENT)}
                      onMouseLeave={onMouseLeave}
                      className={cx({
                        [styles.dragging]: snapshot.isDragging,
                      })}
                      title={dragHoverText && !isDragging ? dragHoverText : ''}
                    >
                      <AgentItem
                        info={info}
                        onClick={() => onAgentClick(info.targetId)}
                        onCollect={() => onToggleCollect(category.type, info)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </section>
    );
  },
);

AgentSection.displayName = 'AgentSection';

export default AgentSection;
