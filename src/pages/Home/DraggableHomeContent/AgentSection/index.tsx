import type {
  CategoryInfo,
  CategoryItemInfo,
} from '@/types/interfaces/agentConfig';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import AgentCard from '../AgentCard'; // 假设你有一个 AgentCard 组件
import styles from '../index.less';

const cx = classNames.bind(styles);

interface AgentSectionProps {
  /** 分类信息 */
  category: CategoryInfo;
  /** 智能体列表 */
  agents: CategoryItemInfo[];
  /** 拖拽提示文本 */
  dragHoverText: string;
  /** 智能体点击事件 */
  onAgentClick: (agentInfo: CategoryItemInfo) => void;
  /** 收藏切换事件 */
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  /** 鼠标进入事件 */
  onMouseEnter: (text: string) => void;
  /** 鼠标离开事件 */
  onMouseLeave: () => void;
  /** 区域引用 */
  sectionRef: (el: HTMLDivElement | null) => void;
  /** 拖拽结束回调 */
  onAgentDragEnd?: (
    categoryType: string,
    newAgents: CategoryItemInfo[],
  ) => void;
}

/**
 * 智能体区域组件
 * 支持智能体的拖拽排序功能，维护自身的 agents 状态
 */
const AgentSection: React.FC<AgentSectionProps> = ({
  category,
  agents: propsAgents,
  dragHoverText,
  onAgentClick,
  onToggleCollect,
  onMouseEnter,
  onMouseLeave,
  sectionRef,
  onAgentDragEnd,
}) => {
  // 维护自身的 agents 状态
  const [localAgents, setLocalAgents] =
    useState<CategoryItemInfo[]>(propsAgents);

  // 同步父组件传入的数据变化
  useEffect(() => {
    setLocalAgents(propsAgents);
  }, [propsAgents]);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 处理智能体拖拽结束
  const handleAgentDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id && over?.id) {
        const activeId = Number(active.id);
        const overId = Number(over.id);

        const oldIndex = localAgents.findIndex(
          (agent) => agent.targetId === activeId,
        );
        const newIndex = localAgents.findIndex(
          (agent) => agent.targetId === overId,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newAgents = arrayMove(localAgents, oldIndex, newIndex);

          // 立即更新本地状态，提供即时反馈
          setLocalAgents(newAgents);

          // 通知父组件更新
          onAgentDragEnd?.(category.type, newAgents);
        }
      }
    },
    [localAgents, category.type, onAgentDragEnd],
  );

  if (!localAgents || localAgents.length === 0) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      data-category={category.type}
      className={cx(styles.section, {
        // [styles.dragging]: isDragging,
      })}
    >
      {/* 分类标题 */}
      <div className={cx(styles.sectionTitle)}>
        {category.name}({localAgents.length})
      </div>

      {/* 智能体列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleAgentDragEnd}
      >
        <SortableContext
          items={localAgents.map((agent) => String(agent.targetId))}
          strategy={rectSortingStrategy}
        >
          <div className={cx(styles.agentGrid)}>
            {localAgents.map((agent) => (
              <AgentCard
                key={agent.targetId}
                agent={agent}
                categoryType={category.type}
                dragHoverText={dragHoverText}
                onAgentClick={() => onAgentClick(agent)}
                onToggleCollect={onToggleCollect}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AgentSection;
