import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';

export interface DragResult {
  destination: {
    droppableId: string;
    index: number;
  } | null;
  source: {
    droppableId: string;
    index: number;
  };
  type: 'CATEGORY' | 'AGENT';
}

export interface DraggableHomeContentProps {
  homeCategoryInfo: HomeAgentCategoryInfo;
  activeTab?: string;
  onTabClick: (type: string) => void;
  onAgentClick: (targetId: number) => void;
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  onDataUpdate: () => void;
}
