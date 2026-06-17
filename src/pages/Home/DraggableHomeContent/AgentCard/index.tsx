import type { CategoryItemInfo } from '@/types/interfaces/agentConfig';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import AgentItem from '../AgentItem';
import { HOVER_TEXTS } from '../constants';

interface AgentCardProps {
  /** 智能体信息 */
  agent: CategoryItemInfo;
  /** 分类类型 */
  categoryType: string;
  /** 拖拽提示文本 */
  dragHoverText: string;
  /** 智能体点击事件 */
  onAgentClick: () => void;
  /** 收藏切换事件 */
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  /** 鼠标进入事件 */
  onMouseEnter: (text: string) => void;
  /** 鼠标离开事件 */
  onMouseLeave: () => void;
}

/**
 * 智能体卡片组件
 * 使用现有的 AgentItem 组件，添加拖拽排序功能
 */
const AgentCard: React.FC<AgentCardProps> = React.memo(
  ({
    agent,
    categoryType,
    dragHoverText,
    onAgentClick,
    onToggleCollect,
    onMouseEnter,
    onMouseLeave,
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: String(agent.targetId), // 确保转换为字符串
    });

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };
    // 处理收藏切换
    const handleToggleCollect = () => {
      onToggleCollect(categoryType, agent);
    };

    // 处理鼠标进入
    const handleMouseEnter = () => {
      onMouseEnter(HOVER_TEXTS.AGENT);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
        title={dragHoverText && !isDragging ? dragHoverText : ''}
      >
        <AgentItem
          info={agent}
          onItemClick={onAgentClick}
          onToggleCollect={handleToggleCollect}
        />
      </div>
    );
  },
);

AgentCard.displayName = 'AgentCard';

export default AgentCard;
