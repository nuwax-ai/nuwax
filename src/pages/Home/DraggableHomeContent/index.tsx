import Loading from '@/components/Loading';
import { apiUpdateAgentSort } from '@/services/agentDev';
import type {
  CategoryInfo,
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type { DragEndEvent } from '@dnd-kit/core';
import { App } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import AgentSection from './AgentSection';
import CategoryContainer from './CategoryContainer';
import {
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
 * 支持栏目和智能体的拖拽排序功能，支持分类左右滑动
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
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 组件状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHoverText, setDragHoverText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 更新排序API请求
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
    onError: () => {
      message.error(ERROR_MESSAGES.SORT_FAILED);
      onDataUpdate(); // 恢复原始数据
    },
    onFinally: () => {
      setIsUpdating(false);
    },
  });

  // 事件处理函数
  const handleTabClick = useCallback(
    (type: string) => {
      onTabClick(type);

      // 滚动到对应区域
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

  // 处理分类拖拽结束
  const handleCategoryDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setIsDragging(false);
      setDragHoverText('');

      if (active.id !== over?.id && homeCategoryInfo?.categories) {
        const oldIndex = homeCategoryInfo.categories.findIndex(
          (item) => item.type === active.id,
        );
        const newIndex = homeCategoryInfo.categories.findIndex(
          (item) => item.type === over?.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const categoryTypes = homeCategoryInfo.categories.map(
            (cat) => cat.type,
          );
          const newCategoryTypes = [...categoryTypes];
          const [movedItem] = newCategoryTypes.splice(oldIndex, 1);
          newCategoryTypes.splice(newIndex, 0, movedItem);

          runUpdateSort(newCategoryTypes, undefined);
        }
      }
    },
    [homeCategoryInfo?.categories, runUpdateSort],
  );

  // 处理智能体拖拽结束
  const handleAgentDragEnd = useCallback(
    (categoryType: string, newAgents: CategoryItemInfo[]) => {
      const agentIds = newAgents.map((agent) => agent.targetId);
      runUpdateSort(undefined, { [categoryType]: agentIds });
    },
    [runUpdateSort],
  );

  // 跳转到广场页面
  const handleLinkToSquare = useCallback(() => {
    history.push('/square?cate_type=Agent');
  }, []);

  // 计算是否为空状态
  const isEmpty = useMemo(() => {
    const items = homeCategoryInfo?.categoryItems || {};
    return Object.keys(items).length === 0;
  }, [homeCategoryInfo?.categoryItems]);

  // 渲染加载状态
  if (isUpdating) {
    return (
      <div className={cx('loading-container')}>
        <Loading />
        <span className={cx('loading-text')}>
          {LOADING_MESSAGES.UPDATING_SORT}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.draggableContainer}>
      {/* 分类标签容器 */}
      <CategoryContainer
        categories={homeCategoryInfo?.categories || []}
        activeCategory={activeTab}
        dragHoverText={dragHoverText}
        onCategoryDragEnd={handleCategoryDragEnd}
        onTabClick={handleTabClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={handleDragStart}
      />

      {/* 内容区域 */}
      {isEmpty ? (
        <div className={cx('empty-container')}>
          <a onClick={handleLinkToSquare} className={cx('empty-link')}>
            暂无数据，立即探索 {'>'} {'>'}
          </a>
        </div>
      ) : (
        <div className={styles.contentContainer}>
          {homeCategoryInfo?.categories?.map((item: CategoryInfo) => (
            <AgentSection
              key={item.type}
              category={item}
              agents={homeCategoryInfo?.categoryItems[item.type] || []}
              dragHoverText={dragHoverText}
              onAgentClick={onAgentClick}
              onToggleCollect={onToggleCollect}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onAgentDragEnd={handleAgentDragEnd}
              sectionRef={(el) => (sectionRefs.current[item.type] = el)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DraggableHomeContent;
