import Loading from '@/components/Loading';
import { apiUpdateAgentSort } from '@/services/agentDev';
import type {
  CategoryInfo,
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import { App } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { history, useRequest } from 'umi';
import AgentSection from './AgentSection';
import CategoryTab from './CategoryTab';
import {
  DRAG_TYPES,
  ERROR_MESSAGES,
  LOADING_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DraggableHomeContentProps {
  /** 首页分类信息 */
  homeCategoryInfo: HomeAgentCategoryInfo;
  /** 当前激活的标签 */
  activeTab?: string;
  /** 标签点击事件 */
  onTabClick: (type: string) => void;
  /** 智能体点击事件 */
  onAgentClick: (targetId: number) => void;
  /** 收藏切换事件 */
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  /** 数据更新回调 */
  onDataUpdate: () => void;
}

/**
 * 首页拖拽排序内容组件
 * 支持栏目和智能体的拖拽排序功能
 */
const DraggableHomeContent: React.FC<DraggableHomeContentProps> = ({
  homeCategoryInfo,
  activeTab,
  onTabClick,
  onAgentClick,
  onToggleCollect,
  onDataUpdate,
}) => {
  const { message } = App.useApp();
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHoverText, setDragHoverText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 更新排序API
  const { run: runUpdateSort } = useRequest(apiUpdateAgentSort, {
    manual: true,
    debounceInterval: 300,
    onBefore: () => {
      setIsUpdating(true);
    },
    onSuccess: () => {
      message.success(SUCCESS_MESSAGES.SORT_SUCCESS);
      onDataUpdate();
    },
    onError: (error: any) => {
      console.error('排序更新失败:', error);
      message.error(ERROR_MESSAGES.SORT_FAILED);
      onDataUpdate(); // 恢复原始数据
    },
    onFinally: () => {
      setIsUpdating(false);
    },
  });

  // 使用 useCallback 优化事件处理函数
  const handleTabClick = useCallback(
    (type: string) => {
      onTabClick(type);

      const section = sectionRefs.current[type];
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [onTabClick],
  );

  const handleMouseEnter = useCallback(
    (text: string) => {
      if (!isDragging) {
        setDragHoverText(text);
      }
    },
    [isDragging],
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setDragHoverText('');
    }
  }, [isDragging]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 使用 useMemo 优化计算
  const isEmpty = useMemo(() => {
    const items = homeCategoryInfo?.categoryItems || {};
    return Object.keys(items).length === 0;
  }, [homeCategoryInfo?.categoryItems]);

  // 拖拽结束
  const handleDragEnd = useCallback(
    (result: any) => {
      const startTime = performance.now();

      setIsDragging(false);
      setDragHoverText('');

      if (!result.destination) return;

      const { source, destination, type } = result;

      if (
        source.index === destination.index &&
        source.droppableId === destination.droppableId
      ) {
        return;
      }

      // 拖拽栏目
      if (type === DRAG_TYPES.CATEGORY) {
        const newCategories = Array.from(homeCategoryInfo.categories);
        const [reorderedCategory] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, reorderedCategory);

        // 直接通知父组件更新
        const categoryTypes = newCategories.map((cat) => cat.type);
        runUpdateSort(categoryTypes, undefined);
      }
      // 拖拽智能体
      else if (type === DRAG_TYPES.AGENT) {
        const categoryType = source.droppableId;
        const categoryAgents = Array.from(
          homeCategoryInfo.categoryItems[categoryType] || [],
        );
        const [reorderedAgent] = categoryAgents.splice(source.index, 1);
        categoryAgents.splice(destination.index, 0, reorderedAgent);

        const agentIds = categoryAgents.map((agent) => agent.targetId);
        runUpdateSort(undefined, { [categoryType]: agentIds });
      }

      // 性能监控
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.warn(`拖拽操作耗时较长: ${endTime - startTime}ms`);
      }
    },
    [homeCategoryInfo, runUpdateSort],
  );

  // 跳转到广场页面
  const handleLink = () => {
    history.push('/square?cate_type=Agent');
  };

  // 添加加载状态显示
  if (isUpdating) {
    return (
      <div className={cx('flex', 'items-center', 'justify-center', 'h-64')}>
        <Loading />
        <span className="ml-2">{LOADING_MESSAGES.UPDATING_SORT}</span>
      </div>
    );
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* 栏目标签拖拽区域 */}
      <Droppable
        droppableId="categories"
        direction="horizontal"
        type={DRAG_TYPES.CATEGORY}
      >
        {(provided: any) => (
          <div
            className={cx('flex', 'w-full', styles.tabs)}
            {...provided.droppableProps}
            ref={(el) => {
              provided.innerRef(el);
              tabsRef.current = el;
            }}
          >
            {homeCategoryInfo?.categories?.map((item, index) => (
              <CategoryTab
                key={item.type}
                category={item}
                index={index}
                isActive={item.type === activeTab}
                isDragging={isDragging}
                dragHoverText={dragHoverText}
                onTabClick={handleTabClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* 内容区域 */}
      {isEmpty ? (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-center',
            styles['empty-box'],
          )}
        >
          <a onClick={handleLink} className={cx('cursor-pointer')}>
            暂无数据，立即探索 {'>'} {'>'}
          </a>
        </div>
      ) : (
        homeCategoryInfo?.categories?.map((item: CategoryInfo) => (
          <AgentSection
            key={item.type}
            category={item}
            agents={homeCategoryInfo?.categoryItems[item.type] || []}
            dragHoverText={dragHoverText}
            isDragging={isDragging}
            onAgentClick={onAgentClick}
            onToggleCollect={onToggleCollect}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sectionRef={(el) => (sectionRefs.current[item.type] = el)}
          />
        ))
      )}
    </DragDropContext>
  );
};

export default DraggableHomeContent;
