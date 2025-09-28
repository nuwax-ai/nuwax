import type { CategoryInfo } from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsProps, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-node-key': string;
}

/**
 * 可拖拽的标签节点组件
 */
const DraggableTabNode: React.FC<Readonly<DraggableTabPaneProps>> = ({
  ...props
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props['data-node-key'],
    });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
  };

  return React.cloneElement(props.children as React.ReactElement<any>, {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  });
};

interface CategoryContainerProps {
  /** 分类列表 */
  categories: CategoryInfo[];
  /** 当前激活的分类 */
  activeCategory?: string;
  /** 拖拽提示文本 */
  dragHoverText: string;
  /** 分类拖拽结束回调 */
  onCategoryDragEnd: (event: DragEndEvent) => void;
  /** 标签点击事件 */
  onTabClick: (type: string) => void;
  /** 鼠标进入事件 */
  onMouseEnter: (text: string) => void;
  /** 鼠标离开事件 */
  onMouseLeave: () => void;
  /** 拖拽开始回调 */
  onDragStart: () => void;
}

/**
 * 分类容器组件
 * 使用 Ant Design Tabs 组件实现分类标签的拖拽排序功能
 */
const CategoryContainer: React.FC<CategoryContainerProps> = ({
  categories,
  activeCategory,
  dragHoverText,
  onCategoryDragEnd,
  onTabClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
}) => {
  // 添加内部状态，用于及时反映排序变化
  const [localCategories, setLocalCategories] =
    useState<CategoryInfo[]>(categories);

  // 当父组件传入的 categories 变化时，更新本地状态
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // 配置拖拽传感器
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });

  // 将分类数据转换为 Tabs 需要的格式
  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    return localCategories.map((category) => ({
      key: category.type,
      label: category.name,
      children: null, // 我们只需要标签，不需要内容
    }));
  }, [localCategories]); // 使用 localCategories 而不是 categories

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // 立即更新本地状态，提供即时反馈
      setLocalCategories((prev) => {
        const oldIndex = prev.findIndex((item) => item.type === active.id);
        const newIndex = prev.findIndex((item) => item.type === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }

        return prev;
      });
    }

    // 调用父组件的回调，处理后端同步
    onCategoryDragEnd(event);
  };

  // 处理标签点击
  const handleTabChange = useCallback(
    (activeKey: string) => {
      console.log(`🎯 Tab点击事件: ${activeKey}`);
      onTabClick(activeKey);
    },
    [onTabClick],
  );

  if (!localCategories || localCategories.length === 0) {
    return null;
  }

  return (
    <div className={cx(styles.categoryContainer)}>
      <div className={cx(styles['tab-left'])}>
        <Tabs
          activeKey={activeCategory}
          items={tabItems}
          onChange={handleTabChange}
          tabBarStyle={{
            marginBottom: 0,
            borderBottom: 'none',
          }}
          // 添加更多样式控制
          tabBarGutter={8}
          size="middle"
          // 去除指示条 - 通过设置size为0来隐藏
          indicator={{ size: 0 }}
          renderTabBar={(tabBarProps, DefaultTabBar) => (
            <DndContext
              sensors={[sensor]}
              onDragStart={onDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCenter}
            >
              <SortableContext
                items={tabItems.map((item) => item.key)}
                strategy={horizontalListSortingStrategy}
              >
                <DefaultTabBar {...tabBarProps}>
                  {(node) => (
                    <DraggableTabNode
                      {...(node as React.ReactElement<DraggableTabPaneProps>)
                        .props}
                      key={node.key}
                      onMouseEnter={() => onMouseEnter(dragHoverText)}
                      onMouseLeave={onMouseLeave}
                    >
                      {node}
                    </DraggableTabNode>
                  )}
                </DefaultTabBar>
              </SortableContext>
            </DndContext>
          )}
        />
      </div>
      <div className={cx(styles['tab-right'])}>
        <Tooltip title="拖拽智能体卡片可交换位置">
          <ExclamationCircleOutlined className={cx(styles.icon)} />
        </Tooltip>
      </div>
    </div>
  );
};

export default CategoryContainer;
